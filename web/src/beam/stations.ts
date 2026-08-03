import { MINUS } from '../game/types'
import type { BeamSkill, BeamStarLevel, BeamTier, BeamZoneId } from './types'

/**
 * The station map.
 *
 * Zones are ordered by what they need you to already believe: doubling and
 * halving first, then splitting a whole into more than two parts, then the
 * place-value moves that only make sense once parts do.
 */
export type BeamStation = {
    readonly id: BeamSkill
    readonly emoji: string
    /** The headline number cap per tier — each generator reads it its own way. */
    readonly caps: readonly [number, number, number]
    /** One solved question, in pure maths notation, so it needs no translation. */
    readonly sample: { readonly prompt: string; readonly answer: string; readonly steps: string }
}

export type BeamZone = {
    readonly id: BeamZoneId
    readonly emoji: string
    readonly stations: readonly BeamStation[]
}

export const BEAM_ZONES: readonly BeamZone[] = [
    {
        id: 'doubles',
        emoji: '🔁',
        stations: [
            {
                id: 'double',
                emoji: '✌️',
                caps: [10, 20, 50],
                sample: { prompt: '2 × 7 = ?', answer: '14', steps: '7 + 7 = 14' },
            },
            {
                id: 'halve',
                emoji: '🪞',
                caps: [20, 40, 100],
                sample: { prompt: '14 ÷ 2 = ?', answer: '7', steps: '7 + 7 = 14' },
            },
            {
                id: 'nearDouble',
                emoji: '➕',
                caps: [10, 20, 50],
                sample: { prompt: '7 + 8 = ?', answer: '15', steps: '7 + 7 = 14 → 14 + 1 = 15' },
            },
        ],
    },
    {
        id: 'parts',
        emoji: '🧩',
        stations: [
            {
                id: 'doubleDouble',
                emoji: '🍀',
                caps: [6, 12, 25],
                sample: { prompt: '4 × 6 = ?', answer: '24', steps: '6 + 6 = 12 → 12 + 12 = 24' },
            },
            {
                id: 'quarter',
                emoji: '🥧',
                caps: [20, 40, 100],
                sample: { prompt: '20 ÷ 4 = ?', answer: '5', steps: '20 ÷ 2 = 10 → 10 ÷ 2 = 5' },
            },
            {
                id: 'fractionOf',
                emoji: '🍰',
                caps: [12, 24, 60],
                sample: { prompt: '¾ × 20 = ?', answer: '15', steps: '20 ÷ 4 = 5 → 3 × 5 = 15' },
            },
        ],
    },
    {
        id: 'place',
        emoji: '🔟',
        stations: [
            {
                id: 'tenTimes',
                emoji: '🔟',
                caps: [10, 20, 50],
                sample: { prompt: '10 × 7 = ?', answer: '70', steps: '7 × 10 = 70' },
            },
            {
                id: 'bond',
                emoji: '🤝',
                caps: [10, 20, 100],
                sample: { prompt: '? + 7 = 10', answer: '3', steps: `10 ${MINUS} 7 = 3` },
            },
            {
                id: 'split',
                emoji: '✂️',
                caps: [20, 100, 1000],
                sample: { prompt: '24 = 20 + ?', answer: '4', steps: `24 ${MINUS} 20 = 4` },
            },
        ],
    },
]

export const BEAM_STATIONS: readonly BeamStation[] = BEAM_ZONES.flatMap(zone => zone.stations)

export type BeamStars = Partial<Record<BeamSkill, BeamStarLevel>>

export function getStation(id: BeamSkill): BeamStation {
    const station = BEAM_STATIONS.find(entry => entry.id === id)
    if (station === undefined) throw new Error(`Unknown beam station: ${id}`)
    return station
}

export function getZone(id: BeamZoneId): BeamZone {
    const zone = BEAM_ZONES.find(entry => entry.id === id)
    if (zone === undefined) throw new Error(`Unknown beam zone: ${id}`)
    return zone
}

export const isBeamSkill = (value: string | undefined): value is BeamSkill =>
    value !== undefined && BEAM_STATIONS.some(station => station.id === value)

/** Stations with at least one star inside `zoneId`. */
function starredCount(zoneId: BeamZoneId, stars: BeamStars): number {
    return getZone(zoneId).stations.filter(station => (stars[station.id] ?? 0) >= 1).length
}

/** A zone opens once two of the previous zone's three stations have a star. */
const STARS_TO_OPEN_NEXT_ZONE = 2

export function isZoneUnlocked(zoneId: BeamZoneId, stars: BeamStars): boolean {
    switch (zoneId) {
        case 'doubles':
            return true
        case 'parts':
            return starredCount('doubles', stars) >= STARS_TO_OPEN_NEXT_ZONE
        case 'place':
            return starredCount('parts', stars) >= STARS_TO_OPEN_NEXT_ZONE
    }
}

export function zoneOf(id: BeamSkill): BeamZone {
    const zone = BEAM_ZONES.find(entry => entry.stations.some(station => station.id === id))
    if (zone === undefined) throw new Error(`Unknown beam station: ${id}`)
    return zone
}

export const isStationUnlocked = (id: BeamSkill, stars: BeamStars): boolean =>
    isZoneUnlocked(zoneOf(id).id, stars)

/** The value cap this station uses at `tier`. */
export const capFor = (id: BeamSkill, tier: BeamTier): number => getStation(id).caps[tier]

/** The station a child should try next: the first one still without a star. */
export function nextRecommendedStation(stars: BeamStars): BeamSkill | undefined {
    return BEAM_STATIONS.find(station =>
        isStationUnlocked(station.id, stars) && (stars[station.id] ?? 0) === 0)?.id
}
