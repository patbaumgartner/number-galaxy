import { describe, expect, it, vi } from 'vitest'
import { applyAnswer, intervalForBox, isDue, isMastered, localEpochDay, todayEpochDay } from './leitner'

describe('day-based Leitner scheduler', () => {
    it('advances correct answers through the capped boxes', () => {
        const day = 100
        const second = applyAnswer(undefined, true, 1000, day)
        const third = applyAnswer(second, true, 1000, day)
        const fourth = applyAnswer(third, true, 1000, day)
        const fifth = applyAnswer(fourth, true, 1000, day)
        const capped = applyAnswer(fifth, true, 1000, day)

        expect([second.box, third.box, fourth.box, fifth.box, capped.box]).toEqual([2, 3, 4, 5, 5])
    })

    it('resets a wrong answer to box one', () => {
        const progress = { box: 5, lastDay: 90, last3: [] } as const

        expect(applyAnswer(progress, false, 1000, 100)).toMatchObject({ box: 1, lastDay: 100 })
    })

    it('uses the five configured review intervals', () => {
        const boxes: readonly (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5]

        expect(boxes.map(intervalForBox)).toEqual([0, 1, 2, 4, 7])
        expect(isDue({ box: 1, lastDay: 100, last3: [] }, 100)).toBe(true)
        expect(isDue({ box: 5, lastDay: 100, last3: [] }, 106)).toBe(false)
        expect(isDue({ box: 5, lastDay: 100, last3: [] }, 107)).toBe(true)
    })

    it('requires a fast perfect three-answer history in box four or higher', () => {
        expect(isMastered({ box: 4, lastDay: 1, last3: [
            { correct: true, ms: 2999 }, { correct: true, ms: 2999 }, { correct: true, ms: 2999 },
        ] })).toBe(true)
        expect(isMastered({ box: 4, lastDay: 1, last3: [
            { correct: true, ms: 3000 }, { correct: true, ms: 2999 }, { correct: true, ms: 2999 },
        ] })).toBe(false)
        expect(isMastered({ box: 4, lastDay: 1, last3: [
            { correct: false, ms: 1000 }, { correct: true, ms: 1000 }, { correct: true, ms: 1000 },
        ] })).toBe(false)
        expect(isMastered({ box: 3, lastDay: 1, last3: [
            { correct: true, ms: 1000 }, { correct: true, ms: 1000 }, { correct: true, ms: 1000 },
        ] })).toBe(false)
    })

    it('derives a local epoch day from explicit clock inputs', () => {
        expect(localEpochDay(86_400_000, -120)).toBe(1)
    })

    /**
     * The day a child is having, not the day UTC is having.
     *
     * An evening in Zurich is already tomorrow in UTC for two hours of every
     * day, and one in Auckland for half of it. Reading the calendar day off the
     * clock alone would bring facts back a day early or late for every child
     * west or east of Greenwich, which is invisible from anywhere near it.
     */
    it('reads today from the local calendar rather than from UTC', () => {
        const at = (iso: string, offsetMin: number): number => {
            vi.setSystemTime(new Date(iso))
            vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offsetMin)
            return todayEpochDay()
        }
        vi.useFakeTimers()
        try {
            // 22:30 UTC is already the next calendar day in Zurich (UTC+2)...
            expect(at('2026-06-01T22:30:00Z', -120)).toBe(at('2026-06-02T12:00:00Z', -120))
            // ...and still the previous one in Los Angeles (UTC-7).
            expect(at('2026-06-02T03:00:00Z', 420)).toBe(at('2026-06-01T12:00:00Z', 420))
        } finally {
            vi.useRealTimers()
            vi.restoreAllMocks()
        }
    })
})

describe('thinking time', () => {
    const quick = { box: 4 as const, lastDay: 0, last3: [
        { correct: true, ms: 4000 }, { correct: true, ms: 4000 }, { correct: true, ms: 4000 },
    ] }

    it('holds the usual recall line by default', () => {
        expect(isMastered(quick)).toBe(false)
    })

    it('measures the same standard with a fairer instrument when time is stretched', () => {
        expect(isMastered(quick, 2)).toBe(true)
    })

    it('still requires the answers to be right, however long they took', () => {
        const wrong = { ...quick, last3: [{ correct: false, ms: 100 }, { correct: true, ms: 100 }, { correct: true, ms: 100 }] }
        expect(isMastered(wrong, 2)).toBe(false)
    })
})
