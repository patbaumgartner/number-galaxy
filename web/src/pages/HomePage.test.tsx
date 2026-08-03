import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { store } from '../store'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedOperations, seedPlayer, seedRank, seedSettings, userEvent } from '../test/utils'
import HomePage from './HomePage'

describe('HomePage', () => {
    beforeEach(() => seedLanguage('en'))
    afterEach(() => vi.restoreAllMocks())

    it('shows the configured mission chips and creates a player before revealing the picker', async () => {
        seedOperations(['addition', 'multiplication'])
        seedRank('cadet')
        seedSettings({ timed: true })
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
        expect(screen.getByText('➕ Plus')).toBeInTheDocument()
        expect(screen.getByText('✖️ Times')).toBeInTheDocument()
        expect(screen.getByText('⭐ Cadet')).toBeInTheDocument()
        expect(screen.getByText(/⏱ 25/)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /play/i }))
        expect(store.getPlayer()).not.toBeNull()
        expect(screen.getByRole('button', { name: /keep playing/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /choose your game/i })).toBeInTheDocument()
    })

    it('navigates from the picker and the hall and settings controls', async () => {
        seedPlayer()
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /^Math Invaders/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/game')
        await user.click(screen.getByRole('button', { name: /^Times Tables Galaxy/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
        await user.click(screen.getByRole('button', { name: /best scores/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/hall-of-fame')
        await user.click(screen.getByRole('button', { name: /settings/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })

    it('edits, validates, persists, and cancels profile changes', async () => {
        seedPlayer('Old name', '🚀')
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)
        await user.click(screen.getByRole('button', { name: /hi, old name/i }))
        await user.click(screen.getByRole('button', { name: /change name/i }))

        const input = screen.getByRole('textbox', { name: 'Name' })
        expect(input).toHaveAttribute('maxlength', '20')
        await user.clear(input)
        await user.type(input, '  Nova  ')
        await user.click(screen.getByRole('button', { name: '👾' }))
        expect(screen.getByRole('button', { name: '👾' })).toHaveAttribute('aria-pressed', 'true')
        await user.click(screen.getByRole('button', { name: 'Save' }))
        expect(store.getPlayer()).toMatchObject({ playerName: 'Nova', avatarId: '👾' })

        await user.click(screen.getByRole('button', { name: /hi, nova/i }))
        await user.click(screen.getByRole('button', { name: /change name/i }))
        await user.clear(screen.getByRole('textbox', { name: 'Name' }))
        await user.click(screen.getByRole('button', { name: 'Save' }))
        expect(store.getPlayer()?.playerName).toBe('Ace')

        await user.click(screen.getByRole('button', { name: /hi, ace/i }))
        await user.click(screen.getByRole('button', { name: /change name/i }))
        await user.clear(screen.getByRole('textbox', { name: 'Name' }))
        await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Discarded')
        await user.click(screen.getByRole('button', { name: 'Cancel' }))
        expect(store.getPlayer()?.playerName).toBe('Ace')
    })

    it('adds a second child, switches between them, and keeps their things apart', async () => {
        seedPlayer('Mia', '🚀')
        seedRank('legend')
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /hi, mia/i }))
        await user.click(screen.getByRole('button', { name: /add someone/i }))
        await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Jonas')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(screen.getByRole('button', { name: /hi, jonas/i })).toBeInTheDocument()
        // A brand new child starts at the beginning, not on Mia's rank.
        expect(store.getSettings().rank).toBe('rookie')

        await user.click(screen.getByRole('button', { name: /hi, jonas/i }))
        await user.click(screen.getByRole('button', { name: /switch to mia/i }))
        expect(screen.getByRole('button', { name: /hi, mia/i })).toBeInTheDocument()
        expect(store.getSettings().rank).toBe('legend')
    })

    it('removes a child and everything they had, once confirmed', async () => {
        seedPlayer('Mia', '🚀')
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /hi, mia/i }))
        await user.click(screen.getByRole('button', { name: /add someone/i }))
        await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Jonas')
        await user.click(screen.getByRole('button', { name: 'Save' }))
        await user.click(screen.getByRole('button', { name: /hi, jonas/i }))

        vi.spyOn(window, 'confirm').mockReturnValue(false)
        await user.click(screen.getByRole('button', { name: /remove jonas/i }))
        expect(store.getPlayers()).toHaveLength(2)

        vi.spyOn(window, 'confirm').mockReturnValue(true)
        await user.click(screen.getByRole('button', { name: /remove jonas/i }))
        expect(store.getPlayers().map(entry => entry.playerName)).toEqual(['Mia'])
    })

    it('never offers to remove the only child on the device', async () => {
        seedPlayer('Mia', '🚀')
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /hi, mia/i }))
        expect(screen.queryByRole('button', { name: /remove mia/i })).not.toBeInTheDocument()
    })

    it('renders in the stored language and sets the document language', () => {
        seedLanguage('fr')
        renderWithRouter(<HomePage />)
        expect(screen.getByRole('button', { name: /jouer/i })).toBeInTheDocument()
        expect(document.documentElement.lang).toBe('fr')
    })

    it('sends the player straight into a game the picker chose', async () => {
        seedLanguage('en')
        seedPlayer()
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /Surprise me/ }))

        // A fresh player has nothing unlocked beyond the arcade, the home galaxy
        // and the Doubling Deck, so those are the only legal destinations.
        const path = screen.getByTestId(LOCATION_TEST_ID).textContent ?? ''
        expect(path).toMatch(/^\/(game|times-tables\/train\/t\d+\/practice|number-beam\/drill\/(double|halve|nearDouble))$/)
    })
})
