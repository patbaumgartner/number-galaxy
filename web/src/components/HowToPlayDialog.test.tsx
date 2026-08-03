import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from '../test/utils'
import HowToPlayDialog from './HowToPlayDialog'

const steps = ['Pick a station.', 'Take a quick look.', 'Slide to your answer.']

describe('HowToPlayDialog', () => {
    it('lists the steps in order, as an ordered list', () => {
        render(<HowToPlayDialog title="How to play" steps={steps} close="Continue" onClose={vi.fn()} />)

        const items = screen.getAllByRole('listitem').map(item => item.textContent)
        expect(items).toEqual(steps)
    })

    it('is a modal dialog named by its title, with the close button focused', () => {
        render(<HowToPlayDialog title="How to play" steps={steps} close="Continue" onClose={vi.fn()} />)

        const dialog = screen.getByRole('dialog', { name: 'How to play' })
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus()
    })

    it('closes on the button and on Escape', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup({ delay: null })
        render(<HowToPlayDialog title="How to play" steps={steps} close="Continue" onClose={onClose} />)

        await user.click(screen.getByRole('button', { name: 'Continue' }))
        expect(onClose).toHaveBeenCalledTimes(1)

        await user.keyboard('{Escape}')
        expect(onClose).toHaveBeenCalledTimes(2)
    })
})
