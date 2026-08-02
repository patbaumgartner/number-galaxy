import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'
import { translations } from '../translations'
import { seedLanguage, userEvent } from '../test/utils'

function CrashingChild(): never {
    throw new Error('test crash')
}

describe('ErrorBoundary', () => {
    it('renders its children when no render error occurs', () => {
        render(<ErrorBoundary><p>Safe content</p></ErrorBoundary>)

        expect(screen.getByText('Safe content')).toBeInTheDocument()
    })

    it('renders localized alert fallback and logs a caught child crash', () => {
        seedLanguage('fr')
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        render(<ErrorBoundary><CrashingChild /></ErrorBoundary>)

        expect(screen.getByRole('alert')).toHaveTextContent(translations.fr.error.title)
        expect(screen.getByRole('alert')).toHaveTextContent(translations.fr.error.body)
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    it('still renders a readable fallback when storage itself is unreadable', () => {
        const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
            throw new Error('storage unavailable')
        })
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        render(<ErrorBoundary><CrashingChild /></ErrorBoundary>)

        // Storage failures never reach the boundary's own catch: `readJson` and
        // `hasKey` already swallow them, so settings fall back to the default
        // German copy rather than the English last resort.
        expect(screen.getByRole('alert')).toHaveTextContent(translations.de.error.title)
        expect(screen.getByRole('alert')).toHaveTextContent(translations.de.error.body)
        getItemSpy.mockRestore()
        errorSpy.mockRestore()
    })

    it('reloads the page when the fallback action is selected', async () => {
        seedLanguage('en')
        const reload = vi.fn()
        const realLocation = window.location
        Object.defineProperty(window, 'location', {
            configurable: true,
            writable: true,
            value: { ...realLocation, reload },
        })
        const user = userEvent.setup({ delay: null })
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        render(<ErrorBoundary><CrashingChild /></ErrorBoundary>)
        await user.click(screen.getByRole('button', { name: translations.en.error.reload }))

        expect(reload).toHaveBeenCalledOnce()
        Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation })
        errorSpy.mockRestore()
    })
})
