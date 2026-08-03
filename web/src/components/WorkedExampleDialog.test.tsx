import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import WorkedExampleDialog from './WorkedExampleDialog'
import { userEvent } from '../test/utils'

const example = { prompt: '2 × 7 = ?', answer: '14', steps: '7 + 7 = 14' }

const renderDialog = (onClose = vi.fn()) => {
    render(<WorkedExampleDialog title="How to work it out" close="Continue" example={example} onClose={onClose} />)
    return onClose
}

describe('WorkedExampleDialog', () => {
    it('presents itself as a labelled modal dialog', () => {
        renderDialog()
        const dialog = screen.getByRole('dialog', { name: /how to work it out/i })
        expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('shows the question, its answer and the steps between them', () => {
        renderDialog()
        expect(screen.getByText('2 × 7 = ?')).toBeInTheDocument()
        expect(screen.getByText('14')).toBeInTheDocument()
        expect(screen.getByText('7 + 7 = 14')).toBeInTheDocument()
    })

    it('closes on the button, which holds focus so a keyboard can reach it first', async () => {
        const user = userEvent.setup({ delay: null })
        const onClose = renderDialog()
        const button = screen.getByRole('button', { name: 'Continue' })

        expect(button).toHaveFocus()
        await user.click(button)
        expect(onClose).toHaveBeenCalledOnce()
    })

    it('closes on Escape, because a dialog a child cannot dismiss is a trap', async () => {
        const user = userEvent.setup({ delay: null })
        const onClose = renderDialog()

        await user.keyboard('{Escape}')
        expect(onClose).toHaveBeenCalledOnce()
    })
})
