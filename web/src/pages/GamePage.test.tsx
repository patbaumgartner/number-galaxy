import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { store } from '../store'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedOperations, seedPlayer, seedRank, seedSettings } from '../test/utils'
import GamePage from './GamePage'

const answerForPrompt = (): string => {
    const text = screen.getByText(/= \?$/, { selector: '.equation__prompt' }).textContent ?? ''
    const match = text.match(/^(\d+) \+ (\d+) = \?$/)
    if (!match) throw new Error(`Expected rookie addition prompt, received ${text}`)
    return String(Number(match[1]) + Number(match[2]))
}

const QUESTIONS = 25

/**
 * The answer to whichever addition form is on screen. Ranks above rookie also
 * ask for a missing addend, which the rookie-only helper above cannot read.
 */
const anyAdditionAnswer = (): string => {
    const text = document.querySelector('.equation__prompt')?.textContent ?? ''
    const plain = text.match(/^(\d+) \+ (\d+) = \?$/)
    if (plain) return String(Number(plain[1]) + Number(plain[2]))
    const missing = text.match(/^(\d+) \+ \? = (\d+)$/)
    if (missing) return String(Number(missing[2]) - Number(missing[1]))
    const leading = text.match(/^\? \+ (\d+) = (\d+)$/)
    if (leading) return String(Number(leading[2]) - Number(leading[1]))
    throw new Error(`Unexpected addition prompt: ${text}`)
}

/** Taps a distractor, then clears the miss, which waits on a tap rather than a clock. */
const answerWrongly = (): void => {
    const answer = anyAdditionAnswer()
    const wrong = screen.getAllByRole('button', { name: /^\d+$/ })
        .find(tile => tile.getAttribute('aria-label') !== answer)
    if (!wrong) throw new Error('Expected a distractor')
    fireEvent.click(wrong)
    const gotIt = screen.queryByRole('button', { name: 'Got it' })
    // The final miss goes straight to the summary with nothing left to read.
    if (gotIt !== null) fireEvent.click(gotIt)
}

const answerCorrectly = () => {
    const answer = answerForPrompt()
    // An owned fact is typed on the pad rather than picked from four tiles.
    const pad = screen.queryByRole('button', { name: 'Submit' })
    if (pad === null) {
        fireEvent.click(screen.getByRole('button', { name: answer }))
        return
    }
    for (const digit of answer) fireEvent.click(screen.getByRole('button', { name: digit }))
    fireEvent.click(pad)
}

