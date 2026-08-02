import { describe, expect, it } from 'vitest'
import { GALAXIES, isPlanetUnlocked, RECOMMENDED_ORDER } from './tables'

describe('times-table galaxy model', () => {
  it('includes all 23 planets', () => {
    const planetCount = GALAXIES.reduce((count, galaxy) => count + galaxy.planets.length, 0)

    expect(planetCount).toBe(23)
  })

  it('keeps every home galaxy planet selectable', () => {
    const home = GALAXIES.find((galaxy) => galaxy.id === 'home')

    expect(home?.planets.every((planet) => isPlanetUnlocked(planet.id, {}))).toBe(true)
  })

  it('unlocks square nebula at five double-star home planets', () => {
    const fourStars = { t1: 2, t2: 2, t3: 2, t4: 2 } as const
    const fiveStars = { ...fourStars, t5: 2 } as const

    expect(isPlanetUnlocked('sq-core', fourStars)).toBe(false)
    expect(isPlanetUnlocked('sq-core', fiveStars)).toBe(true)
  })

  it('unlocks shortcut belt after the core squares earn one star', () => {
    expect(isPlanetUnlocked('t15', {})).toBe(false)
    expect(isPlanetUnlocked('t15', { 'sq-core': 1 })).toBe(true)
  })

  it('unlocks deep space when tables two through twelve have two stars', () => {
    const stars = {
      t2: 2,
      t3: 2,
      t4: 2,
      t5: 2,
      t6: 2,
      t7: 2,
      t8: 2,
      t9: 2,
      t10: 2,
      t11: 2,
      t12: 2,
    } as const

    expect(isPlanetUnlocked('t13', { ...stars, t1: 0 })).toBe(true)
    expect(isPlanetUnlocked('t13', { ...stars, t12: 1 })).toBe(false)
  })

  it('follows the recommended home-galaxy path', () => {
    expect(RECOMMENDED_ORDER).toEqual([
      't1',
      't2',
      't5',
      't10',
      't3',
      't4',
      't6',
      't8',
      't7',
      't9',
      't11',
      't12',
    ])
  })
})
