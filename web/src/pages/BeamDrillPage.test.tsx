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

const usingBeam = (): boolean => screen.queryByRole('slider') !== null

function answerCorrectly(): void {
    const answer = answerForPrompt()
    if (usingBeam()) {
        fireEvent.change(screen.getByRole('slider'), { target: { value: String(answer) } })
        fireEvent.click(screen.getByRole('button', { name: /Land on/ }))
        return
    }
    fireEvent.click(screen.getByRole('button', { name: String(answer) }))
}

function answerWrongly(): void {
    const answer = String(answerForPrompt())
    if (usingBeam()) {
        const slider = screen.getByRole('slider') as HTMLInputElement
        const wrong = Number(answer) === 0 ? Number(slider.step) : 0
        fireEvent.change(slider, { target: { value: String(wrong) } })
        fireEvent.click(screen.getByRole('button', { name: /Land on/ }))
        return
    }
    const wrong = screen.getAllByRole('button', { name: /^\d+$/ })
        .find(button => button.getAttribute('aria-label') !== answer)
    if (wrong === undefined) throw new Error('Expected a distractor tile')
    fireEvent.click(wrong)
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

    it('opens on the first question with the bar picture and four tiles', () => {
        renderDrill('double')
        expect(screen.getByText('Question 1/10')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: /Bar picture/ })).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: /^\d+$/ })).toHaveLength(4)
        expect(screen.getByText('Tier 1')).toBeInTheDocument()
    })

    it('scores a right answer and moves on to the next question', () => {
        renderDrill('double')
        answerCorrectly()
        expect(screen.getByText('Correct!')).toBeInTheDocument()

        act(() => vi.advanceTimersByTime(CORRECT_MS))
        expect(screen.getByText('Question 2/10')).toBeInTheDocument()
        expect(screen.getByText(/Streak 1/)).toBeInTheDocument()
    })

    it('answers the second question by sliding the alien along the beam', () => {
        renderDrill('double')
        answerCorrectly()
        act(() => vi.advanceTimersByTime(CORRECT_MS))

        expect(screen.getByRole('slider', { name: 'Move the alien along the beam' })).toBeInTheDocument()
        answerCorrectly()
        expect(screen.getByText('Correct!')).toBeInTheDocument()
    })

    it('reveals the working and the numbers behind the bar after a miss', () => {
        renderDrill('halve')
        expect(screen.getAllByText('?').length).toBeGreaterThan(0)

        answerWrongly()
        expect(screen.getByText(/Missed! The answer was/)).toBeInTheDocument()
        expect(screen.getByRole('img', { name: /Bar picture: \d+ = \d+ · \d+ = \d+ \+ \d+/ })).toBeInTheDocument()
        expect(screen.getByText(/Streak 0/)).toBeInTheDocument()
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
        expect(screen.getByText('Question 1/10')).toBeInTheDocument()
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
        expect(screen.queryByText('Question 1/10')).not.toBeInTheDocument()
    })

    it('turns away a station whose zone is still locked', () => {
        renderDrill('split')
        expect(screen.queryByText('Question 1/10')).not.toBeInTheDocument()
    })

    it('lets a bond and a split drill be played once their zones are open', () => {
        seedBeamStars({ double: 1, halve: 1, quarter: 1, fractionOf: 1 })
        renderDrill('bond')
        answerCorrectly()
        expect(screen.getByText('Correct!')).toBeInTheDocument()
    })
})
