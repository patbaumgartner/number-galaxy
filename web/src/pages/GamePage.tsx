import { useState } from 'react'
import { useNavigate } from 'react-router'
import { QUESTIONS_PER_MISSION, RANKS, getComboMultiplier, getWorkedExample } from '../game'
import { store } from '../store'
import AnswerGrid from '../components/arcade/AnswerGrid'
import { NumberPad } from '../components/trainer/NumberPad'
import TopBar from '../components/TopBar'
import WorkedExampleDialog from '../components/WorkedExampleDialog'
import HowToPlayDialog from '../components/HowToPlayDialog'
import PlayHud from '../components/PlayHud'
import MissionSummary from '../components/arcade/MissionSummary'
import { useSurpriseActions } from '../hooks'
import { canSpeak, speak } from '../speech'
import { useMissionRun } from './useMissionRun'

export default function GamePage() {
    const navigate = useNavigate()
    const [howToOpen, setHowToOpen] = useState(false)
    const run = useMissionRun()
    const {
        settings, t, player, mission, feedback, result, runs, entry, askStrategy,
        answered, seconds, remaining, helpOpen, answering, typedAnswer,
        setEntry, setHelpOpen, fire, submitTyped, proceed, restart, easier, abort,
    } = run
    const surpriseActions = useSurpriseActions(t)

    const example = getWorkedExample(mission.question.operation, mission.language, mission.question.route)
    const resultText = feedback && (feedback.outcome === 'correct'
        ? `${t.game.correct} +${feedback.points}`
        : `${feedback.outcome === 'timeout' ? t.game.timeUp : t.game.wrong} ${t.game.theAnswerIs} ${feedback.answer}`)

    return (
        <div className="page page--game">
            <TopBar
                back={{ label: t.game.exit, to: '/game' }}
                title={<>🛸<span className="game-bar__hide-sm"> {t.home.gameInvaders}</span></>}
                actions={<>
                    <span className="game-bar__player">
                        <span aria-hidden="true">{player.avatarId}</span>
                        <span className="game-bar__hide-sm">{player.playerName}</span>
                    </span>
                    <button type="button" className="btn btn--icon" onClick={() => setHowToOpen(true)}>
                        ℹ️<span className="game-bar__hide-sm"> {t.home.howToPlay}</span>
                    </button>
                    {settings.hints && (
                        <button
                            type="button"
                            className="btn btn--icon"
                            onClick={() => setHelpOpen(true)}
                            disabled={mission.phase === 'summary'}
                        >
                            💡<span className="game-bar__hide-sm"> {t.game.help}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn--icon"
                        onClick={abort}
                        disabled={mission.phase === 'summary'}
                    >
                        🚪<span className="game-bar__hide-sm"> {t.game.quit}</span>
                    </button>
                </>}
            />

            <main className="stage">
                <PlayHud
                    stats={[
                        ...(settings.showScore
                            ? [
                                { label: t.game.score, value: mission.score, modifier: 'score' },
                                {
                                    label: t.game.combo,
                                    value: <>×{getComboMultiplier(mission.streak)}{mission.streak >= 3 && <span className="hud__flame" aria-hidden="true">🔥</span>}</>,
                                    modifier: `combo hud__stat--x${getComboMultiplier(mission.streak)}`,
                                },
                            ]
                            : []),
                        { label: t.play.question, value: `${answered}/${QUESTIONS_PER_MISSION}` },
                    ]}
                    results={mission.results}
                    total={QUESTIONS_PER_MISSION}
                    timer={{ seconds: settings.timer === 'off' ? null : remaining, maxSeconds: seconds, untimed: t.game.untimed }}
                />

                <section className={`equation${feedback ? ` equation--${feedback.outcome}` : ''}`}>
                    {mission.question.story.length > 0 && (
                        <div className="equation__story-row">
                            <p className="equation__story">{mission.question.story}</p>
                            {canSpeak() && (
                                <button
                                    type="button"
                                    className="btn btn--icon equation__speak"
                                    onClick={() => speak(mission.question.story, settings.language)}
                                    aria-label={t.game.readAloud}
                                >
                                    🔊
                                </button>
                            )}
                        </div>
                    )}
                    <p className={`equation__prompt${mission.question.story.length > 0 ? ' equation__prompt--small' : ''}`}>
                        {mission.question.story.length > 0 && feedback === null ? '?' : mission.question.prompt}
                    </p>
                    <p className="equation__result" aria-live="polite">
                        {resultText || t.game.answerHint}
                    </p>
                    {feedback && feedback.missNote.length > 0 && settings.hints && (
                        <p className="equation__note">{feedback.missNote}</p>
                    )}
                    {feedback && feedback.outcome !== 'correct' && settings.hints && (
                        <p className="equation__working">{feedback.workingOut}</p>
                    )}
                    {feedback && feedback.outcome !== 'correct' && mission.phase === 'feedback' && (
                        <button type="button" className="btn btn--primary equation__next" onClick={proceed} autoFocus>
                            {t.game.gotIt}
                        </button>
                    )}
                    {feedback?.outcome === 'correct' && (
                        <span className="equation__pop" aria-hidden="true">+{feedback.points}</span>
                    )}
                    {askStrategy && feedback?.outcome === 'correct' && mission.phase === 'feedback' && (
                        <div className="strategy">
                            <p className="strategy__ask">{t.game.strategyAsk}</p>
                            <div className="strategy__options">
                                {([
                                    ['knew', t.game.strategyKnew, '🧠'],
                                    ['counted', t.game.strategyCounted, '➕'],
                                    ['trick', t.game.strategyTrick, '💡'],
                                ] as const).map(([value, label, icon]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className="btn btn--ghost strategy__option"
                                        onClick={() => {
                                            store.recordStrategy(mission.question.operation, value)
                                            proceed()
                                        }}
                                    >
                                        <span aria-hidden="true">{icon}</span> {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {typedAnswer ? (
                    <NumberPad
                        value={entry}
                        onChange={setEntry}
                        onSubmit={submitTyped}
                        disabled={!answering}
                        maxLength={String(mission.maxValue).length}
                    />
                ) : (
                    <AnswerGrid
                        options={mission.question.options}
                        disabled={!answering}
                        firedIndex={feedback?.firedIndex ?? null}
                        revealIndex={feedback ? mission.question.correctIndex : null}
                        groupLabel={t.game.answerHint}
                        optionLabel={option => option}
                        onFire={fire}
                    />
                )}

                <p className="stage__rocket" aria-hidden="true">🚀</p>
            </main>

            {howToOpen && (
                <HowToPlayDialog
                    title={t.home.howToTitle}
                    steps={t.home.howToSteps}
                    close={t.game.helpClose}
                    onClose={() => setHowToOpen(false)}
                />
            )}

            {helpOpen && (
                <WorkedExampleDialog
                    title={t.game.helpTitle}
                    close={t.game.helpClose}
                    example={example}
                    onClose={() => setHelpOpen(false)}
                />
            )}

            {result && (
                <MissionSummary
                    language={settings.language}
                    score={result.score}
                    correct={result.correct}
                    total={result.total}
                    stars={result.stars}
                    bestStreak={result.bestStreak}
                    fastestMs={result.fastestMs}
                    newRecord={result.newRecord}
                    newPersonalBest={result.newPersonalBest}
                    runs={runs}
                    canEase={RANKS.indexOf(mission.rank) > 0}
                    labels={t.summary}
                    onPlayAgain={restart}
                    onEasier={easier}
                    onChangeMission={() => navigate('/settings')}
                    onSeeScores={() => navigate('/hall-of-fame')}
                    surprise={surpriseActions}
                />
            )}
        </div>
    )
}
