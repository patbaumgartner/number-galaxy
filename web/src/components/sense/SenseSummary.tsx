import type { SenseStarLevel } from '../../sense'
import type { SurpriseActions } from '../../hooks'
import { fill, type Translations } from '../../i18n'

export type SenseResult = {
    readonly correct: number
    readonly total: number
    readonly accuracy: number
    readonly bestStreak: number
    readonly stars: SenseStarLevel
    readonly gained: boolean
    readonly newBest: boolean
}

type SenseSummaryProps = {
    readonly labels: Translations
    readonly result: SenseResult
    readonly onPlayAgain: () => void
    readonly onExit: () => void
    readonly surprise?: SurpriseActions | undefined
}

/** How a sense drill ends. Shares the arcade's summary markup, not the beam's. */
export default function SenseSummary({ labels, result, onPlayAgain, onExit, surprise }: SenseSummaryProps) {
    const t = labels.beam

    return (
        <div className="summary" role="dialog" aria-modal="true" aria-labelledby="sense-summary-title">
            <div className="summary__card">
                <h2 className="summary__title" id="sense-summary-title">{t.summaryTitle}</h2>
                <div className="summary__stars" aria-label={`${result.stars}/3`}>
                    {[0, 1, 2].map(index => (
                        <span
                            key={index}
                            className={`summary__star${index < result.stars ? ' summary__star--earned' : ''}`}
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    ))}
                </div>

                {result.gained && <p className="summary__badge">⭐ {fill(t.summaryStars, { n: result.stars })}</p>}
                {result.newBest && <p className="summary__badge">🏆 {t.summaryNewBest}</p>}
                {!result.gained && !result.newBest && <p className="summary__hint">{t.summaryKeepGoing}</p>}

                <dl className="summary__stats">
                    <div className="summary__stat">
                        <dt>{t.summaryAccuracy}</dt>
                        <dd>{result.correct}/{result.total}</dd>
                    </div>
                    <div className="summary__stat">
                        <dt>{t.summaryStreak}</dt>
                        <dd>{result.bestStreak}🔥</dd>
                    </div>
                </dl>

                <div className="summary__actions">
                    {surprise === undefined ? (
                        <>
                            <button type="button" className="btn btn--primary btn--lg" onClick={onPlayAgain}>
                                {t.playAgain}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={onExit}>
                                {t.exit}
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
