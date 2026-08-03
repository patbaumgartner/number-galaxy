import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TopBar from './TopBar'
import { LOCATION_TEST_ID, renderWithRouter, userEvent } from '../test/utils'

describe('TopBar', () => {
    it('titles the screen with the page’s only level-one heading', () => {
        renderWithRouter(<TopBar back={{ label: 'Home', to: '/' }} title="Number Beam" />)

        expect(screen.getByRole('heading', { level: 1, name: 'Number Beam' })).toBeInTheDocument()
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    })

    it('puts the way out first, so it is the first control a keyboard reaches', () => {
        renderWithRouter(
            <TopBar back={{ label: 'Home', to: '/' }} title="Number Beam" actions={<button type="button">Help</button>} />,
        )

        const buttons = screen.getAllByRole('button')
        expect(buttons[0]).toHaveAccessibleName(/Home/)
    })

    it('navigates back to wherever the screen says it belongs', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<TopBar back={{ label: 'Back to map', to: '/number-beam' }} title="Halve" />, {
            route: '/number-beam/drill/halve',
        })

        await user.click(screen.getByRole('button', { name: /Back to map/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-beam')
    })

    it('renders whatever actions the screen hands it', () => {
        renderWithRouter(
            <TopBar
                back={{ label: 'Home', to: '/' }}
                title="Game"
                actions={<button type="button">Finish</button>}
            />,
        )
        expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
    })

    it('keeps the back label in the accessibility tree even when a phone hides it', () => {
        const { container } = renderWithRouter(<TopBar back={{ label: 'Home', to: '/' }} title="Game" />)

        // The label is collapsed by CSS at small widths rather than removed, so it
        // is still announced. A `display: none` here would strip it from the tree.
        const hidden = container.querySelector('.game-bar__hide-sm')
        expect(hidden).not.toBeNull()
        expect(hidden).not.toHaveAttribute('aria-hidden')
    })
})
