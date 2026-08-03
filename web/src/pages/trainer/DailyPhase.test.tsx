import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canonicalKey } from '../../timesTable/facts'
import { localEpochDay } from '../../review/leitner'
import { ttStore } from '../../timesTable/ttStore'
import { LOCATION_TEST_ID, renderWithRouter, seedFactProgress, seedLanguage, seedStars, userEvent, hudStat } from '../../test/utils'
import { DailyPhase } from './DailyPhase'

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

describe('DailyPhase', () => {
    beforeEach(() => {
        seedLanguage('en')
        vi.spyOn(Math, 'random').mockReturnValue(0)
    })
    afterEach(() => vi.restoreAllMocks())

    it('shows an all-caught-up panel when no review facts are due', () => {
        renderWithRouter(<DailyPhase />)
        expect(screen.getByText('All caught up!')).toBeInTheDocument()
    })

    it('runs due facts, requeues one wrong answer, reports accuracy, and exits', async () => {
        const today = localEpochDay(Date.now(), new Date().getTimezoneOffset())
        seedStars({ t3: 1 })
        seedFactProgress({
            [canonicalKey(3, 1)]: { box: 1, lastDay: today, last3: [] },
            [canonicalKey(3, 2)]: { box: 1, lastDay: today, last3: [] },
        })
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<DailyPhase />)
        expect(hudStat('Question')).toBe('1/4')
        await submit(user, 999)
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'OK' }))
        expect(hudStat('Question')).toBe('2/4')
        await submit(user, answer())
        expect(screen.getByText('🔥 1')).toBeInTheDocument()
        for (let index = 0; index < 2; index += 1) await submit(user, answer())
        expect(screen.getByText(/accuracy:/i)).toBeInTheDocument()
        await user.click(screen.getAllByRole('button', { name: /back to map/i }).at(-1)!)
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
    })

    it('shows strategy only when enabled', async () => {
        const today = localEpochDay(Date.now(), new Date().getTimezoneOffset())
        seedStars({ t3: 1 })
        seedFactProgress({ [canonicalKey(3, 1)]: { box: 1, lastDay: today, last3: [] } })
        ttStore.saveTTSettings({ strategyCards: false })
        const user = userEvent.setup({ delay: null })
        const off = renderWithRouter(<DailyPhase />)
        expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument()
        off.unmount()
        ttStore.saveTTSettings({ strategyCards: true })
        renderWithRouter(<DailyPhase />)
        await user.click(screen.getByRole('button', { name: /help/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'OK' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
})
