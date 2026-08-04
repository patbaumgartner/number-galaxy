import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    RANKS,
    abortMission,
    advanceMission,
    createMission,
    getAnswered,
    getComboMultiplier,
    getCorrect,
    getQuestionSeconds,
    getStars,
    fadeWorking,
    scoreAnswer,
    type AnswerOutcome,
    type MissionState,
} from '../game'
import { RULESET_VERSION, store } from '../store'
import { translations } from '../i18n'
import { useCountdown, useDocumentLanguage, usePageVisible, useSoundSetting } from '../hooks'
import { playCombo, playCorrect, playShoot, playTimeout, playVictory, playWrong } from '../sound'

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

export type Feedback = {
    outcome: AnswerOutcome
    answer: string
    workingOut: string
    /** What this particular wrong tile meant, when it meant anything. */
    missNote: string
    firedIndex: number | null
    points: number
}

export type MissionResult = {
    score: number
    correct: number
    total: number
    stars: number
    bestStreak: number
    fastestMs: number | null
    newRecord: boolean
    newPersonalBest: boolean
}

/** Typing needs a number to type: an operator or a remainder has no such answer. */
const canBeTyped = (question: MissionState['question']): boolean =>
    question.form !== 'missingOperator' && question.operation !== 'remainders'

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

/**
 * Everything a mission run is, minus how it looks.
 *
 * The page that renders this had grown to hold the question engine, the clock,
 * the scoring, the record submission and the markup at once. Splitting the run
 * out leaves the page declarative and puts the whole lifecycle — where the
 * ordering between a tap, an expiring clock and a re-render actually matters —
 * in one place that can be read start to finish.
 */
export function useMissionRun() {
    const settings = useMemo(() => store.getSettings(), [])
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)
    const player = useMemo(() => store.ensurePlayer(t.home.defaultName, '🚀'), [t])

    const [mission, setMission] = useState<MissionState>(freshMission)
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const [helpOpen, setHelpOpen] = useState(false)
    const [result, setResult] = useState<MissionResult | null>(null)
    const [runs, setRuns] = useState(1)
    const [entry, setEntry] = useState('')
    const [askStrategy, setAskStrategy] = useState(false)

    const resolvedRef = useRef(false)
    const questionStartRef = useRef(0)
    const fastestRef = useRef<number | null>(null)
    const newBestRef = useRef(false)
    const submittedRef = useRef(false)

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

    const abort = useCallback(() => setMission(current => abortMission(current)), [])

    // Frozen for the question's lifetime: a miss drops the box, and the pad must
    // not turn back into four tiles while the child is still looking at it.
    const typedAnswer = useMemo(
        () => canBeTyped(mission.question) && store.getFactBox(mission.question.factKey) >= TYPED_FROM_BOX,
        [mission.question],
    )

    return {
        settings,
        t,
        player,
        mission,
        feedback,
        result,
        runs,
        entry,
        askStrategy,
        answered,
        seconds,
        remaining,
        helpOpen,
        answering: mission.phase === 'answering' && !helpOpen,
        typedAnswer,
        setEntry,
        setHelpOpen,
        fire,
        submitTyped,
        proceed,
        restart,
        easier,
        abort,
    }
}
