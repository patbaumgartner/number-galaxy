import type { Language, Operation } from './types'
import { MINUS } from './types'
import { remainderLabel } from './equations'

export type WorkedExample = {
    prompt: string
    answer: string
    /** Pure maths notation, so it reads identically in all four languages. */
    steps: string
}

/**
 * A solved example per operation, shown on demand from the in-game help button.
 * Deliberately written as symbols and numbers only — no prose to translate and
 * nothing that goes stale when the UI language changes.
 */
export function getWorkedExample(operation: Operation, language: Language): WorkedExample {
    switch (operation) {
        case 'addition':
            return { prompt: '7 + 5 = ?', answer: '12', steps: '7 + 3 = 10 → 10 + 2 = 12' }
        case 'subtraction':
            return { prompt: `13 ${MINUS} 4 = ?`, answer: '9', steps: `13 ${MINUS} 3 = 10 → 10 ${MINUS} 1 = 9` }
        case 'multiplication':
            return { prompt: '4 × 6 = ?', answer: '24', steps: '6 + 6 + 6 + 6 = 24' }
        case 'division':
            return { prompt: '24 ÷ 6 = ?', answer: '4', steps: '6 × 4 = 24 → 24 ÷ 6 = 4' }
        case 'remainders':
            return {
                prompt: '14 ÷ 4 = ?',
                answer: remainderLabel(language, 3, 2),
                steps: `4 × 3 = 12 → 14 ${MINUS} 12 = 2`,
            }
    }
}
