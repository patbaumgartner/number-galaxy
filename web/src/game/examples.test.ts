import { describe, expect, it } from 'vitest'
import { getWorkedExample } from './examples'
import type { Language, Operation } from './types'

const operations: Operation[] = ['addition', 'subtraction', 'multiplication', 'division', 'remainders']
const languages: Language[] = ['de', 'it', 'en', 'fr']

describe('getWorkedExample', () => {
    it('provides a non-empty prompt, answer and working for every operation and language', () => {
        for (const operation of operations) {
            for (const language of languages) {
                const example = getWorkedExample(operation, language)
                expect(example.prompt.trim()).not.toBe('')
                expect(example.answer.trim()).not.toBe('')
                expect(example.steps.trim()).not.toBe('')
            }
        }
    })

    it('uses the local remainder separator while keeping mathematical steps language-neutral', () => {
        expect(getWorkedExample('remainders', 'de').answer).toBe('3 Rest 2')
        for (const language of ['it', 'en', 'fr'] as const) {
            expect(getWorkedExample('remainders', language).answer).toBe('3 r 2')
        }

        for (const operation of operations) {
            const steps = languages.map(language => getWorkedExample(operation, language).steps)
            expect(new Set(steps).size).toBe(1)
        }
    })
})

describe('help that matches the route rather than the operation', () => {
    it('shows a bridging example for a bridging question, and a doubles one for doubles', () => {
        expect(getWorkedExample('addition', 'en', 'bridgeTen').steps).toContain('= 10 →')
        expect(getWorkedExample('addition', 'en', 'nearDouble').steps).toContain('7 + 7')
    })

    it('never reuses the numbers a child is looking at', () => {
        // Help is asked for before answering, so the example must not be the answer.
        const example = getWorkedExample('addition', 'en', 'bridgeTen')
        expect(example.prompt).toBe('7 + 5 = ?')
    })

    it('falls back to the operation when a question has no route of its own', () => {
        expect(getWorkedExample('multiplication', 'en').steps).toBe(getWorkedExample('multiplication', 'en', 'timesTable').steps)
    })

    it('keeps the remainder example whatever route is asked for', () => {
        expect(getWorkedExample('remainders', 'en', 'nearDouble').prompt).toBe('14 ÷ 4 = ?')
    })
})
