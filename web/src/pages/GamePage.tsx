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
    scoreAnswer,
    type AnswerOutcome,
    type MissionState,
} from '../game'
import { RULESET_VERSION, store } from '../store'
import { translations } from '../i18n'
import AnswerGrid from '../components/arcade/AnswerGrid'
import TopBar from '../components/TopBar'
import WorkedExampleDialog from '../components/WorkedExampleDialog'
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
import {
    playCombo,
    playCorrect,
    playShoot,
    playTimeout,
    playVictory,
    playWrong,
} from '../sound'

const CORRECT_MS = 650

type Feedback = {
    outcome: AnswerOutcome
    answer: string
    workingOut: string
    firedIndex: number | null
    points: number
}

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
            timed: settings.timed,
            operations: settings.operations,
            weakness: store.getWeakness(),
            srData: store.getSpacedRepetition(),
            dueFacts: store.getDueFacts(),
            formAccuracy: store.getFormAccuracy(),
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
    const [result, setResult] = useState<MissionResult | null>(null)
    const [runs, setRuns] = useState(1)

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
    const seconds = getQuestionSeconds(mission.rank, mission.question.form)
    const visible = usePageVisible()

    /**
     * The single place an answer is committed. A tap and an expiring clock race
     * for the same question, so both funnel through this guard and only the
     * first one counts.
     */
    const resolve = useCallback((outcome: AnswerOutcome, firedIndex: number | null) => {
        if (resolvedRef.current || mission.phase !== 'answering') return
        resolvedRef.current = true

        const { question } = mission
        const wasCorrect = outcome === 'correct'
        const next = scoreAnswer(mission, outcome)
        const elapsed = Date.now() - questionStartRef.current

        store.recordAnswer(question.operation, wasCorrect, answered)
        store.recordFact(question.factKey, wasCorrect, elapsed)
        store.recordForm(question.form, wasCorrect)

        if (wasCorrect) {
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
                chosen: firedIndex === null ? '' : question.options[firedIndex],
                answer: question.answer,
                at: new Date().toISOString(),
            })
            if (outcome === 'timeout') playTimeout()
            else playWrong()
        }

        setFeedback({
            outcome,
            answer: question.answer,
            workingOut: question.workingOut,
            firedIndex,
            points: next.score - mission.score,
        })
        setMission(next)
    }, [mission, answered])

    const remaining = useCountdown({
        seconds,
        running: mission.phase === 'answering' && mission.timed && !helpOpen && visible,
        resetKey: answered,
        onExpire: () => resolve('timeout', null),
    })

    const fire = useCallback((index: number) => {
        if (mission.phase !== 'answering') return
        playShoot()
        resolve(index === mission.question.correctIndex ? 'correct' : 'wrong', index)
    }, [mission, resolve])

    useEffect(() => {
        if (mission.phase !== 'answering') return
        resolvedRef.current = false
        questionStartRef.current = Date.now()
    }, [mission.phase, mission.question])

    const proceed = useCallback(() => {
        setFeedback(null)
        setMission(current => advanceMission(current, {
            weakness: store.getWeakness(),
            srData: store.getSpacedRepetition(),
            dueFacts: store.getDueFacts(),
            formAccuracy: store.getFormAccuracy(),
        }))
    }, [])

    useEffect(() => {
        if (mission.phase !== 'feedback') return
        // A correct answer needs only a beat of applause. A miss holds until the
        // child says so: two seconds is under the time it takes to read a
        // two-step working, and unread feedback teaches nothing.
        if (feedback?.outcome !== 'correct') return
        const timer = setTimeout(proceed, CORRECT_MS)
        return () => clearTimeout(timer)
    }, [mission.phase, feedback?.outcome, proceed])

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
    const example = getWorkedExample(mission.question.operation, mission.language)
    const resultText = feedback && (feedback.outcome === 'correct'
        ? `${t.game.correct} +${feedback.points}`
        : `${feedback.outcome === 'timeout' ? t.game.timeUp : t.game.wrong} ${t.game.theAnswerIs} ${feedback.answer}`)

    return (
        <div className="page page--game">
            <TopBar
                back={{ label: t.nav.home, to: '/' }}
                title={<>🛸<span className="game-bar__hide-sm"> {t.home.gameInvaders}</span></>}
                actions={<>
                    <span className="game-bar__player">
                        <span aria-hidden="true">{player.avatarId}</span>
                        <span className="game-bar__hide-sm">{player.playerName}</span>
                    </span>
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
                        {t.game.quit}
                    </button>
                </>}
            />

            <main className="stage">
                <PlayHud
                    stats={[
                        { label: t.game.score, value: mission.score, modifier: 'score' },
                        {
                            label: t.game.combo,
                            value: <>×{getComboMultiplier(mission.streak)}{mission.streak >= 3 && <span className="hud__flame" aria-hidden="true">🔥</span>}</>,
                            modifier: `combo hud__stat--x${getComboMultiplier(mission.streak)}`,
                        },
                        { label: t.play.question, value: `${answered}/${QUESTIONS_PER_MISSION}` },
                    ]}
                    results={mission.results}
                    total={QUESTIONS_PER_MISSION}
                    timer={{ seconds: mission.timed ? remaining : null, maxSeconds: seconds, untimed: t.game.untimed }}
                />

                <section className={`equation${feedback ? ` equation--${feedback.outcome}` : ''}`}>
                    <p className="equation__prompt">{mission.question.prompt}</p>
                    <p className="equation__result" aria-live="polite">
                        {resultText || t.game.answerHint}
                    </p>
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
                </section>

                <AnswerGrid
                    options={mission.question.options}
                    disabled={!answering}
                    firedIndex={feedback?.firedIndex ?? null}
                    revealIndex={feedback ? mission.question.correctIndex : null}
                    groupLabel={t.game.answerHint}
                    optionLabel={option => option}
                    onFire={fire}
                />

                <p className="stage__rocket" aria-hidden="true">🚀</p>
            </main>

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
