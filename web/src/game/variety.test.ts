import { describe, expect, it } from 'vitest'
import { OPERATIONS, createRng, pickOperation, type Operation } from './index'
import { QUESTIONS_PER_MISSION } from './types'

/**
 * Replays a whole mission's operation choices with the same bookkeeping the
 * store performs, so the selection loop is exercised exactly as it runs live.
 */
function simulate(pool: Operation[], accuracy: number, seed: number) {
    const rng = createRng(seed)
    const weakness: Record<string, number> = {}
    const srData: Record<string, { interval: number; due: number }> = {}
    const picked: Operation[] = []
    let shown: Operation[] = []

    for (let i = 0; i < QUESTIONS_PER_MISSION; i += 1) {
        const operation = pickOperation(rng, pool, weakness, srData, i, shown)
        picked.push(operation)
        shown = shown.length >= pool.length ? [operation] : [...shown, operation]

        const correct = rng() < accuracy
        weakness[operation] = correct
            ? Math.max(0, (weakness[operation] ?? 0) - 1)
            : (weakness[operation] ?? 0) + 1
        if (correct) {
            const interval = Math.min(Math.round((srData[operation]?.interval ?? 1) * 2.5), 25)
            srData[operation] = { interval, due: i + interval }
        } else {
            srData[operation] = { interval: 1, due: i + 1 }
        }
    }

    const counts = new Map<Operation, number>()
    for (const operation of picked) counts.set(operation, (counts.get(operation) ?? 0) + 1)
    return { picked, counts }
}

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 6971 + 13)

describe('operation variety', () => {
    it('shows every operation the player chose, however well or badly they do', () => {
        const missing: string[] = []
        for (const accuracy of [0, 0.25, 0.5, 0.9, 1]) {
            for (const seed of SEEDS) {
                const { counts } = simulate([...OPERATIONS], accuracy, seed)
                if (counts.size !== OPERATIONS.length) {
                    const absent = OPERATIONS.filter(op => !counts.has(op))
                    missing.push(`accuracy ${accuracy} seed ${seed}: never showed ${absent.join()}`)
                }
            }
        }
        expect(missing).toEqual([])
    })

    it('never lets one operation take over the mission', () => {
        const hogs: string[] = []
        for (const accuracy of [0, 0.25, 0.5]) {
            for (const seed of SEEDS) {
                const { counts } = simulate([...OPERATIONS], accuracy, seed)
                const [top, share] = [...counts.entries()].reduce((a, b) => (a[1] >= b[1] ? a : b))
                if (share > QUESTIONS_PER_MISSION / 2) {
                    hogs.push(`accuracy ${accuracy} seed ${seed}: ${top} took ${share}/${QUESTIONS_PER_MISSION}`)
                }
            }
        }
        expect(hogs).toEqual([])
    })

    it('shows every chosen operation within the first round of questions', () => {
        const late: string[] = []
        for (const accuracy of [0, 0.5, 1]) {
            for (const seed of SEEDS) {
                const { picked } = simulate([...OPERATIONS], accuracy, seed)
                const firstRound = new Set(picked.slice(0, OPERATIONS.length))
                if (firstRound.size !== OPERATIONS.length) {
                    late.push(`accuracy ${accuracy} seed ${seed}: ${picked.slice(0, OPERATIONS.length).join()}`)
                }
            }
        }
        expect(late).toEqual([])
    })

    it('still favours the operation the player keeps getting wrong', () => {
        const pool: Operation[] = ['addition', 'multiplication']
        const rng = createRng(99)
        let weak = 0
        for (let i = 0; i < 3000; i += 1) {
            if (pickOperation(rng, pool, { multiplication: 5 }, {}, i) === 'multiplication') weak += 1
        }
        expect(weak).toBeGreaterThan(1500)
    })

    it('honours a two-operation pool without starving either side', () => {
        for (const seed of SEEDS.slice(0, 12)) {
            const { counts } = simulate(['addition', 'remainders'], 0, seed)
            expect(counts.size).toBe(2)
        }
    })
})
