import { describe, expect, it } from 'vitest'
import {
    OPERATIONS,
    OPTION_COUNT,
    QUESTION_FORMS,
    RANKS,
    applyOperator,
    createQuestion,
    createRng,
    getComboMultiplier,
    getPoints,
    getStars,
    hasUniqueOperator,
    pickForm,
    pickOperation,
    rankConfig,
    type Language,
    type Operation,
    type OperatorSymbol,
    type Question,
    type QuestionForm,
    type Rank,
} from './index'
import { MINUS, OPERATOR_SYMBOLS } from './types'

const LANGUAGES: Language[] = ['de', 'it', 'en', 'fr']
const BINARY_OPERATIONS: Operation[] = ['addition', 'subtraction', 'multiplication', 'division']
const SEEDS = Array.from({ length: 120 }, (_, i) => i * 7919 + 1)

/** Every integer that appears anywhere in a prompt, answer or option. */
function numbersIn(text: string): number[] {
    return (text.match(/\d+/g) ?? []).map(Number)
}

/** Collected rather than asserted inline: ~4k questions × inline expects times out. */
function findProblems(question: Question, rank: Rank, operation: Operation): string[] {
    const problems: string[] = []
    const { maxValue } = rankConfig[rank]
    const where = `${rank}/${operation}/${question.form} "${question.prompt}"`
    const fail = (reason: string) => problems.push(`${where}: ${reason}`)

    if (question.operation !== operation) fail(`operation is ${question.operation}`)
    if (question.options.length !== OPTION_COUNT) fail(`${question.options.length} options`)
    if (new Set(question.options).size !== OPTION_COUNT) fail(`duplicate options ${question.options.join()}`)
    if (question.options[question.correctIndex] !== question.answer) fail('correctIndex misses the answer')
    if (question.options.filter(option => option === question.answer).length !== 1) fail('answer is not unique')
    if (!question.prompt.includes('=')) fail('prompt has no equals sign')
    if (question.workingOut.length === 0) fail('no working out')

    for (const value of [...numbersIn(question.prompt), ...numbersIn(question.workingOut)]) {
        if (value < 0 || value > maxValue) fail(`value ${value} outside 0..${maxValue}`)
    }
    if (question.form !== 'missingOperator') {
        for (const option of question.options) {
            for (const value of numbersIn(option)) {
                if (value < 0) fail(`negative option ${option}`)
            }
        }
    }
    return problems
}

/** Re-derives the answer straight from the prompt text, ignoring the generator. */
function solveDirect(prompt: string): number | null {
    const match = prompt.match(/^(\d+) ([+\u2212×÷]) (\d+) = \?$/)
    if (!match) return null
    return applyOperator(match[2] as OperatorSymbol, Number(match[1]), Number(match[3]))
}

