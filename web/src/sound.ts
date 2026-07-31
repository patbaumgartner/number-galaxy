let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(value: boolean): void {
    enabled = value
}

function getCtx(): AudioContext | null {
    try {
        if (!ctx) ctx = new AudioContext()
        if (ctx.state === 'suspended') void ctx.resume()
        return ctx
    } catch {
        return null
    }
}

function beep(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    gain = 0.18,
    fadeOut = true,
) {
    if (!enabled) return
    const c = getCtx()
    if (!c) return
    try {
        const osc = c.createOscillator()
        const vol = c.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(frequency, c.currentTime)
        vol.gain.setValueAtTime(gain, c.currentTime)
        if (fadeOut) vol.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
        osc.connect(vol)
        vol.connect(c.destination)
        osc.start(c.currentTime)
        osc.stop(c.currentTime + duration)
    } catch {
        /* audio blocked — the game stays playable without it */
    }
}

function sequence(notes: number[], spacing: number, duration: number, gain = 0.15) {
    notes.forEach((frequency, index) => {
        setTimeout(() => beep(frequency, duration, 'triangle', gain), index * spacing)
    })
}

export function playShoot() {
    if (!enabled) return
    const c = getCtx()
    if (!c) return
    try {
        const osc = c.createOscillator()
        const vol = c.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(900, c.currentTime)
        osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.12)
        vol.gain.setValueAtTime(0.1, c.currentTime)
        vol.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
        osc.connect(vol)
        vol.connect(c.destination)
        osc.start(c.currentTime)
        osc.stop(c.currentTime + 0.13)
    } catch {
        /* ignore */
    }
}

export function playCorrect() {
    sequence([523, 784], 90, 0.13)
}

/** Rises with the multiplier, so a bigger combo literally sounds bigger. */
export function playCombo(multiplier: number) {
    sequence([523, 659, 784, 1047].slice(0, Math.min(4, multiplier + 1)), 70, 0.11, 0.16)
}

export function playWrong() {
    beep(180, 0.12, 'sawtooth', 0.18)
    setTimeout(() => beep(130, 0.18, 'sawtooth', 0.16), 100)
}

export function playTimeout() {
    for (const delay of [0, 120, 240]) {
        setTimeout(() => beep(220, 0.09, 'square', 0.16, false), delay)
    }
}

export function playVictory() {
    sequence([523, 659, 784, 1047, 1319], 110, 0.18, 0.16)
}
