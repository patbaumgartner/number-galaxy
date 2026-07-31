import { useEffect, useRef, useState } from 'react'
import type { Language } from './game'

/** Mirrors the chosen UI language onto `<html lang>` for screen readers. */
export function useDocumentLanguage(language: Language): void {
    useEffect(() => {
        document.documentElement.lang = language
    }, [language])
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
