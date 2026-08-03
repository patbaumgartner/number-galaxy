import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
    QUESTIONS_PER_MISSION,
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
    type WorkedExample,
} from '../game'
import { RULESET_VERSION, store } from '../store'
import { translations } from '../i18n'
import AnswerGrid from '../components/AnswerGrid'
import TopBar from '../components/TopBar'
import GameHud from '../components/GameHud'
import MissionSummary from '../components/MissionSummary'
import { useCountdown, useDocumentLanguage, useModalDialog, usePageVisible, useSoundSetting } from '../hooks'
import {
    playCombo,
    playCorrect,
    playShoot,
    playTimeout,
    playVictory,
    playWrong,
} from '../sound'

const CORRECT_MS = 650
const WRONG_MS = 2000

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

    const resolvedRef = useRef(false)
    const questionStartRef = useRef(0)
    const fastestRef = useRef<number | null>(null)
    const newBestRef = useRef(false)
    const submittedRef = useRef(false)

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

        store.recordAnswer(question.operation, wasCorrect, answered)

        if (wasCorrect) {
            const elapsed = Date.now() - questionStartRef.current
            if (store.updatePersonalBest(question.operation, elapsed)) newBestRef.current = true
            if (fastestRef.current === null || elapsed < fastestRef.current) fastestRef.current = elapsed

            const multiplier = getComboMultiplier(next.streak)
            if (multiplier > getComboMultiplier(mission.streak)) playCombo(multiplier)
            else playCorrect()
        } else if (outcome === 'timeout') {
            playTimeout()
        } else {
            playWrong()
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

    useEffect(() => {
        if (mission.phase !== 'feedback') return
        const timer = setTimeout(() => {
            setFeedback(null)
            setMission(current => advanceMission(current, {
                weakness: store.getWeakness(),
                srData: store.getSpacedRepetition(),
            }))
        }, feedback?.outcome === 'correct' ? CORRECT_MS : WRONG_MS)
        return () => clearTimeout(timer)
    }, [mission.phase, feedback?.outcome])

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
        setMission(freshMission())
    }, [])

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
                <GameHud
                    score={mission.score}
                    combo={getComboMultiplier(mission.streak)}
                    streak={mission.streak}
                    results={mission.results}
                    total={QUESTIONS_PER_MISSION}
                    seconds={mission.timed ? remaining : null}
                    maxSeconds={seconds}
                    labels={{
                        score: t.game.score,
                        combo: t.game.combo,
                        question: t.game.question,
                        untimed: t.game.untimed,
                    }}
                />

                <section className={`equation${feedback ? ` equation--${feedback.outcome}` : ''}`}>
                    <p className="equation__prompt">{mission.question.prompt}</p>
                    <p className="equation__result" aria-live="polite">
                        {resultText || t.game.answerHint}
                    </p>
                    {feedback && feedback.outcome !== 'correct' && settings.hints && (
                        <p className="equation__working">{feedback.workingOut}</p>
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
                <HelpOverlay
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
                    labels={t.summary}
                    onPlayAgain={restart}
                    onChangeMission={() => navigate('/settings')}
                    onSeeScores={() => navigate('/hall-of-fame')}
                />
            )}
        </div>
    )
}

type HelpOverlayProps = {
    title: string
    close: string
    example: WorkedExample
    onClose: () => void
}

function HelpOverlay({ title, close, example, onClose }: HelpOverlayProps) {
    const dialog = useModalDialog<HTMLDivElement>(onClose)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="help-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="help-title">💡 {title}</h2>
                <p className="overlay__example">
                    <span>{example.prompt}</span>
                    <strong>{example.answer}</strong>
                </p>
                <p className="overlay__steps">{example.steps}</p>
                <button type="button" className="btn btn--primary" onClick={onClose} autoFocus>
                    {close}
                </button>
            </div>
        </div>
    )
}
