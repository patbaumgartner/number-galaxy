import type { Translations } from '../i18n'
import { useModalDialog } from '../hooks'

const CONFETTI_PIECES = 16

type MissionSummaryProps = {
    score: number
    correct: number
    total: number
    stars: number
    bestStreak: number
    fastestMs: number | null
    newRecord: boolean
    newPersonalBest: boolean
    labels: Translations['summary']
    onPlayAgain: () => void
    onChangeMission: () => void
    onSeeScores: () => void
}

export default function MissionSummary({
    score,
    correct,
    total,
    stars,
    bestStreak,
    fastestMs,
    newRecord,
    newPersonalBest,
    labels,
    onPlayAgain,
    onChangeMission,
    onSeeScores,
}: MissionSummaryProps) {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const perfect = correct === total && total > 0
    const dialog = useModalDialog<HTMLDivElement>()

    return (
        <div className="summary" role="dialog" aria-modal="true" aria-labelledby="summary-title" ref={dialog}>
            <div className="summary__card">
                {stars === 3 && (
                    <div className="summary__confetti" aria-hidden="true">
                        {Array.from({ length: CONFETTI_PIECES }, (_, index) => (
                            <span
                                key={index}
                                className="summary__confetti-piece"
                                style={{
                                    left: `${(index / CONFETTI_PIECES) * 100}%`,
                                    animationDelay: `${(index % 5) * 0.12}s`,
                                }}
                            />
                        ))}
                    </div>
                )}

                <h2 className="summary__title" id="summary-title">
                    {perfect ? labels.perfect : labels.complete}
                </h2>

                <div className="summary__stars" aria-label={`${stars}/3`}>
                    {[0, 1, 2].map(index => (
                        <span
                            key={index}
                            className={`summary__star${index < stars ? ' summary__star--earned' : ''}`}
                            style={{ animationDelay: `${index * 0.15}s` }}
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    ))}
                </div>

                <p className="summary__score">
                    {score}
                    <span className="summary__score-label">{labels.score}</span>
                </p>

                {newRecord && <p className="summary__badge">🏆 {labels.newRecord}</p>}
                {newPersonalBest && fastestMs !== null && (
                    <p className="summary__badge">⚡ {labels.newBest}</p>
                )}

                <dl className="summary__stats">
                    <div className="summary__stat">
                        <dt>{labels.accuracy}</dt>
                        <dd>{correct}/{total} · {accuracy}%</dd>
                    </div>
                    <div className="summary__stat">
                        <dt>{labels.bestStreak}</dt>
                        <dd>{bestStreak}🔥</dd>
                    </div>
                    {fastestMs !== null && (
                        <div className="summary__stat">
                            <dt>{labels.fastest}</dt>
                            <dd>{(fastestMs / 1000).toFixed(1)}s</dd>
                        </div>
                    )}
                </dl>

                <div className="summary__actions">
                    <button type="button" className="btn btn--primary btn--lg" onClick={onPlayAgain} autoFocus>
                        {labels.playAgain}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onChangeMission}>
                        {labels.changeMission}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onSeeScores}>
                        {labels.seeScores}
                    </button>
                </div>
            </div>
        </div>
    )
}
