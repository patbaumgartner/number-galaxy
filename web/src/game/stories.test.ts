import { describe, expect, it } from 'vitest'
import { createRng } from './rng'
import { createEquation, type BinaryOperation } from './equations'
import { storyFor } from './stories'
import { createQuestion } from './questions'
import type { Language } from './types'

const LANGUAGES: Language[] = ['de', 'it', 'en', 'fr']
const BINARY: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']

describe('dressing a sum in the situation it came from', () => {
    it('writes a story in every language, for every operation', () => {
        const missing: string[] = []
        for (const language of LANGUAGES) {
            for (const operation of BINARY) {
                let wrote = 0
                for (let seed = 1; seed < 40; seed += 1) {
                    const equation = createEquation(createRng(seed), operation, 100)
                    if (storyFor(createRng(seed), language, operation, equation) !== null) wrote += 1
                }
                if (wrote === 0) missing.push(`${language}/${operation}`)
            }
        }
        expect(missing).toEqual([])
    })

    it('always names both numbers the child needs', () => {
        for (const language of LANGUAGES) {
            for (const operation of BINARY) {
                for (let seed = 1; seed < 30; seed += 1) {
                    const equation = createEquation(createRng(seed), operation, 100)
                    const story = storyFor(createRng(seed), language, operation, equation)
                    if (story === null) continue
                    expect(story).toContain(String(equation.left))
                    expect(story).toContain(String(equation.right))
                }
            }
        }
    })

    it('never gives the answer away in the telling', () => {
        for (const language of LANGUAGES) {
            for (const operation of BINARY) {
                for (let seed = 1; seed < 40; seed += 1) {
                    const equation = createEquation(createRng(seed), operation, 100)
                    const story = storyFor(createRng(seed), language, operation, equation)
                    // Only when the result is not itself one of the given numbers.
                    if (story === null) continue
                    if (equation.result === equation.left || equation.result === equation.right) continue
                    const digits = story.match(/\d+/g) ?? []
                    expect(digits).not.toContain(String(equation.result))
                }
            }
        }
    })

    it('refuses to picture more groups than anyone would draw', () => {
        // 40 boxes of 3 is arithmetic that works and a picture nobody sets out.
        expect(storyFor(createRng(1), 'en', 'multiplication', { left: 40, right: 3, result: 120, symbol: '×' })).toBeNull()
    })

    it('refuses a situation the numbers would make nonsense of', () => {
        // Sharing 3 apples between 12 children is arithmetic that works and a
        // situation that does not.
        expect(storyFor(createRng(1), 'en', 'division', { left: 3, right: 12, result: 4, symbol: '÷' })).toBeNull()
    })

    it('asks about sharing and about grouping, which are not the same question', () => {
        const told = new Set<string>()
        for (let seed = 1; seed < 60; seed += 1) {
            const story = storyFor(createRng(seed), 'en', 'division', { left: 24, right: 6, result: 4, symbol: '÷' })
            if (story !== null) told.add(story.includes('shared') ? 'sharing' : 'grouping')
        }
        expect(told).toEqual(new Set(['sharing', 'grouping']))
    })
})

describe('a question that carries a story', () => {
    it('stays silent about it unless stories were asked for', () => {
        for (let seed = 1; seed < 20; seed += 1) {
            const plain = createQuestion({ language: 'en', operation: 'addition', rank: 'ace', form: 'direct', rng: createRng(seed) })
            expect(plain.story).toBe('')
        }
    })

    it('keeps the same arithmetic underneath', () => {
        for (let seed = 1; seed < 40; seed += 1) {
            const q = createQuestion({
                language: 'en', operation: 'addition', rank: 'ace', form: 'direct', stories: true, rng: createRng(seed),
            })
            if (q.story === '') continue
            const [left, right] = (q.prompt.match(/\d+/g) ?? []).map(Number)
            expect(String(left + right)).toBe(q.answer)
            expect(q.options).toContain(q.answer)
        }
    })

    it('only ever dresses up a direct question, the one with a single unknown', () => {
        for (const form of ['missingLeft', 'missingRight', 'missingOperator', 'chain'] as const) {
            for (let seed = 1; seed < 15; seed += 1) {
                const q = createQuestion({
                    language: 'en', operation: 'addition', rank: 'ace', form, stories: true, rng: createRng(seed),
                })
                if (q.form === form) expect(q.story).toBe('')
            }
        }
    })
})
