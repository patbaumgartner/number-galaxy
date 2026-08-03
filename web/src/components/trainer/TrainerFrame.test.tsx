import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TrainerFrame from './TrainerFrame'
import { LOCATION_TEST_ID, renderWithRouter, userEvent } from '../../test/utils'

describe('TrainerFrame', () => {
    it('wraps a phase in the shell every trainer screen shares', () => {
        const { container } = renderWithRouter(
            <TrainerFrame title="✖️ 3× — Practice" exit="Back to map">
                <p>question</p>
            </TrainerFrame>,
        )

        expect(container.querySelector('.page.trainer-page')).not.toBeNull()
        expect(container.querySelector('main.shell .trainer-body')).not.toBeNull()
        expect(screen.getByText('question')).toBeInTheDocument()
    })

    it('titles the screen, and only once, so the page keeps a single h1', () => {
        renderWithRouter(<TrainerFrame title="Daily mission" exit="Back to map"><p>x</p></TrainerFrame>)

        expect(screen.getByRole('heading', { level: 1, name: 'Daily mission' })).toBeInTheDocument()
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    })

    it('accepts a node title, because most phases name themselves with an emoji and a label', () => {
        renderWithRouter(
            <TrainerFrame title={<>🪐 ×7 — Speed Run</>} exit="Back to map"><p>x</p></TrainerFrame>,
        )
        expect(screen.getByRole('heading', { level: 1, name: /×7 — Speed Run/ })).toBeInTheDocument()
    })

    it('always leaves to the galaxy map', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(
            <TrainerFrame title="Practice" exit="Back to map"><p>x</p></TrainerFrame>,
            { route: '/times-tables/train/t3/practice' },
        )

        await user.click(screen.getByRole('button', { name: /Back to map/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
    })
})
