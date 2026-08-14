import type { CSSProperties } from 'react'

export type BeamSliderLabels = {
    readonly move: string
    readonly fire: string
    readonly less: string
    readonly more: string
}

type BeamSliderProps = {
    readonly max: number
    readonly step: number
    readonly value: number
    readonly alien: string
    readonly disabled: boolean
    readonly labels: BeamSliderLabels
    readonly onChange: (value: number) => void
    readonly onFire: () => void
}

const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, value))

/** 0, the middle and the end — enough to read a position without crowding the beam. */
function ticksFor(max: number, step: number): number[] {
    const middle = Math.round(max / 2 / step) * step
    return [...new Set([0, middle, max])].sort((a, b) => a - b)
}

/**
 * Answering by moving an alien along the bar instead of picking a number.
 *
 * The control underneath is a native range input, so dragging, tapping,
 * arrow keys, Home/End and screen-reader announcements all come for free; the
 * alien is drawn on top of its thumb, which is why the rail carries the
 * position as a unitless custom property the stylesheet can offset by half a
 * thumb width. The −/+ buttons exist because a fingertip on a phone cannot
 * reliably land on a single unit.
 *
 * Everything here is held with `aria-disabled` rather than `disabled`, because
 * `disabled` blurs whatever it lands on: a child answering from the keyboard
 * would be dropped out of the beam by their own answer, every question, and
 * have to walk back to it from the top of the page.
 */
export default function BeamSlider({
    max,
    step,
    value,
    alien,
    disabled,
    labels,
    onChange,
    onFire,
}: BeamSliderProps) {
    const position = max === 0 ? 0 : value / max
    const change = (next: number) => { if (!disabled) onChange(clamp(next, max)) }

    return (
        <div className="beam">
            <div className="beam__rail" style={{ '--beam-pos': position } as CSSProperties}>
                <span className="beam__alien" aria-hidden="true">{alien}</span>
                {/* The number sits inside the thumb: reading it off the ticks
                    means looking away from the thing being moved. */}
                <span className="beam__value" aria-hidden="true">{value}</span>
                <input
                    className="beam__range"
                    type="range"
                    min={0}
                    max={max}
                    step={step}
                    value={value}
                    aria-disabled={disabled}
                    aria-label={labels.move}
                    onChange={event => change(Number(event.target.value))}
                />
            </div>

            <div className="beam__ticks" aria-hidden="true">
                {ticksFor(max, step).map(tick => (
                    <span key={tick} className="beam__tick">{tick}</span>
                ))}
            </div>

            <div className="beam__controls">
                <button
                    type="button"
                    className="btn btn--ghost beam__nudge"
                    aria-label={labels.less}
                    aria-disabled={disabled || value <= 0}
                    onClick={() => change(value - step)}
                >
                    −
                </button>
                <button
                    type="button"
                    className="btn btn--primary beam__fire"
                    aria-disabled={disabled}
                    onClick={() => { if (!disabled) onFire() }}
                >
                    {labels.fire} {value}
                </button>
                <button
                    type="button"
                    className="btn btn--ghost beam__nudge"
                    aria-label={labels.more}
                    aria-disabled={disabled || value >= max}
                    onClick={() => change(value + step)}
                >
                    +
                </button>
            </div>
        </div>
    )
}
