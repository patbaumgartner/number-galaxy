import { beforeEach, describe, expect, it } from 'vitest'
import type { ScoreEntry } from './index'
import {
    RULESET_VERSION,
    computeBadge,
    defaultSettings,
    legacyLevelToRank,
    profileKeys,
    progressKeys,
    scoreKeys,
    settingsKeys,
    store,
} from './index'

class MemoryStorage implements Storage {
    private map = new Map<string, string>()
    get length() { return this.map.size }
    key(index: number) { return [...this.map.keys()][index] ?? null }
    getItem(key: string) { return this.map.get(key) ?? null }
    setItem(key: string, value: string) { this.map.set(key, value) }
    removeItem(key: string) { this.map.delete(key) }
    clear() { this.map.clear() }
    [name: string]: unknown
}

function installStorage(): Storage {
    const storage = new MemoryStorage()
    Object.defineProperty(globalThis, 'window', {
        value: { localStorage: storage },
        configurable: true,
        writable: true,
    })
    return storage
}

let storage: Storage

beforeEach(() => {
    storage = installStorage()
})

const entry = (overrides: Partial<ScoreEntry> = {}): ScoreEntry => ({
    playerId: 'p1',
    player: 'Ace',
    avatarId: '🚀',
    rulesetVersion: RULESET_VERSION,
    rank: 'pilot',
    timed: true,
    operations: ['addition'],
    score: 100,
    correct: 20,
    total: 25,
    stars: 2,
    bestStreak: 6,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
})

describe('settings migration', () => {
    it('falls back to defaults when nothing is stored', () => {
        expect(store.getSettings()).toEqual(defaultSettings)
    })

    it('maps every old level onto a rank without demoting anyone', () => {
        for (const [level, rank] of Object.entries(legacyLevelToRank)) {
            installStorage()
            storage = globalThis.window.localStorage
            storage.setItem(settingsKeys.legacy, JSON.stringify({ level, mode: 'drill' }))
            expect(store.getSettings().rank).toBe(rank)
        }
    })

    it('turns explore mode into an untimed run and drill into a timed one', () => {
        storage.setItem(settingsKeys.legacy, JSON.stringify({ level: 'starter', mode: 'explore' }))
        expect(store.getSettings().timer).toBe('off')

        installStorage()
        globalThis.window.localStorage.setItem(
            settingsKeys.legacy,
            JSON.stringify({ level: 'starter', mode: 'drill' }),
        )
        expect(store.getSettings().timer).toBe('timed')
    })

    it('collapses the old worked-example and tip switches into one hints flag', () => {
        storage.setItem(settingsKeys.legacy, JSON.stringify({ tips: false, workedExamples: false }))
        expect(store.getSettings().hints).toBe(false)
    })

    it('writes the converted settings back so migration runs only once', () => {
        storage.setItem(settingsKeys.legacy, JSON.stringify({ level: 'master', mode: 'drill' }))
        expect(store.getSettings().rank).toBe('legend')

        store.saveSettings({ ...store.getSettings(), rank: 'rookie' })
        // The legacy blob is still present but must no longer win.
        expect(store.getSettings().rank).toBe('rookie')
    })

    it('is idempotent', () => {
        storage.setItem(settingsKeys.legacy, JSON.stringify({ level: 'elementary', mode: 'drill' }))
        expect(store.getSettings()).toEqual(store.getSettings())
    })

    it('repairs corrupt or unknown values instead of crashing', () => {
        storage.setItem(settingsKeys.current, '{ not json')
        expect(store.getSettings()).toEqual(defaultSettings)

        storage.setItem(
            settingsKeys.current,
            JSON.stringify({ language: 'klingon', rank: 'wizard', operations: ['telepathy'] }),
        )
        const repaired = store.getSettings()
        expect(repaired.language).toBe(defaultSettings.language)
        expect(repaired.rank).toBe(defaultSettings.rank)
        expect(repaired.operations).toEqual(defaultSettings.operations)
    })

    it('never leaves the operation pool empty', () => {
        storage.setItem(settingsKeys.current, JSON.stringify({ operations: [] }))
        expect(store.getSettings().operations.length).toBeGreaterThan(0)
    })
})

