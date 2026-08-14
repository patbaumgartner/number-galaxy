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

const tagOf = (voice: SpeechSynthesisVoice): string => voice.lang.toLowerCase().replace('_', '-')

/**
 * The installed voice that comes closest to the chosen language.
 *
 * `utterance.lang` is a request, not an instruction: the engine answers it with
 * whatever it considers the best match, and if it has nothing for the tag it
 * falls back to its own default. Ask a device configured in English to read
 * `de-CH` and it will happily read German with English phonetics, which for the
 * child this feature exists for — the one who is fine at the maths and not yet
 * at the reading — is worse than silence.
 *
 * So the voice is chosen here rather than requested. The Swiss tags are tried
 * first because they are the right ones, and they are almost never installed:
 * `de-CH`, `fr-CH` and `it-CH` ship with Swiss system images and hardly anything
 * else. Falling back to the bare language is what actually gets a German child a
 * German voice.
 */
function voiceFor(language: Language): SpeechSynthesisVoice | null {
    const synth = available()
    if (synth === null) return null

    let voices: SpeechSynthesisVoice[]
    try {
        voices = synth.getVoices?.() ?? []
    } catch {
        return null
    }

    const wanted = VOICES[language].toLowerCase()
    return voices.find(voice => tagOf(voice) === wanted)
        ?? voices.find(voice => tagOf(voice).split('-')[0] === language)
        ?? null
}

export const canSpeak = (): boolean => available() !== null

/** Never throws: a device with no voice installed must not take the question down. */
export function speak(text: string, language: Language): void {
    const synth = available()
    if (synth === null || text.trim() === '') return
    try {
        synth.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        const voice = voiceFor(language)
        // The tag still goes out when nothing matched, so an engine that knows
        // a voice we could not enumerate still gets told what language this is.
        utterance.lang = voice?.lang ?? VOICES[language]
        if (voice !== null) utterance.voice = voice
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
