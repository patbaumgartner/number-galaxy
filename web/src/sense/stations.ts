import type { SenseSkill, SenseStarLevel, SenseTier, SenseZoneId } from './types'

/**
 * The station map.
 *
 * Seeing a quantity comes before placing one: a child who cannot yet say how
 * many dots are in front of them has nothing to put on a line.
 */
export type SenseStation = {
    readonly id: SenseSkill
    readonly emoji: string
    /** The headline number cap per tier — each generator reads it its own way. */
    readonly caps: readonly [number, number, number]
}

export type SenseZone = {
    readonly id: SenseZoneId
    readonly emoji: string
    readonly stations: readonly SenseStation[]
}

export const SENSE_ZONES: readonly SenseZone[] = [
    {
        id: 'see',
        emoji: '👀',
        stations: [
            { id: 'subitize', emoji: '🎲', caps: [5, 10, 12] },
            { id: 'tenFrame', emoji: '🔟', caps: [10, 10, 20] },
            { id: 'rekenrek', emoji: '🧮', caps: [10, 20, 20] },
        ],
    },
    {
        id: 'line',
        emoji: '📍',
        stations: [
            { id: 'placeNumber', emoji: '🎯', caps: [10, 20, 100] },
            { id: 'countOn', emoji: '🦘', caps: [10, 20, 30] },
            { id: 'array', emoji: '🟦', caps: [4, 6, 10] },
            { id: 'estimate', emoji: '🍇', caps: [20, 30, 40] },
        ],
    },
]

export const SENSE_STATIONS: readonly SenseStation[] = SENSE_ZONES.flatMap(zone => zone.stations)

export type SenseStars = Partial<Record<SenseSkill, SenseStarLevel>>

export function getSenseStation(id: SenseSkill): SenseStation {
    const station = SENSE_STATIONS.find(entry => entry.id === id)
    if (station === undefined) throw new Error(`Unknown sense station: ${id}`)
    return station
}

export function getSenseZone(id: SenseZoneId): SenseZone {
    const zone = SENSE_ZONES.find(entry => entry.id === id)
    if (zone === undefined) throw new Error(`Unknown sense zone: ${id}`)
    return zone
}

export const isSenseSkill = (value: string | undefined): value is SenseSkill =>
    value !== undefined && SENSE_STATIONS.some(station => station.id === value)

/** Stations with at least one star inside `zoneId`. */
function starredCount(zoneId: SenseZoneId, stars: SenseStars): number {
    return getSenseZone(zoneId).stations.filter(station => (stars[station.id] ?? 0) >= 1).length
}

/** A zone opens once two of the previous zone's three stations have a star. */
const STARS_TO_OPEN_NEXT_ZONE = 2

export function isSenseZoneUnlocked(zoneId: SenseZoneId, stars: SenseStars): boolean {
    return zoneId === 'see' || starredCount('see', stars) >= STARS_TO_OPEN_NEXT_ZONE
}

export function senseZoneOf(id: SenseSkill): SenseZone {
    const zone = SENSE_ZONES.find(entry => entry.stations.some(station => station.id === id))
    if (zone === undefined) throw new Error(`Unknown sense station: ${id}`)
    return zone
}

export const isSenseStationUnlocked = (id: SenseSkill, stars: SenseStars): boolean =>
    isSenseZoneUnlocked(senseZoneOf(id).id, stars)

export const senseCapFor = (id: SenseSkill, tier: SenseTier): number => getSenseStation(id).caps[tier]

/** The station a child should try next: the first one still without a star. */
export function nextRecommendedSenseStation(stars: SenseStars): SenseSkill | undefined {
    return SENSE_STATIONS.find(station =>
        isSenseStationUnlocked(station.id, stars) && (stars[station.id] ?? 0) === 0)?.id
}
