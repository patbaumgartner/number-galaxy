import { NextRequest } from "next/server";
import {
  getGameState,
  getPlayer,
  saveGameState,
  type Difficulty,
  type GameStatus,
  type Language,
  type Level,
  type Operation,
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
const levels = new Set<Level>(["starter", "advanced", "challenge"]);
const difficulties = new Set<Difficulty>(["easy", "normal", "hard"]);
const statuses = new Set<GameStatus>(["ready", "playing", "won", "lost"]);

export function OPTIONS() {
  return optionsResponse();
}

export function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return jsonResponse({ error: "playerId is required" }, { status: 400 });
  }

  const gameState = getGameState(playerId);
  return jsonResponse({ gameState });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<{
    playerId: string;
    language: Language;
    operation: Operation;
    level: Level;
    difficulty: Difficulty;
    score: number;
    streak: number;
    lives: number;
    answeredCount: number;
    currentQuestion: { prompt: string; answer: string };
    options: string[];
    correctIndex: number;
    status: GameStatus;
  }>;

  if (!payload.playerId || typeof payload.playerId !== "string" || !getPlayer(payload.playerId)) {
    return jsonResponse({ error: "Unknown playerId" }, { status: 400 });
  }

  if (!payload.language || !languages.has(payload.language)) {
    return jsonResponse({ error: "Unsupported language" }, { status: 400 });
  }

  if (!payload.operation || !operations.has(payload.operation)) {
    return jsonResponse({ error: "Unsupported operation" }, { status: 400 });
  }

  if (!payload.level || !levels.has(payload.level)) {
    return jsonResponse({ error: "Unsupported level" }, { status: 400 });
  }

  if (!payload.difficulty || !difficulties.has(payload.difficulty)) {
    return jsonResponse({ error: "Unsupported difficulty" }, { status: 400 });
  }

  if (
    typeof payload.score !== "number" ||
    typeof payload.streak !== "number" ||
    typeof payload.lives !== "number" ||
    typeof payload.answeredCount !== "number"
  ) {
    return jsonResponse({ error: "Invalid score state" }, { status: 400 });
  }

  if (
    !payload.currentQuestion ||
    typeof payload.currentQuestion.prompt !== "string" ||
    typeof payload.currentQuestion.answer !== "string"
  ) {
    return jsonResponse({ error: "Invalid currentQuestion" }, { status: 400 });
  }

  if (
    !Array.isArray(payload.options) ||
    payload.options.length !== 4 ||
    payload.options.some((option) => typeof option !== "string")
  ) {
    return jsonResponse({ error: "options must contain exactly four answers" }, { status: 400 });
  }

  if (
    typeof payload.correctIndex !== "number" ||
    payload.correctIndex < 0 ||
    payload.correctIndex > 3
  ) {
    return jsonResponse({ error: "correctIndex must be between 0 and 3" }, { status: 400 });
  }

  if (!payload.status || !statuses.has(payload.status)) {
    return jsonResponse({ error: "Unsupported status" }, { status: 400 });
  }

  const gameState = saveGameState({
    playerId: payload.playerId,
    language: payload.language,
    operation: payload.operation,
    level: payload.level,
    difficulty: payload.difficulty,
    score: Math.max(0, Math.floor(payload.score)),
    streak: Math.max(0, Math.floor(payload.streak)),
    lives: Math.max(0, Math.floor(payload.lives)),
    answeredCount: Math.max(0, Math.floor(payload.answeredCount)),
    currentQuestion: payload.currentQuestion,
    options: payload.options,
    correctIndex: Math.floor(payload.correctIndex),
    status: payload.status,
    updatedAt: new Date().toISOString(),
  });

  return jsonResponse({ gameState }, { status: 201 });
}
