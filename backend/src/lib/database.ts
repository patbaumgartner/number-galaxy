import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type Language = "de" | "it" | "en" | "fr";
export type Operation =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "remainders";
export type Level = "starter" | "advanced" | "challenge";
export type Difficulty = "easy" | "normal" | "hard";
export type GameStatus = "ready" | "playing" | "won" | "lost";

export type Player = {
  id: string;
  playerName: string;
  avatarId: string;
  createdAt: string;
};

export type QuestionState = {
  prompt: string;
  answer: string;
};

export type StoredGameState = {
  playerId: string;
  language: Language;
  operation: Operation;
  level: Level;
  difficulty: Difficulty;
  score: number;
  streak: number;
  lives: number;
  answeredCount: number;
  currentQuestion: QuestionState;
  options: string[];
  correctIndex: number;
  status: GameStatus;
  updatedAt: string;
};

export type HallOfFameEntry = {
  playerId: string;
  player: string;
  avatarId: string;
  score: number;
  answeredCount: number;
  language: Language;
  operation: Operation;
  difficulty: Difficulty;
  updatedAt: string;
};

type GameStateRow = {
  player_id: string;
  language: Language;
  operation: Operation;
  level: Level;
  difficulty: Difficulty;
  score: number;
  streak: number;
  lives: number;
  answered_count: number;
  current_question: string;
  options: string;
  correct_index: number;
  status: GameStatus;
  updated_at: string;
};

type HallOfFameRow = {
  player_id: string;
  player: string;
  avatar_id: string;
  score: number;
  answered_count: number;
  language: Language;
  operation: Operation;
  difficulty: Difficulty;
  updated_at: string;
};

const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

const database = new Database(path.join(dataDirectory, "math-invaders.sqlite"));
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");

