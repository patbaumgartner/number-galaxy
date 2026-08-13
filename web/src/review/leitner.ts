/** What the schedule remembers about one fact, whatever kind of fact it is. */
export type FactProgress = {
    readonly box: 1 | 2 | 3 | 4 | 5
    readonly lastDay: number
    readonly last3: readonly {
        readonly correct: boolean
        readonly ms: number
    }[]
}

const nextBoxes: Record<FactProgress['box'], FactProgress['box']> = {
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 5,
}

export const intervalForBox = (box: FactProgress['box']): number => {
    const intervals: Record<FactProgress['box'], number> = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 7 }
    return intervals[box]
}

export const applyAnswer = (
    progress: FactProgress | undefined,
    correct: boolean,
    ms: number,
    today: number,
): FactProgress => {
    const baseline: FactProgress = progress ?? { box: 1, lastDay: today, last3: [] }
    const nextBox: FactProgress['box'] = correct ? nextBoxes[baseline.box] : 1
    const last3 = [...baseline.last3, { correct, ms }].slice(-3)

    return { box: nextBox, lastDay: today, last3 }
}

export const isDue = (progress: FactProgress, today: number): boolean =>
    progress.lastDay + intervalForBox(progress.box) <= today

/**
 * Recall fast enough to count as knowing something by heart.
 *
 * Three seconds is the usual line between recalling a fact and working it out.
 * It is also an unreasonable line for a child answering in a second language, or
 * with dyscalculia, or with a hand that does not do as it is told — so it can be
 * stretched. That is the same standard measured with a fairer instrument, not a
 * lower one, which is why the multiplier lives here rather than in the criterion.
 */
export const RECALL_MS = 3000

export const isMastered = (progress: FactProgress, thinkingTime = 1): boolean =>
    progress.box >= 4
  && progress.last3.length === 3
  && progress.last3.every((answer) => answer.correct && answer.ms < RECALL_MS * thinkingTime)

export const localEpochDay = (now: number, tzOffsetMin: number): number =>
    Math.floor((now - tzOffsetMin * 60_000) / 86_400_000)

/**
 * Today, where the child is sitting.
 *
 * A due date in this app is a local calendar day, never a UTC one: a fact
 * revised on Tuesday evening in Zurich is due on Wednesday there, and asking
 * UTC gets that wrong for a good part of every day. The pairing of `Date.now()`
 * with the current offset is what makes it local, and it was written out by
 * hand in seven places — every one of them a chance for a review schedule to
 * quietly slip a day, in the one direction nobody would notice.
 */
export const todayEpochDay = (): number =>
    localEpochDay(Date.now(), new Date().getTimezoneOffset())
