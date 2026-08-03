import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { beamStore } from '../beam'
import { progressKeys, store } from '../store'
import { ttStore } from '../timesTable/ttStore'
import {
    LOCATION_TEST_ID,
    renderWithRouter,
    seedBeamSettings,
    seedBeamStars,
    seedLanguage,
    seedOperations,
    seedPlayer,
    userEvent,
} from '../test/utils'
import SettingsPage from './SettingsPage'

describe('SettingsPage', () => {
    beforeEach(() => seedLanguage('en'))
    afterEach(() => vi.restoreAllMocks())

    it('persists operation and rank choices while locking the final operation', async () => {
        seedOperations(['addition'])
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)
        const plus = screen.getByRole('button', { name: /plus/i })
        expect(plus).toHaveAttribute('aria-disabled', 'true')
        await user.click(plus)
        expect(store.getSettings().operations).toEqual(['addition'])

        await user.click(screen.getByRole('button', { name: /times/i }))
        expect(store.getSettings().operations).toEqual(['addition', 'multiplication'])
        await user.click(screen.getByRole('button', { name: /cadet/i }))
        expect(store.getSettings().rank).toBe('cadet')
        expect(screen.getByRole('button', { name: /cadet/i })).toHaveAttribute('aria-pressed', 'true')
    })

    it('renders mastery badges and persists translated language changes', async () => {
        localStorage.setItem(progressKeys.skills, JSON.stringify({ addition: { history: [true, true, true, true, true] } }))
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)
        expect(screen.getByText('💎')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /français/i }))
        expect(store.getSettings().language).toBe('fr')
        expect(document.documentElement.lang).toBe('fr')
        expect(screen.getByRole('heading', { name: /réglages/i })).toBeInTheDocument()
    })

    it('persists all switches including trainer strategy cards', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)
        const switchFor = (label: RegExp) => screen.getByRole('switch', {
            name: (_name, element) => label.test(element.closest('.switch-row')?.textContent ?? ''),
        })

        expect(switchFor(/strategy cards/i)).toHaveAttribute('aria-checked', 'true')
        await user.click(switchFor(/strategy cards/i))
        expect(ttStore.getTTSettings().strategyCards).toBe(false)

        await user.click(switchFor(/countdown/i))
        await user.click(switchFor(/sound/i))
        await user.click(switchFor(/worked solutions/i))
        expect(store.getSettings()).toMatchObject({ timed: true, sound: false, hints: false })
    })

    it('resets only trainer data after confirmation and does nothing when cancelled', async () => {
        seedPlayer()
        ttStore.saveTTSettings({ strategyCards: false })
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)
        await user.click(screen.getByRole('button', { name: /reset trainer progress/i }))
        expect(ttStore.getTTSettings().strategyCards).toBe(false)

        vi.spyOn(window, 'confirm').mockReturnValue(true)
        await user.click(screen.getByRole('button', { name: /reset trainer progress/i }))
        expect(ttStore.getTTSettings().strategyCards).toBe(true)
        expect(store.getPlayer()).not.toBeNull()
    })

    it('clears all data only after confirmation and navigates through each footer action', async () => {
        seedPlayer()
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)
        await user.click(screen.getByRole('button', { name: /delete all data/i }))
        expect(store.getPlayer()).not.toBeNull()

        confirm.mockReturnValue(true)
        await user.click(screen.getByRole('button', { name: /delete all data/i }))
        expect(store.getPlayer()).toBeNull()
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/')
    })

    it('persists the Number Beam bar switch', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)
        const barSwitch = screen.getByRole('switch', {
            name: (_name, element) => /always show the bar/i.test(element.closest('.switch-row')?.textContent ?? ''),
        })

        expect(barSwitch).toHaveAttribute('aria-checked', 'true')
        await user.click(barSwitch)
        expect(beamStore.getBeamSettings().alwaysShowBar).toBe(false)
        expect(barSwitch).toHaveAttribute('aria-checked', 'false')

        await user.click(barSwitch)
        expect(beamStore.getBeamSettings().alwaysShowBar).toBe(true)
    })

    it('resets only beam data after confirmation and does nothing when cancelled', async () => {
        seedPlayer()
        seedBeamStars({ double: 2 })
        seedBeamSettings(false)
        ttStore.saveTTSettings({ strategyCards: false })
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        await user.click(screen.getByRole('button', { name: /reset beam progress/i }))
        expect(beamStore.getStars().double).toBe(2)

        vi.spyOn(window, 'confirm').mockReturnValue(true)
        await user.click(screen.getByRole('button', { name: /reset beam progress/i }))
        expect(beamStore.getStars()).toEqual({})
        expect(beamStore.getBeamSettings().alwaysShowBar).toBe(true)
        expect(ttStore.getTTSettings().strategyCards).toBe(false)
        expect(store.getPlayer()).not.toBeNull()
    })

    it('offers only game-neutral navigation, because both games share this page', () => {
        seedLanguage('en')
        renderWithRouter(<SettingsPage />)

        expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /best scores/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /done/i })).not.toBeInTheDocument()
    })
})
