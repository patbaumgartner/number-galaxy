import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPracticeSession } from '../../timesTable/session'
import { ttStore } from '../../timesTable/ttStore'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, userEvent, hudStat } from '../../test/utils'
import { PracticePhase } from './PracticePhase'

const answer = (): number => {
    const prompt = screen.getByText(/× .* = \?/).textContent ?? ''
    const values = prompt.match(/(\d+) × (\d+)/)
    if (!values) throw new Error(`Expected multiplication prompt, received ${prompt}`)
    return Number(values[1]) * Number(values[2])
}

const submit = async (user: ReturnType<typeof userEvent.setup>, value: number) => {
    for (const digit of String(value)) await user.click(screen.getByRole('button', { name: digit }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))
}

describe('PracticePhase', () => {
    beforeEach(() => {
        seedLanguage('en')
        vi.spyOn(Math, 'random').mockReturnValue(0)
        vi.spyOn(performance, 'now').mockReturnValue(1_000)
    })
    afterEach(() => vi.restoreAllMocks())

    it('renders session status, advances correct answers, and requeues a wrong fact only once', async () => {
        const expected = buildPracticeSession('t3', ttStore.getProgress(), Math.floor(Date.now() / 86_400_000), () => 0)
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PracticePhase planetId="t3" />)
        expect(hudStat('Question')).toBe(`1/${expected.length}`)
        expect(screen.getByText('🔥 0')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()

        const first = answer()
        await submit(user, first)
        expect(screen.getByText('🔥 1')).toBeInTheDocument()
        await submit(user, 999)
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/×3/)).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Got it' }))
        expect(hudStat('Question')).toBe(`3/${expected.length + 1}`)
    })

    it('awards one star for at least eighty percent first-attempt accuracy', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PracticePhase planetId="t3" />)
        for (let index = 0; index < 12; index += 1) await submit(user, answer())
        expect(screen.getByText(/you earned 1 star/i)).toBeInTheDocument()
        expect(ttStore.getStars().t3).toBe(1)
    })

    it('shows the keep-practising summary below eighty percent and conditionally opens strategy cards', async () => {
        const user = userEvent.setup({ delay: null })
        ttStore.saveTTSettings({ strategyCards: false })
        const disabled = renderWithRouter(<PracticePhase planetId="t3" />)
        expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument()
        disabled.unmount()

        ttStore.saveTTSettings({ strategyCards: true })
        renderWithRouter(<PracticePhase planetId="t3" />)
        await user.click(screen.getByRole('button', { name: /help/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Got it' }))
        for (let index = 0; index < 3; index += 1) {
            await submit(user, 999)
            await user.click(screen.getByRole('button', { name: 'Got it' }))
        }
        for (let index = 0; index < 12; index += 1) await submit(user, answer())
        expect(screen.getByText(/keep practising/i)).toBeInTheDocument()
    })

    it('returns to the galaxy map from the exit control', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PracticePhase planetId="t3" />)
        await user.click(screen.getByRole('button', { name: /back to map/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
    })
})

describe('PracticePhase dialogs behave like modals', () => {
    beforeEach(() => {
        seedLanguage('en')
        vi.spyOn(Math, 'random').mockReturnValue(0)
        vi.spyOn(performance, 'now').mockReturnValue(1_000)
    })
    afterEach(() => vi.restoreAllMocks())

    it('closes the strategy card with Escape and returns focus to the hint button', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PracticePhase planetId="t3" />)
        const hint = screen.getByRole('button', { name: /help/i })

        await user.click(hint)
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        await user.keyboard('{Escape}')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(hint).toHaveFocus()
    })

    it('keeps Tab inside the strategy card', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PracticePhase planetId="t3" />)

        await user.click(screen.getByRole('button', { name: /help/i }))
        const dialog = screen.getByRole('dialog')
        await user.tab()
        await user.tab()

        expect(dialog).toContainElement(document.activeElement as HTMLElement)
    })

    it('advances past the explanation when it is dismissed with Escape', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PracticePhase planetId="t3" />)
        await submit(user, 999)

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        await user.keyboard('{Escape}')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    })
})
