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
    level: Level
    difficulty: Difficulty
    updatedAt: string
}

const PLAYER_STORAGE_KEY = 'math-invaders-player'
const GAME_STATE_STORAGE_KEY = 'math-invaders-game-state'
const HALL_OF_FAME_STORAGE_KEY = 'math-invaders-hall-of-fame'
const SETTINGS_STORAGE_KEY = 'math-invaders-settings'
const WEAKNESS_STORAGE_KEY = 'math-invaders-weakness'
const HINT_SHOWN_KEY = 'math-invaders-hint-shown'
const SR_STORAGE_KEY = 'math-invaders-sr'
const SKILL_STATS_KEY = 'math-invaders-skill-stats'
const PERSONAL_BESTS_KEY = 'math-invaders-personal-bests'

/** Migrate old entries that predate the level field (added post-launch). */
function migrateEntries(entries: HallOfFameEntry[]): void {
    for (const e of entries) {
        if (!e.level) e.level = 'starter'
    }
}

export type SREntry = { interval: number; due: number }
export type SRData = Record<string, SREntry>

export type SkillStats = Record<string, { history: boolean[] }>
export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'

export function computeBadge(history: boolean[]): BadgeTier {
    const last = history.slice(-30)
    if (last.length < 5) return 'none'
    const pct = last.filter(Boolean).length / last.length
    if (pct >= 0.95) return 'platinum'
    if (pct >= 0.80) return 'gold'
    if (pct >= 0.65) return 'silver'
    if (pct >= 0.45) return 'bronze'
    return 'none'
}

export const BADGE_EMOJI: Record<BadgeTier, string> = {
    none: '',
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
}

export type GameSettings = {
    language: Language
    operations: Operation[]
    level: Level
    difficulty: Difficulty
    mode: 'drill' | 'explore'
    confidence: boolean
}

const defaultSettings: GameSettings = {
    language: 'de',
    operations: ['addition'],
    level: 'starter',
    difficulty: 'easy',
    mode: 'drill',
    confidence: true,
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
            migrateEntries(entries)
            return entries.sort((a, b) => b.score - a.score || b.answeredCount - a.answeredCount)
        } catch {
            return []
        }
    },

    submitScore(entry: HallOfFameEntry): { improved: boolean; entries: HallOfFameEntry[] } {
        const raw = window.localStorage.getItem(HALL_OF_FAME_STORAGE_KEY)
        const all: HallOfFameEntry[] = raw ? (JSON.parse(raw) as HallOfFameEntry[]) : []
        migrateEntries(all)
        // One best-score entry per player per level+difficulty combination
        const existingIndex = all.findIndex(
            (e) => e.playerId === entry.playerId && e.level === entry.level && e.difficulty === entry.difficulty
        )
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
            const parsed = JSON.parse(raw) as Partial<GameSettings>
            const merged: GameSettings = { ...defaultSettings, ...parsed }
            // Migrate old level values that no longer exist
            const validLevels: Level[] = ['starter', 'beginner', 'elementary', 'intermediate', 'advanced', 'expert', 'master']
            if (!validLevels.includes(merged.level)) {
                merged.level = 'starter'
            }
            return merged
        } catch {
            return { ...defaultSettings }
        }
    },

    saveSettings(settings: GameSettings): void {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    },

    getWeakness(): Record<string, number> {
        if (typeof window === 'undefined') return {}
        const raw = window.localStorage.getItem(WEAKNESS_STORAGE_KEY)
        if (!raw) return {}
        try { return JSON.parse(raw) as Record<string, number> } catch { return {} }
    },

    recordMiss(operation: string): void {
        const map = this.getWeakness()
        map[operation] = (map[operation] ?? 0) + 1
        window.localStorage.setItem(WEAKNESS_STORAGE_KEY, JSON.stringify(map))
    },

    recordHit(operation: string): void {
        const map = this.getWeakness()
        if (map[operation]) {
            map[operation] = Math.max(0, map[operation] - 1)
            window.localStorage.setItem(WEAKNESS_STORAGE_KEY, JSON.stringify(map))
        }
    },

    hasSeenSwipeHint(): boolean {
        if (typeof window === 'undefined') return true
        return window.localStorage.getItem(HINT_SHOWN_KEY) === '1'
    },

    markSwipeHintSeen(): void {
        window.localStorage.setItem(HINT_SHOWN_KEY, '1')
    },

    getSRData(): SRData {
        if (typeof window === 'undefined') return {}
        const raw = window.localStorage.getItem(SR_STORAGE_KEY)
        if (!raw) return {}
        try { return JSON.parse(raw) as SRData } catch { return {} }
    },

    updateSR(operation: string, correct: boolean, currentQ: number): void {
        const data = this.getSRData()
        const entry = data[operation] ?? { interval: 1, due: 0 }
        if (correct) {
            const newInterval = Math.min(Math.round(entry.interval * 2.5), 25)
            data[operation] = { interval: newInterval, due: currentQ + newInterval }
        } else {
            data[operation] = { interval: 1, due: currentQ + 1 }
        }
        window.localStorage.setItem(SR_STORAGE_KEY, JSON.stringify(data))
    },

    getSkillStats(): SkillStats {
        if (typeof window === 'undefined') return {}
        const raw = window.localStorage.getItem(SKILL_STATS_KEY)
        if (!raw) return {}
        try { return JSON.parse(raw) as SkillStats } catch { return {} }
    },

    recordSkill(operation: string, correct: boolean): void {
        const stats = this.getSkillStats()
        const entry = stats[operation] ?? { history: [] }
        entry.history = [...entry.history, correct].slice(-60) // keep last 60
        stats[operation] = entry
        window.localStorage.setItem(SKILL_STATS_KEY, JSON.stringify(stats))
    },

    getPersonalBests(): Record<string, number> {
        if (typeof window === 'undefined') return {}
        const raw = window.localStorage.getItem(PERSONAL_BESTS_KEY)
        if (!raw) return {}
        try { return JSON.parse(raw) as Record<string, number> } catch { return {} }
    },

    updatePersonalBest(operation: string, elapsedMs: number): boolean {
        const bests = this.getPersonalBests()
        const current = bests[operation]
        if (current === undefined || elapsedMs < current) {
            bests[operation] = elapsedMs
            window.localStorage.setItem(PERSONAL_BESTS_KEY, JSON.stringify(bests))
            return true
        }
        return false
    },
}
