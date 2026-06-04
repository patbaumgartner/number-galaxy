// Web Audio API sound effects — no files, no dependencies
// All sounds are synthesised in the browser.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
}

function beep(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    gain = 0.18,
    fadeOut = true,
) {
    try {
        const c = getCtx()
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
        // Silently ignore if audio is blocked
    }
}

export function playCorrect() {
    // Rising two-note arpeggio
    beep(523, 0.1, 'triangle', 0.15)       // C5
    setTimeout(() => beep(784, 0.15, 'triangle', 0.15), 90)  // G5
}

export function playWrong() {
    // Low descending buzz
    beep(180, 0.12, 'sawtooth', 0.2)
    setTimeout(() => beep(130, 0.18, 'sawtooth', 0.18), 100)
}

export function playShoot() {
    // Short laser zap
    try {
        const c = getCtx()
        const osc = c.createOscillator()
        const vol = c.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(900, c.currentTime)
        osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.12)
        vol.gain.setValueAtTime(0.12, c.currentTime)
        vol.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
        osc.connect(vol)
        vol.connect(c.destination)
        osc.start(c.currentTime)
        osc.stop(c.currentTime + 0.13)
    } catch { /* ignore */ }
}

export function playLevelUp() {
    // Ascending 4-note fanfare
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
        setTimeout(() => beep(freq, 0.12, 'triangle', 0.15), i * 80)
    })
}

export function playTimeout() {
    // Triple low alarm pulse
    ;[0, 120, 240].forEach(delay => {
        setTimeout(() => beep(220, 0.09, 'square', 0.18, false), delay)
    })
}
