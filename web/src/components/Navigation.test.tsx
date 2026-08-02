import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Navigation from './Navigation'
import { translations } from '../translations'
import { renderWithRouter, seedLanguage } from '../test/utils'

describe('Navigation', () => {
    it('links only to the trainer and the shared settings', () => {
        seedLanguage('en')
        renderWithRouter(<Navigation />)

        expect(screen.getByRole('link', { name: translations.en.nav.home })).toHaveAttribute('href', '/')
        expect(screen.getByRole('link', { name: translations.en.tt.title })).toHaveAttribute('href', '/times-tables')
        expect(screen.getByRole('link', { name: translations.en.nav.settings })).toHaveAttribute('href', '/settings')
        expect(screen.getAllByRole('link')).toHaveLength(3)
    })

    it('keeps the arcade leaderboard out of the trainer', () => {
        seedLanguage('en')
        renderWithRouter(<Navigation />)

        expect(screen.queryByRole('link', { name: translations.en.nav.hallOfFame })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /hall of fame|best scores/i })).not.toBeInTheDocument()
    })

    it('uses the stored German and French translations for links', () => {
        seedLanguage('de')
        const { unmount } = renderWithRouter(<Navigation />)

        expect(screen.getByRole('link', { name: translations.de.nav.home })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: translations.de.nav.settings })).toBeInTheDocument()

        seedLanguage('fr')
        unmount()
        renderWithRouter(<Navigation />)
        expect(screen.getByRole('link', { name: translations.fr.nav.home })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: translations.fr.nav.settings })).toBeInTheDocument()
    })

    it('names the landmark after the game it belongs to', () => {
        seedLanguage('en')
        renderWithRouter(<Navigation />)

        expect(screen.getByRole('navigation', { name: translations.en.tt.title })).toBeInTheDocument()
    })

    it('applies react-router active styling to the current route link', () => {
        seedLanguage('en')
        renderWithRouter(<Navigation />, { route: '/settings' })

        expect(screen.getByRole('link', { name: translations.en.nav.settings })).toHaveClass('active')
        expect(screen.getByRole('link', { name: translations.en.tt.title })).not.toHaveClass('active')
    })
})