describe('scores', () => {
    it('keeps one best entry per rank', () => {
        store.submitScore(entry({ score: 100 }))
        const second = store.submitScore(entry({ score: 250 }))
        expect(second.improved).toBe(true)
        expect(second.entries).toHaveLength(1)
        expect(second.entries[0].score).toBe(250)
    })

    it('does not overwrite a better score with a worse one', () => {
        store.submitScore(entry({ score: 250 }))
        const worse = store.submitScore(entry({ score: 100 }))
        expect(worse.improved).toBe(false)
        expect(worse.entries[0].score).toBe(250)
    })

    it('keeps timed and untimed personal bests apart', () => {
        store.submitScore(entry({ timed: true, score: 300 }))
        store.submitScore(entry({ timed: false, score: 120 }))
        const entries = store.getScores()
        expect(entries).toHaveLength(2)
        expect(entries.find(e => e.timed)?.score).toBe(300)
        expect(entries.find(e => !e.timed)?.score).toBe(120)
    })

    it('keeps different ranks and players apart', () => {
        store.submitScore(entry({ rank: 'rookie' }))
        store.submitScore(entry({ rank: 'legend' }))
        store.submitScore(entry({ playerId: 'p2', player: 'Nova' }))
        expect(store.getScores()).toHaveLength(3)
    })

    it('does not let an older ruleset compete with the current one', () => {
        store.submitScore(entry({ rulesetVersion: 1, score: 9999 }))
        store.submitScore(entry({ rulesetVersion: RULESET_VERSION, score: 100 }))
        expect(store.getScores()).toHaveLength(2)
    })

    it('sorts by score, then stars, then correct answers', () => {
        store.submitScore(entry({ playerId: 'a', score: 100, stars: 1 }))
        store.submitScore(entry({ playerId: 'b', score: 300, stars: 3 }))
        store.submitScore(entry({ playerId: 'c', score: 200, stars: 2 }))
        expect(store.getScores().map(e => e.score)).toEqual([300, 200, 100])
    })

    it('reads pre-rework scores without converting them', () => {
        storage.setItem(
            scoreKeys.legacy,
            JSON.stringify([
                { player: 'Old', avatarId: '👾', score: 40, answeredCount: 12 },
                { player: 'Older', avatarId: '🛸', score: 90, answeredCount: 20 },
            ]),
        )
        expect(store.getLegacyScores().map(e => e.score)).toEqual([90, 40])
        expect(store.getScores()).toEqual([])
    })

    it('does not record a run that never scored a point', () => {
        const abandoned = store.submitScore(entry({ score: 0, correct: 0, total: 1, stars: 0, bestStreak: 0 }))
        expect(abandoned.improved).toBe(false)
        expect(store.getScores()).toEqual([])
    })

    it('does not let a scoreless run wipe an existing record', () => {
        store.submitScore(entry({ score: 250 }))
        store.submitScore(entry({ score: 0, correct: 0, total: 1 }))
        const entries = store.getScores()
        expect(entries).toHaveLength(1)
        expect(entries[0].score).toBe(250)
    })

    it('survives a corrupt score blob', () => {
        storage.setItem(scoreKeys.current, 'not json at all')
        expect(store.getScores()).toEqual([])
    })
})

describe('player', () => {
    it('creates a profile on demand so play is never gated behind a form', () => {
        const player = store.ensurePlayer('Ace', '🚀')
        expect(player.playerName).toBe('Ace')
        expect(store.getPlayer()?.id).toBe(player.id)
    })

    it('reuses the existing profile', () => {
        const first = store.ensurePlayer('Ace', '🚀')
        expect(store.ensurePlayer('Someone Else', '👾').id).toBe(first.id)
    })
})

