// Runs learner Python in the browser with Pyodide, inside a Web Worker.
// - The worker is created from a Blob, so no bundler config is needed.
// - Runs happen off the main thread, so an infinite loop can't freeze the UI:
//   after a timeout the worker is terminated and recreated on the next run.
// - Nothing here touches `window`/`Worker` at import time, so SSR is safe.

import { cleanTraceback } from "./code-grade";

// Pyodide v0.29.4 is bundled in /public/pyodide so Python works offline.
const PYODIDE_PATH = "/pyodide/";
const LOAD_TIMEOUT_MS = 120_000;
export const RUN_TIMEOUT_MS = 5_000;

export type RunResult = { stdout: string; error: string | null; timedOut?: boolean };

// The worker is built from a Blob, so it needs an absolute URL for the bundled runtime.
const workerSource = (base: string) => `
// Some static hosts serve .wasm without the application/wasm MIME type, which makes the
// streaming loaders reject it. Read the bytes ourselves so Python works on any host.
if (typeof WebAssembly !== "undefined") {
  WebAssembly.compileStreaming = async (res) => WebAssembly.compile(await (await res).arrayBuffer());
  WebAssembly.instantiateStreaming = async (res, imports) =>
    WebAssembly.instantiate(await (await res).arrayBuffer(), imports);
}
let booting = null;
function boot() {
  if (!booting) {
    booting = (async () => {
      importScripts(${JSON.stringify(base + "pyodide.js")});
      return await self.loadPyodide({ indexURL: ${JSON.stringify(base)} });
    })();
  }
  return booting;
}
self.onmessage = async (event) => {
  const msg = event.data;
  try {
    const py = await boot();
    if (msg.type === "init") {
      self.postMessage({ type: "ready" });
      return;
    }
    const lines = [];
    py.setStdout({ batched: (s) => lines.push(s) });
    py.setStderr({ batched: (s) => lines.push(s) });
    let error = null;
    try {
      const ns = py.globals.get("dict")();
      try {
        await py.runPythonAsync(msg.code, { globals: ns });
      } finally {
        ns.destroy();
      }
    } catch (err) {
      error = String((err && err.message) || err);
    }
    self.postMessage({ type: "result", id: msg.id, stdout: lines.join("\\n"), error });
  } catch (err) {
    self.postMessage({ type: "fatal", id: msg.id, error: String((err && err.message) || err) });
  }
};
`;

let worker: Worker | null = null;
let booting: Promise<Worker> | null = null;
let ready = false;
let nextId = 1;
const pending = new Map<number, (result: RunResult) => void>();

function killWorker() {
  worker?.terminate();
  worker = null;
  booting = null;
  ready = false;
}

function spawn(): Promise<Worker> {
  if (booting) return booting;
  const attempt = new Promise<Worker>((resolve, reject) => {
    if (typeof Worker === "undefined" || typeof Blob === "undefined") {
      reject(new Error("Web Workers are not available here."));
      return;
    }
    let w: Worker;
    try {
      const url = URL.createObjectURL(
        new Blob([workerSource(window.location.origin + PYODIDE_PATH)], {
          type: "text/javascript",
        }),
      );
      w = new Worker(url);
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    const loadTimer = window.setTimeout(() => {
      if (worker === w || !ready) killWorker();
      reject(new Error("Python took too long to load."));
    }, LOAD_TIMEOUT_MS);

    w.onmessage = (event: MessageEvent) => {
      const m = event.data as
        | { type: "ready" }
        | { type: "result"; id: number; stdout: string; error: string | null }
        | { type: "fatal"; id?: number; error: string };
      if (m.type === "ready") {
        window.clearTimeout(loadTimer);
        worker = w;
        ready = true;
        resolve(w);
      } else if (m.type === "result") {
        const done = pending.get(m.id);
        pending.delete(m.id);
        done?.({
          stdout: m.stdout,
          error: m.error ? cleanTraceback(m.error) : null,
        });
      } else if (m.type === "fatal") {
        const done = m.id === undefined ? undefined : pending.get(m.id);
        if (done && m.id !== undefined) {
          pending.delete(m.id);
          done({ stdout: "", error: m.error });
        } else {
          window.clearTimeout(loadTimer);
          killWorker();
          reject(new Error(m.error));
        }
      }
    };
    w.onerror = (event) => {
      window.clearTimeout(loadTimer);
      killWorker();
      reject(new Error(event.message || "The Python runner failed to start."));
    };
    w.postMessage({ type: "init" });
  });
  booting = attempt;
  // A failed start must not be cached, so the learner can retry.
  attempt.catch(() => {
    if (booting === attempt) booting = null;
  });
  return attempt;
}

/** True once Pyodide has finished loading (first run is slower than later ones). */
export function isPythonReady() {
  return ready;
}

/** Start downloading Pyodide in the background (safe to call many times). */
export function preloadPython() {
  if (typeof window === "undefined") return;
  void spawn().catch(() => {});
}

/**
 * Run a program and collect its output. Rejects only if the runner itself
 * can't start (offline, blocked, unsupported); Python errors come back in
 * `result.error`.
 */
export async function runPython(code: string, timeoutMs = RUN_TIMEOUT_MS): Promise<RunResult> {
  const w = await spawn();
  const id = nextId++;
  return new Promise<RunResult>((resolve) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      killWorker(); // the only way to stop `while True:`
      resolve({
        stdout: "",
        error: `Your code ran for more than ${Math.round(timeoutMs / 1000)} seconds, so it was stopped. Check for a loop that never ends.`,
        timedOut: true,
      });
    }, timeoutMs);
    pending.set(id, (result) => {
      window.clearTimeout(timer);
      resolve(result);
    });
    w.postMessage({ type: "run", id, code });
  });
}
