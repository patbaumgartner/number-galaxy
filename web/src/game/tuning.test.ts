import { describe, expect, it } from 'vitest'
import { RANKS, rankConfig, type Rank } from './types'
import { TUNING_WINDOW, floorFor, tuneAfter, workingMaxFor, type RankTuning } from './tuning'

const answerAll = (rank: Rank, correct: boolean, count: number, from?: RankTuning): RankTuning => {
    let tuning = from
    for (let index = 0; index < count; index += 1) tuning = tuneAfter(rank, tuning, correct)
    return tuning as RankTuning
}

/** The share of `history` that must be correct to sit inside the target band. */
const mixed = (rank: Rank, correctCount: number, from?: RankTuning): RankTuning => {
    let tuning = from
    for (let index = 0; index < TUNING_WINDOW; index += 1) {
        tuning = tuneAfter(rank, tuning, index < correctCount)
    }
    return tuning as RankTuning
}

describe('the working ceiling inside a rank', () => {
    it('starts at the rank a child chose, changing nothing for anyone', () => {
        for (const rank of RANKS) {
            expect(workingMaxFor(rank, undefined)).toBe(rankConfig[rank].maxValue)
        }
    })

    it('waits for a full window before deciding anything', () => {
        const tuning = answerAll('ace', false, TUNING_WINDOW - 1)
        expect(workingMaxFor('ace', tuning)).toBe(rankConfig.ace.maxValue)
    })

    it('eases the numbers off when a child keeps missing', () => {
        const tuning = answerAll('ace', false, TUNING_WINDOW)
        expect(workingMaxFor('ace', tuning)).toBeLessThan(rankConfig.ace.maxValue)
    })

    it('leaves the numbers alone inside the target band', () => {
        // 16 of 20 is 80 %: the middle of where learning is fastest.
        const tuning = mixed('ace', 16)
        expect(workingMaxFor('ace', tuning)).toBe(rankConfig.ace.maxValue)
    })

    it('climbs back once the child is comfortable again', () => {
        const eased = answerAll('ace', false, TUNING_WINDOW)
        const lowered = workingMaxFor('ace', eased)
        const recovered = answerAll('ace', true, TUNING_WINDOW, eased)
        expect(workingMaxFor('ace', recovered)).toBeGreaterThan(lowered)
    })

    it('never drops below the rank underneath, or climbs above its own', () => {
        for (const rank of RANKS) {
            const floor = floorFor(rank)
            const ceiling = rankConfig[rank].maxValue

            let sinking = answerAll(rank, false, TUNING_WINDOW)
            for (let round = 0; round < 12; round += 1) sinking = answerAll(rank, false, TUNING_WINDOW, sinking)
            expect(workingMaxFor(rank, sinking)).toBeGreaterThanOrEqual(floor)

            let rising = answerAll(rank, true, TUNING_WINDOW)
            for (let round = 0; round < 12; round += 1) rising = answerAll(rank, true, TUNING_WINDOW, rising)
            expect(workingMaxFor(rank, rising)).toBeLessThanOrEqual(ceiling)
        }
    })

    it('clears the window after a move, so the next decision uses new evidence', () => {
        expect(answerAll('ace', false, TUNING_WINDOW).history).toEqual([])
        expect(answerAll('ace', false, TUNING_WINDOW - 1).history).toHaveLength(TUNING_WINDOW - 1)
    })

    it('keeps the easiest rank whole, having nothing below it to fall to', () => {
        expect(floorFor('rookie')).toBe(rankConfig.rookie.maxValue)
        const tuning = answerAll('rookie', false, TUNING_WINDOW * 3)
        expect(workingMaxFor('rookie', tuning)).toBe(rankConfig.rookie.maxValue)
    })

    it('repairs a tampered ceiling rather than trusting it', () => {
        expect(workingMaxFor('ace', { max: 99_999, history: [] })).toBe(rankConfig.ace.maxValue)
        expect(workingMaxFor('ace', { max: -5, history: [] })).toBe(floorFor('ace'))
    })
})
