import { createFileRoute } from "@tanstack/react-router";
import { FlashGame } from "@/components/flash-game";

export const Route = createFileRoute("/flash")({ component: FlashGame });
