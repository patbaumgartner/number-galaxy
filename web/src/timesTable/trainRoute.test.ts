import { describe, expect, it } from 'vitest'
import { resolveTrainRoute } from './trainRoute'

describe('resolveTrainRoute', () => {
    it('redirects an unknown planet or phase to the galaxy map', () => {
        expect(resolveTrainRoute('unknown', 'learn', {})).toBe('/times-tables')
        expect(resolveTrainRoute('t1', 'unknown', {})).toBe('/times-tables')
    })

    it('allows the daily mission only at its mission route', () => {
        expect(resolveTrainRoute('mission', 'daily', {})).toBeNull()
        expect(resolveTrainRoute('mission', 'practice', {})).toBe('/times-tables')
        expect(resolveTrainRoute('t1', 'daily', {})).toBe('/times-tables')
    })

    it('redirects a speed deep link without a star to practice', () => {
        expect(resolveTrainRoute('t1', 'speed', {})).toBe('/times-tables/train/t1/practice')
        expect(resolveTrainRoute('t1', 'speed', { t1: 1 })).toBeNull()
    })

    it('redirects a locked planet deep link to the galaxy map', () => {
        expect(resolveTrainRoute('t15', 'learn', {})).toBe('/times-tables')
        expect(resolveTrainRoute('t15', 'practice', {})).toBe('/times-tables')
        expect(resolveTrainRoute('t15', 'speed', { t15: 1 })).toBe('/times-tables')
    })
})
