import type { Language } from '../game'
import type { Fact, PlanetId } from './types'
import { STRATEGY_CARDS, type StrategyCard } from './strategyCards'

export { STRATEGY_CARDS } from './strategyCards'

export const getStrategyCard = (planetId: PlanetId, language: Language): StrategyCard => {
    const card = STRATEGY_CARDS[planetId]?.[language]
    if (card === undefined) throw new Error(`unknown planet: ${planetId}`)
    return card
}

const factorForPlanet = (planetId: PlanetId): number | undefined => {
    const match = /^t(\d+)$/.exec(planetId)
    return match === null ? undefined : Number(match[1])
}

const otherFactor = (fact: Fact, factor: number): number =>
    fact.a === factor ? fact.b : fact.a

const sequence = (factor: number, count: number): string =>
    Array.from({ length: count }, (_, index) => String(factor * (index + 1))).join(', ')

const distributiveExplanation = (fact: Fact, factor: number, language: Language): string => {
    const other = otherFactor(fact, factor)
    const tens = 10 * other
    const ones = (factor - 10) * other
    const equation = `${factor}×${other} = 10×${other} + ${factor - 10}×${other} = ${tens} + ${ones} = ${fact.answer}`
    const introductions: Record<Language, string> = {
        de: 'Teile die 10 ab:',
        it: 'Separa il 10:',
        en: 'Split off the 10:',
        fr: 'Sépare le 10 :',
    }
    return `${introductions[language]} ${equation}`
}

const shortcutExplanation = (fact: Fact, planetId: PlanetId, language: Language): string => {
    const factor = factorForPlanet(planetId)
    if (factor === undefined) throw new Error(`unknown planet: ${planetId}`)
    const other = otherFactor(fact, factor)
    const equation = `${factor}×${other} = ${fact.answer}`
    const rules: Record<PlanetId, Record<Language, string> | undefined> = {
        t1: undefined, t2: undefined, t3: undefined, t4: undefined, t5: undefined, t6: undefined,
        t7: undefined, t8: undefined, t9: undefined, t10: undefined, t11: undefined, t12: undefined,
        'sq-core': undefined, 'sq-deep': undefined,
        t15: {
            de: `10×${other} + die Hälfte von 10×${other}`,
            it: `10×${other} più la metà di 10×${other}`,
            en: `10×${other} plus half of 10×${other}`,
            fr: `10×${other} plus la moitié de 10×${other}`,
        },
        t20: {
            de: `verdopple 10×${other}`,
            it: `raddoppia 10×${other}`,
            en: `double 10×${other}`,
            fr: `double 10×${other}`,
        },
        t25: {
            de: `${other}×100 ÷ 4`, it: `${other}×100 ÷ 4`, en: `${other}×100 ÷ 4`, fr: `${other}×100 ÷ 4`,
        },
        t13: undefined, t14: undefined, t16: undefined, t17: undefined, t18: undefined, t19: undefined,
    }
    const rule = rules[planetId]
    if (rule === undefined) throw new Error(`unknown planet: ${planetId}`)
    return `${equation}: ${rule[language]} = ${fact.answer}`
}

export const explainFact = (fact: Fact, planetId: PlanetId, language: Language): string => {
    if (STRATEGY_CARDS[planetId] === undefined) throw new Error(`unknown planet: ${planetId}`)

    if (planetId === 'sq-core' || planetId === 'sq-deep') {
        const area: Record<Language, string> = {
            de: `${fact.a} Reihen mit je ${fact.b} Punkten bilden ${fact.answer}.`,
            it: `${fact.a} righe da ${fact.b} puntini formano ${fact.answer}.`,
            en: `${fact.a} rows of ${fact.b} dots make ${fact.answer}.`,
            fr: `${fact.a} rangées de ${fact.b} points font ${fact.answer}.`,
        }
        return area[language]
    }

    if (planetId === 't15' || planetId === 't20' || planetId === 't25') {
        return shortcutExplanation(fact, planetId, language)
    }

    if (planetId === 't13' || planetId === 't14' || planetId === 't16' || planetId === 't17' || planetId === 't18' || planetId === 't19') {
        const factor = factorForPlanet(planetId)
        if (factor === undefined) throw new Error(`unknown planet: ${planetId}`)
        return distributiveExplanation(fact, factor, language)
    }

    const factor = factorForPlanet(planetId)
    if (factor === undefined) throw new Error(`unknown planet: ${planetId}`)
    const count = otherFactor(fact, factor)
    const phrases: Record<Language, string> = {
        de: `Zähle ${count} ${factor}er: ${sequence(factor, count)} = ${fact.answer}.`,
        it: `Conta ${count} volte ${factor}: ${sequence(factor, count)} = ${fact.answer}.`,
        en: `Count ${count} ${factor}s: ${sequence(factor, count)} = ${fact.answer}.`,
        fr: `Compte ${count} fois ${factor} : ${sequence(factor, count)} = ${fact.answer}.`,
    }
    return phrases[language]
}
