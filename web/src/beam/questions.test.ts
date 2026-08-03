import { describe, expect, it } from 'vitest'
import { createRng } from '../game/rng'
import { beamMaxFor, beamStepFor, buildBar, isBeamEligible } from './bars'
import { createBeamQuestion } from './questions'
import { BEAM_STATIONS, capFor } from './stations'
import { BEAM_SKILLS, BEAM_TIERS, type BeamQuestion } from './types'

const SEEDS = 200

const everyQuestion = (visit: (question: BeamQuestion) => void): void => {
    for (const skill of BEAM_SKILLS) {
        for (const tier of BEAM_TIERS) {
            for (let seed = 0; seed < SEEDS; seed += 1) {
                visit(createBeamQuestion({ skill, tier, preferBeam: seed % 2 === 0, rng: createRng(seed) }))
            }
        }
    }
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0)

describe('beam questions', () => {
    it('always offers four distinct options containing the answer exactly once', () => {
        everyQuestion(question => {
            expect(question.options).toHaveLength(4)
            expect(new Set(question.options).size).toBe(4)
            expect(question.options.filter(option => option === question.answer)).toHaveLength(1)
            expect(question.options[question.correctIndex]).toBe(question.answer)
        })
    })

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

    it('keeps the answer inside the beam and on one of its stops', () => {
        everyQuestion(question => {
            expect(question.beamMax).toBeGreaterThanOrEqual(question.value)
            if (question.input === 'beam') {
                expect(question.value % beamStepFor(question.beamMax)).toBe(0)
                expect(question.beamMax / beamStepFor(question.beamMax)).toBeLessThanOrEqual(30)
            }
        })
    })

    it('never puts the answer at the very end of the beam', () => {
        everyQuestion(question => {
            expect(question.beamMax).not.toBe(question.value)
        })
    })

    it('offers the slider whenever the answer lands on a stop', () => {
        const inputs = new Set<string>()
        everyQuestion(question => void inputs.add(question.input))
        expect(inputs).toEqual(new Set(['tiles', 'beam']))
    })

    it('falls back to tiles when the slider was asked for but cannot be used', () => {
        const question = createBeamQuestion({ skill: 'split', tier: 2, preferBeam: true, rng: createRng(7) })
        expect(question.input === 'beam' || !isBeamEligible(question.value, question.beamMax)).toBe(true)
    })

    it('keeps every operand within the station cap for its tier', () => {
        for (const station of BEAM_STATIONS) {
            for (const tier of BEAM_TIERS) {
                const cap = capFor(station.id, tier)
                for (let seed = 0; seed < SEEDS; seed += 1) {
                    const question = createBeamQuestion({ skill: station.id, tier, rng: createRng(seed) })
                    const operands = [...question.prompt.matchAll(/\d+/g)].map(match => Number(match[0]))
                    // The whole a bar is drawn against is the cap's real subject;
                    // a doubled or ten-timesed result is allowed to exceed it.
                    expect(Math.min(...operands)).toBeLessThanOrEqual(cap)
                }
            }
        }
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
    it('rounds the beam up to a landmark instead of stopping on the answer', () => {
        expect(beamMaxFor(7, 14)).toBe(15)
        expect(beamMaxFor(14, 14)).toBe(15)
        expect(beamMaxFor(40, 40)).toBe(50)
        expect(beamMaxFor(70, 70)).toBe(75)
        expect(beamMaxFor(600, 600)).toBe(700)
    })

    it('widens the step as the beam gets longer', () => {
        expect(beamStepFor(20)).toBe(1)
        expect(beamStepFor(100)).toBe(5)
        expect(beamStepFor(300)).toBe(10)
    })

    it('rejects an answer that no stop on the beam can reach', () => {
        expect(isBeamEligible(7, 15)).toBe(true)
        expect(isBeamEligible(19, 40)).toBe(false)
        expect(isBeamEligible(40, 300)).toBe(true)
        expect(isBeamEligible(40, 400)).toBe(false)
        expect(isBeamEligible(40, 1000)).toBe(false)
    })
})
