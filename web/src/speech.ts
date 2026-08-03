import type { Language } from './game'

/**
 * Reading a question aloud, for the child who cannot yet read it.
 *
 * Word problems put a second load on top of the arithmetic, which is why they
 * are off by default — but for a child who is fine at the maths and not yet at
 * the reading, the reading is the only thing in the way. This removes it without
 * removing the question.
 *
 * Nothing is downloaded and nothing is sent: `speechSynthesis` is the browser's
 * own, already on the device, which is the only kind of voice an app with no
 * network calls can use.
 */

const VOICES: Record<Language, string> = {
    de: 'de-CH',
    it: 'it-CH',
    en: 'en-GB',
    fr: 'fr-CH',
}

const available = (): SpeechSynthesis | null => {
    try {
        return typeof window === 'undefined' ? null : (window.speechSynthesis ?? null)
    } catch {
        return null
    }
}

export const canSpeak = (): boolean => available() !== null

/** Never throws: a device with no voice installed must not take the question down. */
export function speak(text: string, language: Language): void {
    const synth = available()
    if (synth === null || text.trim() === '') return
    try {
        synth.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = VOICES[language]
        // Slower than default: this is being read to a child who is working out
        // what it means, not to an adult skimming a notification.
        utterance.rate = 0.85
        synth.speak(utterance)
    } catch {
        /* no voice on this device — the question is still on screen */
    }
}

export function stopSpeaking(): void {
    try {
        available()?.cancel()
    } catch {
        /* nothing was speaking */
    }
}
