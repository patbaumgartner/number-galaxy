import { describe, expect, it } from 'vitest'

import { practiceSessionSize } from './session'
import { explainFact, getStrategyCard, STRATEGY_CARDS } from './strategies'
import type { Language } from '../game'
import type { PlanetId } from './types'

const languages: readonly Language[] = ['de', 'it', 'en', 'fr']
const coreAndSquarePlanets: readonly PlanetId[] = [
    't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12', 'sq-core', 'sq-deep',
]
const allPlanets: readonly PlanetId[] = [
    ...coreAndSquarePlanets,
    't15', 't20', 't25', 't13', 't14', 't16', 't17', 't18', 't19',
]

describe('strategy cards', () => {
    it('returns a useful localized card for every core and square planet', () => {
        for (const planetId of coreAndSquarePlanets) {
            for (const language of languages) {
                const card = getStrategyCard(planetId, language)

                expect(card.title).not.toBe('')
                expect(card.lines.length).toBeGreaterThanOrEqual(2)
            }
        }
    })

    it('introduces the difference of squares on the deep-square planet', () => {
        const distinctiveIdeas: Record<Language, string> = {
            de: 'Quadrate',
            it: 'quadrati',
            en: 'squares',
            fr: 'carrés',
        }

        for (const language of languages) {
            expect(getStrategyCard('sq-deep', language).lines.join(' ')).toContain(distinctiveIdeas[language])
        }
    })

    it('rejects an unknown planet id', () => {
        expect(() => getStrategyCard(
            // @ts-expect-error t99 is deliberately outside the PlanetId union.
            't99',
            'de',
        )).toThrow('unknown planet: t99')
    })

    it('does not use opaque shortcut systems', () => {
        const banned = 'Trachten' + 'berg'

        for (const card of Object.values(STRATEGY_CARDS)) {
            for (const language of languages) {
                const localizedCard = card[language]
                if (localizedCard !== undefined) {
                    expect([localizedCard.title, ...localizedCard.lines].join(' ')).not.toContain(banned)
                }
            }
        }
    })

    it('caps deep-space practice sessions at ten facts', () => {
        expect(practiceSessionSize('t17')).toBe(10)
        expect(practiceSessionSize('t5')).toBe(12)
    })

    it('returns a useful localized card for every planet', () => {
        for (const planetId of allPlanets) {
            for (const language of languages) {
                const card = getStrategyCard(planetId, language)

                expect(card.title).not.toBe('')
                expect(card.lines.length).toBeGreaterThanOrEqual(2)
            }
        }
    })

    it('explains deep-space facts with their actual distributive parts', () => {
        const fact = { key: '6x17', a: 17, b: 6, answer: 102 } as const

        for (const language of languages) {
            const explanation = explainFact(fact, 't17', language)

            expect(explanation).toContain('60')
            expect(explanation).toContain('42')
            expect(explanation).toContain('102')
        }
    })

    it('explains shortcut and square facts with their actual answers', () => {
        const twentyFiveByEight = { key: '8x25', a: 25, b: 8, answer: 200 } as const
        const sevenSquared = { key: '7x7', a: 7, b: 7, answer: 49 } as const

        for (const language of languages) {
            expect(explainFact(twentyFiveByEight, 't25', language)).toContain('200')
            expect(explainFact(sevenSquared, 'sq-core', language)).toContain('49')
        }
    })

    it('rejects an unknown planet for a fact explanation', () => {
        const fact = { key: '6x17', a: 17, b: 6, answer: 102 } as const

        expect(() => explainFact(
            fact,
            // @ts-expect-error t99 is deliberately outside the PlanetId union.
            't99',
            'de',
        )).toThrow('unknown planet: t99')
    })

})
