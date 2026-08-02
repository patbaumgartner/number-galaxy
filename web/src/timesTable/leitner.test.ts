import { describe, expect, it } from 'vitest'
import { applyAnswer, intervalForBox, isDue, isMastered, localEpochDay } from './leitner'

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
})
