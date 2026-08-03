import { describe, expect, it } from 'vitest'
import { createRng } from '../game/rng'
import { createSenseQuestion, isSenseAnswerCorrect } from './questions'
import { SENSE_SKILLS, SENSE_TIERS, type SenseSkill, type SenseTier } from './types'
import { senseCapFor } from './stations'
import { patternFor } from './patterns'

const everyStationAndTier = (visit: (skill: SenseSkill, tier: SenseTier, seed: number) => void) => {
    for (const skill of SENSE_SKILLS) {
        for (const tier of SENSE_TIERS) {
            for (let seed = 1; seed < 60; seed += 1) visit(skill, tier, seed)
        }
    }
}

describe('every sense question', () => {
    it('has an answer that can actually be reached on the beam', () => {
        const problems: string[] = []
        everyStationAndTier((skill, tier, seed) => {
            const q = createSenseQuestion({ skill, tier, rng: createRng(seed) })
            if (q.value < 0 || q.value > q.beamMax) problems.push(`${skill}/${tier}: ${q.value} outside 0..${q.beamMax}`)
            if (q.value % q.beamStep !== 0) problems.push(`${skill}/${tier}: ${q.value} is not on a stop`)
            if (q.beamMax % q.beamStep !== 0) problems.push(`${skill}/${tier}: beam ends off a stop`)
        })
        expect(problems).toEqual([])
    })

    it('never asks for nothing, and never gives the answer away in the prompt', () => {
        const problems: string[] = []
        everyStationAndTier((skill, tier, seed) => {
            const q = createSenseQuestion({ skill, tier, rng: createRng(seed) })
            if (q.value < 1) problems.push(`${skill}/${tier}: value ${q.value}`)
            if (q.workingOut.length === 0) problems.push(`${skill}/${tier}: no working`)
            // Every prompt either marks its unknown with `?`, or is itself the
            // number to place — the one station where the number is the question.
            if (skill !== 'placeNumber' && !q.prompt.includes('?')) {
                problems.push(`${skill}/${tier}: prompt "${q.prompt}" marks no unknown`)
            }
            if (skill === 'placeNumber' && q.prompt !== String(q.value)) {
                problems.push(`${skill}/${tier}: prompt "${q.prompt}" is not the number to place`)
            }
        })
        expect(problems).toEqual([])
    })

    it('carries a picture wherever one is the point', () => {
        everyStationAndTier((skill, tier, seed) => {
            const q = createSenseQuestion({ skill, tier, rng: createRng(seed) })
            // `placeNumber` is the exception: the beam it is answered on *is* the
            // line, so a drawn one would repeat it and mark the answer on it.
            if (skill === 'placeNumber') expect(q.visual.kind).toBe('none')
            else expect(q.visual.kind).not.toBe('none')
        })
    })

    it('always puts the thing being asked about on screen', () => {
        everyStationAndTier((skill, tier, seed) => {
            const q = createSenseQuestion({ skill, tier, rng: createRng(seed) })
            // Either a prompt to read, or a picture to look at. Never neither —
            // `placeNumber` once showed only its instruction, so nothing to place.
            const hasSomething = q.prompt !== '?' || q.visual.kind !== 'none'
            expect(hasSomething).toBe(true)
        })
    })
})

