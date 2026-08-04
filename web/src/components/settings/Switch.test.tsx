import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Switch from './Switch'
import { translations } from '../../i18n'
import { userEvent } from '../../test/utils'

const labels = translations.en.settings

describe('Switch', () => {
    it('reports its state to a screen reader rather than only by colour', () => {
        render(<Switch labels={labels} on={true} onToggle={() => {}} />)

        const control = screen.getByRole('switch')
        expect(control).toHaveAttribute('aria-checked', 'true')
        expect(control).toHaveTextContent(labels.on)
    })

    it('names itself off when off', () => {
        render(<Switch labels={labels} on={false} onToggle={() => {}} />)

        const control = screen.getByRole('switch')
        expect(control).toHaveAttribute('aria-checked', 'false')
        expect(control).toHaveTextContent(labels.off)
    })

    it('asks to be flipped without flipping itself', async () => {
        const onToggle = vi.fn()
        const user = userEvent.setup({ delay: null })
        render(<Switch labels={labels} on={false} onToggle={onToggle} />)

        await user.click(screen.getByRole('switch'))

        expect(onToggle).toHaveBeenCalledOnce()
    })
})
