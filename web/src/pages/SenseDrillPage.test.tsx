import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedSenseZoneTwo, userEvent } from '../test/utils'
import { senseStore } from '../sense'
import SenseDrillPage from './SenseDrillPage'

const renderDrill = (skill: string) =>
    renderWithRouter(<SenseDrillPage />, {
        route: `/number-sense/drill/${skill}`,
        path: '/number-sense/drill/:skill',
    })

/** Drives the native range the alien rides, then lands on it. */
async function answer(user: ReturnType<typeof userEvent.setup>, value: number) {
    const slider = screen.getByRole('slider')
    act(() => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        setter?.call(slider, String(value))
        slider.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await user.click(screen.getByRole('button', { name: /Land on/ }))
}

describe('SenseDrillPage', () => {
    beforeEach(() => seedLanguage('en'))
    afterEach(() => vi.restoreAllMocks())

    it('sends a locked station back to the map', () => {
        renderDrill('placeNumber')
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-sense')
    })

    it('sends an unknown station back to the map', () => {
        renderDrill('nonsense')
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-sense')
    })

    it('shows the number to place, which is the whole task', () => {
        seedSenseZoneTwo()
        const { container } = renderDrill('placeNumber')

        // The instruction alone leaves nothing on screen to place.
        expect(screen.getByText('Put it where it belongs')).toBeInTheDocument()
        expect(container.querySelector('.equation__prompt')?.textContent).toMatch(/^\d+$/)
    })

    it('asks how many, and hides the pattern once the glance is over', () => {
        vi.useFakeTimers()
        const { container } = renderDrill('subitize')

        expect(screen.getByText('How many?')).toBeInTheDocument()
        expect(container.querySelectorAll('.sense-dot:not(.sense-dot--empty)').length).toBeGreaterThan(0)

        act(() => vi.advanceTimersByTime(1500))
        expect(container.querySelectorAll('.sense-dot')).toHaveLength(0)
        expect(screen.getByRole('button', { name: /Look again/ })).toBeInTheDocument()
        vi.useRealTimers()
    })

    it('puts the pattern back on request', () => {
        vi.useFakeTimers()
        const { container } = renderDrill('subitize')
        act(() => vi.advanceTimersByTime(1500))

        // fireEvent rather than userEvent: the latter waits on real timers that
        // the fake clock is holding, and the two deadlock.
        fireEvent.click(screen.getByRole('button', { name: /Look again/ }))
        expect(container.querySelectorAll('.sense-dot:not(.sense-dot--empty)').length).toBeGreaterThan(0)
        vi.useRealTimers()
    })

    it('leaves the pattern up when the glance is switched off', () => {
        vi.useFakeTimers()
        senseStore.saveSenseSettings({ briefGlance: false })
        const { container } = renderDrill('subitize')

        act(() => vi.advanceTimersByTime(3000))
        expect(container.querySelectorAll('.sense-dot:not(.sense-dot--empty)').length).toBeGreaterThan(0)
        vi.useRealTimers()
    })

    it('accepts a near miss where the skill is a sense of size', async () => {
        seedSenseZoneTwo()
        const user = userEvent.setup({ delay: null })
        const { container } = renderDrill('placeNumber')

        const target = Number(container.querySelector('.equation__prompt')?.textContent)
        await answer(user, target + 1)
        expect(screen.getByText('Close enough!')).toBeInTheDocument()
    })

    it('says plainly when an answer is wrong, and shows the working', async () => {
        const user = userEvent.setup({ delay: null })
        const { container } = renderDrill('subitize')

        const dots = container.querySelectorAll('.sense-dot:not(.sense-dot--empty)').length
        await answer(user, dots + 5)
        expect(screen.getByText(/Missed!/)).toBeInTheDocument()
        expect(container.querySelector('.equation__working')).not.toBeNull()
    })

    it('finishes a ten-question drill and awards a star', async () => {
        const user = userEvent.setup({ delay: null })
        const { container } = renderDrill('subitize')

        for (let index = 0; index < 10; index += 1) {
            const dots = container.querySelectorAll('.sense-dot:not(.sense-dot--empty)').length
            await answer(user, dots)
            if (screen.queryByRole('dialog') !== null) break
            await act(async () => { await new Promise(resolve => setTimeout(resolve, 800)) })
        }

        expect(await screen.findByRole('dialog', { name: 'Station complete!' })).toBeInTheDocument()
        expect(senseStore.getStars().subitize).toBeGreaterThanOrEqual(1)
    })

    it('shows a worked example on other numbers, and closes it again', async () => {
        const user = userEvent.setup({ delay: null })
        renderDrill('subitize')

        await user.click(screen.getByRole('button', { name: /Help/ }))
        const help = await screen.findByRole('dialog')

        // On numbers the drill is not asking about: help that solves the question
        // in front of the child hands the answer over.
        expect(help).toHaveTextContent('5 + 2 = 7')

        await user.click(screen.getByRole('button', { name: 'Continue' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
})
