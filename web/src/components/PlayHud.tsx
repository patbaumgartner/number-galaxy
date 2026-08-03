import type { ReactNode } from 'react'

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export type PlayStat = {
    readonly label: string
    readonly value: ReactNode
    /** Appended to `hud__stat--` for game-specific emphasis, e.g. the combo colours. */
    readonly modifier?: string
}

type PlayHudProps = {
    /** Two or three at most; they share one row and get equal typographic weight. */
    readonly stats: readonly PlayStat[]
    /** One step per question. `true` is a hit, `false` a miss, `undefined` still to come. */
    readonly results: readonly (boolean | undefined)[]
    readonly total: number
    /** Omit entirely for a game with no clock. */
    readonly timer?: { readonly seconds: number | null; readonly maxSeconds: number; readonly untimed: string } | undefined
}

/**
 * The status strip every game shows under the top bar.
 *
 * The three games used to present progress three different ways — a rich stat
 * row here, a bare "1 / 12" tucked inside a card there, a plain line somewhere
 * else — so moving between them felt like moving between three apps. Each game
 * still chooses *what* to show; this fixes where it sits and how it reads.
 */
export default function PlayHud({ stats, results, total, timer }: PlayHudProps) {
    const timed = timer !== undefined && timer.seconds !== null
    const seconds = timer?.seconds ?? 0
    const remaining = timed && timer.maxSeconds > 0 ? Math.max(0, seconds) / timer.maxSeconds : 1
    const urgent = timed && seconds <= 3

    return (
        <div className="hud">
            <div className="hud__stats">
                {stats.map(stat => (
                    <div key={stat.label} className={`hud__stat${stat.modifier === undefined ? '' : ` hud__stat--${stat.modifier}`}`}>
                        <span className="hud__label">{stat.label}</span>
                        <span className="hud__value">{stat.value}</span>
                    </div>
                ))}
            </div>

            {timer !== undefined && (
                <>
                    <div
                        className={`hud__timer${urgent ? ' hud__timer--urgent' : ''}${timed ? '' : ' hud__timer--off'}`}
                        aria-hidden="true"
                    >
                        <svg viewBox="0 0 64 64">
                            <circle className="hud__timer-track" cx="32" cy="32" r={RADIUS} />
                            <circle
                                className="hud__timer-fill"
                                cx="32"
                                cy="32"
                                r={RADIUS}
                                style={{
                                    strokeDasharray: CIRCUMFERENCE,
                                    strokeDashoffset: CIRCUMFERENCE * (1 - remaining),
                                }}
                            />
                        </svg>
                        <span className="hud__timer-value">{timed ? seconds : '∞'}</span>
                    </div>
                    {!timed && <p className="hud__untimed">{timer.untimed}</p>}
                </>
            )}

            <ol className="hud__trail" aria-hidden="true">
                {Array.from({ length: total }, (_unused, index) => {
                    const result = results[index]
                    const state = result === undefined ? 'todo' : result ? 'hit' : 'miss'
                    return <li key={index} className={`hud__trail-step hud__trail-step--${state}`} />
                })}
            </ol>
        </div>
    )
}
