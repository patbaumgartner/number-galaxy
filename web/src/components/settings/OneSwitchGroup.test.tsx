import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import OneSwitchGroup from './OneSwitchGroup'
import { translations } from '../../i18n'
import { userEvent } from '../../test/utils'

const labels = translations.en.settings

const renderGroup = (overrides: Partial<Parameters<typeof OneSwitchGroup>[0]> = {}) => {
    const props = {
        labels,
        title: 'Number Sense',
        hint: 'Applies to the sense stations.',
        switchTitle: '👁 Brief glance',
        switchHint: 'Dot patterns vanish after a moment.',
        on: true,
        resetLabel: 'Reset sense progress',
        onToggle: () => {},
        onReset: () => {},
        ...overrides,
    }
    return render(<OneSwitchGroup {...props} />)
}

describe('OneSwitchGroup', () => {
    it('carries the group heading, the setting and its explanation', () => {
        renderGroup()

        expect(screen.getByRole('heading', { name: 'Number Sense' })).toBeInTheDocument()
        expect(screen.getByText('Applies to the sense stations.')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: '👁 Brief glance' })).toBeInTheDocument()
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('routes the switch and the reset to different handlers', async () => {
        const onToggle = vi.fn()
        const onReset = vi.fn()
        const user = userEvent.setup({ delay: null })
        renderGroup({ onToggle, onReset })

        await user.click(screen.getByRole('switch'))
        expect(onToggle).toHaveBeenCalledOnce()
        expect(onReset).not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: 'Reset sense progress' }))
        expect(onReset).toHaveBeenCalledOnce()
        expect(onToggle).toHaveBeenCalledOnce()
    })
})