describe('createQuestion', () => {
    it('produces a structurally valid question for every rank × operation × seed', () => {
        const problems: string[] = []
        for (const rank of RANKS) {
            for (const operation of OPERATIONS) {
                for (const seed of SEEDS) {
                    const question = createQuestion({
                        language: 'en',
                        operation,
                        rank,
                        rng: createRng(seed),
                    })
                    problems.push(...findProblems(question, rank, operation))
                }
            }
        }
        expect(problems).toEqual([])
    })

    it('produces a structurally valid question for every explicitly requested form', () => {
        const problems: string[] = []
        for (const rank of RANKS) {
            for (const operation of OPERATIONS) {
                for (const form of QUESTION_FORMS) {
                    for (const seed of SEEDS) {
                        const question = createQuestion({
                            language: 'en',
                            operation,
                            rank,
                            form,
                            rng: createRng(seed),
                        })
                        problems.push(...findProblems(question, rank, operation))
                    }
                }
            }
        }
        expect(problems).toEqual([])
    })

    it('never blanks an operand or the operator of a remainder question', () => {
        const problems: string[] = []
        for (const form of QUESTION_FORMS) {
            for (const seed of SEEDS) {
                const question = createQuestion({
                    language: 'de',
                    operation: 'remainders',
                    rank: 'legend',
                    form,
                    rng: createRng(seed),
                })
                if (question.form !== 'direct') problems.push(`form ${question.form} survived`)
                if (!/^\d+ ÷ \d+ = \?$/.test(question.prompt)) problems.push(`prompt ${question.prompt}`)
            }
        }
        expect(problems).toEqual([])
    })

    it('keeps every remainder — including the wrong tiles — smaller than the divisor', () => {
        const problems: string[] = []
        for (const language of LANGUAGES) {
            for (const rank of RANKS) {
                for (const seed of SEEDS) {
                    const question = createQuestion({
                        language,
                        operation: 'remainders',
                        rank,
                        rng: createRng(seed),
                    })
                    const divisor = Number(question.prompt.match(/÷ (\d+)/)![1])
                    for (const option of question.options) {
                        const [, remainder] = numbersIn(option)
                        if (!(remainder >= 0 && remainder < divisor)) {
                            problems.push(`${question.prompt} → "${option}" with divisor ${divisor}`)
                        }
                    }
                }
            }
        }
        expect(problems).toEqual([])
    })

    it('answers its own direct questions correctly', () => {
        const problems: string[] = []
        for (const rank of RANKS) {
            for (const operation of BINARY_OPERATIONS) {
                for (const seed of SEEDS) {
                    const question = createQuestion({
                        language: 'en',
                        operation,
                        rank,
                        form: 'direct',
                        rng: createRng(seed),
                    })
                    if (solveDirect(question.prompt) !== Number(question.answer)) {
                        problems.push(`${question.prompt} claims ${question.answer}`)
                    }
                }
            }
        }
        expect(problems).toEqual([])
    })

    it('makes the blank operand the value that satisfies the equation', () => {
        const problems: string[] = []
        for (const form of ['missingLeft', 'missingRight'] as QuestionForm[]) {
            for (const rank of RANKS) {
                for (const operation of BINARY_OPERATIONS) {
                    for (const seed of SEEDS) {
                        const question = createQuestion({
                            language: 'en',
                            operation,
                            rank,
                            form,
                            rng: createRng(seed),
                        })
                        const solved = question.prompt.replace('?', question.answer)
                        const match = solved.match(/^(\d+) ([+\u2212×÷]) (\d+) = (\d+)$/)
                        if (!match) {
                            problems.push(`unparseable ${solved}`)
                            continue
                        }
                        const value = applyOperator(match[2] as OperatorSymbol, Number(match[1]), Number(match[3]))
                        if (value !== Number(match[4])) problems.push(`${solved} does not hold`)
                    }
                }
            }
        }
        expect(problems).toEqual([])
    })

    it('only asks for a missing operator when exactly one operator fits', () => {
        const problems: string[] = []
        let generated = 0
        for (const rank of RANKS) {
            for (const operation of BINARY_OPERATIONS) {
                for (const seed of SEEDS) {
                    const question = createQuestion({
                        language: 'en',
                        operation,
                        rank,
                        form: 'missingOperator',
                        rng: createRng(seed),
                    })
                    if (question.form !== 'missingOperator') continue
                    generated += 1

                    const [left, right, result] = numbersIn(question.prompt)
                    if (!hasUniqueOperator(left, right, result)) problems.push(`ambiguous ${question.prompt}`)
                    if (applyOperator(question.answer as OperatorSymbol, left, right) !== result) {
                        problems.push(`${question.prompt} answer ${question.answer} is wrong`)
                    }
                    if ([...question.options].sort().join() !== [...OPERATOR_SYMBOLS].sort().join()) {
                        problems.push(`options ${question.options.join()}`)
                    }
                }
            }
        }
        expect(problems).toEqual([])
        expect(generated).toBeGreaterThan(0)
    })

    it('brackets both steps of a chain and keeps the intermediate value legal', () => {
        const problems: string[] = []
        let generated = 0
        for (const operation of BINARY_OPERATIONS) {
            for (const seed of SEEDS) {
                const question = createQuestion({
                    language: 'en',
                    operation,
                    rank: 'legend',
                    form: 'chain',
                    rng: createRng(seed),
                })
                if (question.form !== 'chain') continue
                generated += 1

                const match = question.prompt.match(/^\((\d+) ([+\u2212×÷]) (\d+)\) ([+\u2212]) (\d+) = \?$/)
                if (!match) {
                    problems.push(`unbracketed ${question.prompt}`)
                    continue
                }
                const middle = applyOperator(match[2] as OperatorSymbol, Number(match[1]), Number(match[3]))
                if (middle === null || middle < 0) {
                    problems.push(`illegal intermediate in ${question.prompt}`)
                    continue
                }
                if (applyOperator(match[4] as OperatorSymbol, middle, Number(match[5])) !== Number(question.answer)) {
                    problems.push(`${question.prompt} claims ${question.answer}`)
                }
            }
        }
        expect(problems).toEqual([])
        expect(generated).toBeGreaterThan(0)
    })

    it('is deterministic for a given seed', () => {
        for (const rank of RANKS) {
            const args = { language: 'en' as Language, operation: 'multiplication' as Operation, rank }
            expect(createQuestion({ ...args, rng: createRng(42) }))
                .toEqual(createQuestion({ ...args, rng: createRng(42) }))
        }
    })
})

