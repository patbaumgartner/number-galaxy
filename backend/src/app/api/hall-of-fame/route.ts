import { NextRequest } from "next/server";
import {
  getHallOfFame,
  getPlayer,
  type Difficulty,
  type Language,
  type Operation,
  submitHallOfFameScore,
} from "@/lib/database";
import { jsonResponse, optionsResponse } from "@/lib/http";

export const runtime = "nodejs";

const languages = new Set<Language>(["de", "it", "en", "fr"]);
const operations = new Set<Operation>([
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "remainders",
]);
const difficulties = new Set<Difficulty>(["easy", "normal", "hard"]);

export function OPTIONS() {
  return optionsResponse();
}

export function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language") as Language | null;
  const entries = getHallOfFame(language && languages.has(language) ? language : undefined);
  return jsonResponse({ entries });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<{
    playerId: string;
    score: number;
    answeredCount: number;
    language: Language;
    operation: Operation;
    difficulty: Difficulty;
  }>;

  if (!payload.playerId || typeof payload.playerId !== "string" || !getPlayer(payload.playerId)) {
    return jsonResponse({ error: "Unknown playerId" }, { status: 400 });
  }

  if (typeof payload.score !== "number" || payload.score < 0) {
    return jsonResponse({ error: "score must be a positive number" }, { status: 400 });
  }

  if (typeof payload.answeredCount !== "number" || payload.answeredCount < 0) {
    return jsonResponse({ error: "answeredCount must be a positive number" }, { status: 400 });
  }

  if (!payload.language || !languages.has(payload.language)) {
    return jsonResponse({ error: "Unsupported language" }, { status: 400 });
  }

  if (!payload.operation || !operations.has(payload.operation)) {
    return jsonResponse({ error: "Unsupported operation" }, { status: 400 });
  }

  if (!payload.difficulty || !difficulties.has(payload.difficulty)) {
    return jsonResponse({ error: "Unsupported difficulty" }, { status: 400 });
  }

  const { entry, improved } = submitHallOfFameScore({
    playerId: payload.playerId,
    score: Math.floor(payload.score),
    answeredCount: Math.floor(payload.answeredCount),
    language: payload.language,
    operation: payload.operation,
    difficulty: payload.difficulty,
  });

  return jsonResponse(
    {
      improved,
      entry,
      entries: getHallOfFame(payload.language),
    },
    { status: 201 },
  );
}
