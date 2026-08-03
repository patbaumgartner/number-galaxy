import { describe, expect, it } from 'vitest'
import { createRng } from './game/rng'
import { pickSurprise, surpriseRoute, SURPRISE_PARAM, type SurpriseTarget } from './surprise'
import { BEAM_STATIONS, isStationUnlocked } from './beam'
import { GALAXIES, isPlanetUnlocked } from './timesTable/tables'
import type { PlanetId, StarLevel } from './timesTable/types'

const SEEDS = 300

const beginner = { ttStars: {}, beamStars: {}, dueFactCount: 0 }

const veteran = {
    ttStars: Object.fromEntries(
        GALAXIES.flatMap(galaxy => galaxy.planets).map(planet => [planet.id, 3 as StarLevel]),
    ) as Partial<Record<PlanetId, StarLevel>>,
    beamStars: Object.fromEntries(BEAM_STATIONS.map(station => [station.id, 3 as const])),
    dueFactCount: 0,
}

const draw = (input: Omit<Parameters<typeof pickSurprise>[0], 'rng'>, seeds = SEEDS): SurpriseTarget[] =>
    Array.from({ length: seeds }, (_unused, seed) => pickSurprise({ ...input, rng: createRng(seed) }))

describe('surprise picker', () => {
    it('never sends a beginner anywhere that is locked', () => {
        for (const target of draw(beginner)) {
            if (target.game === 'tables' && target.planetId !== 'mission') {
                expect(isPlanetUnlocked(target.planetId, beginner.ttStars)).toBe(true)
            }
            if (target.game === 'beam') {
                expect(isStationUnlocked(target.skill, beginner.beamStars)).toBe(true)
            }
        }
    })

    it('never sends a veteran anywhere that is locked either', () => {
        for (const target of draw(veteran)) {
            if (target.game === 'tables' && target.planetId !== 'mission') {
                expect(isPlanetUnlocked(target.planetId, veteran.ttStars)).toBe(true)
            }
            if (target.game === 'beam') {
                expect(isStationUnlocked(target.skill, veteran.beamStars)).toBe(true)
            }
        }
    })

    it('reaches all three games for a player who has unlocked them', () => {
        const games = new Set(draw(veteran).map(target => target.game))
        expect(games).toEqual(new Set(['invaders', 'tables', 'beam']))
    })

    it('sends review to the daily mission whenever facts are due', () => {
        const targets = draw({ ...veteran, dueFactCount: 12 })
        const tables = targets.filter(target => target.game === 'tables')
        expect(tables.length).toBeGreaterThan(0)
        expect(tables.every(target => target.planetId === 'mission')).toBe(true)
    })

    it('falls back to a planet when nothing is due', () => {
        const tables = draw(veteran).filter(target => target.game === 'tables')
        expect(tables.length).toBeGreaterThan(0)
        expect(tables.every(target => target.planetId !== 'mission')).toBe(true)
    })

    it('varies the planet and the station it picks', () => {
        const targets = draw(veteran)
        const planets = new Set(targets.filter(t => t.game === 'tables').map(t => t.planetId))
        const stations = new Set(targets.filter(t => t.game === 'beam').map(t => t.skill))
        expect(planets.size).toBeGreaterThan(1)
        expect(stations.size).toBeGreaterThan(1)
    })

    it('always offers the arcade, which needs nothing unlocked', () => {
        expect(draw(beginner).some(target => target.game === 'invaders')).toBe(true)
    })

    it('repeats exactly for a given seed, so a run can be replayed in a test', () => {
        const once = pickSurprise({ ...veteran, rng: createRng(42) })
        const twice = pickSurprise({ ...veteran, rng: createRng(42) })
        expect(once).toEqual(twice)
    })
})

describe('surprise routes', () => {
    it('marks every route so its summary knows the run was not chosen', () => {
        for (const target of draw(veteran)) {
            expect(surpriseRoute(target)).toContain(`?${SURPRISE_PARAM}=1`)
        }
    })

    it('maps each game to the screen a run actually starts on', () => {
        expect(surpriseRoute({ game: 'invaders' })).toBe('/game?surprise=1')
        expect(surpriseRoute({ game: 'tables', planetId: 'mission' }))
            .toBe('/times-tables/train/mission/daily?surprise=1')
        expect(surpriseRoute({ game: 'tables', planetId: 't3' }))
            .toBe('/times-tables/train/t3/practice?surprise=1')
        expect(surpriseRoute({ game: 'beam', skill: 'halve' }))
            .toBe('/number-beam/drill/halve?surprise=1')
    })

    it('never sends the trainer to Learn, which is a lesson rather than a run', () => {
        for (const target of draw(veteran)) {
            expect(surpriseRoute(target)).not.toContain('/learn')
        }
    })
})
