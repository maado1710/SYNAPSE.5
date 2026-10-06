import { createFileRoute } from "@tanstack/react-router";
import { MatchGame } from "@/components/match-game";

export const Route = createFileRoute("/match")({ component: MatchGame });
