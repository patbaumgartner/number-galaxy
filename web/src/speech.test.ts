import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canSpeak, speak, stopSpeaking } from './speech'

type Spoken = { text: string; lang: string; rate: number; voice: { name: string } | null }

const voice = (lang: string, name = lang) => ({ lang, name })

describe('speech', () => {
    let spoken: Spoken[]
    let cancelled: number

    beforeEach(() => {
        spoken = []
        cancelled = 0
        vi.stubGlobal('SpeechSynthesisUtterance', class {
            text: string
            lang = ''
            rate = 1
            voice: { name: string } | null = null
            constructor(text: string) { this.text = text }
        })
        // This suite runs in the node project, which has no window at all — so
        // the thing under test has to be handed one, as the other domain suites do.
        vi.stubGlobal('window', {
            speechSynthesis: {
                speak: (u: Spoken) => spoken.push({ text: u.text, lang: u.lang, rate: u.rate, voice: u.voice }),
                cancel: () => { cancelled += 1 },
            },
        })
    })

    afterEach(() => vi.unstubAllGlobals())

    /** A device that lists no voices at all still gets told what language it is. */
    it('reads a sentence in the Swiss voice for the chosen language', () => {
        speak('Nova hat 7 Äpfel.', 'de')

        expect(spoken).toHaveLength(1)
        expect(spoken[0].text).toBe('Nova hat 7 Äpfel.')
        expect(spoken[0].lang).toBe('de-CH')
    })

    /**
     * `utterance.lang` is a request the engine may answer with its own default.
     * Asked for `de-CH` on a device that has no Swiss voice — which is nearly
     * every device — it used to read German in whatever voice was default,
     * English phonetics included. The voice is chosen here instead.
     */
    const installed = (...tags: string[]) => {
        const synth = (window as unknown as { speechSynthesis: Record<string, unknown> }).speechSynthesis
        synth.getVoices = () => tags.map(tag => voice(tag))
    }

    it('prefers the Swiss voice when the device actually has one', () => {
        installed('de-DE', 'de-CH', 'en-US')
        speak('Nova hat 7 Äpfel.', 'de')

        expect(spoken[0].voice).toEqual(voice('de-CH'))
        expect(spoken[0].lang).toBe('de-CH')
    })

    it('falls back to any voice in the same language, which is what most devices have', () => {
        installed('en-US', 'de-DE', 'fr-FR')
        speak('Nova hat 7 Äpfel.', 'de')

        expect(spoken[0].voice).toEqual(voice('de-DE'))
        expect(spoken[0].lang).toBe('de-DE')
    })

    it('never reads one language in another language’s voice', () => {
        installed('en-US', 'en-GB')
        speak('Nova a 7 pommes.', 'fr')

        expect(spoken[0].voice).toBeNull()
        expect(spoken[0].lang).toBe('fr-CH')
    })

    it('reads the tag case- and separator-insensitively, as engines report it', () => {
        installed('IT_ch')
        speak('Nova ha 7 mele.', 'it')

        expect(spoken[0].voice).toEqual(voice('IT_ch'))
    })

    it('survives an engine that refuses to enumerate its voices', () => {
        const synth = (window as unknown as { speechSynthesis: Record<string, unknown> }).speechSynthesis
        synth.getVoices = () => { throw new Error('not ready') }

        expect(() => speak('anything', 'de')).not.toThrow()
        expect(spoken).toHaveLength(1)
        expect(spoken[0].voice).toBeNull()
    })

    it('reads slower than the default, because it is being worked out', () => {
        speak('Nova has 7 apples.', 'en')
        expect(spoken[0].rate).toBeLessThan(1)
    })

    it('stops whatever was speaking before starting, so two taps do not overlap', () => {
        speak('one', 'en')
        speak('two', 'en')
        expect(cancelled).toBe(2)
        expect(spoken.map(entry => entry.text)).toEqual(['one', 'two'])
    })

    it('says nothing for an empty story rather than clearing its throat', () => {
        speak('   ', 'en')
        expect(spoken).toHaveLength(0)
    })

    it('survives a device with no speech at all', () => {
        vi.stubGlobal('window', {})

        expect(canSpeak()).toBe(false)
        expect(() => speak('anything', 'de')).not.toThrow()
        expect(() => stopSpeaking()).not.toThrow()
        expect(spoken).toHaveLength(0)
    })

    it('survives a window that throws when asked for speech', () => {
        vi.stubGlobal('window', { get speechSynthesis(): never { throw new Error('blocked') } })

        expect(canSpeak()).toBe(false)
        expect(() => speak('anything', 'en')).not.toThrow()
        expect(() => stopSpeaking()).not.toThrow()
    })

    it('stays silent where there is no window at all, as on a server', () => {
        vi.unstubAllGlobals()

        expect(canSpeak()).toBe(false)
        expect(() => speak('anything', 'de')).not.toThrow()
        expect(() => stopSpeaking()).not.toThrow()
    })
})
