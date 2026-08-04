import type { BeamStarLevel } from '../../beam'
import { useModalDialog, type SurpriseActions } from '../../hooks'
import { fill, type Translations } from '../../i18n'

export type DrillResult = {
    readonly correct: number
    readonly total: number
    readonly accuracy: number
    readonly bestStreak: number
    readonly stars: BeamStarLevel
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

/** How a beam drill ends: stars earned, what was right, and where to go next. */
export default function DrillSummary({ labels, result, onPlayAgain, onExit, surprise }: DrillSummaryProps) {
    const dialog = useModalDialog<HTMLDivElement>()

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="beam-summary-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="beam-summary-title">{labels.summaryTitle}</h2>
                <p className="overlay__stars" aria-label={`${result.stars} stars`}>
                    {'⭐'.repeat(result.stars) || '☆'}
                </p>
                <p className="overlay__steps">
                    {labels.summaryAccuracy}: {result.correct}/{result.total} ({Math.round(result.accuracy * 100)}%)
                    {' · '}
                    {labels.summaryStreak}: {result.bestStreak}
                </p>
                {result.gained && <p className="overlay__note">{fill(labels.summaryStars, { n: result.stars })}</p>}
                {result.newBest && <p className="overlay__note">{labels.summaryNewBest}</p>}
                {!result.gained && result.stars === 0 && <p className="overlay__note">{labels.summaryKeepGoing}</p>}
                <div className="overlay__actions">
                    {surprise === undefined ? (
                        <>
                            <button type="button" className="btn btn--primary" onClick={onPlayAgain}>
                                {labels.playAgain}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={onExit}>
                                {labels.exit}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn--primary" onClick={surprise.onAgain}>
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
