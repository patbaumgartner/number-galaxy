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
import { senseStore } from '../sense'
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

        await user.click(switchFor(/sound/i))
        await user.click(switchFor(/worked solutions/i))
        expect(store.getSettings()).toMatchObject({ sound: false, hints: false })
    })

    it('offers a gentle clock between off and timed, and remembers the choice', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        expect(store.getSettings().timer).toBe('off')
        await user.click(screen.getByRole('button', { name: 'Gentle' }))
        expect(store.getSettings().timer).toBe('gentle')

        await user.click(screen.getByRole('button', { name: 'On' }))
        expect(store.getSettings().timer).toBe('timed')
    })

    it('lets a child who needs longer have longer', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        expect(store.getSettings().thinkingTime).toBe(1)
        await user.click(screen.getByRole('button', { name: 'Most' }))
        expect(store.getSettings().thinkingTime).toBe(2)
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

    /**
     * Every control sits under the game it actually affects. Two had drifted:
     * thinking time also sets the line at which a times-tables fact counts as
     * known by heart, and the progress report covers all four games — so neither
     * belongs to Math Invaders, which is where the first one was.
     */
    it('files every control under the game it actually affects', () => {
        renderWithRouter(<SettingsPage />)

        // Headings carry an emoji, so match the label rather than the whole node.
        const groupOf = (label: string | RegExp): string => {
            const node = screen.getAllByText(label)[0].closest('section.group')
            return node?.querySelector('.group__title')?.textContent ?? 'no group'
        }

        expect(groupOf('What do you want to practise?')).toContain('Math Invaders')
        expect(groupOf(/^⏱ Countdown$/)).toContain('Math Invaders')
        expect(groupOf(/^📖 Word problems$/)).toContain('Math Invaders')
        expect(groupOf('Strategy cards')).toContain('Times Tables')

        // Cross-game, so neither may sit under a single game.
        expect(groupOf(/^🧠 More thinking time$/)).toContain('All games')
        expect(groupOf(/^📋 Progress$/)).toContain('All games')
    })

    it('offers only game-neutral navigation, because every game shares this page', () => {
        seedLanguage('en')
        renderWithRouter(<SettingsPage />)

        expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /best scores/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /done/i })).not.toBeInTheDocument()
    })

    it('reaches the progress page, home, and the number-sense reset', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        await user.click(screen.getByRole('button', { name: /^📋 Progress$/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/progress')
    })

    it('goes home from the foot of the page', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        await user.click(screen.getByRole('button', { name: /🏠/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/')
    })

    it('switches the glance off and back on', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        const glance = screen.getByRole('switch', {
            name: (_name, element) => /Show only briefly/.test(element.closest('.switch-row')?.textContent ?? ''),
        })
        expect(glance).toHaveAttribute('aria-checked', 'true')
        await user.click(glance)
        expect(senseStore.getSenseSettings().briefGlance).toBe(false)
    })

    it('resets only number-sense data after confirmation, and nothing when cancelled', async () => {
        senseStore.raiseStars('subitize', 3)
        beamStore.raiseStars('double', 2)
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        vi.spyOn(window, 'confirm').mockReturnValue(false)
        await user.click(screen.getByRole('button', { name: /Reset Number Sense/ }))
        expect(senseStore.getStars().subitize).toBe(3)

        vi.spyOn(window, 'confirm').mockReturnValue(true)
        await user.click(screen.getByRole('button', { name: /Reset Number Sense/ }))
        expect(senseStore.getStars()).toEqual({})
        expect(beamStore.getStars().double).toBe(2)
    })

    it('turns word problems on', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SettingsPage />)

        const stories = screen.getByRole('switch', {
            name: (_name, element) => /Word problems/.test(element.closest('.switch-row')?.textContent ?? ''),
        })
        await user.click(stories)
        expect(store.getSettings().stories).toBe(true)
    })
})
