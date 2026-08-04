import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DrillSummary, { type DrillResult } from './DrillSummary'
import { translations } from '../i18n'
import { userEvent } from '../test/utils'

const labels = translations.en.beam

const result = (patch: Partial<DrillResult> = {}): DrillResult => ({
    correct: 7,
    total: 10,
    accuracy: 0.7,
    bestStreak: 4,
    stars: 1,
    gained: true,
    newBest: false,
    ...patch,
})

const renderSummary = (patch: Partial<DrillResult> = {}, surprise?: Parameters<typeof DrillSummary>[0]['surprise']) =>
    render(
        <DrillSummary
            labels={labels}
            result={result(patch)}
            onPlayAgain={() => {}}
            onExit={() => {}}
            {...(surprise === undefined ? {} : { surprise })}
        />,
    )

describe('DrillSummary', () => {
    it('always draws three stars so what is left to earn is visible too', () => {
        renderSummary({ stars: 1 })

        expect(document.querySelectorAll('.summary__star')).toHaveLength(3)
        expect(document.querySelectorAll('.summary__star--earned')).toHaveLength(1)
        expect(screen.getByLabelText('1/3')).toBeInTheDocument()
    })

    it('reports the run as a fraction and a percentage', () => {
        renderSummary({ correct: 7, total: 10, accuracy: 0.7, bestStreak: 4 })

        expect(screen.getByText('7/10 · 70%')).toBeInTheDocument()
        expect(screen.getByText('4🔥')).toBeInTheDocument()
    })

    it('celebrates a new star and a new best independently', () => {
        renderSummary({ gained: true, newBest: true, stars: 2 })

        expect(screen.getByText(/You earned 2 star/)).toBeInTheDocument()
        expect(screen.getByText(new RegExp(labels.summaryNewBest))).toBeInTheDocument()
    })

    it('only tells a child to keep practising when they have no star yet', () => {
        renderSummary({ gained: false, newBest: false, stars: 0 })
        expect(screen.getByText(labels.summaryKeepGoing)).toBeInTheDocument()
    })

    it('says nothing of the sort to a child who already holds stars', () => {
        renderSummary({ gained: false, newBest: false, stars: 3 })
        expect(screen.queryByText(labels.summaryKeepGoing)).not.toBeInTheDocument()
    })

    it('offers another surprise instead of a replay when the picker chose this station', async () => {
        const onAgain = vi.fn()
        const user = userEvent.setup({ delay: null })
        renderSummary({}, { againLabel: 'Another surprise', homeLabel: 'Home', onAgain, onHome: () => {} })

        expect(screen.queryByRole('button', { name: labels.playAgain })).not.toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Another surprise' }))

        expect(onAgain).toHaveBeenCalledOnce()
    })

    it('takes focus into the dialog rather than leaving it behind on the page', () => {
        const outside = document.createElement('button')
        document.body.append(outside)
        outside.focus()

        const { container } = renderSummary()

        expect(container.querySelector('.summary')?.contains(document.activeElement)).toBe(true)
        outside.remove()
    })
})
