import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ArcadeSettings from './ArcadeSettings'
import { translations } from '../../i18n'
import { store } from '../../store'
import { userEvent } from '../../test/utils'

const t = translations.en

const renderArcade = (overrides: Partial<Parameters<typeof ArcadeSettings>[0]> = {}) => {
    const props = {
        t,
        settings: { ...store.getSettings(), language: 'en' as const, operations: ['addition' as const] },
        badges: new Map(),
        mistake: null,
        onUpdate: () => {},
        onToggleOperation: () => {},
        ...overrides,
    }
    return render(<ArcadeSettings {...props} />)
}

describe('ArcadeSettings', () => {
    it('flips the points switch without deciding the new value itself', async () => {
        const onUpdate = vi.fn()
        const user = userEvent.setup({ delay: null })
        const settings = { ...store.getSettings(), language: 'en' as const, showScore: true }
        renderArcade({ settings, onUpdate })

        const showPoints = screen.getByRole('heading', { name: new RegExp(t.settings.showScoreTitle, 'i') })
            .closest('.switch-row')
        await user.click(showPoints?.querySelector('[role=switch]') as HTMLElement)

        expect(onUpdate).toHaveBeenCalledWith({ showScore: false })
    })

    it('reports a rank choice upwards rather than saving it', async () => {
        const onUpdate = vi.fn()
        const user = userEvent.setup({ delay: null })
        renderArcade({ onUpdate })

        await user.click(screen.getByRole('button', { name: new RegExp(t.ranks.cadet, 'i') }))

        expect(onUpdate).toHaveBeenCalledWith({ rank: 'cadet' })
    })

    it('locks the last operation so a mission can never have nothing to ask', () => {
        renderArcade({ settings: { ...store.getSettings(), language: 'en', operations: ['addition'] } })

        expect(screen.getByRole('button', { name: /plus/i })).toHaveAttribute('aria-disabled', 'true')
        expect(screen.getByText(t.settings.keepOne)).toBeInTheDocument()
    })

    it('names the mistake that keeps coming up, when there is one', () => {
        renderArcade({ mistake: 'offByOne' })

        expect(screen.getByText(t.misses.offByOne)).toBeInTheDocument()
    })
})
