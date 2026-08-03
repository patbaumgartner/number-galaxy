import { describe, expect, it } from 'vitest'
import {
    QUESTIONS_PER_MISSION,
    abortMission,
    advanceMission,
    createMission,
    createRng,
    getAccuracy,
    getAnswered,
    getCorrect,
    scoreAnswer,
} from './index'

const config = {
    language: 'en' as const,
    rank: 'rookie' as const,
    timed: true,
    operations: ['addition', 'multiplication'] as const,
}

describe('createMission', () => {
    it('is deterministic with a seeded rng and starts ready with its first operation shown', () => {
        const first = createMission({ ...config, operations: [...config.operations], rng: createRng(42) })
        const second = createMission({ ...config, operations: [...config.operations], rng: createRng(42) })
        expect(first).toEqual(second)
        expect(first.phase).toBe('ready')
        expect(first.shownOperations).toEqual([first.question.operation])
    })

    it('falls back to addition when the selected operation pool is empty', () => {
        const mission = createMission({ ...config, operations: [], rng: createRng(1) })
        expect(mission.operations).toEqual(['addition'])
        expect(mission.question.operation).toBe('addition')
    })
})

describe('mission scoring', () => {
    it('reports answered, correct, and zero-safe accuracy from answer results', () => {
        const mission = createMission({ ...config, operations: [...config.operations], rng: createRng(1) })
        expect(getAnswered(mission)).toBe(0)
        expect(getCorrect(mission)).toBe(0)
        expect(getAccuracy(mission)).toBe(0)

        const answered = scoreAnswer(scoreAnswer(mission, 'correct'), 'wrong')
        expect(getAnswered(answered)).toBe(2)
        expect(getCorrect(answered)).toBe(1)
        expect(getAccuracy(answered)).toBe(0.5)
    })

    it('tracks score, streak, best streak, results and normal feedback transitions', () => {
        let mission = createMission({ ...config, operations: [...config.operations], rng: createRng(2) })
        mission = scoreAnswer(mission, 'correct')
        expect(mission).toMatchObject({ results: [true], streak: 1, bestStreak: 1, score: 10, phase: 'feedback' })
        mission = scoreAnswer(mission, 'correct')
        mission = scoreAnswer(mission, 'correct')
        expect(mission).toMatchObject({ streak: 3, bestStreak: 3, score: 40 })
    })

    it('resets the streak for wrong answers and timeouts without losing the best streak', () => {
        let mission = createMission({ ...config, operations: [...config.operations], rng: createRng(3) })
        mission = scoreAnswer(scoreAnswer(mission, 'correct'), 'wrong')
        expect(mission).toMatchObject({ results: [true, false], streak: 0, bestStreak: 1, phase: 'feedback' })
        mission = scoreAnswer(mission, 'timeout')
        expect(mission).toMatchObject({ results: [true, false, false], streak: 0, bestStreak: 1 })
    })

    it('enters summary exactly when the mission reaches its question count', () => {
        let mission = createMission({ ...config, operations: [...config.operations], rng: createRng(4) })
        for (let i = 0; i < QUESTIONS_PER_MISSION - 1; i += 1) mission = scoreAnswer(mission, 'wrong')
        expect(mission.phase).toBe('feedback')
        mission = scoreAnswer(mission, 'wrong')
        expect(mission.results).toHaveLength(QUESTIONS_PER_MISSION)
        expect(mission.phase).toBe('summary')
    })
})

describe('mission transitions', () => {
    it('does not advance a completed mission', () => {
        const mission = abortMission(createMission({ ...config, operations: [...config.operations], rng: createRng(5) }))
        expect(advanceMission(mission, { rng: createRng(6) })).toBe(mission)
    })

    it('restarts shown operations after every selected operation has appeared', () => {
        let mission = createMission({ ...config, operations: [...config.operations], rng: createRng(7) })
        mission = advanceMission(mission, { rng: createRng(8) })
        expect(mission.shownOperations).toHaveLength(2)
        expect(new Set(mission.shownOperations)).toEqual(new Set(config.operations))
        expect(mission.phase).toBe('answering')

        mission = advanceMission(mission, { rng: createRng(9) })
        expect(mission.shownOperations).toEqual([mission.question.operation])
    })

    it('ends a mission on request while retaining the earned state', () => {
        const scored = scoreAnswer(createMission({ ...config, operations: [...config.operations], rng: createRng(10) }), 'correct')
        const aborted = abortMission(scored)
        expect(aborted.phase).toBe('summary')
        expect(aborted.score).toBe(scored.score)
        expect(aborted.results).toEqual(scored.results)
    })
})

describe('missed questions coming back', () => {
    const start = () => createMission({ ...config, operations: [...config.operations], rng: createRng(3) })

    it('asks a missed question again a few questions later, not straight away', () => {
        const missed = start().question
        let mission = scoreAnswer(start(), 'wrong')
        expect(mission.retries).toHaveLength(1)

        mission = advanceMission(mission, { rng: createRng(11) })
        expect(mission.question.prompt).not.toBe(missed.prompt)

        for (let i = 0; i < 3; i += 1) {
            mission = advanceMission(scoreAnswer(mission, 'correct'), { rng: createRng(12 + i) })
        }
        expect(mission.question.prompt).toBe(missed.prompt)
        expect(mission.retries).toHaveLength(0)
    })

    it('requeues a timeout the same way it requeues a wrong answer', () => {
        expect(scoreAnswer(start(), 'timeout').retries).toHaveLength(1)
        expect(scoreAnswer(start(), 'correct').retries).toHaveLength(0)
    })

    it('never queues the same prompt twice, so a repeated miss cannot loop', () => {
        let mission = scoreAnswer(start(), 'wrong')
        mission = advanceMission(mission, { rng: createRng(11) })
        for (let i = 0; i < 3; i += 1) {
            mission = advanceMission(scoreAnswer(mission, 'correct'), { rng: createRng(20 + i) })
        }

        const secondMiss = scoreAnswer(mission, 'wrong')
        expect(secondMiss.retries).toHaveLength(0)
        expect(secondMiss.retried).toHaveLength(1)
    })

    it('still stops at exactly one mission length however many were missed', () => {
        let mission = start()
        for (let i = 0; i < QUESTIONS_PER_MISSION; i += 1) {
            mission = scoreAnswer(mission, i % 2 === 0 ? 'wrong' : 'correct')
            if (mission.phase !== 'summary') mission = advanceMission(mission, { rng: createRng(30 + i) })
        }
        expect(mission.phase).toBe('summary')
        expect(getAnswered(mission)).toBe(QUESTIONS_PER_MISSION)
    })
})
