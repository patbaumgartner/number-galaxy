import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * Shared jsdom setup for every `*.test.tsx` suite.
 *
 * jsdom ships neither Web Audio nor `matchMedia`, and the app touches both on
 * mount. Stubbing them here keeps each suite focused on behaviour instead of
 * re-teaching jsdom what a browser is.
 */

type OscillatorStub = {
    type: string
    frequency: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> }
    connect: ReturnType<typeof vi.fn>
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
}

/** Every oscillator created during a test, so audio can be asserted on. */
export const createdOscillators: OscillatorStub[] = []

class AudioContextStub {
    state = 'running'
    currentTime = 0
    destination = {}

    resume = vi.fn(() => Promise.resolve())

    createOscillator() {
        const oscillator: OscillatorStub = {
            type: 'sine',
            frequency: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
        }
        createdOscillators.push(oscillator)
        return oscillator
    }

    createGain() {
        return {
            gain: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
        }
    }
}

Object.defineProperty(globalThis, 'AudioContext', {
    configurable: true,
    writable: true,
    value: AudioContextStub,
})

if (typeof window !== 'undefined' && window.matchMedia === undefined) {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }),
    })
}

if (typeof window !== 'undefined') {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
}

beforeEach(() => {
    window.localStorage.clear()
    createdOscillators.length = 0
    document.documentElement.lang = 'de'
})

afterEach(() => {
    cleanup()
})
