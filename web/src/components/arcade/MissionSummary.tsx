import type { Translations } from '../../i18n'
import type { SurpriseActions } from '../../hooks'
import { useModalDialog } from '../../hooks'
import { SHOW_SPEED_ABOVE, STRUGGLED_BELOW, type Language } from '../../game'

const CONFETTI_PIECES = 16

const RUNS_BEFORE_BREAK = 2

type MissionSummaryProps = {
    score: number
    correct: number
    total: number
    stars: number
    bestStreak: number
    fastestMs: number | null
    newRecord: boolean
    newPersonalBest: boolean
    /** Missions played back to back in this sitting, this one included. */
    runs: number
    /** False at the lowest rank, where there are no smaller numbers to offer. */
    canEase: boolean
    labels: Translations['summary']
    /** Formats the one decimal on this screen: Swiss children are taught the comma. */
    language: Language
    onPlayAgain: () => void
    onEasier: () => void
    onChangeMission: () => void
    onSeeScores: () => void
    /** Set when the picker chose this game, not the player. */
    surprise?: SurpriseActions | undefined
}

const seconds = (ms: number, language: Language): string =>
    new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000)

export default function MissionSummary({
    score,
    correct,
    total,
    stars,
    bestStreak,
    fastestMs,
    newRecord,
    newPersonalBest,
    runs,
    canEase,
    labels,
    language,
    surprise,
    onPlayAgain,
    onEasier,
    onChangeMission,
    onSeeScores,
}: MissionSummaryProps) {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const perfect = correct === total && total > 0
    const dialog = useModalDialog<HTMLDivElement>()

    // A fast run full of misses is not a faster child.
    const showSpeed = fastestMs !== null && total > 0 && correct / total >= SHOW_SPEED_ABOVE
    const struggled = total > 0 && correct / total < STRUGGLED_BELOW
    const offerBreak = runs >= RUNS_BEFORE_BREAK

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

                {newRecord && !struggled && <p className="summary__badge">🏆 {labels.newRecord}</p>}
                {newPersonalBest && showSpeed && (
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
                    {showSpeed && (
                        <div className="summary__stat">
                            <dt>{labels.fastest}</dt>
                            <dd>{seconds(fastestMs, language)}s</dd>
                        </div>
                    )}
                </dl>

                {struggled && canEase && <p className="summary__hint">{labels.easierHint}</p>}
                {!struggled && offerBreak && <p className="summary__hint">{labels.stopHint}</p>}

                <div className="summary__actions">
                    {surprise === undefined ? (
                        <>
                            {struggled && canEase && (
                                <button type="button" className="btn btn--primary btn--lg" onClick={onEasier}>
                                    {labels.easier}
                                </button>
                            )}
                            <button
                                type="button"
                                className={struggled && canEase ? 'btn btn--ghost' : 'btn btn--primary btn--lg'}
                                onClick={onPlayAgain}
                            >
                                {labels.playAgain}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={onChangeMission}>
                                {labels.changeMission}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={onSeeScores}>
                                {labels.seeScores}
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
