import { describe, expect, it } from 'vitest'
import { canonicalKey, factsForPlanet, orientFact } from './facts'

describe('times-table facts', () => {
    it('folds commutative fact keys', () => {
        expect(canonicalKey(7, 3)).toBe('3x7')
    })

    it('enumerates the specified fact ranges', () => {
        expect(factsForPlanet('t7')).toHaveLength(12)
        expect(factsForPlanet('t17')).toHaveLength(10)
        expect(factsForPlanet('sq-deep').map((fact) => fact.answer)).toEqual(
            Array.from({ length: 13 }, (_, index) => (index + 13) ** 2),
        )
    })

    it('orients non-square facts in both directions without changing their key', () => {
        const fact = factsForPlanet('t7')[0]

        expect(fact).toBeDefined()
        if (fact === undefined) return

        expect(orientFact(fact, () => 0.25)).toEqual({ a: 7, b: 1 })
        expect(orientFact(fact, () => 0.75)).toEqual({ a: 1, b: 7 })
        expect(fact.key).toBe('1x7')
    })

    it('does not generate duplicate canonical keys', () => {
        for (const planetId of [
            't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12',
            'sq-core', 'sq-deep', 't15', 't20', 't25', 't13', 't14', 't16', 't17', 't18', 't19',
        ] as const) {
            const facts = factsForPlanet(planetId)

            expect(new Set(facts.map((fact) => fact.key)).size).toBe(facts.length)
        }
    })
})
