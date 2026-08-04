import { useState } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown, useDocumentLanguage, useModalDialog, usePageVisible } from './hooks'
import { store } from './store'
import { userEvent } from './test/utils'

function DialogProbe({ onClose, dismissible = true }: { onClose?: () => void; dismissible?: boolean }) {
    const dialog = useModalDialog<HTMLDivElement>(dismissible ? onClose : undefined)
    return (
        <div>
            <button type="button">outside</button>
            <div role="dialog" aria-modal="true" aria-label="probe" ref={dialog}>
                <button type="button">first</button>
                <button type="button">last</button>
            </div>
        </div>
    )
}

function LanguageProbe({ language }: { language: 'de' | 'en' }) {
    useDocumentLanguage(language)
    return null
}

function VisibilityProbe() {
    return <output>{String(usePageVisible())}</output>
}

function CountdownProbe({ seconds, running, resetKey, onExpire }: {
    seconds: number
    running: boolean
    resetKey: string
    onExpire: () => void
}) {
    return <output>{useCountdown({ seconds, running, resetKey, onExpire })}</output>
}

describe('hooks', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('mirrors the selected language onto the document element and the tab title', () => {
        const view = render(<LanguageProbe language="de" />)
        expect(document.documentElement.lang).toBe('de')
        expect(document.title).toBe('Zahlen-Galaxie')

        view.rerender(<LanguageProbe language="en" />)
        expect(document.documentElement.lang).toBe('en')
        expect(document.title).toBe('Number Galaxy')
    })

    it('carries easier reading onto every screen, and takes it off again', () => {
        // It rides along with the language hook precisely so it cannot be
        // half-applied: a setting lost by walking into the trainer is worse than
        // no setting at all.
        const view = render(<LanguageProbe language="de" />)
        expect(document.documentElement.classList.contains('reading-comfort')).toBe(false)

        store.saveSettings({ ...store.getSettings(), readableText: true })
        view.rerender(<LanguageProbe language="en" />)
        expect(document.documentElement.classList.contains('reading-comfort')).toBe(true)

        store.saveSettings({ ...store.getSettings(), readableText: false })
        view.rerender(<LanguageProbe language="de" />)
        expect(document.documentElement.classList.contains('reading-comfort')).toBe(false)
    })

    it('tracks document visibility and removes its listener on unmount', () => {
        const hidden = vi.spyOn(document, 'hidden', 'get')
        const remove = vi.spyOn(document, 'removeEventListener')
        hidden.mockReturnValue(false)
        const view = render(<VisibilityProbe />)
        expect(screen.getByText('true')).toBeInTheDocument()

        hidden.mockReturnValue(true)
        act(() => document.dispatchEvent(new Event('visibilitychange')))
        expect(screen.getByText('false')).toBeInTheDocument()

        hidden.mockReturnValue(false)
        act(() => document.dispatchEvent(new Event('visibilitychange')))
        expect(screen.getByText('true')).toBeInTheDocument()

        view.unmount()
        expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    })

    it('counts down, pauses, resets, and uses the latest expiration callback', () => {
        const firstExpire = vi.fn()
        const latestExpire = vi.fn()
        const view = render(<CountdownProbe seconds={2} running resetKey="first" onExpire={firstExpire} />)
        expect(screen.getByText('2')).toBeInTheDocument()

        act(() => vi.advanceTimersByTime(1000))
        expect(screen.getByText('1')).toBeInTheDocument()
        view.rerender(<CountdownProbe seconds={2} running resetKey="first" onExpire={latestExpire} />)
        act(() => vi.advanceTimersByTime(1000))
        expect(latestExpire).toHaveBeenCalledTimes(1)
        expect(firstExpire).not.toHaveBeenCalled()

        view.rerender(<CountdownProbe seconds={3} running={false} resetKey="paused" onExpire={latestExpire} />)
        expect(screen.getByText('3')).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(5000))
        expect(screen.getByText('3')).toBeInTheDocument()

        view.rerender(<CountdownProbe seconds={3} running resetKey="restart" onExpire={latestExpire} />)
        act(() => vi.advanceTimersByTime(1000))
        expect(screen.getByText('2')).toBeInTheDocument()
        view.rerender(<CountdownProbe seconds={5} running resetKey="restart" onExpire={latestExpire} />)
        expect(screen.getByText('5')).toBeInTheDocument()
    })
})

describe('useModalDialog', () => {
    // Real timers: this hook schedules nothing, and userEvent's default delay
    // deadlocks against vitest's fake clock.
    beforeEach(() => vi.useRealTimers())

    it('moves focus into the dialog when nothing inside is focused yet', () => {
        render(<DialogProbe onClose={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
    })

    it('closes on Escape when the dialog is dismissible', async () => {
        const onClose = vi.fn()
        render(<DialogProbe onClose={onClose} />)

        await userEvent.setup({ delay: null }).keyboard('{Escape}')

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('ignores Escape for a dialog that cannot be dismissed', async () => {
        const onClose = vi.fn()
        render(<DialogProbe onClose={onClose} dismissible={false} />)

        await userEvent.setup({ delay: null }).keyboard('{Escape}')

        expect(onClose).not.toHaveBeenCalled()
    })

    it('keeps Tab inside the dialog instead of reaching the page behind it', async () => {
        render(<DialogProbe onClose={vi.fn()} />)
        const user = userEvent.setup({ delay: null })
        const first = screen.getByRole('button', { name: 'first' })
        const last = screen.getByRole('button', { name: 'last' })

        await user.tab()
        expect(last).toHaveFocus()

        await user.tab()
        expect(first).toHaveFocus()

        expect(screen.getByRole('button', { name: 'outside' })).not.toHaveFocus()
    })

    it('wraps backwards from the first control to the last', async () => {
        render(<DialogProbe onClose={vi.fn()} />)

        await userEvent.setup({ delay: null }).tab({ shift: true })

        expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()
    })

    it('returns focus to the control that opened the dialog', async () => {
        function Host() {
            const [open, setOpen] = useState(false)
            return (
                <div>
                    <button type="button" onClick={() => setOpen(true)}>open</button>
                    {open && <DialogProbe onClose={() => setOpen(false)} />}
                </div>
            )
        }

        render(<Host />)
        const user = userEvent.setup({ delay: null })
        const opener = screen.getByRole('button', { name: 'open' })

        await user.click(opener)
        expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()

        await user.keyboard('{Escape}')
        expect(opener).toHaveFocus()
    })
})
