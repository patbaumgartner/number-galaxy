import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BeamDrillPage from './BeamDrillPage'
import { beamStore } from '../beam'
import {
    LOCATION_TEST_ID,
    renderWithRouter,
    seedBeamSettings,
    seedBeamStars,
    seedLanguage,
    hudStat,
} from '../test/utils'

const CORRECT_MS = 700
const WRONG_MS = 2400

const renderDrill = (skill: string) =>
    renderWithRouter(<BeamDrillPage />, {
        route: `/number-beam/drill/${skill}`,
        path: '/number-beam/drill/:skill',
    })

const prompt = (): string =>
    screen.getByText(/= \?|\? \+/, { selector: '.equation__prompt' }).textContent ?? ''

/**
 * Prompts are generated, so the expected answer is computed from whatever is on
 * screen rather than assumed — the four shapes below are every prompt a
 * doubling, halving, bond or split station can produce.
 */
function answerForPrompt(): number {
    const text = prompt()
    const times = text.match(/^(\d+) × (\d+) = \?$/)
    if (times !== null) return Number(times[1]) * Number(times[2])
    const divide = text.match(/^(\d+) ÷ (\d+) = \?$/)
    if (divide !== null) return Number(divide[1]) / Number(divide[2])
    const bond = text.match(/^\? \+ (\d+) = (\d+)$/)
    if (bond !== null) return Number(bond[2]) - Number(bond[1])
    const split = text.match(/^(\d+) = (?:\? \+ (\d+)|(\d+) \+ \?)$/)
    if (split !== null) return Number(split[1]) - Number(split[2] ?? split[3])
    throw new Error(`Unsupported beam prompt: ${text}`)
}

function land(on: number): void {
    fireEvent.change(screen.getByRole('slider'), { target: { value: String(on) } })
    fireEvent.click(screen.getByRole('button', { name: /Land on/ }))
}

const answerCorrectly = (): void => land(answerForPrompt())

function answerWrongly(): void {
    const slider = screen.getByRole('slider') as HTMLInputElement
    const answer = answerForPrompt()
    land(answer === 0 ? Number(slider.step) : 0)
}

const playThrough = (outcome: (index: number) => boolean): void => {
    for (let index = 0; index < 10; index += 1) {
        if (outcome(index)) answerCorrectly()
        else answerWrongly()
        if (index < 9) act(() => vi.advanceTimersByTime(WRONG_MS))
    }
}

