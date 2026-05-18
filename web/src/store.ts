import type { GameState, Language, Operation, Difficulty, Level } from './game'

export type Player = {
    id: string
    playerName: string
    avatarId: string
    createdAt: string
}

export type HallOfFameEntry = {
    playerId: string
    player: string
    avatarId: string
    score: number
    answeredCount: number
    language: Language
    operation: Operation
    difficulty: Difficulty
    updatedAt: string
}

const PLAYER_STORAGE_KEY = 'math-invaders-player'
const GAME_STATE_STORAGE_KEY = 'math-invaders-game-state'
const HALL_OF_FAME_STORAGE_KEY = 'math-invaders-hall-of-fame'
const SETTINGS_STORAGE_KEY = 'math-invaders-settings'

export type GameSettings = {
    language: Language
    operations: Operation[]
    level: Level
    difficulty: Difficulty
}

const defaultSettings: GameSettings = {
    language: 'de',
    operations: ['addition'],
    level: 'starter',
    difficulty: 'easy',
}

export const store = {
    getPlayer(): Player | null {
        if (typeof window === 'undefined') return null
        const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY)
        if (!raw) return null
        try {
            return JSON.parse(raw) as Player
        } catch {
            return null
        }
    },

    savePlayer(name: string, avatarId: string): Player {
        const player: Player = {
            id: crypto.randomUUID(),
            playerName: name,
            avatarId,
            createdAt: new Date().toISOString(),
        }
        window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player))
        return player
    },

    updatePlayer(player: Player): Player {
        window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player))
        return player
    },

    getGameState(playerId: string): GameState | null {
        if (typeof window === 'undefined') return null
        const raw = window.localStorage.getItem(`${GAME_STATE_STORAGE_KEY}-${playerId}`)
        if (!raw) return null
        try {
            return JSON.parse(raw) as GameState
        } catch {
            return null
        }
    },

    saveGameState(playerId: string, gameState: GameState): void {
        window.localStorage.setItem(`${GAME_STATE_STORAGE_KEY}-${playerId}`, JSON.stringify(gameState))
    },

    getHallOfFame(): HallOfFameEntry[] {
        if (typeof window === 'undefined') return []
        const raw = window.localStorage.getItem(HALL_OF_FAME_STORAGE_KEY)
        if (!raw) return []
        try {
            const entries = JSON.parse(raw) as HallOfFameEntry[]
            return entries.sort((a, b) => b.score - a.score || b.answeredCount - a.answeredCount)
        } catch {
            return []
        }
    },

    submitScore(entry: HallOfFameEntry): { improved: boolean; entries: HallOfFameEntry[] } {
        const raw = window.localStorage.getItem(HALL_OF_FAME_STORAGE_KEY)
        const all: HallOfFameEntry[] = raw ? (JSON.parse(raw) as HallOfFameEntry[]) : []
        const existingIndex = all.findIndex((e) => e.playerId === entry.playerId)
        const improved = existingIndex === -1 || all[existingIndex].score < entry.score

        if (improved) {
            if (existingIndex >= 0) {
                all[existingIndex] = entry
            } else {
                all.push(entry)
            }
        }

        all.sort((a, b) => b.score - a.score || b.answeredCount - a.answeredCount)
        window.localStorage.setItem(HALL_OF_FAME_STORAGE_KEY, JSON.stringify(all))
        return { improved, entries: all }
    },

    clearAllData(): void {
        if (typeof window === 'undefined') return
        Object.keys(window.localStorage)
            .filter((key) => key.startsWith('math-invaders-'))
            .forEach((key) => window.localStorage.removeItem(key))
    },

    getSettings(): GameSettings {
        if (typeof window === 'undefined') return defaultSettings
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
        if (!raw) return { ...defaultSettings }
        try {
            const parsed = JSON.parse(raw) as GameSettings
            // Migrate old level values that no longer exist
            const validLevels: Level[] = ['starter', 'beginner', 'elementary', 'intermediate', 'advanced', 'expert', 'master']
            if (!validLevels.includes(parsed.level)) {
                parsed.level = 'starter'
            }
            return parsed
        } catch {
            return { ...defaultSettings }
        }
    },

    saveSettings(settings: GameSettings): void {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    },
}