describe('applyOperator', () => {
    it('refuses negative results, division by zero and inexact division', () => {
        expect(applyOperator(MINUS, 3, 5)).toBeNull()
        expect(applyOperator('÷', 5, 0)).toBeNull()
        expect(applyOperator('÷', 7, 2)).toBeNull()
        expect(applyOperator(MINUS, 5, 5)).toBe(0)
        expect(applyOperator('÷', 8, 2)).toBe(4)
    })
})

describe('hasUniqueOperator', () => {
    it('rejects the classic ambiguous prompts', () => {
        expect(hasUniqueOperator(4, 2, 2)).toBe(false) // 4 − 2 and 4 ÷ 2
        expect(hasUniqueOperator(2, 2, 4)).toBe(false) // 2 + 2 and 2 × 2
    })

    it('accepts prompts only one operator satisfies', () => {
        expect(hasUniqueOperator(7, 5, 12)).toBe(true)
        expect(hasUniqueOperator(9, 3, 27)).toBe(true)
    })
})

describe('pickForm', () => {
    it('only ever returns a form unlocked at that rank', () => {
        for (const rank of RANKS) {
            for (const seed of SEEDS) {
                const form = pickForm(createRng(seed), rank, 'addition')
                expect(rankConfig[rank].forms).toContain(form)
            }
        }
    })

    it('keeps direct questions the most common form even at the top rank', () => {
        const rng = createRng(2024)
        const counts = new Map<QuestionForm, number>()
        for (let i = 0; i < 4000; i += 1) {
            const form = pickForm(rng, 'legend', 'addition')
            counts.set(form, (counts.get(form) ?? 0) + 1)
        }
        const direct = counts.get('direct') ?? 0
        for (const form of rankConfig.legend.forms) {
            if (form === 'direct') continue
            expect(direct).toBeGreaterThan(counts.get(form) ?? 0)
        }
    })

    it('never takes a form away as the ranks climb', () => {
        for (let i = 1; i < RANKS.length; i += 1) {
            const previous = rankConfig[RANKS[i - 1]].forms
            const current = rankConfig[RANKS[i]].forms
            expect(current.length).toBeGreaterThanOrEqual(previous.length)
            for (const form of previous) expect(current).toContain(form)
        }
    })

    it('unlocks every form by the top rank, and raises the ceiling beyond it', () => {
        const top = rankConfig[RANKS[RANKS.length - 1]]
        const previous = rankConfig[RANKS[RANKS.length - 2]]
        expect([...top.forms].sort()).toEqual([...QUESTION_FORMS].sort())
        expect(top.maxValue).toBeGreaterThan(previous.maxValue)
    })
})

describe('pickOperation', () => {
    it('returns the only member of a single-operation pool', () => {
        expect(pickOperation(createRng(1), ['division'])).toBe('division')
    })

    it('always returns a member of the pool', () => {
        const pool: Operation[] = ['addition', 'multiplication', 'remainders']
        for (const seed of SEEDS) {
            expect(pool).toContain(pickOperation(createRng(seed), pool))
        }
    })

    it('favours the operation the player keeps getting wrong', () => {
        const pool: Operation[] = ['addition', 'multiplication']
        const rng = createRng(7)
        let multiplicationCount = 0
        for (let i = 0; i < 2000; i += 1) {
            if (pickOperation(rng, pool, { multiplication: 6 }) === 'multiplication') multiplicationCount += 1
        }
        expect(multiplicationCount).toBeGreaterThan(1200)
    })
})

