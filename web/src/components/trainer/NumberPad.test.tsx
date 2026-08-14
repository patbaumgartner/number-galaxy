import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { seedLanguage, userEvent } from '../../test/utils'
import { NumberPad } from './NumberPad'

const setup = (props: Partial<React.ComponentProps<typeof NumberPad>> = {}) => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const view = render(<NumberPad value="" onChange={onChange} onSubmit={onSubmit} {...props} />)
    return { ...view, onChange, onSubmit }
}

describe('NumberPad', () => {
    beforeEach(() => seedLanguage('en'))

    it('appends a tapped digit', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange } = setup({ value: '4' })

        await user.click(screen.getByRole('button', { name: '2' }))
        expect(onChange).toHaveBeenCalledWith('42')
    })

    it('stops at the digit limit, which the arcade widens for bigger numbers', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange } = setup({ value: '123' })

        await user.click(screen.getByRole('button', { name: '4' }))
        expect(onChange).not.toHaveBeenCalled()

        onChange.mockClear()
        const wider = setup({ value: '123', maxLength: 4 })
        await user.click(screen.getAllByRole('button', { name: '4' })[1])
        expect(wider.onChange).toHaveBeenCalledWith('1234')
    })

    it('deletes the last digit', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange } = setup({ value: '42' })

        await user.click(screen.getByRole('button', { name: 'Delete' }))
        expect(onChange).toHaveBeenCalledWith('4')
    })

    it('submits what was typed, and refuses to submit nothing', async () => {
        const user = userEvent.setup({ delay: null })
        const empty = setup({ value: '' })
        expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('aria-disabled', 'true')
        empty.unmount()

        const typed = setup({ value: '7' })
        await user.click(screen.getByRole('button', { name: 'Submit' }))
        expect(typed.onSubmit).toHaveBeenCalled()
    })

    it('accepts real keys as well as taps', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange, onSubmit, rerender } = setup({ value: '' })

        await user.keyboard('5')
        expect(onChange).toHaveBeenCalledWith('5')

        rerender(<NumberPad value="5" onChange={onChange} onSubmit={onSubmit} />)
        await user.keyboard('{Backspace}')
        expect(onChange).toHaveBeenCalledWith('')
        await user.keyboard('{Enter}')
        expect(onSubmit).toHaveBeenCalled()
    })

    it('holds the digit limit against the keyboard too, not just taps', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange } = setup({ value: '123' })

        await user.keyboard('4')
        expect(onChange).not.toHaveBeenCalled()
    })

    it('ignores keys that are not digits, delete or enter', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange, onSubmit } = setup({ value: '1' })

        await user.keyboard('x')
        expect(onChange).not.toHaveBeenCalled()
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('has nothing to delete or submit when nothing has been typed', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange, onSubmit } = setup({ value: '' })

        await user.keyboard('{Enter}')
        expect(onSubmit).not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: 'Delete' }))
        expect(onChange).toHaveBeenCalledWith('')
    })

    it('does nothing at all while disabled', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange, onSubmit } = setup({ value: '4', disabled: true })

        await user.keyboard('7')
        await user.keyboard('{Enter}')
        await user.keyboard('{Backspace}')
        expect(onChange).not.toHaveBeenCalled()
        expect(onSubmit).not.toHaveBeenCalled()

        // The taps are inert too, not merely the keys.
        await user.click(screen.getByRole('button', { name: '3' }))
        await user.click(screen.getByRole('button', { name: 'Delete' }))
        expect(onChange).not.toHaveBeenCalled()
        screen.getAllByRole('button').forEach(key => expect(key).toHaveAttribute('aria-disabled', 'true'))
    })

    /**
     * `aria-disabled` rather than `disabled`, for one reason: `disabled` blurs
     * the control it lands on. The pad locks the moment an answer is submitted,
     * so a child typing from a keyboard or a switch was thrown out of the pad by
     * their own answer, once for every fact on the planet.
     */
    it('leaves focus on the key that was pressed while the answer is marked', () => {
        const onChange = vi.fn()
        const onSubmit = vi.fn()
        const { rerender } = render(<NumberPad value="7" onChange={onChange} onSubmit={onSubmit} />)
        const submit = screen.getByRole('button', { name: 'Submit' })
        submit.focus()
        expect(submit).toHaveFocus()

        rerender(<NumberPad value="7" onChange={onChange} onSubmit={onSubmit} disabled />)
        expect(submit).toHaveFocus()
        expect(document.activeElement).not.toBe(document.body)
    })
})
