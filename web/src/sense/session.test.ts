import { describe, expect, it } from 'vitest'
import { createRng } from '../game/rng'
import {
    advanceSenseDrill,
    answerSenseDrill,
    buildSenseQuestions,
    createSenseDrill,
    currentSenseQuestion,
    senseAccuracy,
    senseCorrect,
} from './session'
import { QUESTIONS_PER_DRILL, computeSenseStars, tierForStars } from './types'

describe('a sense drill', () => {
    it('is always ten questions, and starts on the first', () => {
        const drill = createSenseDrill('subitize', 0, createRng(1))
        expect(drill.questions).toHaveLength(QUESTIONS_PER_DRILL)
        expect(currentSenseQuestion(drill)).toBe(drill.questions[0])
        expect(drill.phase).toBe('answering')
    })

    it('spreads a tiny pool out rather than repeating itself back to back', () => {
        // Subitizing at tier 0 draws from five quantities.
        for (let seed = 1; seed < 30; seed += 1) {
            const questions = buildSenseQuestions('subitize', 0, createRng(seed))
            for (let index = 1; index < questions.length; index += 1) {
                expect(questions[index].value).not.toBe(questions[index - 1].value)
            }
        }
    })

    it('reaches all ten questions however many are missed', () => {
        let drill = createSenseDrill('tenFrame', 0, createRng(2))
        for (let index = 0; index < QUESTIONS_PER_DRILL; index += 1) {
            drill = answerSenseDrill(drill, false)
            if (drill.phase !== 'summary') drill = advanceSenseDrill(drill)
        }
        expect(drill.phase).toBe('summary')
        expect(drill.results).toHaveLength(QUESTIONS_PER_DRILL)
        expect(senseCorrect(drill)).toBe(0)
    })

    it('tracks the streak, and lets a miss cost it without costing the drill', () => {
        let drill = createSenseDrill('rekenrek', 0, createRng(3))
        drill = advanceSenseDrill(answerSenseDrill(drill, true))
        drill = advanceSenseDrill(answerSenseDrill(drill, true))
        expect(drill.streak).toBe(2)
        drill = advanceSenseDrill(answerSenseDrill(drill, false))
        expect(drill.streak).toBe(0)
        expect(drill.bestStreak).toBe(2)
        expect(senseAccuracy(drill)).toBeCloseTo(2 / 3)
    })

    it('ignores an answer once the drill is over', () => {
        let drill = createSenseDrill('array', 0, createRng(4))
        for (let index = 0; index < QUESTIONS_PER_DRILL; index += 1) {
            drill = answerSenseDrill(drill, true)
            if (drill.phase !== 'summary') drill = advanceSenseDrill(drill)
        }
        expect(answerSenseDrill(drill, true)).toBe(drill)
        expect(advanceSenseDrill(drill)).toBe(drill)
    })
})

describe('stars', () => {
    it('needs a good run for the first, and a held star for each one after', () => {
        expect(computeSenseStars(0, 7, 10)).toBe(1)
        expect(computeSenseStars(0, 9, 10)).toBe(1)
        expect(computeSenseStars(1, 9, 10)).toBe(2)
        expect(computeSenseStars(2, 10, 10)).toBe(3)
    })

    it('never falls', () => {
        expect(computeSenseStars(3, 0, 10)).toBe(3)
        expect(computeSenseStars(2, 1, 10)).toBe(2)
    })

    it('widens the numbers with the stars already held', () => {
        expect(tierForStars(0)).toBe(0)
        expect(tierForStars(2)).toBe(2)
        expect(tierForStars(3)).toBe(2)
    })
})
