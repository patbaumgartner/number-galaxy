import { describe, expect, it } from 'vitest'
import { factsForPlanet } from './facts'
import { buildDailyMission, buildPracticeSession, buildSpeedSession, requeueWrong, countDueFacts } from './session'
import type { FactProgress } from './types'

const fixedRng = (): number => 0.5
const dueProgress = (box: FactProgress['box']): FactProgress => ({ box, lastDay: 0, last3: [] })

describe('times-table sessions', () => {
    it('builds practice sessions at each planet size cap', () => {
        expect(buildPracticeSession('t5', {}, 1, fixedRng)).toHaveLength(12)
        expect(buildPracticeSession('t17', {}, 1, fixedRng)).toHaveLength(10)
        expect(buildPracticeSession('sq-deep', {}, 1, fixedRng)).toHaveLength(12)
    })

    it('orders due lower-box facts before non-due facts', () => {
        const facts = factsForPlanet('t5')
        const dueLow = facts[0]
        const dueHigh = facts[1]

        expect(dueLow).toBeDefined()
        expect(dueHigh).toBeDefined()
        if (dueLow === undefined || dueHigh === undefined) return

        const session = buildPracticeSession('t5', {
            [dueLow.key]: dueProgress(1),
            [dueHigh.key]: dueProgress(2),
        }, 2, fixedRng)

        expect(session.slice(0, 2).map((fact) => fact.key)).toEqual([dueLow.key, dueHigh.key])
    })

    it('covers every fact once in a speed session', () => {
        const session = buildSpeedSession('t17', fixedRng)

        expect(session).toHaveLength(10)
        expect(new Set(session.map((fact) => fact.key)).size).toBe(10)
    })

    it('caps daily review at ten due persisted facts across planets', () => {
        const t5 = factsForPlanet('t5').slice(0, 6)
        const t17 = factsForPlanet('t17').slice(0, 6)
        const progress = Object.fromEntries([...t5, ...t17].map((fact) => [fact.key, dueProgress(1)]))

        const mission = buildDailyMission(progress, { t5: 1, t17: 1 }, 1, fixedRng)

        expect(mission).toHaveLength(10)
        expect(new Set(mission.map((fact) => fact.a)).has(5)).toBe(true)
        expect(new Set(mission.map((fact) => fact.a)).has(17)).toBe(true)
        expect(buildDailyMission({}, { t5: 1 }, 1, fixedRng)).toEqual([])
    })

    it('returns no daily mission when no persisted fact is due', () => {
        const fact = factsForPlanet('t5')[0]

        expect(fact).toBeDefined()
        if (fact === undefined) return

        expect(buildDailyMission({ [fact.key]: { box: 5, lastDay: 0, last3: [] } }, {}, 6, fixedRng)).toEqual([])
    })

    it('requeues a missed fact only once', () => {
        const session = buildPracticeSession('t5', {}, 1, fixedRng)
        const missed = session[0]

        expect(missed).toBeDefined()
        if (missed === undefined) return

        const requeued = requeueWrong(session, missed.key)

        expect(requeued).toHaveLength(13)
        expect(requeueWrong(requeued, missed.key)).toHaveLength(13)
    })

    it('counts the same capped candidate set as the daily mission', () => {
        const facts = factsForPlanet('t5')
        const progress = Object.fromEntries(facts.map((fact) => [fact.key, dueProgress(1)]))

        expect(countDueFacts(progress, 1)).toBe(buildDailyMission(progress, { t5: 1 }, 1, fixedRng).length)
    })
})
