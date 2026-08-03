import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { store } from '../store'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedOperations, seedPlayer, seedRank, userEvent } from '../test/utils'
import HomePage from './HomePage'

describe('HomePage', () => {
    beforeEach(() => seedLanguage('en'))
    afterEach(() => vi.restoreAllMocks())

    it('shows all four games before anyone has been named', () => {
        renderWithRouter(<HomePage />)

        // The picker used to be hidden until Play created a profile, so a parent
        // opening the app was told it had four games while being shown none.
        expect(store.getPlayer()).toBeNull()
        expect(screen.getByRole('heading', { name: /choose your game/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^Math Invaders/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^Times Tables/ })).toBeInTheDocument()
    })

    it('names the child on the way into a game rather than up front', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /^Math Invaders/ }))
        expect(store.getPlayer()).not.toBeNull()
    })

    it('sends the hero button somewhere instead of leaving it inert', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        // It read "Keep playing" and did nothing at all once a profile existed.
        await user.click(screen.getByRole('button', { name: /play/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-sense')
    })

    it('resumes the game that was played last', async () => {
        seedPlayer()
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /^Times Tables/ }))
        expect(store.getLastGame()).toBe('/times-tables')

        renderWithRouter(<HomePage />)
        await user.click(screen.getAllByRole('button', { name: /keep playing/i })[0])
        expect(screen.getAllByTestId(LOCATION_TEST_ID)[0]).toHaveTextContent('/times-tables')
    })

    it('leaves the arcade its own settings and leaderboard, rather than hosting them', () => {
        seedOperations(['addition', 'multiplication'])
        seedRank('cadet')
        renderWithRouter(<HomePage />)

        // Both belong to Math Invaders alone, and home now serves all four games.
        expect(screen.queryByText('⭐ Cadet')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /best scores/i })).not.toBeInTheDocument()
    })

    it('navigates from the picker and the settings control', async () => {
        seedPlayer()
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<HomePage />)

        await user.click(screen.getByRole('button', { name: /^Math Invaders/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/game')
        await user.click(screen.getByRole('button', { name: /^Times Tables/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
        await user.click(screen.getByRole('button', { name: /settings/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })

    it('offers all four games, easiest first, so the order is the guidance', async () => {
        seedPlayer()
        renderWithRouter(<HomePage />)

        const cards = [...document.querySelectorAll('.game-picker__card:not(.game-picker__card--surprise)')]
            .map(card => card.textContent ?? '')

        expect(cards).toHaveLength(4)
        expect(cards[0]).toContain('Number Sense')
        expect(cards[1]).toContain('Number Beam')
        expect(cards[2]).toContain('Math Invaders')
        expect(cards[3]).toContain('Times Tables')
    })

    it('keeps the rules in the games rather than stacked on the way to them', () => {
        seedPlayer()
        renderWithRouter(<HomePage />)
        expect(screen.queryByText(/How to play/i)).not.toBeInTheDocument()
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

        // A fresh player has nothing unlocked beyond the arcade, the home galaxy,
        // the first Number Sense zone and the Doubling Deck, so those are the
        // only legal destinations.
        const path = screen.getByTestId(LOCATION_TEST_ID).textContent ?? ''
        expect(path).toMatch(
            /^\/(game\/play|times-tables\/train\/t\d+\/practice|number-beam\/drill\/(double|halve|nearDouble)|number-sense\/drill\/(subitize|tenFrame|rekenrek))$/,
        )
    })
})
