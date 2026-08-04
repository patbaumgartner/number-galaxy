import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { QUESTIONS_PER_DUEL } from '../game'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedOperations, seedPlayer, seedRank, userEvent } from '../test/utils'
import DuelPlayPage from './DuelPlayPage'

const open = (mode: 'together' | 'versus') =>
    renderWithRouter(<DuelPlayPage />, { route: `/game/two/play?mode=${mode}&one=Nova&two=Kim` })

const answerOf = (): string => {
    const prompt = document.querySelector('.equation__prompt')?.textContent ?? ''
    const match = /^(\d+) \+ (\d+) = \?$/.exec(prompt)
    if (!match) throw new Error(`Expected a rookie addition prompt, received ${prompt}`)
    return String(Number(match[1]) + Number(match[2]))
}

/** Plays the whole round; `right` decides each answer, so a winner can be arranged. */
const playRound = async (user: ReturnType<typeof userEvent.setup>, right: (index: number) => boolean) => {
    for (let index = 0; index < QUESTIONS_PER_DUEL; index += 1) {
        const ready = screen.queryByRole('button', { name: 'Ready' })
        if (ready === null) break
        await user.click(ready)

        const wanted = answerOf()
        const tiles = [...document.querySelectorAll('.answer-tile')] as HTMLButtonElement[]
        const correct = tiles.findIndex(tile => tile.querySelector('.answer-tile__value')?.textContent === wanted)
        const pick = right(index) ? correct : tiles.findIndex((_tile, at) => at !== correct)
        await user.click(tiles[pick === -1 ? 0 : pick])

        const next = screen.queryByRole('button', { name: 'Got it' })
        if (next !== null) await user.click(next)
    }
}

describe('DuelPlayPage', () => {
    beforeEach(() => {
        seedLanguage('en')
        seedOperations(['addition'])
        seedRank('rookie')
        seedPlayer()
    })

    it('opens by naming whose turn it is, before showing any answers', () => {
        open('together')

        expect(screen.getByText(/Your turn, Nova/)).toBeInTheDocument()
        expect(document.querySelectorAll('.answer-tile')).toHaveLength(0)
    })

    it('asks for the device to be passed over between every question', async () => {
        const user = userEvent.setup({ delay: null })
        open('together')

        await user.click(screen.getByRole('button', { name: 'Ready' }))
        expect(document.querySelectorAll('.answer-tile')).toHaveLength(4)

        await user.click(document.querySelectorAll('.answer-tile')[0] as HTMLElement)
        await user.click(screen.getByRole('button', { name: 'Got it' }))

        // Without this pause the quicker child simply answers both turns.
        expect(screen.getByText(/Your turn, Kim/)).toBeInTheDocument()
    })

    it('keeps the answering child\u2019s name above their own result', async () => {
        const user = userEvent.setup({ delay: null })
        open('together')

        await user.click(screen.getByRole('button', { name: 'Ready' }))
        await user.click(document.querySelectorAll('.answer-tile')[0] as HTMLElement)

        // The turn moves the instant an answer lands, so this reads Kim without care.
        expect(screen.getByText(/Nova\u2019s turn/)).toBeInTheDocument()
    })

    it('reports one shared result and no winner when playing together', async () => {
        const user = userEvent.setup({ delay: null })
        open('together')
        await playRound(user, index => index % 2 === 0)

        expect(screen.getByText('Done together')).toBeInTheDocument()
        expect(screen.queryByText(/won!/)).not.toBeInTheDocument()
    })

    it('names a winner when playing head to head', async () => {
        const user = userEvent.setup({ delay: null })
        open('versus')
        await playRound(user, index => index % 2 === 0)

        expect(screen.getByText(/Nova won!/)).toBeInTheDocument()
    })

    it('calls a level round a draw rather than picking somebody', async () => {
        const user = userEvent.setup({ delay: null })
        open('versus')
        await playRound(user, () => true)

        expect(screen.getByText(/A draw/)).toBeInTheDocument()
    })

    it('repeats on the result screen that nothing was recorded', async () => {
        const user = userEvent.setup({ delay: null })
        open('together')
        await playRound(user, () => true)

        expect(screen.getByText(/is not saved/)).toBeInTheDocument()
    })

    it('falls back to together when the address carries no usable shape', () => {
        renderWithRouter(<DuelPlayPage />, { route: '/game/two/play?mode=nonsense' })

        expect(screen.getByText(/Your turn, Child 1/)).toBeInTheDocument()
    })

    it('starts a fresh round in place rather than reloading', async () => {
        const user = userEvent.setup({ delay: null })
        open('together')
        await playRound(user, () => true)

        await user.click(screen.getByRole('button', { name: 'Again' }))

        expect(screen.getByText(/Your turn, Nova/)).toBeInTheDocument()
        expect(screen.queryByText('Done together')).not.toBeInTheDocument()
    })

    it('leaves the round for the arcade when asked', async () => {
        const user = userEvent.setup({ delay: null })
        open('together')
        await playRound(user, () => true)

        await user.click(screen.getByRole('button', { name: 'Back' }))

        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/game')
    })
})
