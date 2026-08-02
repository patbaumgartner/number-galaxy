import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Navigation from './Navigation'
import { translations } from '../translations'
import { renderWithRouter, seedLanguage } from '../test/utils'

describe('Navigation', () => {
    it('renders the Math Invaders brand and four destination links', () => {
        seedLanguage('en')
        renderWithRouter(<Navigation />)

        expect(screen.getByRole('link', { name: 'MATH INVADERS' })).toHaveAttribute('href', '/')
        expect(screen.getByRole('link', { name: translations.en.nav.home })).toHaveAttribute('href', '/')
        expect(screen.getByRole('link', { name: translations.en.tt.title })).toHaveAttribute('href', '/times-tables')
        expect(screen.getByRole('link', { name: translations.en.nav.hallOfFame })).toHaveAttribute('href', '/hall-of-fame')
        expect(screen.getByRole('link', { name: translations.en.nav.settings })).toHaveAttribute('href', '/settings')
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

    it('exposes the primary navigation landmark', () => {
        seedLanguage('en')
        renderWithRouter(<Navigation />)

        expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument()
    })

    it('applies react-router active styling to the current route link', () => {
        seedLanguage('en')
        renderWithRouter(<Navigation />, { route: '/settings' })

        expect(screen.getByRole('link', { name: translations.en.nav.settings })).toHaveClass('active')
        expect(screen.getByRole('link', { name: translations.en.nav.home })).not.toHaveClass('active')
    })
})
