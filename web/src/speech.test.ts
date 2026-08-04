import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canSpeak, speak, stopSpeaking } from './speech'

type Spoken = { text: string; lang: string; rate: number }

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
            constructor(text: string) { this.text = text }
        })
        // This suite runs in the node project, which has no window at all — so
        // the thing under test has to be handed one, as the other domain suites do.
        vi.stubGlobal('window', {
            speechSynthesis: {
                speak: (u: Spoken) => spoken.push({ text: u.text, lang: u.lang, rate: u.rate }),
                cancel: () => { cancelled += 1 },
            },
        })
    })

    afterEach(() => vi.unstubAllGlobals())

    it('reads a sentence in the Swiss voice for the chosen language', () => {
        speak('Nova hat 7 Äpfel.', 'de')

        expect(spoken).toHaveLength(1)
        expect(spoken[0].text).toBe('Nova hat 7 Äpfel.')
        expect(spoken[0].lang).toBe('de-CH')
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