describe('seeing a quantity', () => {
    it('shows exactly as many dots as the answer', () => {
        for (const tier of SENSE_TIERS) {
            for (let seed = 1; seed < 40; seed += 1) {
                const q = createSenseQuestion({ skill: 'subitize', tier, rng: createRng(seed) })
                if (q.visual.kind !== 'dots') throw new Error('expected dots')
                expect(q.visual.dots).toHaveLength(q.value)
            }
        }
    })

    it('fills the ten-frame to match, and asks the gap as a bond to ten', () => {
        for (let seed = 1; seed < 60; seed += 1) {
            const q = createSenseQuestion({ skill: 'tenFrame', tier: 0, rng: createRng(seed) })
            if (q.visual.kind !== 'tenFrame') throw new Error('expected a frame')
            const asksGap = q.prompt.includes('=')
            expect(q.value).toBe(asksGap ? 10 - q.visual.filled : q.visual.filled)
        }
    })

    it('pushes as many beads across as the answer, grouped in tens', () => {
        for (const tier of SENSE_TIERS) {
            for (let seed = 1; seed < 40; seed += 1) {
                const q = createSenseQuestion({ skill: 'rekenrek', tier, rng: createRng(seed) })
                if (q.visual.kind !== 'rekenrek') throw new Error('expected a rack')
                expect(q.visual.rows.reduce((sum, row) => sum + row, 0)).toBe(q.value)
                for (const row of q.visual.rows) expect(row).toBeLessThanOrEqual(10)
            }
        }
    })

    it('draws the array it asks about', () => {
        for (let seed = 1; seed < 40; seed += 1) {
            const q = createSenseQuestion({ skill: 'array', tier: 1, rng: createRng(seed) })
            if (q.visual.kind !== 'array') throw new Error('expected an array')
            expect(q.visual.rows * q.visual.columns).toBe(q.value)
        }
    })
})

describe('placing a number', () => {
    it('allows a near miss, because the skill is a sense of size', () => {
        const q = createSenseQuestion({ skill: 'placeNumber', tier: 2, rng: createRng(4) })
        expect(q.tolerance).toBeGreaterThan(0)
        expect(isSenseAnswerCorrect(q, q.value)).toBe(true)
        expect(isSenseAnswerCorrect(q, q.value + q.tolerance)).toBe(true)
        expect(isSenseAnswerCorrect(q, q.value + q.tolerance + 1)).toBe(false)
    })

    it('demands the exact quantity everywhere a quantity is exact', () => {
        for (const skill of SENSE_SKILLS) {
            if (skill === 'placeNumber') continue
            const q = createSenseQuestion({ skill, tier: 0, rng: createRng(7) })
            expect(q.tolerance).toBe(0)
            expect(isSenseAnswerCorrect(q, q.value + 1)).toBe(false)
        }
    })

    it('spans the whole line, so the beam is the line', () => {
        for (let seed = 1; seed < 30; seed += 1) {
            const q = createSenseQuestion({ skill: 'placeNumber', tier: 2, rng: createRng(seed) })
            expect(q.beamMax).toBe(senseCapFor('placeNumber', 2))
        }
    })
})

describe('counting on', () => {
    it('draws the jump it asks about, landing on the answer', () => {
        for (let seed = 1; seed < 40; seed += 1) {
            const q = createSenseQuestion({ skill: 'countOn', tier: 1, rng: createRng(seed) })
            if (q.visual.kind !== 'numberLine') throw new Error('expected a line')
            expect(q.visual.from + q.visual.jump).toBe(q.value)
            expect(q.visual.jump).toBeGreaterThan(0)
        }
    })
})

describe('the arrangements themselves', () => {
    it('uses a die face for anything a die can show', () => {
        for (let count = 1; count <= 6; count += 1) {
            expect(patternFor(count, false).dots).toHaveLength(count)
        }
    })

    it('groups past five, so a quantity can be seen rather than counted', () => {
        const seven = patternFor(7, false)
        expect(seven.dots).toHaveLength(7)
        // Five in the first row, the rest marked as the second group.
        expect(seven.dots.filter(dot => dot.group === 1)).toHaveLength(2)
    })

    it('never places two dots in the same spot', () => {
        for (let count = 1; count <= 12; count += 1) {
            for (const domino of [false, true]) {
                const { dots } = patternFor(count, domino)
                const spots = new Set(dots.map(dot => `${dot.row}:${dot.column}`))
                expect(spots.size).toBe(dots.length)
            }
        }
    })
})
