import type { GameState, Language, Operation, Difficulty } from './game'

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

// Polyfill for UUID generation since crypto.randomUUID is not available in browsers
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
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
            id: generateUUID(),
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

    getHallOfFame(language: Language): HallOfFameEntry[] {
        if (typeof window === 'undefined') return []
        const raw = window.localStorage.getItem(HALL_OF_FAME_STORAGE_KEY)
        if (!raw) return []
        try {
            const entries = JSON.parse(raw) as HallOfFameEntry[]
            return entries.filter((e) => e.language === language).sort((a, b) => b.score - a.score || b.answeredCount - a.answeredCount)
        } catch {
            return []
        }
    },

    submitScore(entry: HallOfFameEntry): { improved: boolean; entries: HallOfFameEntry[] } {
        const entries = this.getHallOfFame(entry.language)
        const existingIndex = entries.findIndex((e) => e.playerId === entry.playerId)
        const improved = existingIndex === -1 || entries[existingIndex].score < entry.score

        if (existingIndex >= 0) {
            entries[existingIndex] = entry
        } else {
            entries.push(entry)
        }

        entries.sort((a, b) => b.score - a.score || b.answeredCount - a.answeredCount)
        const all = this.getAllHallOfFame()
        const updated = all.filter((e) => e.language !== entry.language)
        updated.push(...entries)

        window.localStorage.setItem(HALL_OF_FAME_STORAGE_KEY, JSON.stringify(updated))
        return { improved, entries }
    },

    getAllHallOfFame(): HallOfFameEntry[] {
        if (typeof window === 'undefined') return []
        const raw = window.localStorage.getItem(HALL_OF_FAME_STORAGE_KEY)
        if (!raw) return []
        try {
            return JSON.parse(raw) as HallOfFameEntry[]
        } catch {
            return []
        }
    },

    clearAllData(): void {
        if (typeof window === 'undefined') return
        Object.keys(window.localStorage)
            .filter((key) => key.startsWith('math-invaders-'))
            .forEach((key) => window.localStorage.removeItem(key))
    },
}
