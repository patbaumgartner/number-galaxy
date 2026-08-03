import { GALAXIES, isPlanetUnlocked } from './tables'
import type { Phase, PlanetId, StarLevel } from './types'

const phases: readonly Phase[] = ['learn', 'practice', 'speed', 'daily']

const isPhase = (value: string | undefined): value is Phase =>
    value !== undefined && phases.some(phase => phase === value)

const planetIds: readonly PlanetId[] = GALAXIES.flatMap((galaxy) => galaxy.planets.map((planet) => planet.id))

const isPlanetId = (value: string | undefined): value is PlanetId =>
    value !== undefined && planetIds.some(planetId => planetId === value)

export const resolveTrainRoute = (
    planetId: string | undefined,
    phase: string | undefined,
    stars: Partial<Record<PlanetId, StarLevel>>,
): string | null => {
    if (!isPhase(phase)) return '/times-tables'
    if (planetId === 'mission') return phase === 'daily' ? null : '/times-tables'
    if (phase === 'daily' || !isPlanetId(planetId)) return '/times-tables'

    const typedPlanetId = planetId
    if (!isPlanetUnlocked(typedPlanetId, stars)) return '/times-tables'
    if (phase === 'speed' && (stars[typedPlanetId] ?? 0) < 1) {
        return `/times-tables/train/${typedPlanetId}/practice`
    }

    return null
}
