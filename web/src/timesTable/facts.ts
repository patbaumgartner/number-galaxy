import { getPlanet } from './tables'
import type { Fact, FactKey, PlanetId } from './types'

export const canonicalKey = (a: number, b: number): FactKey =>
  `${Math.min(a, b)}x${Math.max(a, b)}`

const fact = (a: number, b: number): Fact => ({
  key: canonicalKey(a, b),
  a,
  b,
  answer: a * b,
})

export const factsForPlanet = (planetId: PlanetId): readonly Fact[] => {
  const planet = getPlanet(planetId)

  if (planet === undefined) return []
  if (planetId === 'sq-core' || planetId === 'sq-deep') {
    return Array.from({ length: planet.rangeEnd - planet.factor + 1 }, (_, index) => {
      const value = planet.factor + index
      return fact(value, value)
    })
  }

  return Array.from({ length: planet.rangeEnd }, (_, index) => fact(planet.factor, index + 1))
}

export const orientFact = (
  source: Fact,
  rng: () => number = Math.random,
): Pick<Fact, 'a' | 'b'> => {
  if (source.a === source.b || rng() < 0.5) return { a: source.a, b: source.b }
  return { a: source.b, b: source.a }
}
