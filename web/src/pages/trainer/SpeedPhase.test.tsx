import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ttStore } from '../../timesTable/ttStore'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedStars } from '../../test/utils'
import { SpeedPhase } from './SpeedPhase'

const answer = (): number => {
    const prompt = screen.getByText(/× .* = \?/).textContent ?? ''
    const values = prompt.match(/(\d+) × (\d+)/)
    if (!values) throw new Error(`Expected multiplication prompt, received ${prompt}`)
    return Number(values[1]) * Number(values[2])
}

const submit = (value: number) => {
    for (const digit of String(value)) fireEvent.click(screen.getByRole('button', { name: digit }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
}

describe('SpeedPhase', () => {
    let now = 0

    beforeEach(() => {
        vi.useFakeTimers()
        seedLanguage('en')
        vi.spyOn(Math, 'random').mockReturnValue(0)
        vi.spyOn(performance, 'now').mockImplementation(() => now)
    })
    afterEach(() => vi.useRealTimers())

    it('redirects a starless planet to practice before allowing a run', () => {
        renderWithRouter(<SpeedPhase planetId="t3" />)
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables/train/t3/practice')
    })

    it('counts down into a timed run, persists answers, shakes wrong answers, and saves fast mastery', async () => {
        seedStars({ t3: 1 })
        const { container } = renderWithRouter(<SpeedPhase planetId="t3" />)
        expect(screen.getByText('3')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(1000))
        act(() => vi.advanceTimersByTime(1000))
        act(() => vi.advanceTimersByTime(1000))
        act(() => vi.advanceTimersByTime(1))
        expect(screen.getByText('00:00.0')).toBeInTheDocument()
        expect(screen.getByText(/1 \/ 12/)).toBeInTheDocument()
        submit(999)
        expect(container.querySelector('.question-display')).toHaveClass('shake')
        expect(Object.keys(ttStore.getProgress())).not.toHaveLength(0)
        for (let index = 1; index < 12; index += 1) {
            now += 100
            submit(answer())
        }
        expect(screen.getByText(/accuracy: 92%/i)).toBeInTheDocument()
        expect(ttStore.getStars().t3).toBe(2)
        expect(ttStore.getBests().t3).toBeDefined()
    })

    it('does not create a best or extra star below ninety percent and exits to the map', async () => {
        seedStars({ t3: 1 })
        renderWithRouter(<SpeedPhase planetId="t3" />)
        act(() => vi.advanceTimersByTime(1000))
        act(() => vi.advanceTimersByTime(1000))
        act(() => vi.advanceTimersByTime(1000))
        act(() => vi.advanceTimersByTime(1))
        for (let index = 0; index < 12; index += 1) submit(999)
        expect(ttStore.getStars().t3).toBe(1)
        expect(ttStore.getBests().t3).toBeUndefined()
        fireEvent.click(screen.getAllByRole('button', { name: /back to map/i }).at(-1)!)
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
    })
})
