import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Operation } from '../game'
import { RULESET_VERSION, store } from '../store'
import { renderWithRouter, seedLanguage } from '../test/utils'
import HallOfFamePage from './HallOfFamePage'

const score = (rank: 'rookie' | 'legend', timed: boolean, player: string, stars: number, value: number) => ({
    playerId: player,
    player,
    avatarId: '🚀',
    rulesetVersion: RULESET_VERSION,
    rank,
    timed,
    operations: ['addition'] as Operation[],
    score: value,
    correct: 20,
    total: 25,
    stars,
    bestStreak: 9,
    updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('HallOfFamePage', () => {
    beforeEach(() => seedLanguage('en'))


    it('groups ranks highest first with clock sections, medals, stars, and stats', () => {
        store.submitScore(score('rookie', false, 'Fourth', 1, 40))
        store.submitScore(score('rookie', false, 'Fifth', 1, 30))
        store.submitScore(score('rookie', false, 'Third', 2, 50))
        store.submitScore(score('rookie', false, 'Second', 3, 60))
        store.submitScore(score('legend', true, 'First', 3, 100))
        renderWithRouter(<HallOfFamePage />)

        const headings = screen.getAllByRole('heading', { level: 2 }).map(node => node.textContent)
        expect(headings[0]).toContain('Legend')
        expect(screen.getByText(/With countdown/)).toBeInTheDocument()
        expect(screen.getAllByText('🥇')).toHaveLength(2)
        expect(screen.getByText('🥈')).toBeInTheDocument()
        expect(screen.getByText('🥉')).toBeInTheDocument()
        expect(screen.getByText('4', { selector: '.board__rank' })).toBeInTheDocument()
        expect(screen.getAllByText('★★★')).toHaveLength(2)
        expect(screen.getAllByText(/Correct 20\/25 · Streak 9/)).toHaveLength(5)
    })

})
