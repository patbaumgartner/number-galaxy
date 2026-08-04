import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
    QUESTIONS_PER_MISSION,
    RANKS,
    abortMission,
    advanceMission,
    createMission,
    getAnswered,
    getComboMultiplier,
    getCorrect,
    getQuestionSeconds,
    getStars,
    getWorkedExample,
    fadeWorking,
    scoreAnswer,
    type AnswerOutcome,
    type MissionState,
} from '../game'
import { RULESET_VERSION, store } from '../store'
import { translations } from '../i18n'
import AnswerGrid from '../components/arcade/AnswerGrid'
import { NumberPad } from '../components/trainer/NumberPad'
import TopBar from '../components/TopBar'
import WorkedExampleDialog from '../components/WorkedExampleDialog'
import HowToPlayDialog from '../components/HowToPlayDialog'
import PlayHud from '../components/PlayHud'
import MissionSummary from '../components/arcade/MissionSummary'
import {
    useCountdown,
    useDocumentLanguage,
    usePageVisible,
    useSoundSetting,
    useSurpriseRun,
    type SurpriseActions,
} from '../hooks'
import { canSpeak, speak } from '../speech'
import {
    playCombo,
    playCorrect,
    playShoot,
    playTimeout,
    playVictory,
    playWrong,
} from '../sound'

const CORRECT_MS = 650

/**
 * The box from which a fact is typed rather than picked from four tiles.
 *
 * Recognising an answer among four and producing one are not the same skill, and
 * it is producing it that predicts being able to use the fact elsewhere. But
 * typing is the harder ask, so it waits until a fact is owned — the tiles are how
 * a child meets something, the pad is how they show they have it. This is the
 * same box at which the worked example is withdrawn, so a fact stops being
 * explained and starts being asked for outright at the same moment.
 */
const TYPED_FROM_BOX = 4

/**
 * How often a correct answer is asked about.
 *
 * Rarely. Whether an answer was recalled or counted is the most diagnostic thing
 * about it and invisible from the outside, but the fast correct-answer loop is a
 * real strength of this game and interrupting every one of them would cost more
 * than it returns. The value is in the trend, not in any single answer.
 */
const ASK_STRATEGY_SHARE = 0.12

/** Long enough to answer if you want to, short enough to ignore. */
const STRATEGY_MS = 3600

type Feedback = {
    outcome: AnswerOutcome
    answer: string
    workingOut: string
    /** What this particular wrong tile meant, when it meant anything. */
    missNote: string
    firedIndex: number | null
    points: number
}

/** Typing needs a number to type: an operator or a remainder has no such answer. */
const canBeTyped = (question: MissionState['question']): boolean =>
    question.form !== 'missingOperator' && question.operation !== 'remainders'

type MissionResult = {
    score: number
    correct: number
    total: number
    stars: number
    bestStreak: number
    fastestMs: number | null
    newRecord: boolean
    newPersonalBest: boolean
}

function freshMission(): MissionState {
    const settings = store.getSettings()
    return {
        ...createMission({
            language: settings.language,
            rank: settings.rank,
            maxValue: store.getWorkingMax(settings.rank),
            timed: settings.timer === 'timed',
            operations: settings.operations,
            weakness: store.getWeakness(),
            srData: store.getSpacedRepetition(),
            dueFacts: store.getDueFacts(),
            formAccuracy: store.getFormAccuracy(),
            stories: settings.stories,
        }),
        // Straight into the action — pressing Play already was the "start".
        phase: 'answering',
    }
}

