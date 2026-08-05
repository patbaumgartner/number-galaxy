import { describe, expect, it } from 'vitest'
import {
    QUESTIONS_PER_DUEL,
    advanceDuel,
    answerDuel,
    createDuel,
    duelCombined,
    duelOver,
    duelWinner,
    turnOf,
    type DuelMode,
    type DuelState,
} from './duel'
import { createRng } from './rng'

const players = [
    { name: 'Nova', avatarId: '🚀' },
    { name: 'Kim', avatarId: '👾' },
] as const

const start = (mode: DuelMode = 'together'): DuelState => createDuel({
    mode,
    players,
    language: 'en',
    rank: 'rookie',
    timed: false,
    operations: ['addition'],
    rng: createRng(7),
})

/** Plays a whole round, with `hits` deciding the outcome of each question. */
const play = (state: DuelState, hits: (index: number) => boolean): DuelState => {
    let current = state
    for (let index = 0; index < QUESTIONS_PER_DUEL; index += 1) {
        current = answerDuel(current, hits(index) ? 'correct' : 'wrong', createRng(index + 1))
        if (!duelOver(current)) current = advanceDuel(current, createRng(index + 1))
    }
    return current
}

describe('a two-player round', () => {
    it('gives each player exactly half the questions', () => {
        const done = play(start(), () => true)

        expect(done.tallies[0].answered).toBe(QUESTIONS_PER_DUEL / 2)
        expect(done.tallies[1].answered).toBe(QUESTIONS_PER_DUEL / 2)
        expect(QUESTIONS_PER_DUEL % 2).toBe(0)
    })

    it('alternates strictly, so neither can take two turns running', () => {
        let state = start()
        const order: number[] = []
        for (let index = 0; index < 6; index += 1) {
            order.push(turnOf(state))
            state = answerDuel(state, 'correct', createRng(index + 1))
            state = advanceDuel(state, createRng(index + 1))
        }
        expect(order).toEqual([0, 1, 0, 1, 0, 1])
    })

    it('books a right answer to whoever actually gave it', () => {
        let state = start()
        state = answerDuel(state, 'correct', createRng(1))
        state = advanceDuel(state, createRng(1))
        state = answerDuel(state, 'wrong', createRng(2))

        expect(state.tallies[0]).toEqual({ answered: 1, correct: 1 })
        expect(state.tallies[1]).toEqual({ answered: 1, correct: 0 })
    })

    it('ends after its own number of questions rather than a solo mission\u2019s', () => {
        const done = play(start(), () => true)

        expect(duelOver(done)).toBe(true)
        expect(done.mission.results).toHaveLength(QUESTIONS_PER_DUEL)
        expect(QUESTIONS_PER_DUEL).toBeLessThan(25)
    })

    it('books each child only their own answers, whatever the other one does', () => {
        // Player 0 answers everything right, player 1 everything wrong.
        const done = play(start(), index => index % 2 === 0)

        expect(done.tallies[0]).toEqual({ answered: QUESTIONS_PER_DUEL / 2, correct: QUESTIONS_PER_DUEL / 2 })
        expect(done.tallies[1]).toEqual({ answered: QUESTIONS_PER_DUEL / 2, correct: 0 })
    })
})

describe('playing together', () => {
    it('never names a winner, whoever answered better', () => {
        const done = play(start('together'), index => index % 2 === 0)

        expect(duelWinner(done)).toBeNull()
    })

    it('adds the two up into one result that belongs to both', () => {
        const done = play(start('together'), () => true)
        const shared = duelCombined(done)

        expect(shared.answered).toBe(QUESTIONS_PER_DUEL)
        expect(shared.correct).toBe(QUESTIONS_PER_DUEL)
        expect(shared.correct).toBe(done.tallies[0].correct + done.tallies[1].correct)
    })
})

describe('playing head to head', () => {
    it('names whoever got more right', () => {
        const done = play(start('versus'), index => index % 2 === 0)

        expect(done.tallies[0].correct).toBeGreaterThan(done.tallies[1].correct)
        expect(duelWinner(done)).toBe(0)
    })

    it('names the other one when the other one scores more', () => {
        const done = play(start('versus'), index => index % 2 === 1)

        expect(duelWinner(done)).toBe(1)
    })

    it('calls a draw nobody rather than picking one', () => {
        const done = play(start('versus'), () => true)

        expect(done.tallies[0].correct).toBe(done.tallies[1].correct)
        expect(duelWinner(done)).toBeNull()
    })

    it('never crowns the child holding the smaller number', () => {
        // A long run used to be worth more than a bigger total: five straight
        // beat six with a miss in the middle, 80 points to 60, while the screen
        // showed 5 against 6. Runs earn nothing now, so the totals decide.
        // Player 0 answers on the even questions, player 1 on the odd ones.
        const runsOfFive = [0, 2, 4, 6, 8]              // five straight, then three misses
        const sixNeverThree = [1, 3, 7, 9, 13, 15]      // six right, never three running
        const streaky = play(start('versus'), index =>
            runsOfFive.includes(index) || sixNeverThree.includes(index))
        const [runner, scatterer] = streaky.tallies

        expect(scatterer.correct).toBeGreaterThan(runner.correct)
        expect(duelWinner(streaky)).toBe(1)
    })

    it('does not reward going first', () => {
        // A shared combo multiplier once put these two on different rungs of the
        // same ladder: identical play finished 250 to 230 on turn order alone.
        const done = play(start('versus'), () => true)

        expect(done.tallies[0]).toEqual(done.tallies[1])
    })
})

describe('what a round leaves behind', () => {
    it('carries its own length rather than a solo mission\u2019s', () => {
        expect(start().mission.total).toBe(QUESTIONS_PER_DUEL)
    })
})
