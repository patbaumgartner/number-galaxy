import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedOperations, seedRank, seedSettings, userEvent } from '../test/utils'
import ArcadePage from './ArcadePage'

describe('ArcadePage', () => {
    beforeEach(() => seedLanguage('en'))

    it('shows what the next mission will serve', () => {
        seedOperations(['addition', 'multiplication'])
        seedRank('cadet')
        seedSettings({ timer: 'timed' })
        renderWithRouter(<ArcadePage />)

        expect(screen.getByText('➕ Plus')).toBeInTheDocument()
        expect(screen.getByText('✖️ Times')).toBeInTheDocument()
        expect(screen.getByText('⭐ Cadet')).toBeInTheDocument()
        expect(screen.getByText(/⏱/)).toBeInTheDocument()
        expect(screen.getByText('25 questions')).toBeInTheDocument()
    })

    it('marks an untimed mission with ∞ rather than a clock', () => {
        seedSettings({ timer: 'off' })
        renderWithRouter(<ArcadePage />)

        expect(screen.getByText(/∞ No time pressure/)).toBeInTheDocument()
        expect(screen.getByText('25 questions')).toBeInTheDocument()
    })

    it('starts the mission one level down, so the hub is not in the way of playing again', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<ArcadePage />)

        await user.click(screen.getByRole('button', { name: /Play/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/game/play')
    })

    it('keeps the leaderboard and the mission settings within reach', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<ArcadePage />)

        await user.click(screen.getByRole('button', { name: /Best scores/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/hall-of-fame')

        await user.click(screen.getByRole('button', { name: /Change/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })

    it('opens and closes the rules without leaving the hub', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<ArcadePage />)

        await user.click(screen.getByRole('button', { name: /How to play/ }))
        expect(screen.getByRole('dialog', { name: /How to play: Math Invaders/ })).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Continue' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('reaches settings from the top bar as well as the mission panel', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<ArcadePage />)

        await user.click(screen.getAllByRole('button', { name: /Settings/ })[0])
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })

    it('opens a two-player round from the arcade front door', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<ArcadePage />)

        await user.click(screen.getByRole('button', { name: /Two players/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/game/two')
    })
})
