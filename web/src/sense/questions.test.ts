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
        // The only two stations that may forgive a near miss are the two whose
        // subject *is* the near miss: where a number sits, and roughly how many.
        const approximate: readonly SenseSkill[] = ['placeNumber', 'estimate']
        for (const skill of SENSE_SKILLS) {
            if (approximate.includes(skill)) continue
            const q = createSenseQuestion({ skill, tier: 0, rng: createRng(7) })
            expect(q.tolerance).toBe(0)
            expect(isSenseAnswerCorrect(q, q.value + 1)).toBe(false)
        }
    })

    it('gives an estimate room to be an estimate, and still not a guess', () => {
        for (let seed = 1; seed < 20; seed += 1) {
            const q = createSenseQuestion({ skill: 'estimate', tier: 1, rng: createRng(seed) })
            expect(q.tolerance).toBeGreaterThan(1)
            expect(isSenseAnswerCorrect(q, q.value + q.tolerance)).toBe(true)
            expect(isSenseAnswerCorrect(q, q.value + q.tolerance + 1)).toBe(false)
            // Too many to take in at a glance is what makes it an estimate.
            expect(q.value).toBeGreaterThan(10)
        }
    })

    it('spans the whole line, so the beam is the line', () => {
        for (let seed = 1; seed < 30; seed += 1) {
            const q = createSenseQuestion({ skill: 'placeNumber', tier: 2, rng: createRng(seed) })
            expect(q.beamMax).toBe(senseCapFor('placeNumber', 2))
        }
    })

    /**
     * A landmark is not an estimate.
     *
     * A multiple of ten is already labelled on the line and the midpoint is the
     * line folded in half, so either can be placed without any sense of where
     * numbers sit — which is the only thing this station measures.
     */
    it('never asks for a multiple of ten or for the middle of the line', () => {
        const offered: string[] = []
        for (const tier of SENSE_TIERS) {
            const cap = senseCapFor('placeNumber', tier)
            for (let seed = 0; seed < 400; seed += 1) {
                const { value } = createSenseQuestion({ skill: 'placeNumber', tier, rng: createRng(seed) })
                if (value % 10 === 0) offered.push(`tier ${tier}: ${value} is a labelled ten`)
                if (value === cap / 2) offered.push(`tier ${tier}: ${value} is the midpoint of ${cap}`)
            }
        }
        expect(offered).toEqual([])
    })

    it('still uses the rest of the line, rather than a narrow band of it', () => {
        for (const tier of SENSE_TIERS) {
            const cap = senseCapFor('placeNumber', tier)
            const values = Array.from({ length: 400 }, (_unused, seed) =>
                createSenseQuestion({ skill: 'placeNumber', tier, rng: createRng(seed) }).value)
            expect(values.every(value => value >= 1 && value <= cap - 1)).toBe(true)
            // Excluding the tens and the midpoint must thin the line, not halve it.
            const available = cap - 1 - Math.floor((cap - 1) / 10) - (cap / 2 % 10 === 0 ? 0 : 1)
            expect(new Set(values).size).toBeGreaterThanOrEqual(Math.min(available, 8))
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
    /**
     * The picture and the sentence under it have to be the same decomposition.
     *
     * They were computed independently from the same number and disagreed: a
     * glance was drawn as `6 + n` and always explained as `5 + (n − 5)`. A child
     * shown two die faces of six and six was told "5 + 7 = 12" — a split that is
     * not in front of them, and cannot be, because seven is not a die face.
     */
    it('explains a glance with the groups the picture is actually drawn in', () => {
        const problems: string[] = []

        for (const tier of SENSE_TIERS) {
            for (let seed = 1; seed < 200; seed += 1) {
                const q = createSenseQuestion({ skill: 'subitize', tier, rng: createRng(seed) })
                const visual = q.visual
                if (visual.kind !== 'dots') continue

                const drawn = [0, 1]
                    .map(group => visual.dots.filter(dot => dot.group === group).length)
                    .filter(size => size > 0)
                const said = q.workingOut.includes('+')
                    ? (q.workingOut.split('=')[0] ?? '').split('+').map(part => Number(part.trim()))
                    : [Number(q.workingOut)]

                const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b).join('+')
                if (sorted(said) !== sorted(drawn)) {
                    problems.push(`${q.value} is drawn as ${sorted(drawn)} but explained as "${q.workingOut}"`)
                }
            }
        }

        expect([...new Set(problems)]).toEqual([])
    })

    it('only ever splits a glance into halves a die can show', () => {
        for (let count = 1; count <= 12; count += 1) {
            for (const part of patternFor(count, true).parts) {
                expect(part).toBeGreaterThanOrEqual(1)
                expect(part).toBeLessThanOrEqual(6)
            }
            expect(patternFor(count, true).parts.reduce((sum, part) => sum + part, 0)).toBe(count)
        }
    })

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