database.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    player_name TEXT NOT NULL,
    avatar_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_states (
    player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    operation TEXT NOT NULL,
    level TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    score INTEGER NOT NULL,
    streak INTEGER NOT NULL,
    lives INTEGER NOT NULL,
    answered_count INTEGER NOT NULL,
    current_question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hall_of_fame (
    player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    answered_count INTEGER NOT NULL,
    language TEXT NOT NULL,
    operation TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function mapGameState(row: GameStateRow): StoredGameState {
  return {
    playerId: row.player_id,
    language: row.language,
    operation: row.operation,
    level: row.level,
    difficulty: row.difficulty,
    score: row.score,
    streak: row.streak,
    lives: row.lives,
    answeredCount: row.answered_count,
    currentQuestion: JSON.parse(row.current_question) as QuestionState,
    options: JSON.parse(row.options) as string[],
    correctIndex: row.correct_index,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function mapHallOfFameRow(row: HallOfFameRow): HallOfFameEntry {
  return {
    playerId: row.player_id,
    player: row.player,
    avatarId: row.avatar_id,
    score: row.score,
    answeredCount: row.answered_count,
    language: row.language,
    operation: row.operation,
    difficulty: row.difficulty,
    updatedAt: row.updated_at,
  };
}

const selectPlayerStatement = database.prepare(
  `SELECT id, player_name, avatar_id, created_at FROM players WHERE id = ?`,
);

const insertPlayerStatement = database.prepare(
  `INSERT INTO players (id, player_name, avatar_id, created_at)
   VALUES (@id, @player_name, @avatar_id, @created_at)`,
);

const updatePlayerStatement = database.prepare(
  `UPDATE players
   SET player_name = @player_name, avatar_id = @avatar_id
   WHERE id = @id`,
);

const selectGameStateStatement = database.prepare(
  `SELECT player_id, language, operation, level, difficulty, score, streak, lives,
          answered_count, current_question, options, correct_index, status, updated_at
   FROM game_states
   WHERE player_id = ?`,
);

const upsertGameStateStatement = database.prepare(
  `INSERT INTO game_states (
      player_id, language, operation, level, difficulty, score, streak, lives,
      answered_count, current_question, options, correct_index, status, updated_at
    ) VALUES (
      @player_id, @language, @operation, @level, @difficulty, @score, @streak, @lives,
      @answered_count, @current_question, @options, @correct_index, @status, @updated_at
    )
    ON CONFLICT(player_id) DO UPDATE SET
      language = excluded.language,
      operation = excluded.operation,
      level = excluded.level,
      difficulty = excluded.difficulty,
      score = excluded.score,
      streak = excluded.streak,
      lives = excluded.lives,
      answered_count = excluded.answered_count,
      current_question = excluded.current_question,
      options = excluded.options,
      correct_index = excluded.correct_index,
      status = excluded.status,
      updated_at = excluded.updated_at`,
);

const topEntriesStatement = database.prepare(
  `SELECT h.player_id, p.player_name AS player, p.avatar_id, h.score, h.answered_count,
          h.language, h.operation, h.difficulty, h.updated_at
   FROM hall_of_fame h
   INNER JOIN players p ON p.id = h.player_id
   WHERE (@language IS NULL OR h.language = @language)
   ORDER BY h.score DESC, h.answered_count DESC, h.updated_at ASC
   LIMIT @limit`,
);

const selectHallOfFameEntryStatement = database.prepare(
  `SELECT player_id, score FROM hall_of_fame WHERE player_id = ?`,
);

const upsertHallOfFameStatement = database.prepare(
  `INSERT INTO hall_of_fame (
      player_id, score, answered_count, language, operation, difficulty, updated_at
    ) VALUES (
      @player_id, @score, @answered_count, @language, @operation, @difficulty, @updated_at
    )
    ON CONFLICT(player_id) DO UPDATE SET
      score = excluded.score,
      answered_count = excluded.answered_count,
      language = excluded.language,
      operation = excluded.operation,
      difficulty = excluded.difficulty,
      updated_at = excluded.updated_at`,
);

export function upsertPlayer(input: {
  playerId?: string;
  playerName: string;
  avatarId: string;
}): Player {
  const existingId = input.playerId && getPlayer(input.playerId) ? input.playerId : undefined;
  const now = new Date().toISOString();

  if (existingId) {
    updatePlayerStatement.run({
      id: existingId,
      player_name: input.playerName,
      avatar_id: input.avatarId,
    });
    return getPlayer(existingId)!;
  }

  const player: Player = {
    id: randomUUID(),
    playerName: input.playerName,
    avatarId: input.avatarId,
    createdAt: now,
  };

  insertPlayerStatement.run({
    id: player.id,
    player_name: player.playerName,
    avatar_id: player.avatarId,
    created_at: player.createdAt,
  });

  return player;
}

export function getPlayer(playerId: string): Player | null {
  const row = selectPlayerStatement.get(playerId) as
    | { id: string; player_name: string; avatar_id: string; created_at: string }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    playerName: row.player_name,
    avatarId: row.avatar_id,
    createdAt: row.created_at,
  };
}

export function saveGameState(state: StoredGameState): StoredGameState {
  const updatedAt = new Date().toISOString();
  upsertGameStateStatement.run({
    player_id: state.playerId,
    language: state.language,
    operation: state.operation,
    level: state.level,
    difficulty: state.difficulty,
    score: state.score,
    streak: state.streak,
    lives: state.lives,
    answered_count: state.answeredCount,
    current_question: JSON.stringify(state.currentQuestion),
    options: JSON.stringify(state.options),
    correct_index: state.correctIndex,
    status: state.status,
    updated_at: updatedAt,
  });

  return getGameState(state.playerId)!;
}

export function getGameState(playerId: string): StoredGameState | null {
  const row = selectGameStateStatement.get(playerId) as GameStateRow | undefined;
  return row ? mapGameState(row) : null;
}

export function getHallOfFame(language?: Language, limit = 10): HallOfFameEntry[] {
  const rows = topEntriesStatement.all({
    language: language ?? null,
    limit,
  }) as HallOfFameRow[];

  return rows.map(mapHallOfFameRow);
}

export function submitHallOfFameScore(input: {
  playerId: string;
  score: number;
  answeredCount: number;
  language: Language;
  operation: Operation;
  difficulty: Difficulty;
}): { entry: HallOfFameEntry; improved: boolean } {
  const existing = selectHallOfFameEntryStatement.get(input.playerId) as
    | { player_id: string; score: number }
    | undefined;

  const improved = !existing || input.score >= existing.score;
  if (improved) {
    upsertHallOfFameStatement.run({
      player_id: input.playerId,
      score: input.score,
      answered_count: input.answeredCount,
      language: input.language,
      operation: input.operation,
      difficulty: input.difficulty,
      updated_at: new Date().toISOString(),
    });
  }

  const [entry] = getHallOfFame(undefined, 100).filter(
    (hallOfFameEntry) => hallOfFameEntry.playerId === input.playerId,
  );

  if (!entry) {
    throw new Error("Hall of Fame entry could not be loaded");
  }

  return { entry, improved };
}
