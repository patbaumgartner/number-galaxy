import type { Language, Operation } from './types'
import { MINUS } from './types'
import { remainderLabel } from './equations'
import type { Route } from './working'

export type WorkedExample = {
    prompt: string
    answer: string
    /** Pure maths notation, so it reads identically in all four languages. */
    steps: string
}

/**
 * A solved example, shown on demand from the in-game help button.
 *
 * Deliberately written as symbols and numbers only — no prose to translate and
 * nothing that goes stale when the UI language changes.
 *
 * It never uses the numbers on screen. Help is asked for *before* answering, so
 * an example built from the live question would simply hand over the answer.
 * What it matches instead is the *route*: a child stuck on a bridging-ten sum is
 * shown a smaller bridging-ten sum, worked through, and can carry the idea back.
 */
const byRoute: Record<Route, WorkedExample> = {
    nearDouble: { prompt: '7 + 8 = ?', answer: '15', steps: '7 + 7 = 14 → 14 + 1 = 15' },
    bridgeTen: { prompt: '7 + 5 = ?', answer: '12', steps: '7 + 3 = 10 → 10 + 2 = 12' },
    placeValue: { prompt: '34 + 20 = ?', answer: '54', steps: '30 + 20 = 50 → 50 + 4 = 54' },
    countUp: { prompt: `12 ${MINUS} 9 = ?`, answer: '3', steps: '9 + 3 = 12' },
    inverse: { prompt: '24 ÷ 6 = ?', answer: '4', steps: '6 × 4 = 24' },
    timesTable: { prompt: '6 × 7 = ?', answer: '42', steps: '5 × 7 + 7 = 35 + 7 = 42' },
    plain: { prompt: '7 + 5 = ?', answer: '12', steps: '7 + 3 = 10 → 10 + 2 = 12' },
}

/** The fallback when a question has no route of its own, such as a remainder. */
const byOperation: Partial<Record<Operation, Route>> = {
    addition: 'bridgeTen',
    subtraction: 'countUp',
    multiplication: 'timesTable',
    division: 'inverse',
}

export function getWorkedExample(operation: Operation, language: Language, route?: Route): WorkedExample {
    if (operation === 'remainders') {
        return {
            prompt: '14 ÷ 4 = ?',
            answer: remainderLabel(language, 3, 2),
            steps: `4 × 3 = 12 → 14 ${MINUS} 12 = 2`,
        }
    }

    return byRoute[route ?? byOperation[operation] ?? 'plain']
}
