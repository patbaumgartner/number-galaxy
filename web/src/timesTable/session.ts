import { factsForPlanet } from './facts'
import { isDue } from '../review/leitner'
import { GALAXIES } from './tables'
import type { Fact, FactKey, FactProgress, PlanetId, StarLevel } from './types'

type LearnSession = {
    readonly facts: readonly Fact[]
    readonly skipCountSequence: readonly number[]
    readonly gapIndices: readonly number[]
    readonly guidedQuestions: readonly Fact[]
}

const allPlanetIds = GALAXIES.flatMap((galaxy) => galaxy.planets.map((planet) => planet.id))

const shuffle = (values: readonly Fact[], rng: () => number): readonly Fact[] => {
    const result = [...values]

    for (let index = result.length - 1; index > 0; index -= 1) {
        const nextIndex = Math.floor(rng() * (index + 1))
        const current = result[index]
        const next = result[nextIndex]
        if (current !== undefined && next !== undefined) {
            result[index] = next
            result[nextIndex] = current
        }
    }
    return result
}

const orderByBoxThenShuffle = (
    facts: readonly Fact[],
    progress: Record<FactKey, FactProgress>,
    rng: () => number,
): readonly Fact[] => {
    const boxes: readonly FactProgress['box'][] = [1, 2, 3, 4, 5]

    return boxes.flatMap((box) => shuffle(facts.filter((fact) => progress[fact.key]?.box === box), rng))
}

const latestWasWrong = (progress: FactProgress | undefined): boolean =>
    progress?.last3.at(-1)?.correct === false

export const practiceSessionSize = (planetId: PlanetId): number => {
    const facts = factsForPlanet(planetId)
    const galaxy = GALAXIES.find((entry) => entry.planets.some((planet) => planet.id === planetId))
    const cap = galaxy?.id === 'deep' ? 10 : 12

    return Math.min(cap, facts.length)
}

const byPriority = (
    facts: readonly Fact[],
    progress: Record<FactKey, FactProgress>,
    today: number,
    rng: () => number,
): readonly Fact[] => {
    const due = facts
        .filter((fact) => {
            const entry = progress[fact.key]
            return entry !== undefined && isDue(entry, today)
        })
    const orderedDue = orderByBoxThenShuffle(due, progress, rng)
    const dueKeys = new Set(orderedDue.map((fact) => fact.key))
    const weak = facts.filter((fact) => !dueKeys.has(fact.key) && latestWasWrong(progress[fact.key]))
    const weakKeys = new Set(weak.map((fact) => fact.key))
    const remaining = facts.filter((fact) => !dueKeys.has(fact.key) && !weakKeys.has(fact.key))

    return [...orderedDue, ...weak, ...shuffle(remaining, rng)]
}

export const buildLearnSession = (planetId: PlanetId): LearnSession => {
    const facts = factsForPlanet(planetId)
    const sequence = facts.map((fact) => fact.answer)
    const gapIndices = [2, 5, 8].filter((index) => index < sequence.length)

    return {
        facts,
        skipCountSequence: sequence,
        gapIndices,
        guidedQuestions: facts.slice(0, 5),
    }
}

export const buildPracticeSession = (
    planetId: PlanetId,
    progress: Record<FactKey, FactProgress>,
    today: number,
    rng: () => number = Math.random,
): readonly Fact[] => {
    const facts = factsForPlanet(planetId)
    const size = practiceSessionSize(planetId)

    return byPriority(facts, progress, today, rng).slice(0, size)
}

export const buildSpeedSession = (
    planetId: PlanetId,
    rng: () => number = Math.random,
): readonly Fact[] => shuffle(factsForPlanet(planetId), rng)

const factByKey = (planetIds: readonly PlanetId[]): ReadonlyMap<FactKey, Fact> => {
    const facts = planetIds.flatMap(factsForPlanet)
    return new Map(facts.map((fact) => [fact.key, fact]))
}

const dueFacts = (
    progress: Record<FactKey, FactProgress>,
    today: number,
): readonly Fact[] => {
    const facts = factByKey(allPlanetIds)

    return [...facts.values()]
        .filter((fact) => {
            const entry = progress[fact.key]
            return entry !== undefined && isDue(entry, today)
        })
}

export const buildDailyMission = (
    progress: Record<FactKey, FactProgress>,
    stars: Partial<Record<PlanetId, StarLevel>>,
    today: number,
    rng: () => number = Math.random,
): readonly Fact[] => {
    const eligiblePlanetIds = allPlanetIds.filter(planetId => {
        const hasStars = (stars[planetId] || 0) > 0
        const hasProgress = factsForPlanet(planetId).some(f => progress[f.key] !== undefined)
        return hasStars || hasProgress
    })

    // By key, not by planet: a fact sits on both of its tables, so `2 × 3` is
    // reached from ×2 and from ×3 under the one canonical key. Concatenating
    // the planets asked a child who had touched both to answer it twice, and
    // `DailyPhase` scores a run by unique key over the session's length — so
    // the repeat capped a flawless mission at 50% and cost it its star.
    const eligibleFacts = [...factByKey(eligiblePlanetIds).values()]
    const dueEligible = eligibleFacts.filter(fact => {
        const entry = progress[fact.key]
        return entry !== undefined && isDue(entry, today)
    })

    return orderByBoxThenShuffle(dueEligible, progress, rng).slice(0, 10)
}

export const requeueWrong = (session: readonly Fact[], factKey: FactKey): readonly Fact[] => {
    const fact = session.find((candidate) => candidate.key === factKey)
    const appearsTwice = session.filter((candidate) => candidate.key === factKey).length > 1

    return fact !== undefined && !appearsTwice ? [...session, fact] : session
}

export const countDueFacts = (
    progress: Record<FactKey, FactProgress>,
    today: number,
): number => Math.min(dueFacts(progress, today).length, 10)
