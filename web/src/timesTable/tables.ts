import type { GalaxyId, PlanetId, StarLevel } from './types'

type Planet = {
  readonly id: PlanetId
  readonly emoji: string
  readonly label: string
  readonly factor: number
  readonly rangeEnd: number
}

type Galaxy = {
  readonly id: GalaxyId
  readonly planets: readonly Planet[]
}

const homePlanets = [
  ['t1', 1], ['t2', 2], ['t3', 3], ['t4', 4], ['t5', 5], ['t6', 6],
  ['t7', 7], ['t8', 8], ['t9', 9], ['t10', 10], ['t11', 11], ['t12', 12],
] as const

const toTablePlanet = (id: PlanetId, factor: number, rangeEnd: number): Planet => ({
  id,
  emoji: '✖️',
  label: `×${factor}`,
  factor,
  rangeEnd,
})

export const GALAXIES: readonly Galaxy[] = [
  {
    id: 'home',
    planets: homePlanets.map(([id, factor]) => toTablePlanet(id, factor, 12)),
  },
  {
    id: 'squares',
    planets: [
      { id: 'sq-core', emoji: '⬜', label: '1²–12²', factor: 1, rangeEnd: 12 },
      { id: 'sq-deep', emoji: '⬛', label: '13²–25²', factor: 13, rangeEnd: 25 },
    ],
  },
  {
    id: 'shortcuts',
    planets: [
      toTablePlanet('t15', 15, 12),
      toTablePlanet('t20', 20, 12),
      toTablePlanet('t25', 25, 12),
    ],
  },
  {
    id: 'deep',
    planets: [
      toTablePlanet('t13', 13, 10),
      toTablePlanet('t14', 14, 10),
      toTablePlanet('t16', 16, 10),
      toTablePlanet('t17', 17, 10),
      toTablePlanet('t18', 18, 10),
      toTablePlanet('t19', 19, 10),
    ],
  },
]

export const RECOMMENDED_ORDER: readonly PlanetId[] = [
  't1', 't2', 't5', 't10', 't3', 't4', 't6', 't8', 't7', 't9', 't11', 't12',
]

const homeIds = new Set<PlanetId>(homePlanets.map(([id]) => id))
const deepIds = new Set<PlanetId>(['t13', 't14', 't16', 't17', 't18', 't19'])

export const getPlanet = (planetId: PlanetId): Planet | undefined =>
  GALAXIES.flatMap((galaxy) => galaxy.planets).find((planet) => planet.id === planetId)

export const isPlanetUnlocked = (
  planetId: PlanetId,
  stars: Partial<Record<PlanetId, StarLevel>>,
): boolean => {
  if (homeIds.has(planetId)) return true
  if (planetId === 'sq-core' || planetId === 'sq-deep') {
    return [...homeIds].filter((id) => (stars[id] ?? 0) >= 2).length >= 5
  }
  if (planetId === 't15' || planetId === 't20' || planetId === 't25') {
    return (stars['sq-core'] ?? 0) >= 1
  }
  if (deepIds.has(planetId)) {
    return (['t2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'] as const)
      .every((id) => (stars[id] ?? 0) >= 2)
  }
  return false
}
