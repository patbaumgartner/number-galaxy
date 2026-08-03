import { describe, expect, it } from 'vitest'
import { createRng } from '../game/rng'
import {
    advanceDrill,
    answerDrill,
    buildDrillQuestions,
    createDrill,
    currentQuestion,
    drillAccuracy,
    drillCorrect,
} from './session'
import {
    BEAM_STATIONS,
    BEAM_ZONES,
    getStation,
    getZone,
    isBeamSkill,
    isStationUnlocked,
    isZoneUnlocked,
    nextRecommendedStation,
    zoneOf,
    type BeamStars,
} from './stations'
import { BEAM_SKILLS, QUESTIONS_PER_DRILL, computeBeamStars, tierForStars } from './types'

const playThrough = (outcomes: readonly boolean[]) =>
    outcomes.reduce(
        (state, correct) => advanceDrill(answerDrill(state, correct)),
        createDrill('double', 0, createRng(1)),
    )

describe('beam drill', () => {
    it('builds exactly ten questions for the chosen skill', () => {
        const drill = createDrill('halve', 1, createRng(4))
        expect(drill.questions).toHaveLength(QUESTIONS_PER_DRILL)
        expect(drill.questions.every(question => question.skill === 'halve')).toBe(true)
        expect(currentQuestion(drill)).toBe(drill.questions[0])
    })

    it('opens with tiles and asks for the beam on every other question', () => {
        const questions = buildDrillQuestions('halve', 0, createRng(9))
        expect(questions[0].input).toBe('tiles')
        expect(questions.filter((_unused, index) => index % 2 === 1).some(q => q.input === 'beam')).toBe(true)
    })

    it('counts a correct answer and keeps the streak growing', () => {
        const state = playThrough([true, true, true])
        expect(drillCorrect(state)).toBe(3)
        expect(state.streak).toBe(3)
        expect(state.bestStreak).toBe(3)
        expect(drillAccuracy(state)).toBe(1)
    })

    it('resets the streak on a miss but remembers the best one', () => {
        const state = playThrough([true, true, false, true])
        expect(state.streak).toBe(1)
        expect(state.bestStreak).toBe(2)
        expect(drillAccuracy(state)).toBe(0.75)
    })

    it('reports no accuracy before the first answer', () => {
        expect(drillAccuracy(createDrill('bond', 0, createRng(2)))).toBe(0)
    })

    it('reaches the summary only after all ten questions, whatever the answers', () => {
        let state = createDrill('split', 0, createRng(5))
        for (let index = 0; index < QUESTIONS_PER_DRILL; index += 1) {
            expect(state.phase).toBe('answering')
            state = answerDrill(state, index % 3 !== 0)
            if (state.phase === 'feedback') state = advanceDrill(state)
        }
        expect(state.phase).toBe('summary')
        expect(state.results).toHaveLength(QUESTIONS_PER_DRILL)
    })

    it('ignores an answer that arrives outside the answering phase', () => {
        const answered = answerDrill(createDrill('double', 0, createRng(6)), true)
        expect(answerDrill(answered, true)).toBe(answered)

        const advanced = advanceDrill(answered)
        expect(advanced.index).toBe(1)
        expect(advanceDrill(advanced)).toBe(advanced)
    })
})

describe('beam stars', () => {
    it('awards the first star for a solid run', () => {
        expect(computeBeamStars(0, 7, 10)).toBe(1)
        expect(computeBeamStars(0, 6, 10)).toBe(0)
    })

    it('awards the second star only once the first is held', () => {
        expect(computeBeamStars(0, 9, 10)).toBe(1)
        expect(computeBeamStars(1, 9, 10)).toBe(2)
    })

    it('awards the third star for a clean sweep on top of two', () => {
        expect(computeBeamStars(2, 10, 10)).toBe(3)
        expect(computeBeamStars(1, 10, 10)).toBe(2)
    })

    it('never takes a star away', () => {
        expect(computeBeamStars(3, 0, 10)).toBe(3)
        expect(computeBeamStars(2, 5, 10)).toBe(2)
        expect(computeBeamStars(1, 0, 0)).toBe(1)
    })

    it('raises the tier with the stars, then holds at the top', () => {
        expect(tierForStars(0)).toBe(0)
        expect(tierForStars(1)).toBe(1)
        expect(tierForStars(2)).toBe(2)
        expect(tierForStars(3)).toBe(2)
    })
})

describe('beam stations', () => {
    it('lists every skill exactly once across the three zones', () => {
        expect(BEAM_STATIONS.map(station => station.id).sort()).toEqual([...BEAM_SKILLS].sort())
        expect(BEAM_ZONES).toHaveLength(3)
        expect(BEAM_ZONES.every(zone => zone.stations.length === 3)).toBe(true)
    })

    it('grows its number caps from tier to tier', () => {
        for (const station of BEAM_STATIONS) {
            expect(station.caps[0]).toBeLessThan(station.caps[1])
            expect(station.caps[1]).toBeLessThan(station.caps[2])
        }
    })

    it('opens the first zone straight away and the rest on two stars', () => {
        const none: BeamStars = {}
        expect(isZoneUnlocked('doubles', none)).toBe(true)
        expect(isZoneUnlocked('parts', none)).toBe(false)
        expect(isZoneUnlocked('parts', { double: 1 })).toBe(false)
        expect(isZoneUnlocked('parts', { double: 1, halve: 2 })).toBe(true)
        expect(isZoneUnlocked('place', { double: 1, halve: 2 })).toBe(false)
        expect(isZoneUnlocked('place', { quarter: 1, fractionOf: 1 })).toBe(true)
    })

    it('locks a station exactly when its zone is locked', () => {
        expect(isStationUnlocked('double', {})).toBe(true)
        expect(isStationUnlocked('quarter', {})).toBe(false)
        expect(isStationUnlocked('quarter', { double: 1, nearDouble: 1 })).toBe(true)
    })

    it('recommends the first unlocked station still without a star', () => {
        expect(nextRecommendedStation({})).toBe('double')
        expect(nextRecommendedStation({ double: 1 })).toBe('halve')
        expect(nextRecommendedStation({ double: 1, halve: 1, nearDouble: 1 })).toBe('doubleDouble')
    })

    it('finds a station and its zone by id, and rejects anything else', () => {
        expect(getStation('bond').emoji).not.toBe('')
        expect(getZone('place').id).toBe('place')
        expect(zoneOf('bond').id).toBe('place')
        expect(isBeamSkill('halve')).toBe(true)
        expect(isBeamSkill('nonsense')).toBe(false)
        expect(isBeamSkill(undefined)).toBe(false)
        expect(() => getStation('nope' as never)).toThrow()
        expect(() => getZone('nope' as never)).toThrow()
        expect(() => zoneOf('nope' as never)).toThrow()
    })
})
