import { describe, expect, it } from 'vitest'
import {
    SENSE_STATIONS,
    SENSE_ZONES,
    getSenseStation,
    isSenseSkill,
    isSenseStationUnlocked,
    isSenseZoneUnlocked,
    nextRecommendedSenseStation,
    senseCapFor,
    senseZoneOf,
} from './stations'

describe('the station map', () => {
    it('opens the first zone and holds the second until two stars are earned', () => {
        expect(isSenseZoneUnlocked('see', {})).toBe(true)
        expect(isSenseZoneUnlocked('line', {})).toBe(false)
        expect(isSenseZoneUnlocked('line', { subitize: 1 })).toBe(false)
        expect(isSenseZoneUnlocked('line', { subitize: 1, tenFrame: 1 })).toBe(true)
    })

    it('puts seeing a quantity before placing one', () => {
        expect(SENSE_ZONES.map(zone => zone.id)).toEqual(['see', 'line'])
        expect(senseZoneOf('subitize').id).toBe('see')
        expect(senseZoneOf('placeNumber').id).toBe('line')
    })

    it('widens every station as its tiers rise', () => {
        for (const station of SENSE_STATIONS) {
            expect(senseCapFor(station.id, 0)).toBeLessThanOrEqual(senseCapFor(station.id, 1))
            expect(senseCapFor(station.id, 1)).toBeLessThanOrEqual(senseCapFor(station.id, 2))
        }
    })

    it('recommends the first unstarred station a child can actually reach', () => {
        expect(nextRecommendedSenseStation({})).toBe('subitize')
        expect(nextRecommendedSenseStation({ subitize: 2 })).toBe('tenFrame')
        // Two stars in the first zone open the second, so it becomes reachable.
        expect(nextRecommendedSenseStation({ subitize: 2, tenFrame: 2, rekenrek: 2 })).toBe('placeNumber')
    })

    it('recommends nothing once every reachable station has a star', () => {
        const all = Object.fromEntries(SENSE_STATIONS.map(station => [station.id, 1 as const]))
        expect(nextRecommendedSenseStation(all)).toBeUndefined()
    })

    it('never recommends a station behind a shut zone', () => {
        expect(nextRecommendedSenseStation({ subitize: 1 })).not.toBe('placeNumber')
    })

    it('locks every station in a zone that has not opened', () => {
        expect(isSenseStationUnlocked('placeNumber', {})).toBe(false)
        expect(isSenseStationUnlocked('placeNumber', { subitize: 1, rekenrek: 1 })).toBe(true)
    })

    it('recognises its own skills and nothing else', () => {
        expect(isSenseSkill('subitize')).toBe(true)
        expect(isSenseSkill('double')).toBe(false)
        expect(isSenseSkill(undefined)).toBe(false)
        expect(() => getSenseStation('nope' as never)).toThrow()
    })
})
