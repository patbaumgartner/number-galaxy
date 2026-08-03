import { describe, expect, it } from 'vitest'
import { createRng } from '../game/rng'
import { beamMaxFor, beamStops, buildBar } from './bars'
import { createBeamQuestion } from './questions'
import { BEAM_STATIONS } from './stations'
import { BEAM_SKILLS, BEAM_TIERS, type BeamQuestion } from './types'

const SEEDS = 200

const everyQuestion = (visit: (question: BeamQuestion) => void): void => {
    for (const skill of BEAM_SKILLS) {
        for (const tier of BEAM_TIERS) {
            for (let seed = 0; seed < SEEDS; seed += 1) {
                visit(createBeamQuestion({ skill, tier, rng: createRng(seed) }))
            }
        }
    }
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0)

describe('beam questions', () => {
    it('answers with a positive whole number that matches its display string', () => {
        everyQuestion(question => {
            expect(Number.isInteger(question.value)).toBe(true)
            expect(question.value).toBeGreaterThan(0)
            expect(question.answer).toBe(String(question.value))
        })
    })

    it('writes a prompt that asks for exactly one unknown', () => {
        everyQuestion(question => {
            expect(question.prompt.split('?')).toHaveLength(2)
            expect(question.workingOut).toContain(String(question.value))
        })
    })

    it('always puts a beam stop exactly on the answer', () => {
        everyQuestion(question => {
            expect(question.value % question.beamStep).toBe(0)
            expect(question.beamMax % question.beamStep).toBe(0)
        })
    })

    it('never puts the answer at either end of the beam', () => {
        everyQuestion(question => {
            expect(question.value).toBeGreaterThan(0)
            expect(question.beamMax).toBeGreaterThan(question.value)
        })
    })

    it('keeps every beam long enough to be a real number line and short enough to aim at', () => {
        everyQuestion(question => {
            const stops = beamStops(question.beamMax, question.beamStep)
            expect(stops).toBeGreaterThanOrEqual(10)
            expect(stops).toBeLessThanOrEqual(70)
        })
    })

    it('does not park the answer at a fixed fraction of the beam, which would give it away', () => {
        for (const skill of BEAM_SKILLS) {
            const fractions = new Set<number>()
            for (let seed = 0; seed < 60; seed += 1) {
                const question = createBeamQuestion({ skill, tier: 1, rng: createRng(seed) })
                fractions.add(Math.round((question.value / question.beamMax) * 10))
            }
            expect(fractions.size).toBeGreaterThan(1)
        }
    })

    it('grows the numbers from tier to tier at every station', () => {
        for (const station of BEAM_STATIONS) {
            const averageScale = BEAM_TIERS.map(tier => {
                const scales = Array.from({ length: SEEDS }, (_unused, seed) =>
                    createBeamQuestion({ skill: station.id, tier, rng: createRng(seed) }).bar.scale)
                return scales.reduce((total, scale) => total + scale, 0) / scales.length
            })
            expect(averageScale[0]).toBeLessThan(averageScale[1])
            expect(averageScale[1]).toBeLessThan(averageScale[2])
        }
    })

    it('keeps the bar to a scale a child can still read', () => {
        everyQuestion(question => {
            expect(question.bar.scale).toBeLessThanOrEqual(300)
            expect([...question.prompt.matchAll(/\d+/g)]
                .every(match => Number(match[0]) > 0)).toBe(true)
        })
    })
})

describe('beam bars', () => {
    it('draws both rows against one scale that fits the longer of them', () => {
        everyQuestion(({ bar }) => {
            const totals = bar.rows.map(row => sum(row.segments.map(segment => segment.value)))
            expect(bar.scale).toBe(Math.max(...totals))
            expect(bar.scale).toBeGreaterThan(0)
        })
    })

    it('labels an unknown segment with a question mark and reveals its number', () => {
        everyQuestion(({ bar }) => {
            for (const row of bar.rows) {
                for (const segment of row.segments) {
                    expect(segment.label === '?' || segment.label === segment.revealedLabel).toBe(true)
                    expect(segment.revealedLabel).toBe(String(segment.value))
                    expect(segment.value).toBeGreaterThan(0)
                }
            }
        })
    })

    it('gives every row a total that equals the sum of its segments once revealed', () => {
        everyQuestion(({ bar }) => {
            for (const row of bar.rows) {
                expect(row.revealedTotal).toBe(String(sum(row.segments.map(segment => segment.value))))
                expect(row.total === '?' || row.total === row.revealedTotal).toBe(true)
                expect(row.segments.length).toBeGreaterThan(0)
            }
        })
    })

    it('puts an alien on every segment', () => {
        everyQuestion(({ bar }) => {
            for (const row of bar.rows) {
                for (const segment of row.segments) expect(segment.alien).not.toBe('')
            }
        })
    })

    it('draws doubling as two equal parts twice as long as the whole above', () => {
        const { bar } = createBeamQuestion({ skill: 'double', tier: 0, rng: createRng(3) })
        const [top, bottom] = bar.rows
        expect(top.segments).toHaveLength(1)
        expect(bottom.segments).toHaveLength(2)
        expect(bottom.segments[0].value).toBe(top.segments[0].value)
        expect(bar.scale).toBe(top.segments[0].value * 2)
    })

    it('draws halving as two unknown parts under a known whole', () => {
        const { bar, value } = createBeamQuestion({ skill: 'halve', tier: 0, rng: createRng(3) })
        const [top, bottom] = bar.rows
        expect(top.total).toBe(String(value * 2))
        expect(bottom.segments.map(segment => segment.label)).toEqual(['?', '?'])
        expect(bottom.segments.every(segment => segment.value === value)).toBe(true)
    })

    it('marks the parts a fraction leaves behind as extra', () => {
        for (let seed = 0; seed < SEEDS; seed += 1) {
            const { bar, value } = createBeamQuestion({ skill: 'fractionOf', tier: 1, rng: createRng(seed) })
            const wanted = bar.rows[1].segments.filter(segment => segment.tone !== 'extra')
            expect(sum(wanted.map(segment => segment.value))).toBe(value)
        }
    })

    it('tones a lone known segment as the whole and a shared one as a part', () => {
        const model = buildBar([
            { totalKnown: true, parts: [{ value: 12, known: true }] },
            { totalKnown: true, parts: [{ value: 8, known: true }, { value: 4, known: false }] },
        ])
        expect(model.rows[0].segments[0].tone).toBe('whole')
        expect(model.rows[1].segments[0].tone).toBe('part')
        expect(model.rows[1].segments[1].tone).toBe('unknown')
    })
})

describe('beam sizing', () => {
    it('always clears the answer and lands on a multiple of the step', () => {
        const rng = createRng(11)
        for (const [value, step] of [[7, 1], [70, 10], [24, 4], [50, 2], [95, 5]] as const) {
            for (let attempt = 0; attempt < 50; attempt += 1) {
                const max = beamMaxFor(value, step, rng)
                expect(max % step).toBe(0)
                expect(max).toBeGreaterThan(value)
            }
        }
    })

    it('counts the stops a child can land on', () => {
        expect(beamStops(20, 1)).toBe(20)
        expect(beamStops(200, 10)).toBe(20)
    })
})