describe('progress tracking', () => {
    it('grows weakness on misses and shrinks it on hits, never below zero', () => {
        store.recordAnswer('division', false, 0)
        store.recordAnswer('division', false, 1)
        expect(store.getWeakness().division).toBe(2)

        store.recordAnswer('division', true, 2)
        store.recordAnswer('division', true, 3)
        store.recordAnswer('division', true, 4)
        expect(store.getWeakness().division).toBe(0)
    })

    it('schedules a missed operation for the very next question', () => {
        store.recordAnswer('multiplication', false, 7)
        expect(store.getSpacedRepetition().multiplication).toEqual({ interval: 1, due: 8 })
    })

    it('pushes a mastered operation further out each time', () => {
        store.recordAnswer('addition', true, 0)
        const first = store.getSpacedRepetition().addition.interval
        store.recordAnswer('addition', true, 1)
        expect(store.getSpacedRepetition().addition.interval).toBeGreaterThan(first)
    })

    it('only records a personal best when it is actually faster', () => {
        expect(store.updatePersonalBest('addition', 4000)).toBe(true)
        expect(store.updatePersonalBest('addition', 5000)).toBe(false)
        expect(store.updatePersonalBest('addition', 1200)).toBe(true)
        expect(store.getPersonalBests().addition).toBe(1200)
    })

    it('clears every namespaced key but nothing else', () => {
        storage.setItem('unrelated-app-key', 'keep me')
        store.ensurePlayer('Ace', '🚀')
        store.submitScore(entry())
        store.clearAllData()
        expect(store.getPlayer()).toBeNull()
        expect(store.getScores()).toEqual([])
        expect(storage.getItem('unrelated-app-key')).toBe('keep me')
    })
})

describe('corrupt storage', () => {
    const corruptions = ['null', '[1,2,3]', '{{{not json', '"a string"', '123']

    it('falls back to defaults when settings hold any junk value', () => {
        for (const junk of corruptions) {
            storage.setItem(settingsKeys.current, junk)
            expect(() => store.getSettings()).not.toThrow()
            expect(store.getSettings().language).toBe(defaultSettings.language)
        }
    })

    it('survives junk in every progress key', () => {
        for (const junk of corruptions) {
            for (const key of [progressKeys.weakness, progressKeys.spacedRepetition, progressKeys.skills, progressKeys.bests]) {
                storage.setItem(key, junk)
            }
            expect(() => store.getWeakness()).not.toThrow()
            expect(() => store.getSkillStats()).not.toThrow()
            expect(() => store.getSpacedRepetition()).not.toThrow()
            expect(() => store.getPersonalBests()).not.toThrow()
            expect(() => store.recordAnswer('addition', false, 0)).not.toThrow()
            expect(() => store.updatePersonalBest('addition', 100)).not.toThrow()
        }
    })

    it('reports no player rather than throwing when the registry is junk', () => {
        for (const junk of corruptions) {
            storage.setItem(profileKeys.players, junk)
            expect(store.getPlayer()).toBeNull()
        }
    })

    it('reads an empty leaderboard when scores hold junk', () => {
        for (const junk of corruptions) {
            storage.setItem(scoreKeys.current, junk)
            expect(() => store.getScores()).not.toThrow()
            expect(Array.isArray(store.getScores())).toBe(true)
        }
    })
})

describe('computeBadge', () => {
    it('stays silent until there is enough evidence', () => {
        expect(computeBadge([true, true, true, true])).toBe('none')
    })

    it('awards tiers by rolling accuracy', () => {
        expect(computeBadge(Array(20).fill(true))).toBe('platinum')
        expect(computeBadge([...Array(17).fill(true), ...Array(3).fill(false)])).toBe('gold')
        expect(computeBadge([...Array(14).fill(true), ...Array(6).fill(false)])).toBe('silver')
        expect(computeBadge([...Array(10).fill(true), ...Array(10).fill(false)])).toBe('bronze')
        expect(computeBadge(Array(20).fill(false))).toBe('none')
    })

    it('only looks at the most recent 30 answers', () => {
        expect(computeBadge([...Array(50).fill(false), ...Array(30).fill(true)])).toBe('platinum')
    })
})

