import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MissionSummary from './MissionSummary'
import { translations } from '../translations'
import { userEvent } from '../test/utils'

const labels = translations.en.summary

function renderSummary(overrides: Partial<React.ComponentProps<typeof MissionSummary>> = {}) {
    const onPlayAgain = vi.fn()
    const onChangeMission = vi.fn()
    const onSeeScores = vi.fn()
    const result = render(
        <MissionSummary
            score={500}
            correct={8}
            total={10}
            stars={2}
            bestStreak={6}
            fastestMs={1234}
            newRecord={false}
            newPersonalBest={false}
            labels={labels}
            onPlayAgain={onPlayAgain}
            onChangeMission={onChangeMission}
            onSeeScores={onSeeScores}
            {...overrides}
        />,
    )
    return { ...result, onPlayAgain, onChangeMission, onSeeScores }
}

describe('MissionSummary', () => {
    it('uses complete or perfect title according to the result', () => {
        const { rerender } = renderSummary({ correct: 9 })

        expect(screen.getByRole('heading', { name: labels.complete })).toBeInTheDocument()
        rerender(<MissionSummary score={500} correct={10} total={10} stars={2} bestStreak={6} fastestMs={1234} newRecord={false} newPersonalBest={false} labels={labels} onPlayAgain={vi.fn()} onChangeMission={vi.fn()} onSeeScores={vi.fn()} />)
        expect(screen.getByRole('heading', { name: labels.perfect })).toBeInTheDocument()
    })

    it('renders score, correct count, and rounded accuracy without NaN for zero questions', () => {
        const { rerender } = renderSummary({ correct: 7, total: 9 })

        expect(screen.getByText('500')).toBeInTheDocument()
        expect(screen.getByText('7/9 · 78%')).toBeInTheDocument()
        rerender(<MissionSummary score={500} correct={0} total={0} stars={0} bestStreak={0} fastestMs={null} newRecord={false} newPersonalBest={false} labels={labels} onPlayAgain={vi.fn()} onChangeMission={vi.fn()} onSeeScores={vi.fn()} />)
        expect(screen.getByText('0/0 · 0%')).toBeInTheDocument()
        expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    })

    it('labels the stars and marks exactly the earned number', () => {
        const { container } = renderSummary({ stars: 2 })

        expect(screen.getByLabelText('2/3')).toBeInTheDocument()
        expect(container.querySelectorAll('.summary__star--earned')).toHaveLength(2)
    })

    it('only shows confetti for three stars', () => {
        const { container, rerender } = renderSummary({ stars: 2 })

        expect(container.querySelector('.summary__confetti')).not.toBeInTheDocument()
        rerender(<MissionSummary score={500} correct={8} total={10} stars={3} bestStreak={6} fastestMs={1234} newRecord={false} newPersonalBest={false} labels={labels} onPlayAgain={vi.fn()} onChangeMission={vi.fn()} onSeeScores={vi.fn()} />)
        expect(container.querySelector('.summary__confetti')).toBeInTheDocument()
    })

    it('shows record badges only for their qualifying achievements', () => {
        const { rerender } = renderSummary({ newRecord: true, newPersonalBest: true, fastestMs: null })

        expect(screen.getByText(/New record!/)).toBeInTheDocument()
        expect(screen.queryByText(labels.newBest)).not.toBeInTheDocument()
        rerender(<MissionSummary score={500} correct={8} total={10} stars={2} bestStreak={6} fastestMs={1234} newRecord={false} newPersonalBest labels={labels} onPlayAgain={vi.fn()} onChangeMission={vi.fn()} onSeeScores={vi.fn()} />)
        expect(screen.getByText(/New best time!/)).toBeInTheDocument()
    })

    it('renders a fastest-time row in one decimal seconds only when available', () => {
        const { rerender } = renderSummary({ fastestMs: 1567 })

        expect(screen.getByText(labels.fastest)).toBeInTheDocument()
        expect(screen.getByText('1.6s')).toBeInTheDocument()
        rerender(<MissionSummary score={500} correct={8} total={10} stars={2} bestStreak={6} fastestMs={null} newRecord={false} newPersonalBest={false} labels={labels} onPlayAgain={vi.fn()} onChangeMission={vi.fn()} onSeeScores={vi.fn()} />)
        expect(screen.queryByText(labels.fastest)).not.toBeInTheDocument()
    })

    it('invokes the matching callback for every action', async () => {
        const user = userEvent.setup({ delay: null })
        const { onPlayAgain, onChangeMission, onSeeScores } = renderSummary()

        await user.click(screen.getByRole('button', { name: labels.playAgain }))
        await user.click(screen.getByRole('button', { name: labels.changeMission }))
        await user.click(screen.getByRole('button', { name: labels.seeScores }))

        expect(onPlayAgain).toHaveBeenCalledOnce()
        expect(onChangeMission).toHaveBeenCalledOnce()
        expect(onSeeScores).toHaveBeenCalledOnce()
    })

    it('exposes a modal dialog labelled by its title', () => {
        renderSummary()

        const dialog = screen.getByRole('dialog', { name: labels.complete })
        expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
})