describe('BeamDrillPage', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        seedLanguage('en')
    })
    afterEach(() => vi.useRealTimers())

    it('opens on the first question with the bar picture and the beam', () => {
        renderDrill('double')
        expect(hudStat('Question')).toBe('1/10')
        expect(screen.getByRole('img', { name: /Bar picture/ })).toBeInTheDocument()
        expect(screen.getByRole('slider', { name: 'Move the alien along the beam' })).toBeInTheDocument()
        expect(screen.getByText('Tier 1')).toBeInTheDocument()
    })

    it('answers every question of a whole drill on the beam, never on tiles', () => {
        renderDrill('halve')
        for (let index = 0; index < 10; index += 1) {
            expect(screen.getByRole('slider')).toBeInTheDocument()
            // The arcade's tile grid must never appear here; the beam is the only input.
            expect(document.querySelector('.answer-grid')).toBeNull()
            answerCorrectly()
            if (index < 9) act(() => vi.advanceTimersByTime(WRONG_MS))
        }
        expect(screen.getByRole('dialog', { name: 'Station complete!' })).toBeInTheDocument()
    })

    it('scores a right answer and moves on to the next question', () => {
        renderDrill('double')
        answerCorrectly()
        expect(screen.getByText('Correct!')).toBeInTheDocument()

        act(() => vi.advanceTimersByTime(CORRECT_MS))
        expect(hudStat('Question')).toBe('2/10')
        expect(hudStat('Streak')).toContain('1')
    })

    it('always offers a beam stop exactly on the answer', () => {
        seedBeamStars({ double: 1, halve: 1, quarter: 1, fractionOf: 1 })
        renderDrill('tenTimes')
        const slider = screen.getByRole('slider') as HTMLInputElement
        expect(answerForPrompt() % Number(slider.step)).toBe(0)
        expect(Number(slider.max)).toBeGreaterThan(answerForPrompt())
    })

    it('reveals the working and the numbers behind the bar after a miss', () => {
        renderDrill('halve')
        expect(screen.getAllByText('?').length).toBeGreaterThan(0)

        answerWrongly()
        expect(screen.getByText(/Missed! The answer was/)).toBeInTheDocument()
        expect(screen.getByRole('img', { name: /Bar picture: \d+ = \d+ · \d+ = \d+ \+ \d+/ })).toBeInTheDocument()
        expect(hudStat('Streak')).toContain('0')
    })

    it('keeps the bar hidden until a miss when the player switched it off', () => {
        seedBeamSettings(false)
        renderDrill('double')
        expect(screen.queryByRole('img', { name: /Bar picture/ })).not.toBeInTheDocument()

        answerWrongly()
        expect(screen.getByRole('img', { name: /Bar picture/ })).toBeInTheDocument()
    })

    it('awards a star, stores it and offers another run when the drill goes well', () => {
        renderDrill('double')
        playThrough(() => true)

        expect(screen.getByRole('dialog', { name: 'Station complete!' })).toBeInTheDocument()
        expect(screen.getByLabelText('1 stars')).toBeInTheDocument()
        expect(screen.getByText(/10\/10 \(100%\)/)).toBeInTheDocument()
        expect(beamStore.getStars().double).toBe(1)
        expect(beamStore.getBests().double).toBe(1)

        fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
        expect(hudStat('Question')).toBe('1/10')
    })

    it('withholds the star and says so when the run was not good enough', () => {
        renderDrill('double')
        playThrough(index => index < 5)

        expect(screen.getByText('Keep practising for a star.')).toBeInTheDocument()
        expect(beamStore.getStars().double ?? 0).toBe(0)
    })

    it('raises the tier once a star has been earned', () => {
        seedBeamStars({ double: 2 })
        renderDrill('double')
        expect(screen.getByText('Tier 3')).toBeInTheDocument()
    })

    it('shows a worked example on demand and closes it again', () => {
        renderDrill('halve')
        fireEvent.click(screen.getByRole('button', { name: /help/i }))

        const dialog = screen.getByRole('dialog', { name: /how to work it out/i })
        expect(dialog).toHaveTextContent('14 ÷ 2 = ?')
        expect(dialog).toHaveTextContent('7 + 7 = 14')

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('leaves for the map from the summary', () => {
        renderDrill('double')
        playThrough(() => true)
        fireEvent.click(screen.getByRole('button', { name: 'Back to map' }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-beam')
    })

    it('turns away a station that does not exist', () => {
        renderDrill('nonsense')
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/number-beam')
        expect(screen.queryByText('Question')).not.toBeInTheDocument()
    })

    it('turns away a station whose zone is still locked', () => {
        renderDrill('split')
        expect(screen.queryByText('Question')).not.toBeInTheDocument()
    })

    it('lets a bond and a split drill be played once their zones are open', () => {
        seedBeamStars({ double: 1, halve: 1, quarter: 1, fractionOf: 1 })
        renderDrill('bond')
        answerCorrectly()
        expect(screen.getByText('Correct!')).toBeInTheDocument()
    })

    it('offers another surprise instead of a replay when the picker chose this station', () => {
        renderWithRouter(<BeamDrillPage />, {
            route: '/number-beam/drill/double?surprise=1',
            path: '/number-beam/drill/:skill',
        })
        playThrough(() => true)

        expect(screen.getByRole('button', { name: 'Another surprise' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Play again' })).not.toBeInTheDocument()
    })

    it('leaves a chosen run with its own replay actions', () => {
        renderDrill('double')
        playThrough(() => true)

        expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Another surprise' })).not.toBeInTheDocument()
    })
})
