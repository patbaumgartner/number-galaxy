import { beforeEach, describe, expect, it } from 'vitest'
import { buildReport, readableFact } from './report'
import { store } from './index'
import { ttStore } from '../timesTable/ttStore'
import { beamStore } from '../beam'
import { senseStore } from '../sense'

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

beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
        value: { localStorage: new MemoryStorage() },
        configurable: true,
        writable: true,
    })
})

describe('reading a fact back for a grown-up', () => {
    it('turns a storage key into something a parent can act on', () => {
        expect(readableFact('addition:7:8')).toBe('7 + 8')
        expect(readableFact('multiplication:6:7')).toBe('6 × 7')
    })

    it('puts the whole back before taking from it or dividing it', () => {
        // A fact is stored as its pair, so the stored numbers are the two parts.
        // Printed as they stand, `subtraction:5:7` would read "5 − 7", not a sum.
        expect(readableFact('subtraction:5:7')).toBe('12 − 7')
        expect(readableFact('division:6:7')).toBe('42 ÷ 7')
    })

    it('says nothing rather than something wrong', () => {
        expect(readableFact('nonsense')).toBeNull()
        expect(readableFact('remainders:2:3')).toBeNull()
    })
})

describe('the progress report', () => {
    it('reads an empty device without inventing anything', () => {
        const report = buildReport()
        expect(report.arcade.factsSeen).toBe(0)
        expect(report.arcade.practiseNext).toEqual([])
        expect(report.arcade.mistake).toBeNull()
        expect(report.arcade.skills.every(line => line.accuracy === null)).toBe(true)
        expect(report.tables.factsKnown).toBe(0)
    })

    it('records nothing of its own — building it twice writes nothing', () => {
        const snapshot = () => {
            const storage = window.localStorage
            return Array.from({ length: storage.length }, (_unused, index) => storage.key(index))
        }
        store.recordFact('addition:2:3', false, 900)
        const before = snapshot()

        buildReport()
        buildReport()

        expect(snapshot()).toEqual(before)
    })

    it('counts a fact as secure only once it is owned', () => {
        store.recordFact('addition:7:8', true, 900)
        expect(buildReport().arcade.factsKnown).toBe(0)

        for (let round = 0; round < 4; round += 1) store.recordFact('addition:7:8', true, 900)
        const report = buildReport()
        expect(report.arcade.factsKnown).toBe(1)
        expect(report.arcade.practiseNext).not.toContain('7 + 8')
    })

    it('names what to practise next, newest first and in plain notation', () => {
        store.recordFact('addition:2:3', false, 900)
        store.recordFact('multiplication:6:7', false, 900)

        expect(buildReport().arcade.practiseNext).toEqual(['6 × 7', '2 + 3'])
    })

    it('keeps the list short enough to act on', () => {
        for (let index = 0; index < 20; index += 1) store.recordFact(`addition:1:${index}`, false, 900)
        expect(buildReport().arcade.practiseNext.length).toBeLessThanOrEqual(8)
    })

    it('carries the habit worth naming, when there is one', () => {
        const miss = {
            operation: 'subtraction' as const,
            form: 'direct' as const,
            prompt: '51 − 26 = ?',
            chosen: '35',
            reason: 'smallerFromLarger' as const,
            answer: '25',
            at: '2026-01-01T00:00:00.000Z',
        }
        for (let index = 0; index < 3; index += 1) store.recordMiss(miss)
        expect(buildReport().arcade.mistake).toBe('smallerFromLarger')
    })

    it('reports accuracy per operation from what was actually answered', () => {
        store.recordAnswer('addition', true, 0)
        store.recordAnswer('addition', true, 1)
        store.recordAnswer('addition', false, 2)
        store.recordAnswer('addition', true, 3)
        store.recordAnswer('addition', true, 4)

        const line = buildReport().arcade.skills.find(entry => entry.operation === 'addition')
        expect(line?.answered).toBe(5)
        expect(line?.accuracy).toBeCloseTo(0.8)
    })

    it('adds up the stars each section has actually earned', () => {
        ttStore.raiseStars('t2', 3)
        beamStore.raiseStars('double', 2)
        senseStore.raiseStars('subitize', 1)

        const report = buildReport()
        expect(report.tables.stars).toBe(3)
        expect(report.beam.stars).toBe(2)
        expect(report.sense.stars).toBe(1)
        expect(report.beam.outOf).toBe(27)
        expect(report.sense.outOf).toBe(18)
    })

    it('names the child it is about', () => {
        store.ensurePlayer('Mia', '🚀')
        expect(buildReport().player).toBe('Mia')
    })
})
