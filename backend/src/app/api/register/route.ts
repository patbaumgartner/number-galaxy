import { NextRequest } from "next/server";
import { jsonResponse, optionsResponse } from "@/lib/http";
import { upsertPlayer } from "@/lib/database";

export const runtime = "nodejs";

const MAX_PLAYER_NAME_LENGTH = 24;

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<{
    playerId: string;
    playerName: string;
    avatarId: string;
  }>;

  if (
    !payload.playerName ||
    typeof payload.playerName !== "string" ||
    payload.playerName.trim().length < 2 ||
    payload.playerName.trim().length > MAX_PLAYER_NAME_LENGTH
  ) {
    return jsonResponse(
      { error: "playerName must have 2-24 characters" },
      { status: 400 },
    );
  }

  if (!payload.avatarId || typeof payload.avatarId !== "string") {
    return jsonResponse({ error: "avatarId is required" }, { status: 400 });
  }

  const player = upsertPlayer({
    playerId: payload.playerId,
    playerName: payload.playerName.trim(),
    avatarId: payload.avatarId,
  });

  return jsonResponse(
    {
      message: "Player profile saved",
      player,
    },
    { status: 201 },
  );
}
