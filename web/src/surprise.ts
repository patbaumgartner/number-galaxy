import type { Rng } from './game'
import { defaultRng, pick } from './game/rng'
import type { BeamSkill } from './beam'
import { BEAM_STATIONS, beamStore, isStationUnlocked, type BeamStars } from './beam'
import type { SenseSkill } from './sense'
import { SENSE_STATIONS, isSenseStationUnlocked, senseStore, type SenseStars } from './sense'
import { localEpochDay } from './review/leitner'
import { countDueFacts } from './timesTable/session'
import { GALAXIES, isPlanetUnlocked } from './timesTable/tables'
import { ttStore } from './timesTable/ttStore'
import type { PlanetId, StarLevel } from './timesTable/types'

/** Marks a run the player did not choose, so its summary can offer another one. */
export const SURPRISE_PARAM = 'surprise'

export type SurpriseTarget =
    | { readonly game: 'invaders' }
    | { readonly game: 'tables'; readonly planetId: PlanetId }
    | { readonly game: 'tables'; readonly planetId: 'mission' }
    | { readonly game: 'beam'; readonly skill: BeamSkill }
    | { readonly game: 'sense'; readonly skill: SenseSkill }

export type SurpriseInput = {
    readonly rng: Rng
    readonly ttStars: Partial<Record<PlanetId, StarLevel>>
    readonly beamStars: BeamStars
    readonly senseStars: SenseStars
    /** Times-tables facts due for review today. */
    readonly dueFactCount: number
}

const ALL_PLANETS: readonly PlanetId[] = GALAXIES.flatMap(galaxy => galaxy.planets.map(planet => planet.id))

/**
 * Where a surprise run should go.
 *
 * "Random" here never means uniform. A locked planet or station cannot be
 * entered at all, and a rank the player did not choose would throw Supernova
 * numbers at a Rookie, so the pick is drawn only from what is unlocked and left
 * at the difficulty the player has already earned. Review comes first: if the
 * trainer has facts due today, that is what practice is for.
 */
export function pickSurprise({ rng, ttStars, beamStars, senseStars, dueFactCount }: SurpriseInput): SurpriseTarget {
    const planets = ALL_PLANETS.filter(planetId => isPlanetUnlocked(planetId, ttStars))
    const stations = BEAM_STATIONS
        .filter(station => isStationUnlocked(station.id, beamStars))
        .map(station => station.id)
    const senseStations = SENSE_STATIONS
        .filter(station => isSenseStationUnlocked(station.id, senseStars))
        .map(station => station.id)

    const games: SurpriseTarget[] = [{ game: 'invaders' }]
    if (dueFactCount > 0) games.push({ game: 'tables', planetId: 'mission' })
    else if (planets.length > 0) games.push({ game: 'tables', planetId: pick(rng, planets) })
    if (stations.length > 0) games.push({ game: 'beam', skill: pick(rng, stations) })
    if (senseStations.length > 0) games.push({ game: 'sense', skill: pick(rng, senseStations) })

    return pick(rng, games)
}

/**
 * The path a target opens.
 *
 * The marker rides in the query string rather than router state so it survives a
 * reload and the GitHub Pages 404 redirect, both of which drop state.
 */
export function surpriseRoute(target: SurpriseTarget): string {
    const mark = `?${SURPRISE_PARAM}=1`
    switch (target.game) {
        case 'invaders':
            return `/game${mark}`
        case 'tables':
            return target.planetId === 'mission'
                ? `/times-tables/train/mission/daily${mark}`
                : `/times-tables/train/${target.planetId}/practice${mark}`
        case 'beam':
            return `/number-beam/drill/${target.skill}${mark}`
        case 'sense':
            return `/number-sense/drill/${target.skill}${mark}`
    }
}

/**
 * The same pick, against whatever the player has actually earned.
 *
 * Kept apart from {@link pickSurprise} so the choosing stays pure and testable
 * while the storage reads live in one place.
 */
export function nextSurprise(rng: Rng = defaultRng): SurpriseTarget {
    const today = localEpochDay(Date.now(), new Date().getTimezoneOffset())
    return pickSurprise({
        rng,
        ttStars: ttStore.getStars(),
        beamStars: beamStore.getStars(),
        senseStars: senseStore.getStars(),
        dueFactCount: countDueFacts(ttStore.getProgress(), today),
    })
}
