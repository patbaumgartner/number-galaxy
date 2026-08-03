import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Language } from './game'
import { translations } from './i18n'
import { setSoundEnabled } from './sound'
import { store } from './store'
import { nextSurprise, surpriseRoute, SURPRISE_PARAM } from './surprise'

/**
 * Mirrors the document-level preferences: language, and easier reading.
 *
 * The title cannot stay in `index.html`: the app name is translated, so a static
 * one leaves an English or French child looking at a German tab. The markup
 * keeps the German name for first paint, which is the default language.
 *
 * Easier reading rides along rather than getting a hook of its own, because it
 * has to be on *every* screen — a setting a dyslexic child switched on and then
 * lost by walking into the trainer is worse than no setting. This hook is the
 * one every page already calls, so it cannot be half-applied.
 */
export function useDocumentLanguage(language: Language): void {
    useEffect(() => {
        document.documentElement.lang = language
        document.title = translations[language].home.appName
    }, [language])

    useEffect(() => {
        document.documentElement.classList.toggle('reading-comfort', store.getSettings().readableText)
    })
}

/**
 * Applies the stored sound preference.
 *
 * `sound.ts` keeps one module-level flag for the whole app, so every screen that
 * makes a noise has to set it. Every game calls this: without it, a child who
 * switched sound off and went straight to the trainer still heard it, because
 * only the arcade game was applying the setting.
 */
export function useSoundSetting(): void {
    useEffect(() => {
        setSoundEnabled(store.getSettings().sound)
    }, [])
}

/** False while the tab is in the background, so a mission never runs unwatched. */
export function usePageVisible(): boolean {
    const [visible, setVisible] = useState(() =>
        typeof document === 'undefined' ? true : !document.hidden,
    )

    useEffect(() => {
        const onChange = () => setVisible(!document.hidden)
        document.addEventListener('visibilitychange', onChange)
        return () => document.removeEventListener('visibilitychange', onChange)
    }, [])

    return visible
}

type CountdownOptions = {
    seconds: number
    running: boolean
    /** Change this to restart the clock, even when `seconds` is unchanged. */
    resetKey: unknown
    onExpire: () => void
}

export function useCountdown({ seconds, running, resetKey, onExpire }: CountdownOptions): number {
    const [clock, setClock] = useState({ key: resetKey, seconds, remaining: seconds })
    const onExpireRef = useRef(onExpire)

    useEffect(() => {
        onExpireRef.current = onExpire
    })

    // Adjusting during render rather than in an effect avoids a wasted commit
    // that would briefly paint the previous question's remaining time.
    if (clock.key !== resetKey || clock.seconds !== seconds) {
        setClock({ key: resetKey, seconds, remaining: seconds })
    }

    useEffect(() => {
        if (!running) return
        if (clock.remaining <= 0) {
            onExpireRef.current()
            return
        }
        const timer = setTimeout(
            () => setClock(current => ({ ...current, remaining: current.remaining - 1 })),
            1000,
        )
        return () => clearTimeout(timer)
    }, [clock.remaining, running])

    return clock.remaining
}

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Makes an `aria-modal` dialog behave like one.
 *
 * Returns a ref to put on the dialog element. While it is mounted, Escape
 * closes it, Tab cycles inside it instead of reaching the page behind, and the
 * control that opened it gets focus back on close. Pass no `onClose` for a
 * dialog that cannot be dismissed, such as the end-of-mission summary.
 */
export function useModalDialog<T extends HTMLElement>(onClose?: () => void) {
    const ref = useRef<T>(null)
    const onCloseRef = useRef(onClose)
    const openerRef = useRef<HTMLElement | null>(null)

    // Captured during the first render, not in the effect: React applies a
    // child's `autoFocus` before effects run, so by then `document.activeElement`
    // is already inside the dialog and the real opener is lost.
    if (openerRef.current === null) {
        openerRef.current = document.activeElement as HTMLElement | null
    }

    useEffect(() => {
        onCloseRef.current = onClose
    })

    useEffect(() => {
        const opener = openerRef.current
        const dialog = ref.current
        if (dialog === null) return

        // Several dialogs autofocus their primary action; only take over when
        // focus is still outside, so we never fight the more specific choice.
        if (!dialog.contains(document.activeElement)) {
            dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus()
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && onCloseRef.current !== undefined) {
                event.preventDefault()
                onCloseRef.current()
                return
            }
            if (event.key !== 'Tab') return

            const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
            if (focusable.length === 0) {
                event.preventDefault()
                return
            }

            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            const active = document.activeElement

            if (!dialog.contains(active)) {
                event.preventDefault()
                first.focus()
            } else if (event.shiftKey && active === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && active === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            opener?.focus()
        }
    }, [])

    return ref
}

/**
 * What a summary renders instead of "play again" after a surprise run.
 *
 * Labels ride along because the three summaries take their own translation
 * slice, and these two strings are shared across all of them.
 */
export type SurpriseActions = {
    readonly againLabel: string
    readonly homeLabel: string
    readonly onAgain: () => void
    readonly onHome: () => void
}

export type SurpriseRun = {
    /** True when the player did not choose this game — the picker did. */
    readonly active: boolean
    readonly again: () => void
    readonly home: () => void
}

/**
 * Whether this run came from the Surprise button, and where to go next.
 *
 * A chosen game ends with "Play again", which is right because the player asked
 * for that game. A surprise run ends with another surprise, because variety was
 * the point of pressing the button.
 */
export function useSurpriseRun(): SurpriseRun {
    const navigate = useNavigate()
    const { search } = useLocation()
    const active = new URLSearchParams(search).get(SURPRISE_PARAM) === '1'

    const again = useCallback(() => {
        navigate(surpriseRoute(nextSurprise()), { replace: true })
    }, [navigate])

    const home = useCallback(() => navigate('/'), [navigate])

    return { active, again, home }
}
