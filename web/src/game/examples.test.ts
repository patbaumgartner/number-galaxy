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