describe('GamePage', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        // The self-report is a coin flip; pin it away unless a test wants it.
        vi.spyOn(Math, 'random').mockReturnValue(1)
        seedLanguage('en')
        seedOperations(['addition'])
        seedRank('rookie')
        seedPlayer()
    })
    afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

    it('renders the HUD, simple prompt, and four answer tiles', () => {
        renderWithRouter(<GamePage />)
        expect(screen.getByText('Score')).toBeInTheDocument()
        expect(screen.getByText('Combo')).toBeInTheDocument()
        expect(screen.getByText(/Question/)).toBeInTheDocument()
        expect(screen.getByText(/= \?$/)).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: /^\d+$/ })).toHaveLength(4)
    })

    it('scores a right answer, advances after feedback, and grows the combo', async () => {
        renderWithRouter(<GamePage />)
        answerCorrectly()
        expect(screen.getByText(/Correct! \+10/)).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(650))
        expect(screen.getByText('1/25')).toBeInTheDocument()
        answerCorrectly()
        act(() => vi.advanceTimersByTime(650))
        answerCorrectly()
        expect(screen.getByText('×2')).toBeInTheDocument()
    })

    it('reveals worked answers after a wrong tap without ending the mission', async () => {
        renderWithRouter(<GamePage />)
        const answer = answerForPrompt()
        const wrong = screen.getAllByRole('button', { name: /^\d+$/ }).find(button => button.getAttribute('aria-label') !== answer)
        if (!wrong) throw new Error('Expected a distractor')
        fireEvent.click(wrong)
        expect(screen.getByText(/Missed! The answer was/)).toBeInTheDocument()
        expect(screen.getByText(/= \d+$/)).toBeInTheDocument()
        expect(screen.getByText('×1')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(2000))
        expect(screen.getByText('1/25')).toBeInTheDocument()
    })

    it('records a timeout, hides help when hints are disabled, and stops showing workings after misses', () => {
        seedSettings({ timer: 'timed', hints: false })
        renderWithRouter(<GamePage />)
        expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument()
        for (let index = 0; index < 20; index += 1) act(() => vi.advanceTimersByTime(1000))
        expect(screen.getByText(/Time’s up! The answer was/)).toBeInTheDocument()
        expect(screen.queryByText(/\d+ \+ \d+ = \d+$/)).not.toBeInTheDocument()
    })

    it('pauses a timed mission while help is open and closes the worked example', async () => {
        seedSettings({ timer: 'timed' })
        renderWithRouter(<GamePage />)
        fireEvent.click(screen.getByRole('button', { name: /help/i }))
        expect(screen.getByRole('dialog', { name: /how to work it out/i })).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(25_000))
        expect(screen.queryByText(/Time’s up!/)).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('quits early and completes all twenty-five answers with a submitted score and replay reset', async () => {
        const view = renderWithRouter(<GamePage />)
        fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
        expect(screen.getByRole('dialog', { name: /mission complete/i })).toBeInTheDocument()
        expect(store.getScores()).toEqual([])
        view.unmount()

        renderWithRouter(<GamePage />)
        for (let index = 0; index < 25; index += 1) {
            answerCorrectly()
            if (index < 24) act(() => vi.advanceTimersByTime(650))
        }
        expect(screen.getByRole('dialog', { name: /perfect/i })).toBeInTheDocument()
        expect(screen.getByLabelText('3/3')).toBeInTheDocument()
        expect(store.getScores()).toHaveLength(1)
        fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
        expect(screen.getByText('0/25')).toBeInTheDocument()
    })

    it('asks for an owned fact to be typed rather than picked from four tiles', () => {
        renderWithRouter(<GamePage />)
        expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
        cleanup()

        // Every addition fact Rookie can write, marked as owned.
        for (let a = 2; a <= 8; a += 1) {
            for (let b = a; a + b <= 10; b += 1) {
                for (let round = 0; round < 4; round += 1) store.recordFact(`addition:${a}:${b}`, true, 900)
            }
        }

        renderWithRouter(<GamePage />)
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
        expect(screen.queryByRole('group', { name: /pick an answer/i })).not.toBeInTheDocument()
    })

    it('asks how an answer was worked out, now and then, without ever blocking', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0)
        renderWithRouter(<GamePage />)
        answerCorrectly()

        expect(screen.getByText('How did you do that?')).toBeInTheDocument()
        // The fast loop is untouched: unanswered, it times out and moves on.
        act(() => vi.advanceTimersByTime(650))
        expect(screen.getByText('How did you do that?')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(3000))
        expect(screen.queryByText('How did you do that?')).not.toBeInTheDocument()
        expect(screen.getByText('1/25')).toBeInTheDocument()
    })

    it('records how it was worked out and carries straight on', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0)
        renderWithRouter(<GamePage />)
        answerCorrectly()

        fireEvent.click(screen.getByRole('button', { name: /I counted/ }))
        expect(store.getStrategyMix().addition?.counted).toBe(1)
        expect(screen.queryByText('How did you do that?')).not.toBeInTheDocument()
        expect(screen.getByText('1/25')).toBeInTheDocument()
    })

    it('navigates from summary actions and the back button', async () => {
        renderWithRouter(<GamePage />)
        fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
        fireEvent.click(screen.getByRole('button', { name: 'Change mission' }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
        fireEvent.click(screen.getByRole('button', { name: 'Best scores' }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/hall-of-fame')
        fireEvent.click(screen.getByRole('button', { name: /home/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/')
    })

    it('offers smaller numbers after a poor run, and actually drops the rank', () => {
        // Stories off keeps the numbers on screen instead of behind a "?".
        seedSettings({ rank: 'cadet', stories: false })
        renderWithRouter(<GamePage />)

        // Missing every question lands under one star, which is what offers the
        // step down instead of a bruising zero-star verdict.
        for (let index = 0; index < QUESTIONS; index += 1) answerWrongly()

        fireEvent.click(screen.getByRole('button', { name: 'Smaller numbers' }))
        expect(store.getSettings().rank).toBe('rookie')
    })

    it('keeps the rules a tap away inside the mission', () => {
        renderWithRouter(<GamePage />)

        fireEvent.click(screen.getByRole('button', { name: /How to play/ }))
        expect(screen.getByRole('dialog', { name: /How to play: Math Invaders/ })).toBeInTheDocument()
    })
})
