import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildLearnSession } from '../../timesTable/session'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, userEvent } from '../../test/utils'
import { LearnPhase } from './LearnPhase'

const submit = async (user: ReturnType<typeof userEvent.setup>, answer: number) => {
    for (const digit of String(answer)) await user.click(screen.getByRole('button', { name: digit }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))
}

describe('LearnPhase', () => {
    it('moves from strategy through skip-count, table, guided questions, and practice navigation', async () => {
        seedLanguage('en')
        const session = buildLearnSession('t3')
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<LearnPhase planetId="t3" />)
        expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Got it' }))
        for (const gap of session.gapIndices) await submit(user, session.skipCountSequence[gap])
        expect(screen.getByText(`${session.facts[0].a} × ${session.facts[0].b} =`)).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /try these now/i }))
        await submit(user, session.guidedQuestions[0].answer + 1)
        expect(screen.getAllByText(String(session.guidedQuestions[0].answer)).length).toBeGreaterThan(0)
        for (let index = 0; index < session.guidedQuestions.length; index += 1) {
            const fact = session.guidedQuestions[index]
            await submit(user, fact.answer)
        }
        await user.click(screen.getByRole('button', { name: /practise now/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables/train/t3/practice')
    })

    it('shakes and pre-fills a skip-count answer after two consecutive misses and exits to the map', async () => {
        seedLanguage('en')
        const user = userEvent.setup({ delay: null })
        const { container } = renderWithRouter(<LearnPhase planetId="t3" />)
        await user.click(screen.getByRole('button', { name: 'Got it' }))
        await submit(user, 99)
        expect(container.querySelector('.seq-active')).toHaveClass('shake')
        await submit(user, 99)
        expect(container.querySelector('.numpad-display')).toHaveTextContent('9')
        await user.click(screen.getByRole('button', { name: /back to map/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
    })
})
