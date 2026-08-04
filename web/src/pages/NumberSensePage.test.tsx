import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedSenseStars, seedSenseZoneTwo, userEvent } from '../test/utils'
import NumberSensePage from './NumberSensePage'

describe('NumberSensePage', () => {
    beforeEach(() => seedLanguage('en'))

    it('opens the first zone and holds the second shut', () => {
        renderWithRouter(<NumberSensePage />)

        expect(screen.getByRole('button', { name: /At a glance/ })).toBeEnabled()
        expect(screen.getByRole('button', { name: /Place it/ })).toBeDisabled()
        expect(screen.getAllByText(/Earn ⭐ at two stations/).length).toBeGreaterThan(0)
    })

    it('opens the second zone once the first has earned its stars', () => {
        seedSenseZoneTwo()
        renderWithRouter(<NumberSensePage />)

        expect(screen.getByRole('button', { name: /Place it/ })).toBeEnabled()
    })

    it('sends a tap to that station drill', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<NumberSensePage />)

        await user.click(screen.getByRole('button', { name: /At a glance/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-sense/drill/subitize')
    })

    it('shows earned stars and the best run so far', () => {
        seedSenseStars('subitize', 2)
        renderWithRouter(<NumberSensePage />)

        expect(screen.getByLabelText('2 stars')).toBeInTheDocument()
    })

    it('marks the next station to try, and stops marking it once starred', () => {
        const { container, unmount } = renderWithRouter(<NumberSensePage />)
        expect(container.querySelectorAll('.beam-station__next')).toHaveLength(1)
        unmount()

        seedSenseStars('subitize', 1)
        const next = renderWithRouter(<NumberSensePage />)
        const marked = next.container.querySelector('.beam-station__next')?.closest('button')
        expect(marked?.textContent).toContain('Ten-frame')
    })

    it('keeps the rules one tap away rather than on the way in', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<NumberSensePage />)

        await user.click(screen.getByRole('button', { name: /How to play/ }))
        expect(screen.getByRole('dialog', { name: /How to play: Number Sense/ })).toBeInTheDocument()
        expect(screen.getByText(/do not count/i)).toBeInTheDocument()
    })

    it('reaches settings from the map', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<NumberSensePage />)

        await user.click(screen.getByRole('button', { name: /settings/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })

    it('opens the sandbox from the map without needing a star', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<NumberSensePage />)

        await user.click(screen.getByRole('button', { name: /Explore numbers/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-sense/play')
    })
})
