import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QUESTIONS_PER_DUEL } from '../game'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedOperations, seedPlayer, seedRank } from '../test/utils'
import DuelPlayPage from './DuelPlayPage'

const open = (mode: 'together' | 'versus') =>
    renderWithRouter(<DuelPlayPage />, { route: `/game/two/play?mode=${mode}&one=Nova&two=Kim` })

const answerOf = (): string => {
    const prompt = document.querySelector('.equation__prompt')?.textContent ?? ''
    const match = /^(\d+) \+ (\d+) = \?$/.exec(prompt)
    if (!match) throw new Error(`Expected a rookie addition prompt, received ${prompt}`)
    return String(Number(match[1]) + Number(match[2]))
}

/** How long a right answer is applauded before the round moves itself on. */
const CORRECT_MS = 650

/** Answers the question on screen, right or wrong on request. */
const answer = (correctly: boolean): void => {
    const wanted = answerOf()
    const tiles = [...document.querySelectorAll('.answer-tile')] as HTMLButtonElement[]
    const correct = tiles.findIndex(tile => tile.querySelector('.answer-tile__value')?.textContent === wanted)
    const pick = correctly ? correct : tiles.findIndex((_tile, at) => at !== correct)
    fireEvent.click(tiles[pick === -1 ? 0 : pick])
}

/** Plays the whole round; `right` decides each answer, so a winner can be arranged. */
const playRound = (right: (index: number) => boolean): void => {
    for (let index = 0; index < QUESTIONS_PER_DUEL; index += 1) {
        const ready = screen.queryByRole('button', { name: 'Ready' })
        if (ready === null) break
        fireEvent.click(ready)

        const wanted = answerOf()
        const tiles = [...document.querySelectorAll('.answer-tile')] as HTMLButtonElement[]
        const correct = tiles.findIndex(tile => tile.querySelector('.answer-tile__value')?.textContent === wanted)
        const pick = right(index) ? correct : tiles.findIndex((_tile, at) => at !== correct)
        fireEvent.click(tiles[pick === -1 ? 0 : pick])

        // A miss waits for a tap; a right answer applauds and moves on by itself.
        const next = screen.queryByRole('button', { name: 'Got it' })
        if (next !== null) fireEvent.click(next)
        else act(() => { vi.advanceTimersByTime(CORRECT_MS) })
    }
}

describe('DuelPlayPage', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        seedLanguage('en')
        seedOperations(['addition'])
        seedRank('rookie')
        seedPlayer()
    })
    afterEach(() => vi.useRealTimers())

    it('opens by naming whose turn it is, before showing any answers', () => {
        open('together')

        expect(screen.getByText(/Your turn, Nova/)).toBeInTheDocument()
        expect(document.querySelectorAll('.answer-tile')).toHaveLength(0)
    })

    it('asks for the device to be passed over between every question', () => {
        open('together')

        fireEvent.click(screen.getByRole('button', { name: 'Ready' }))
        expect(document.querySelectorAll('.answer-tile')).toHaveLength(4)

        answer(true)
        act(() => { vi.advanceTimersByTime(CORRECT_MS) })

        // Without this pause the quicker child simply answers both turns.
        expect(screen.getByText(/Your turn, Kim/)).toBeInTheDocument()
    })

    it('keeps the answering child\u2019s name above their own result', () => {
        open('together')

        fireEvent.click(screen.getByRole('button', { name: 'Ready' }))
        answer(false)

        // The turn moves the instant an answer lands, so this reads Kim without care.
        expect(screen.getByText(/Nova\u2019s turn/)).toBeInTheDocument()
    })

    it('reports one shared result and no winner when playing together', () => {
        open('together')
        playRound(index => index % 2 === 0)

        expect(screen.getByText('Done together')).toBeInTheDocument()
        expect(screen.queryByText(/won!/)).not.toBeInTheDocument()
    })

    it('names a winner when playing head to head', () => {
        open('versus')
        playRound(index => index % 2 === 0)

        expect(screen.getByText(/Nova won!/)).toBeInTheDocument()
    })

    it('calls a level round a draw rather than picking somebody', () => {
        open('versus')
        playRound(() => true)

        expect(screen.getByText(/A draw/)).toBeInTheDocument()
    })

    it('repeats on the result screen that nothing was recorded', () => {
        open('together')
        playRound(() => true)

        expect(screen.getByText(/is not saved/)).toBeInTheDocument()
    })

    it('does not ask a child to confirm they understood being right', () => {
        open('together')
        fireEvent.click(screen.getByRole('button', { name: 'Ready' }))

        answer(true)

        expect(screen.getByText('Correct!')).toBeInTheDocument()
        // There is no working on screen to have read, so there is nothing to confirm.
        expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument()

        act(() => { vi.advanceTimersByTime(CORRECT_MS) })
        expect(screen.getByText(/Your turn, Kim/)).toBeInTheDocument()
    })

    it('says what went wrong in words, not only in colour', () => {
        open('together')
        fireEvent.click(screen.getByRole('button', { name: 'Ready' }))
        const wanted = answerOf()

        answer(false)

        expect(screen.getByText(new RegExp(`The answer was ${wanted}`))).toBeInTheDocument()
        // A miss has a route to read, so this one does wait for a tap.
        expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
    })

    it('does not have the scoreboard and the card disagree about whose go it is', () => {
        open('together')
        fireEvent.click(screen.getByRole('button', { name: 'Ready' }))

        answer(false)

        const named = screen.getByText(/’s turn/).textContent ?? ''
        const lit = document.querySelector('.hud__stat--score')?.textContent ?? ''
        expect(named).toContain('Nova')
        expect(lit).toContain('Nova')
    })

    it('falls back to together when the address carries no usable shape', () => {
        renderWithRouter(<DuelPlayPage />, { route: '/game/two/play?mode=nonsense' })

        expect(screen.getByText(/Your turn, Child 1/)).toBeInTheDocument()
    })

    it('starts a fresh round in place rather than reloading', () => {
        open('together')
        playRound(() => true)

        fireEvent.click(screen.getByRole('button', { name: 'Again' }))

        expect(screen.getByText(/Your turn, Nova/)).toBeInTheDocument()
        expect(screen.queryByText('Done together')).not.toBeInTheDocument()
    })

    it('leaves the round for the arcade when asked', () => {
        open('together')
        playRound(() => true)

        fireEvent.click(screen.getByRole('button', { name: 'Back' }))

        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/game')
    })
})
