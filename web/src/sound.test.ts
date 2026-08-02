import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class SpyAudioContext {
    static frequencies: number[] = []
    state = 'running'
    currentTime = 0
    destination = {}

    static reset() {
        SpyAudioContext.frequencies = []
    }

    resume() { return Promise.resolve() }

    createOscillator() {
        return {
            type: 'square',
            frequency: {
                setValueAtTime: (frequency: number) => SpyAudioContext.frequencies.push(frequency),
                exponentialRampToValueAtTime: () => undefined,
            },
            connect: () => undefined,
            start: () => undefined,
            stop: () => undefined,
        }
    }

    createGain() {
        return {
            gain: {
                setValueAtTime: () => undefined,
                exponentialRampToValueAtTime: () => undefined,
            },
            connect: () => undefined,
        }
    }
}

function installAudioContext(value: unknown) {
    Object.defineProperty(globalThis, 'AudioContext', { value, configurable: true, writable: true })
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    SpyAudioContext.reset()
    installAudioContext(SpyAudioContext)
})

afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
})

describe('sound effects', () => {
    it('creates oscillators at the documented effect frequencies', async () => {
        const sound = await import('./sound')
        sound.setSoundEnabled(true)

        sound.playShoot()
        sound.playCorrect()
        sound.playWrong()
        sound.playTimeout()
        sound.playVictory()
        vi.runAllTimers()

        expect(SpyAudioContext.frequencies).toEqual([
            900, 180, 523, 220, 523, 784, 130, 659, 220, 784, 220, 1047, 1319,
        ])
    })

    it('scales combo notes with the multiplier and caps the sequence at four notes', async () => {
        const sound = await import('./sound')
        sound.setSoundEnabled(true)

        sound.playCombo(0)
        vi.runAllTimers()
        expect(SpyAudioContext.frequencies).toEqual([523])

        SpyAudioContext.reset()
        sound.playCombo(3)
        vi.runAllTimers()
        expect(SpyAudioContext.frequencies).toEqual([523, 659, 784, 1047])

        SpyAudioContext.reset()
        sound.playCombo(99)
        vi.runAllTimers()
        expect(SpyAudioContext.frequencies).toEqual([523, 659, 784, 1047])
    })

    it('silences beep-based effects while sound is disabled', async () => {
        const sound = await import('./sound')
        sound.setSoundEnabled(false)
        sound.playCorrect()
        sound.playCombo(3)
        sound.playWrong()
        sound.playTimeout()
        sound.playVictory()
        vi.runAllTimers()

        expect(SpyAudioContext.frequencies).toEqual([])
        sound.setSoundEnabled(true)
    })

    it('swallows a failing AudioContext constructor so the game remains playable', async () => {
        class ThrowingAudioContext {
            constructor() {
                throw new Error('audio blocked')
            }
        }

        installAudioContext(ThrowingAudioContext)
        const sound = await import('./sound')
        sound.setSoundEnabled(true)
        expect(() => {
            sound.playShoot()
            sound.playCorrect()
            vi.runAllTimers()
        }).not.toThrow()
    })
})
