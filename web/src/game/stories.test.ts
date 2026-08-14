import { describe, expect, it } from 'vitest'
import { createRng } from './rng'
import { createEquation, type BinaryOperation, type Equation } from './equations'
import { storyFor } from './stories'
import { createQuestion } from './questions'
import type { Language } from './types'

const LANGUAGES: Language[] = ['de', 'it', 'en', 'fr']
const BINARY: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']

/** The same numbers every time, so a pinned sentence is about the words. */
const sum = (symbol: Equation['symbol']): Equation => ({ left: 12, right: 5, result: 17, symbol })

describe('dressing a sum in the situation it came from', () => {
    /**
     * The prose itself, put where a reviewer has to read it.
     *
     * French and Italian agree adjectives, past participles and pronouns with
     * the noun, and the templates carry those agreements as fixed text —
     * `bleues`, `chacune`, `partagées`, `divise`, `Quante`. When the noun lists
     * held both genders they were wrong more often than right: a child read
     * "Il y a 7 pommes rouges et 5 bleus", "12 autocollants sont partagées" and
     * "Combien Mia en a-t-il de plus ?".
     *
     * Nothing here can check grammar. What it can do is show every sentence the
     * generator can produce in the diff, so a change to the wording or to a
     * noun has to be read rather than assumed. Every line below has been
     * checked for agreement.
     */
    it.each([
        ['de', 0, 'Mia hat 12 Murmeln und bekommt 5 dazu. Wie viele sind es jetzt?'],
        ['en', 0, 'Mia has 12 marbles and gets 5 more. How many now?'],
        ['fr', 0, 'Mia a 12 billes et en reçoit 5 de plus. Combien maintenant ?'],
        ['it', 0, 'Mia ha 12 biglie e ne riceve 5 in più. Quante sono adesso?'],
    ])('writes a %s join story', (language, seed, expected) => {
        expect(storyFor(() => seed, language as Language, 'addition', sum('+'))).toBe(expected)
    })

    it.each([
        ['fr', 'partWhole', 'addition', 'Il y a 12 cartes rouges et 5 bleues. Combien en tout ?'],
        ['fr', 'compare', 'subtraction', 'Elias a 12 cartes, Léa en a 5. Elias en a combien de plus ?'],
        ['fr', 'measuring', 'division', '12 cartes sont mises par 5 dans des trousses. Combien de trousses faut-il ?'],
        ['it', 'partWhole', 'addition', 'Ci sono 12 gomme rosse e 5 blu. Quante sono in tutto?'],
        ['it', 'compare', 'subtraction', 'Elia ha 12 gomme, Lea ne ha 5. Quante ne ha in più Elia?'],
        ['it', 'measuring', 'division', '12 gomme vanno a 5 per borse. Quante borse servono?'],
    ])('agrees every word in the %s %s story', (language, _type, operation, expected) => {
        // The last of everything: the second story type, and the last noun and
        // person in each list, so a different set of words is exercised.
        expect(storyFor(() => 0.99, language as Language, operation as BinaryOperation, sum('+'))).toBe(expected)
    })

    it.each([
        ['fr', 'grouping', 'multiplication', '12 boîtes avec 5 billes dans chacune. Combien de billes en tout ?'],
        ['fr', 'sharing', 'division', '12 billes sont partagées entre 5 enfants. Combien pour chaque enfant ?'],
        ['it', 'grouping', 'multiplication', '12 scatole con 5 biglie ciascuna. Quante biglie sono?'],
        ['it', 'sharing', 'division', '12 biglie vengono divise fra 5 bambini. Quante ne riceve ogni bambino?'],
    ])('agrees every word in the %s %s story too', (language, _type, operation, expected) => {
        expect(storyFor(() => 0, language as Language, operation as BinaryOperation, sum('+'))).toBe(expected)
    })

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