describe('arcade fact scheduling', () => {
    const key = 'addition:7:8'

    it('brings a missed fact back the same day and pushes a known one away', () => {
        store.recordFact(key, false, 4000)
        expect(store.getDueFacts()).toContainEqual({ operation: 'addition', a: 7, b: 8 })

        store.recordFact(key, true, 1200)
        expect(store.getDueFacts()).toEqual([])
    })

    it('keeps no record for a question that has no fact behind it', () => {
        store.recordFact('', false, 1000)
        expect(store.getArcadeFacts()).toEqual({})
    })

    it('drops the least recently practised facts once the cap is reached', () => {
        for (let index = 0; index < 420; index += 1) store.recordFact(`addition:1:${index}`, false, 900)

        const tracked = Object.keys(store.getArcadeFacts())
        expect(tracked).toHaveLength(400)
        expect(tracked).not.toContain('addition:1:0')
        expect(tracked).toContain('addition:1:419')
    })

    it('counts practising a fact again as recent, so it is not the next one dropped', () => {
        store.recordFact('addition:1:0', false, 900)
        for (let index = 1; index < 400; index += 1) store.recordFact(`addition:1:${index}`, false, 900)
        store.recordFact('addition:1:0', false, 900)
        store.recordFact('addition:2:2', false, 900)

        expect(Object.keys(store.getArcadeFacts())).toContain('addition:1:0')
    })

    it('ignores a stored key that is not a fact at all', () => {
        storage.setItem(progressKeys.arcadeFacts, JSON.stringify({
            'not a fact': { box: 1, lastDay: 0, last3: [] },
        }))
        expect(store.getDueFacts()).toEqual([])
    })

    it('survives a corrupt fact blob', () => {
        for (const junk of ['null', '[1,2,3]', '{{{not json', '"a string"', '123']) {
            storage.setItem(progressKeys.arcadeFacts, junk)
            expect(() => store.getDueFacts()).not.toThrow()
            expect(store.getDueFacts()).toEqual([])
        }
    })
})

describe('the mistake that keeps coming up', () => {
    const miss = (reason: string) => ({
        operation: 'subtraction' as const,
        form: 'direct' as const,
        prompt: '51 − 26 = ?',
        chosen: '35',
        reason: reason as never,
        answer: '25',
        at: '2026-01-01T00:00:00.000Z',
    })

    it('says nothing until a pattern is more than bad luck', () => {
        store.recordMiss(miss('smallerFromLarger'))
        store.recordMiss(miss('smallerFromLarger'))
        expect(store.getCommonMistake()).toBeNull()

        store.recordMiss(miss('smallerFromLarger'))
        expect(store.getCommonMistake()).toBe('smallerFromLarger')
    })

    it('says nothing when two mistakes are equally common', () => {
        for (let index = 0; index < 3; index += 1) {
            store.recordMiss(miss('smallerFromLarger'))
            store.recordMiss(miss('forgotCarry'))
        }
        expect(store.getCommonMistake()).toBeNull()
    })

    it('ignores misses that meant nothing in particular', () => {
        for (let index = 0; index < 10; index += 1) store.recordMiss(miss('none'))
        expect(store.getCommonMistake()).toBeNull()
    })

    it('follows what is recent rather than what is oldest', () => {
        for (let index = 0; index < 40; index += 1) store.recordMiss(miss('offByOne'))
        for (let index = 0; index < 40; index += 1) store.recordMiss(miss('forgotCarry'))
        expect(store.getCommonMistake()).toBe('forgotCarry')
    })
})

describe('the clock and the time to think', () => {
    it('carries the old on/off switch onto the new three-way setting', () => {
        storage.setItem(settingsKeys.current, JSON.stringify({ timed: true }))
        expect(store.getSettings().timer).toBe('timed')

        installStorage()
        globalThis.window.localStorage.setItem(settingsKeys.current, JSON.stringify({ timed: false }))
        expect(store.getSettings().timer).toBe('off')
    })

    it('starts with no clock and normal thinking time', () => {
        expect(store.getSettings().timer).toBe('off')
        expect(store.getSettings().thinkingTime).toBe(1)
    })

    it('refuses a thinking time or clock mode it does not offer', () => {
        storage.setItem(settingsKeys.current, JSON.stringify({ timer: 'sideways', thinkingTime: 99 }))
        expect(store.getSettings().timer).toBe('off')
        expect(store.getSettings().thinkingTime).toBe(1)
    })
})
