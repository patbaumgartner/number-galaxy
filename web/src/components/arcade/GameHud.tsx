const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type GameHudProps = {
    score: number
    combo: number
    streak: number
    results: boolean[]
    total: number
    /** `null` when the countdown is switched off. */
    seconds: number | null
    maxSeconds: number
    labels: { score: string; combo: string; question: string; untimed: string }
}

export default function GameHud({
    score,
    combo,
    streak,
    results,
    total,
    seconds,
    maxSeconds,
    labels,
}: GameHudProps) {
    const timed = seconds !== null
    const remaining = timed && maxSeconds > 0 ? Math.max(0, seconds) / maxSeconds : 1
    const urgent = timed && seconds <= 3

    return (
        <div className="hud">
            <div className="hud__stats">
                <div className="hud__stat">
                    <span className="hud__label">{labels.score}</span>
                    <span className="hud__value hud__value--score">{score}</span>
                </div>

                <div className={`hud__stat hud__stat--combo hud__stat--x${combo}`}>
                    <span className="hud__label">{labels.combo}</span>
                    <span className="hud__value">
                        ×{combo}
                        {streak >= 3 && <span className="hud__flame" aria-hidden="true">🔥</span>}
                    </span>
                </div>

                <div className="hud__stat">
                    <span className="hud__label">{labels.question}</span>
                    <span className="hud__value">{results.length}/{total}</span>
                </div>
            </div>

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
            {!timed && <p className="hud__untimed">{labels.untimed}</p>}

            {/* Visual echo of the "question x of y" stat above. */}
            <ol className="hud__trail" aria-hidden="true">
                {Array.from({ length: total }, (_, index) => {
                    const result = results[index]
                    const state = result === undefined ? 'todo' : result ? 'hit' : 'miss'
                    return <li key={index} className={`hud__trail-step hud__trail-step--${state}`} />
                })}
            </ol>
        </div>
    )
}