describe('scoring', () => {
    it('steps the combo multiplier at 3, 6 and 10 correct in a row', () => {
        expect([0, 1, 2].map(getComboMultiplier)).toEqual([1, 1, 1])
        expect([3, 4, 5].map(getComboMultiplier)).toEqual([2, 2, 2])
        expect([6, 7, 8, 9].map(getComboMultiplier)).toEqual([3, 3, 3, 3])
        expect([10, 25].map(getComboMultiplier)).toEqual([4, 4])
    })

    it('never decreases points as the streak grows', () => {
        for (let streak = 1; streak < 30; streak += 1) {
            expect(getPoints(streak)).toBeGreaterThanOrEqual(getPoints(streak - 1))
        }
    })

    it('awards stars by accuracy', () => {
        expect(getStars(25, 25)).toBe(3)
        expect(getStars(23, 25)).toBe(3)
        expect(getStars(20, 25)).toBe(2)
        expect(getStars(18, 25)).toBe(1)
        expect(getStars(0, 0)).toBe(0)
    })

    it('withholds the first star from a run that four-way guessing could reach', () => {
        // Chance alone scores 25 % on four tiles, so 50 % must not read as success.
        expect(getStars(13, 25)).toBe(0)
        expect(getStars(16, 25)).toBe(0)
        expect(getStars(17, 25)).toBe(1)
    })
})

describe('pickForm and shaky shapes', () => {
    it('draws a shape the child keeps missing more often than a secure one', () => {
        const counts = { weak: 0, strong: 0 }
        for (let seed = 1; seed <= 400; seed += 1) {
            const form = pickForm(createRng(seed), 'ace', 'addition', {
                missingLeft: 0.2,
                missingRight: 1,
                missingOperator: 1,
            })
            if (form === 'missingLeft') counts.weak += 1
            if (form === 'missingRight') counts.strong += 1
        }
        expect(counts.weak).toBeGreaterThan(counts.strong)
    })

    it('keeps direct the most common shape even when another is shaky', () => {
        const seen: Record<string, number> = {}
        for (let seed = 1; seed <= 400; seed += 1) {
            const form = pickForm(createRng(seed), 'ace', 'addition', { missingLeft: 0 })
            seen[form] = (seen[form] ?? 0) + 1
        }
        const most = Object.entries(seen).sort((a, b) => b[1] - a[1])[0][0]
        expect(most).toBe('direct')
    })

    it('treats an unmet shape as neutral rather than urgent', () => {
        const withNoHistory = Array.from({ length: 200 }, (_, index) =>
            pickForm(createRng(index + 1), 'ace', 'addition')).filter(form => form === 'missingLeft').length
        const withPerfect = Array.from({ length: 200 }, (_, index) =>
            pickForm(createRng(index + 1), 'ace', 'addition', { missingLeft: 1 })).filter(form => form === 'missingLeft').length
        expect(withNoHistory).toBe(withPerfect)
    })

    /**
     * A chain is two facts and one outcome. A wrong answer to `(7 + 5) − 3`
     * does not say which of the two steps went wrong, so recording it against
     * either would put a signal in the review schedule describing something
     * that may not have happened. Empty is the honest answer, and it is a
     * decision rather than an omission — which is why it is written down here.
     */
    it('gives a chain no fact key, because it is two facts and one answer', () => {
        let chains = 0
        for (let seed = 1; seed <= 300; seed += 1) {
            const question = createQuestion({
                language: 'en', operation: 'addition', rank: 'supernova', form: 'chain', rng: createRng(seed),
            })
            if (question.form !== 'chain') continue
            chains += 1
            expect(question.factKey).toBe('')
        }
        expect(chains).toBeGreaterThan(0)
    })

    it('gives every other shape a fact key the schedule can use', () => {
        const shapes = ['direct', 'missingLeft', 'missingRight'] as const
        for (const form of shapes) {
            for (let seed = 1; seed <= 60; seed += 1) {
                const question = createQuestion({
                    language: 'en', operation: 'multiplication', rank: 'ace', form, rng: createRng(seed),
                })
                expect(question.factKey, `${form}/${seed}`).not.toBe('')
            }
        }
    })
})
