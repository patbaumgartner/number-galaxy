import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NumberBeamPage from './NumberBeamPage'
import { beamStore } from '../beam'
import {
    LOCATION_TEST_ID,
    renderWithRouter,
    seedBeamStars,
    seedLanguage,
    userEvent,
} from '../test/utils'

const user = userEvent.setup({ delay: null })

/**
 * Station names nest inside their button, and several share a prefix
 * ("Double" / "Double twice"), so the exact label is matched and the button it
 * belongs to is walked up to.
 */
function station(label: string): HTMLElement {
    const button = screen.getByText(label, { exact: true }).closest('button')
    if (button === null) throw new Error(`No station button labelled ${label}`)
    return button
}

describe('NumberBeamPage', () => {
    it('offers the first zone straight away and locks the two behind it', () => {
        seedLanguage('en')
        renderWithRouter(<NumberBeamPage />)

        expect(screen.getByRole('heading', { name: /Doubling Deck/ })).toBeInTheDocument()
        expect(station('Double')).toBeEnabled()
        expect(station('Halve')).toBeEnabled()
        expect(station('Quarters')).toBeDisabled()
        expect(station('Number bonds')).toBeDisabled()
    })

    it('opens the next zone once two stations behind it have a star', () => {
        seedLanguage('en')
        seedBeamStars({ double: 1, halve: 2 })
        renderWithRouter(<NumberBeamPage />)

        expect(station('Quarters')).toBeEnabled()
        expect(station('Number bonds')).toBeDisabled()
    })

    it('shows a worked example on every station so the maths is visible before entering', () => {
        seedLanguage('en')
        renderWithRouter(<NumberBeamPage />)
        expect(screen.getByText('2 × 7 = ?')).toBeInTheDocument()
        expect(screen.getByText('¾ × 20 = ?')).toBeInTheDocument()
    })

    it('shows the stars and best score a station has already earned', () => {
        seedLanguage('en')
        seedBeamStars({ double: 2 })
        beamStore.updateBest('double', 0.9)
        renderWithRouter(<NumberBeamPage />)

        expect(screen.getByLabelText('2 of 3 stars')).toBeInTheDocument()
        expect(screen.getByText('Best 90%')).toBeInTheDocument()
    })

    it('sends the player into the drill for the station they tap', async () => {
        seedLanguage('en')
        renderWithRouter(<NumberBeamPage />)

        await user.click(station('Halve'))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-beam/drill/halve')
    })

    it('refuses to open a locked station', async () => {
        seedLanguage('en')
        renderWithRouter(<NumberBeamPage />)

        await user.click(station('Split'))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/')
        expect(screen.getByTestId(LOCATION_TEST_ID)).not.toHaveTextContent('/number-beam/drill')
    })

    it('offers a way through to settings', async () => {
        seedLanguage('en')
        renderWithRouter(<NumberBeamPage />)

        await user.click(screen.getByRole('button', { name: /Settings/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })

    it('speaks the language the player chose', () => {
        seedLanguage('de')
        renderWithRouter(<NumberBeamPage />)
        expect(screen.getByRole('heading', { name: /Doppel-Deck/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Verdoppeln/ })).toBeInTheDocument()
    })

    it('opens and closes the rules without leaving the map', async () => {
        seedLanguage('en')
        renderWithRouter(<NumberBeamPage />)

        await user.click(screen.getByRole('button', { name: /How to play/ }))
        expect(screen.getByRole('dialog', { name: /How to play: Number Beam/ })).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Continue' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
})
