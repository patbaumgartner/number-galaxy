import type { FactProgress } from './types'

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
    todayEpochDay: number,
): FactProgress => {
    const baseline: FactProgress = progress ?? { box: 1, lastDay: todayEpochDay, last3: [] }
    const nextBox: FactProgress['box'] = correct ? nextBoxes[baseline.box] : 1
    const last3 = [...baseline.last3, { correct, ms }].slice(-3)

    return { box: nextBox, lastDay: todayEpochDay, last3 }
}

export const isDue = (progress: FactProgress, todayEpochDay: number): boolean =>
    progress.lastDay + intervalForBox(progress.box) <= todayEpochDay

export const isMastered = (progress: FactProgress): boolean =>
    progress.box >= 4
  && progress.last3.length === 3
  && progress.last3.every((answer) => answer.correct && answer.ms < 3000)

export const localEpochDay = (now: number, tzOffsetMin: number): number =>
    Math.floor((now - tzOffsetMin * 60_000) / 86_400_000)
