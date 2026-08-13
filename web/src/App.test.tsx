import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { store } from './store'
import { translations } from './i18n'

const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

function renderAt(path: string) {
    window.history.pushState({}, '', `${BASENAME}${path}`)
    return render(<App />)
}

describe('App routing', () => {
    it('renders the home page at the root', () => {
        renderAt('/')

        expect(screen.getByRole('heading', { level: 1, name: new RegExp(translations.de.home.appName, 'i') })).toBeInTheDocument()
    })

    it('renders the arcade hub, which is what /game opens now', () => {
        renderAt('/game')

        expect(screen.getByRole('heading', { level: 1, name: /Math Invaders/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: new RegExp(translations.de.nav.hallOfFame) })).toBeInTheDocument()
    })

    it('renders the mission itself one level down', () => {
        renderAt('/game/play')

        expect(screen.getByRole('group')).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: /^\d+$/ }).length).toBeGreaterThan(0)
    })

    it('renders the hall of fame page', () => {
        renderAt('/hall-of-fame')

        expect(screen.getByRole('heading', { level: 1, name: /🏆/ })).toBeInTheDocument()
    })

    it('renders the settings page', () => {
        renderAt('/settings')

        expect(screen.getByRole('heading', { level: 1, name: /⚙️/ })).toBeInTheDocument()
    })

    it('renders the times tables galaxy map', () => {
        renderAt('/times-tables')

        expect(screen.getByRole('heading', { level: 1, name: translations.de.tt.title })).toBeInTheDocument()
        expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('renders a trainer phase behind its own route', () => {
        renderAt('/times-tables/train/t2/learn')

        expect(screen.getByRole('heading', { level: 1, name: /2/ })).toBeInTheDocument()
    })

    it('redirects an unknown route home instead of showing a blank page', () => {
        renderAt('/this-route-does-not-exist')

        expect(screen.getByRole('heading', { level: 1, name: new RegExp(translations.de.home.appName, 'i') })).toBeInTheDocument()
        expect(window.location.pathname.replace(/\/$/, '')).toBe(BASENAME)
    })

    it('mirrors the stored language onto the document element', () => {
        store.saveSettings({ ...store.getSettings(), language: 'fr' })

        renderAt('/')

        expect(document.documentElement.lang).toBe('fr')
    })
})
