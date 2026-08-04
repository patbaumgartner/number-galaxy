import { useModalDialog } from '../hooks'
import { fill, type Translations } from '../i18n'
import type { SurpriseActions } from '../hooks'

/** Both drills award the same three stars; the beam and sense types agree. */
export type DrillStarLevel = 0 | 1 | 2 | 3

export type DrillResult = {
    readonly correct: number
    readonly total: number
    readonly accuracy: number
    readonly bestStreak: number
    readonly stars: DrillStarLevel
    readonly gained: boolean
    readonly newBest: boolean
}

type DrillSummaryProps = {
    readonly labels: Translations['beam']
    readonly result: DrillResult
    readonly onPlayAgain: () => void
    readonly onExit: () => void
    /** Set when the picker chose this station, not the player. */
    readonly surprise?: SurpriseActions | undefined
}

/**
 * How a drill ends, for the beam and the sense stations alike.
 *
 * They used to end differently: the beam wore `.overlay`, the shell this app
 * uses for dialogs that ask something, while sense and the arcade wore
 * `.summary`, the one for a finished run. A result is not a question, so both
 * now use `.summary` — and the beam's flat run of ⭐ gives way to three fixed
 * stars, which say what is still there to earn as well as what was.
 *
 * Escape deliberately does nothing: a run ends by choosing what happens next.
 */
export default function DrillSummary({ labels, result, onPlayAgain, onExit, surprise }: DrillSummaryProps) {
    const dialog = useModalDialog<HTMLDivElement>()

    return (
        <div className="summary" role="dialog" aria-modal="true" aria-labelledby="drill-summary-title" ref={dialog}>
            <div className="summary__card">
                <h2 className="summary__title" id="drill-summary-title">{labels.summaryTitle}</h2>

                <div className="summary__stars" aria-label={`${result.stars}/3`}>
                    {[0, 1, 2].map(index => (
                        <span
                            key={index}
                            className={`summary__star${index < result.stars ? ' summary__star--earned' : ''}`}
                            style={{ animationDelay: `${index * 0.15}s` }}
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    ))}
                </div>

                {result.gained && <p className="summary__badge">⭐ {fill(labels.summaryStars, { n: result.stars })}</p>}
                {result.newBest && <p className="summary__badge">🏆 {labels.summaryNewBest}</p>}
                {/* "Keep practising for a star" only makes sense to somebody without one. */}
                {!result.gained && result.stars === 0 && <p className="summary__hint">{labels.summaryKeepGoing}</p>}

                <dl className="summary__stats">
                    <div className="summary__stat">
                        <dt>{labels.summaryAccuracy}</dt>
                        <dd>{result.correct}/{result.total} · {Math.round(result.accuracy * 100)}%</dd>
                    </div>
                    <div className="summary__stat">
                        <dt>{labels.summaryStreak}</dt>
                        <dd>{result.bestStreak}🔥</dd>
                    </div>
                </dl>

                <div className="summary__actions">
                    {surprise === undefined ? (
                        <>
                            <button type="button" className="btn btn--primary btn--lg" onClick={onPlayAgain}>
                                {labels.playAgain}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={onExit}>
                                {labels.exit}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn--primary btn--lg" onClick={surprise.onAgain}>
                                {surprise.againLabel}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={surprise.onHome}>
                                {surprise.homeLabel}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