export default function GamePage() {
    const navigate = useNavigate()
    const settings = useMemo(() => store.getSettings(), [])
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)
    const player = useMemo(() => store.ensurePlayer(t.home.defaultName, '🚀'), [t])

    const [mission, setMission] = useState<MissionState>(freshMission)
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const [helpOpen, setHelpOpen] = useState(false)
    const [howToOpen, setHowToOpen] = useState(false)
    const [result, setResult] = useState<MissionResult | null>(null)
    const [runs, setRuns] = useState(1)
    const [entry, setEntry] = useState('')
    const [askStrategy, setAskStrategy] = useState(false)

    const resolvedRef = useRef(false)
    const questionStartRef = useRef(0)
    const fastestRef = useRef<number | null>(null)
    const newBestRef = useRef(false)
    const submittedRef = useRef(false)
    const surprise = useSurpriseRun()

    const surpriseActions: SurpriseActions | undefined = surprise.active
        ? {
            againLabel: t.surprise.again,
            homeLabel: t.nav.home,
            onAgain: surprise.again,
            onHome: surprise.home,
        }
        : undefined

    useSoundSetting()

    const answered = getAnswered(mission)
    const seconds = Math.round(getQuestionSeconds(mission.rank, mission.question.form) * settings.thinkingTime)
    const visible = usePageVisible()

    /**
     * The single place an answer is committed. A tap and an expiring clock race
     * for the same question, so both funnel through this guard and only the
     * first one counts.
     */
    const resolve = useCallback((outcome: AnswerOutcome, firedIndex: number | null, chosen: string) => {
        if (resolvedRef.current || mission.phase !== 'answering') return
        resolvedRef.current = true

        const { question } = mission
        const wasCorrect = outcome === 'correct'
        const next = scoreAnswer(mission, outcome)
        const elapsed = Date.now() - questionStartRef.current
        // Read before recording: a miss drops the box, and how much of the route
        // to show depends on what the child knew going in, not coming out.
        const priorBox = store.getFactBox(question.factKey)
        const reason = question.missReasons[chosen] ?? 'none'

        store.recordAnswer(question.operation, wasCorrect, answered)
        store.recordFact(question.factKey, wasCorrect, elapsed)
        store.recordForm(question.form, wasCorrect)
        store.recordRankAnswer(mission.rank, wasCorrect)

        if (wasCorrect) {
            setAskStrategy(Math.random() < ASK_STRATEGY_SHARE)
            if (store.updatePersonalBest(question.operation, elapsed)) newBestRef.current = true
            if (fastestRef.current === null || elapsed < fastestRef.current) fastestRef.current = elapsed

            const multiplier = getComboMultiplier(next.streak)
            if (multiplier > getComboMultiplier(mission.streak)) playCombo(multiplier)
            else playCorrect()
        } else {
            store.recordMiss({
                operation: question.operation,
                form: question.form,
                prompt: question.prompt,
                chosen,
                reason,
                answer: question.answer,
                at: new Date().toISOString(),
            })
            if (outcome === 'timeout') playTimeout()
            else playWrong()
        }

        setFeedback({
            outcome,
            answer: question.answer,
            missNote: reason === 'none' ? '' : t.misses[reason],
            workingOut: fadeWorking(question.workingOut, priorBox),
            firedIndex,
            points: next.score - mission.score,
        })
        setMission(next)
    }, [mission, answered, t])

    const remaining = useCountdown({
        seconds,
        running: mission.phase === 'answering' && settings.timer !== 'off' && !helpOpen && visible,
        resetKey: answered,
        // A gentle clock shows the time going by and then simply stops.
        onExpire: () => { if (settings.timer === 'timed') resolve('timeout', null, '') },
    })

    const fire = useCallback((index: number) => {
        if (mission.phase !== 'answering') return
        playShoot()
        const option = mission.question.options[index]
        resolve(index === mission.question.correctIndex ? 'correct' : 'wrong', index, option)
    }, [mission, resolve])

    const submitTyped = useCallback(() => {
        if (mission.phase !== 'answering' || entry.length === 0) return
        playShoot()
        resolve(entry === mission.question.answer ? 'correct' : 'wrong', null, entry)
    }, [mission, resolve, entry])

    useEffect(() => {
        if (mission.phase !== 'answering') return
        resolvedRef.current = false
        questionStartRef.current = Date.now()
    }, [mission.phase, mission.question])

    const proceed = useCallback(() => {
        setFeedback(null)
        setEntry('')
        setAskStrategy(false)
        setMission(current => advanceMission(current, {
            weakness: store.getWeakness(),
            srData: store.getSpacedRepetition(),
            dueFacts: store.getDueFacts(),
            formAccuracy: store.getFormAccuracy(),
            stories: store.getSettings().stories,
        }))
    }, [])

    useEffect(() => {
        if (mission.phase !== 'feedback') return
        // A correct answer needs only a beat of applause. A miss holds until the
        // child says so: two seconds is under the time it takes to read a
        // two-step working, and unread feedback teaches nothing.
        if (feedback?.outcome !== 'correct') return
        // Asking never blocks: unanswered, it simply times out and moves on.
        const timer = setTimeout(proceed, askStrategy ? STRATEGY_MS : CORRECT_MS)
        return () => clearTimeout(timer)
    }, [mission.phase, feedback?.outcome, askStrategy, proceed])

    useEffect(() => {
        if (mission.phase !== 'summary' || submittedRef.current) return
        submittedRef.current = true

        const correct = getCorrect(mission)
        const total = getAnswered(mission)
        const stars = getStars(correct, total)
        playVictory()

        const { improved } = store.submitScore({
            playerId: player.id,
            player: player.playerName,
            avatarId: player.avatarId,
            rulesetVersion: RULESET_VERSION,
            rank: mission.rank,
            timed: mission.timed,
            operations: mission.operations,
            score: mission.score,
            correct,
            total,
            stars,
            bestStreak: mission.bestStreak,
            updatedAt: new Date().toISOString(),
        })

        setResult({
            score: mission.score,
            correct,
            total,
            stars,
            bestStreak: mission.bestStreak,
            fastestMs: fastestRef.current,
            newRecord: improved,
            newPersonalBest: newBestRef.current,
        })
    }, [mission, player])

    const restart = useCallback(() => {
        resolvedRef.current = false
        submittedRef.current = false
        fastestRef.current = null
        newBestRef.current = false
        setResult(null)
        setFeedback(null)
        setEntry('')
        setAskStrategy(false)
        setHelpOpen(false)
        setRuns(count => count + 1)
        setMission(freshMission())
    }, [])

    /** Drops one rank and starts over — offered instead of a zero-star verdict. */
    const easier = useCallback(() => {
        const current = store.getSettings()
        const index = RANKS.indexOf(current.rank)
        if (index > 0) store.saveSettings({ ...current, rank: RANKS[index - 1] })
        restart()
    }, [restart])

    const answering = mission.phase === 'answering' && !helpOpen
    // Frozen for the question's lifetime: a miss drops the box, and the pad must
    // not turn back into four tiles while the child is still looking at it.
    const typedAnswer = useMemo(
        () => canBeTyped(mission.question) && store.getFactBox(mission.question.factKey) >= TYPED_FROM_BOX,
        [mission.question],
    )
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
                        onClick={() => setMission(abortMission(mission))}
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
