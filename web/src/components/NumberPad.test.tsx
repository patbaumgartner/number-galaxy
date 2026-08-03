import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NumberPad } from './NumberPad'
import { translations } from '../i18n'
import { seedLanguage, userEvent } from '../test/utils'

function renderPad(overrides: Partial<React.ComponentProps<typeof NumberPad>> = {}) {
    seedLanguage('en')
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const result = render(<NumberPad value="" onChange={onChange} onSubmit={onSubmit} {...overrides} />)
    return { ...result, onChange, onSubmit }
}

describe('NumberPad', () => {
    it('appends clicked digits and caps input at three characters', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange, rerender } = renderPad({ value: '12' })

        await user.click(screen.getByRole('button', { name: '3' }))
        expect(onChange).toHaveBeenCalledWith('123')
        rerender(<NumberPad value="123" onChange={onChange} onSubmit={vi.fn()} />)
        await user.click(screen.getByRole('button', { name: '4' }))
        expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('deletes the last digit and submits only a non-empty value by click', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange, onSubmit, rerender } = renderPad({ value: '42' })

        await user.click(screen.getByRole('button', { name: translations.en.tt.padDelete }))
        await user.click(screen.getByRole('button', { name: translations.en.tt.padSubmit }))
        expect(onChange).toHaveBeenCalledWith('4')
        expect(onSubmit).toHaveBeenCalledOnce()

        rerender(<NumberPad value="" onChange={onChange} onSubmit={onSubmit} />)
        await user.click(screen.getByRole('button', { name: translations.en.tt.padSubmit }))
        expect(onSubmit).toHaveBeenCalledOnce()
    })

    it('handles digit, backspace, and enter keyboard input', () => {
        const { onChange, onSubmit, rerender } = renderPad({ value: '1' })

        fireEvent.keyDown(window, { key: '2' })
        fireEvent.keyDown(window, { key: 'Backspace' })
        fireEvent.keyDown(window, { key: 'Enter' })
        expect(onChange).toHaveBeenNthCalledWith(1, '12')
        expect(onChange).toHaveBeenNthCalledWith(2, '')
        expect(onSubmit).toHaveBeenCalledOnce()

        rerender(<NumberPad value="" onChange={onChange} onSubmit={onSubmit} />)
        fireEvent.keyDown(window, { key: 'Enter' })
        expect(onSubmit).toHaveBeenCalledOnce()
    })

    it('blocks mouse and keyboard entry while disabled and disables empty submission', async () => {
        const user = userEvent.setup({ delay: null })
        const { onChange, onSubmit } = renderPad({ disabled: true })

        await user.click(screen.getByRole('button', { name: '1' }))
        fireEvent.keyDown(window, { key: '1' })
        fireEvent.keyDown(window, { key: 'Enter' })

        expect(onChange).not.toHaveBeenCalled()
        expect(onSubmit).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: translations.en.tt.padSubmit })).toBeDisabled()
    })

    it('uses translated delete and submit names and politely announces the display', () => {
        const { container } = renderPad({ value: '9' })

        expect(screen.getByRole('button', { name: translations.en.tt.padDelete })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: translations.en.tt.padSubmit })).toBeInTheDocument()
        expect(container.querySelector('.numpad-display')).toHaveAttribute('aria-live', 'polite')
    })

    it('removes the keyboard listener when unmounted', () => {
        const { onChange, unmount } = renderPad()

        unmount()
        fireEvent.keyDown(window, { key: '7' })

        expect(onChange).not.toHaveBeenCalled()
    })
})
