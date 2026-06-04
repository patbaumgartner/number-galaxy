import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRound, nextQuestion, getQuestionTime, getWave, getEffectiveLevel, getWorkedExample, type GameState, type Operation } from '../game'
import { store, computeBadge, BADGE_EMOJI } from '../store'
import Navigation from '../components/Navigation'
import GameBoard from '../components/GameBoard'
import { TOTAL_QUESTIONS_PER_RUN } from '../constants'
import { translations } from '../translations'
import { playCorrect, playWrong, playShoot, playLevelUp, playTimeout } from '../sound'
import { explainAnswer } from '../explain'
import { getRandomTip } from '../tips'

const CIRCUMFERENCE = 2 * Math.PI * 28

export default function GamePage() {
    const navigate = useNavigate()
    const player = store.getPlayer()
    const settings = store.getSettings()
    const t = translations[settings.language]

    const [gameState, setGameState] = useState<GameState>(() =>
        createRound(settings.language, settings.operations, settings.level, settings.difficulty)
    )
    const [selectedLane, setSelectedLane] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [blastLane, setBlastLane] = useState<number | null>(null)
    const [launchLane, setLaunchLane] = useState<number | null>(null)
    const [maxTime, setMaxTime] = useState(() => getQuestionTime(settings.level, settings.difficulty))
    const [countdown, setCountdown] = useState(() => getQuestionTime(settings.level, settings.difficulty))
    const [isShowingResult, setIsShowingResult] = useState(false)
    const [isShaking, setIsShaking] = useState(false)
    const [showSwipeHint, setShowSwipeHint] = useState(false)
    const [answerHistory, setAnswerHistory] = useState<Array<{ prompt: string; correct: boolean; answer: string }>>([])
    const [gameSummary, setGameSummary] = useState<{
        won: boolean
        score: number
        correct: number
        total: number
        bestStreak: number
        newRecord: boolean
        bestTimeMs: number | null
        newPersonalBest: boolean
    } | null>(null)
    const correctCountRef = useRef(0)
    const bestStreakRef = useRef(0)
    const lastSeenOperationRef = useRef<Operation | null>(null)
    const questionStartTimeRef = useRef<number>(0)
    const bestTimeThisGameRef = useRef<number | null>(null)
    const newPersonalBestRef = useRef(false)
    const consecutiveMissesRef = useRef<Record<string, number>>({})
    const confidenceEnabledRef = useRef(settings.confidence)
    const workedExamplesEnabledRef = useRef(settings.workedExamples)
    const tipsEnabledRef = useRef(settings.tips)
    // Keep refs current whenever settings change
    useEffect(() => {
        confidenceEnabledRef.current = settings.confidence
        workedExamplesEnabledRef.current = settings.workedExamples
        tipsEnabledRef.current = settings.tips
    }, [settings.confidence, settings.workedExamples, settings.tips])
    const [tipOverlay, setTipOverlay] = useState<{ title: string; body: string } | null>(null)
    const [confidencePrompt, setConfidencePrompt] = useState<{
        operation: string
        wasCorrect: boolean
        answeredCount: number
        timeoutId: ReturnType<typeof setTimeout>
    } | null>(null)
    const [workedExampleOp, setWorkedExampleOp] = useState<Operation | null>(null)
    const [feedbackOverlay, setFeedbackOverlay] = useState<{
        type: 'correct' | 'wrong' | 'timeout'
        questionPrompt: string
        correctAnswer: string
        explanation?: string
    } | null>(null)

    // Redirect to home if no player profile exists
    useEffect(() => {
        if (!player) navigate('/', { replace: true })
    }, [navigate, player])

    // Persist game state on each change
    useEffect(() => {
        if (player) store.saveGameState(player.id, gameState)
    }, [gameState, player])

    // Reset question start timer whenever a new question is shown
    useEffect(() => {
        if (gameState.status === 'playing') {
            questionStartTimeRef.current = Date.now()
        }
    }, [gameState.currentQuestion, gameState.status])

    // Stable ref to handleTimeExpired — initialised with a placeholder so it can
    // be declared before handleTimeExpired without a temporal-dead-zone error.
    // The ref is kept current by the effect declared after handleTimeExpired.
    const handleTimeExpiredRef = useRef<() => void>(() => { })

    // Countdown tick — fires time-expired handler via ref when reaching 0
    useEffect(() => {
        if (gameState.status !== 'playing') return
        if (isShowingResult) return
        if (workedExampleOp) return  // pause timer during worked example
        if (settings.mode === 'explore') return  // no countdown in explore mode
        if (countdown === 0) {
            handleTimeExpiredRef.current()
            return
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown, gameState.status, isShowingResult, workedExampleOp, settings.mode])

    const trackMissStreak = useCallback((operation: string) => {
        const map = consecutiveMissesRef.current
        map[operation] = (map[operation] ?? 0) + 1
        if (tipsEnabledRef.current && map[operation] === 3) {
            const tip = getRandomTip(operation as Operation)
            setTipOverlay(tip)
            setTimeout(() => setTipOverlay(null), 4500)
        }
    }, [])

    const dismissConfidence = useCallback(() => {
        setConfidencePrompt(prev => {
            if (prev) clearTimeout(prev.timeoutId)
            return null
        })
    }, [])

    const handleConfidence = useCallback((confident: boolean) => {
        setConfidencePrompt(prev => {
            if (!prev) return null
            clearTimeout(prev.timeoutId)
            // "Not sure" on correct → penalise SR: reset interval
            if (!confident && prev.wasCorrect) {
                store.updateSR(prev.operation, false, prev.answeredCount)
            }
            return null
        })
    }, [])

    const submitScore = useCallback((state: GameState) => {
        if (state.score <= 0) return null
        const entry = {
            playerId: player?.id ?? 'anonymous',
            player: player?.playerName ?? 'Anonymous',
            avatarId: player?.avatarId ?? '🚀',
            score: state.score,
            answeredCount: state.answeredCount,
            language: state.language,
            operation: state.operation,
            level: state.level,
            difficulty: state.difficulty,
            updatedAt: new Date().toISOString(),
        }
        return store.submitScore(entry)
    }, [player])

    const endGame = useCallback((state: GameState, won: boolean) => {
        const result = submitScore(state)
        const msg = won
            ? (result?.improved
                ? t.gameFeedbackNewRecord.replace('{score}', String(state.score))
                : t.gameFeedbackComplete.replace('{score}', String(state.score)))
            : state.lives <= 0
                ? t.gameFeedbackGameOver.replace('{score}', String(state.score))
                : t.gameFeedbackStopped.replace('{score}', String(state.score))
        setFeedback(msg)
        setGameSummary({
            won,
            score: state.score,
            correct: correctCountRef.current,
            total: state.answeredCount,
            bestStreak: bestStreakRef.current,
            newRecord: result?.improved ?? false,
            bestTimeMs: bestTimeThisGameRef.current,
            newPersonalBest: newPersonalBestRef.current,
        })
        setTimeout(() => navigate('/hall-of-fame'), 4000)
    }, [submitScore, navigate, t])

    const handleTimeExpired = useCallback(() => {
        if (gameState.status !== 'playing') return
        if (isShowingResult) return
        const answeredCount = gameState.answeredCount + 1
        const nextLives = gameState.lives - 1
        const sessionEnded = answeredCount >= TOTAL_QUESTIONS_PER_RUN || nextLives <= 0
        const nextWave = getWave(answeredCount)
        const effectiveNextLevel = getEffectiveLevel(gameState.level, nextWave)
        store.recordMiss(gameState.operation)
        store.updateSR(gameState.operation, false, gameState.answeredCount)
        store.recordSkill(gameState.operation, false)
        trackMissStreak(gameState.operation)
        const nextRound = nextQuestion(gameState, effectiveNextLevel, store.getWeakness(), store.getSRData(), answeredCount)
        const newState: GameState = {
            ...gameState,
            operation: sessionEnded ? gameState.operation : nextRound.operation,
            lives: nextLives,
            answeredCount,
            currentQuestion: sessionEnded ? gameState.currentQuestion : nextRound.currentQuestion,
            options: sessionEnded ? gameState.options : nextRound.options,
            correctIndex: sessionEnded ? gameState.correctIndex : nextRound.correctIndex,
            status: sessionEnded ? (nextLives > 0 ? 'won' : 'lost') : 'playing',
        }
        setFeedback(t.gameFeedbackTimeout.replace('{answer}', gameState.currentQuestion.answer))
        setFeedbackOverlay({ type: 'timeout', questionPrompt: gameState.currentQuestion.prompt, correctAnswer: gameState.currentQuestion.answer, explanation: explainAnswer(gameState.currentQuestion.prompt, gameState.currentQuestion.answer) })
        setAnswerHistory(h => [{ prompt: gameState.currentQuestion.prompt, correct: false, answer: gameState.currentQuestion.answer }, ...h].slice(0, 5))
        playTimeout()
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
        setIsShowingResult(true)
        setTimeout(() => {
            setFeedbackOverlay(null)
            setIsShowingResult(false)
            setGameState(newState)
            if (sessionEnded) {
                endGame(newState, nextLives > 0)
            } else {
                const qt = getQuestionTime(effectiveNextLevel, gameState.difficulty)
                setMaxTime(qt)
                setCountdown(qt)
                // Confidence prompt after timeout
                if (confidenceEnabledRef.current) {
                    const tid = setTimeout(dismissConfidence, 2000)
                    setConfidencePrompt({ operation: gameState.operation, wasCorrect: false, answeredCount: gameState.answeredCount, timeoutId: tid })
                }
            }
        }, 1500)
    }, [gameState, endGame, t, isShowingResult, trackMissStreak, dismissConfidence])

    // Keep the ref current so the countdown effect always calls the latest version
    useEffect(() => { handleTimeExpiredRef.current = handleTimeExpired })

    const startGame = useCallback(() => {
        const qt = getQuestionTime(gameState.level, gameState.difficulty)
        setMaxTime(qt)
        setCountdown(qt)
        setGameState(s => ({ ...s, status: 'playing' }))
        setFeedback(t.gameSteering)
        // Show worked example for the current operation when starting
        if (workedExamplesEnabledRef.current && lastSeenOperationRef.current !== gameState.operation) {
            lastSeenOperationRef.current = gameState.operation
            setWorkedExampleOp(gameState.operation)
            setTimeout(() => setWorkedExampleOp(null), 3000)
        }
        if (!store.hasSeenSwipeHint()) {
            store.markSwipeHintSeen()
            setShowSwipeHint(true)
            setTimeout(() => setShowSwipeHint(false), 3000)
        }
    }, [gameState.level, gameState.difficulty, gameState.operation, t])

    const stopGame = useCallback(() => {
        const finalState = { ...gameState, status: 'lost' as const }
        setGameState(finalState)
        endGame(finalState, false)
    }, [gameState, endGame])

    const resetGame = useCallback(() => {
        const s = store.getSettings()
        const newState = createRound(s.language, s.operations, s.level, s.difficulty)
        const qt = getQuestionTime(newState.level, newState.difficulty)
        setGameState(newState)
        setSelectedLane(0)
        setBlastLane(null)
        setFeedback('')
        setAnswerHistory([])
        setGameSummary(null)
        correctCountRef.current = 0
        bestStreakRef.current = 0
        lastSeenOperationRef.current = null
        bestTimeThisGameRef.current = null
        newPersonalBestRef.current = false
        consecutiveMissesRef.current = {}
        setConfidencePrompt(null)
        setMaxTime(qt)
        setCountdown(qt)
    }, [])

    const handleShoot = useCallback(() => {
        if (gameState.status !== 'playing') return
        if (isShowingResult) return
        setBlastLane(selectedLane)
        setTimeout(() => setBlastLane(null), 240)
        setLaunchLane(selectedLane)
        setTimeout(() => setLaunchLane(null), 400)
        playShoot()
        const isCorrect = selectedLane === gameState.correctIndex
        const answeredCount = gameState.answeredCount + 1
        const nextLives = isCorrect ? gameState.lives : gameState.lives - 1
        const sessionEnded = answeredCount >= TOTAL_QUESTIONS_PER_RUN || nextLives <= 0
        const currentWave = getWave(gameState.answeredCount)
        const nextWave = getWave(answeredCount)
        const effectiveNextLevel = getEffectiveLevel(gameState.level, nextWave)
        const nextRound = nextQuestion(gameState, effectiveNextLevel, store.getWeakness(), store.getSRData(), answeredCount)
        const points = isCorrect ? 10 + currentWave * 5 + Math.max(0, gameState.streak) * 2 : 0
        const nextState: GameState = {
            ...gameState,
            operation: sessionEnded ? gameState.operation : nextRound.operation,
            score: gameState.score + points,
            streak: isCorrect ? gameState.streak + 1 : 0,
            lives: nextLives,
            answeredCount,
            currentQuestion: sessionEnded ? gameState.currentQuestion : nextRound.currentQuestion,
            options: sessionEnded ? gameState.options : nextRound.options,
            correctIndex: sessionEnded ? gameState.correctIndex : nextRound.correctIndex,
            status: sessionEnded ? (nextLives > 0 ? 'won' : 'lost') : 'playing',
        }
        if (isCorrect) {
            store.recordHit(gameState.operation)
            store.updateSR(gameState.operation, true, gameState.answeredCount)
            store.recordSkill(gameState.operation, true)
            consecutiveMissesRef.current[gameState.operation] = 0  // reset on correct
            const elapsed = Date.now() - questionStartTimeRef.current
            const isPB = store.updatePersonalBest(gameState.operation, elapsed)
            if (isPB) newPersonalBestRef.current = true
            if (bestTimeThisGameRef.current === null || elapsed < bestTimeThisGameRef.current) {
                bestTimeThisGameRef.current = elapsed
            }
            correctCountRef.current += 1
            bestStreakRef.current = Math.max(bestStreakRef.current, nextState.streak)
            setAnswerHistory(h => [{ prompt: gameState.currentQuestion.prompt, correct: true, answer: gameState.currentQuestion.answer }, ...h].slice(0, 5))
            setFeedbackOverlay({ type: 'correct', questionPrompt: gameState.currentQuestion.prompt, correctAnswer: gameState.currentQuestion.answer })
            setTimeout(() => {
                setFeedbackOverlay(null)
                // Show confidence prompt (non-blocking, auto-dismisses in 2s)
                if (confidenceEnabledRef.current) {
                    const tid = setTimeout(dismissConfidence, 2000)
                    setConfidencePrompt({ operation: gameState.operation, wasCorrect: true, answeredCount: gameState.answeredCount, timeoutId: tid })
                }
            }, 700)
            setGameState(nextState)
            if (!sessionEnded) {
                const qt = getQuestionTime(effectiveNextLevel, gameState.difficulty)
                setMaxTime(qt)
                setCountdown(qt)
                const isWaveUp = nextWave > currentWave
                if (isWaveUp) {
                    playLevelUp()
                } else {
                    playCorrect()
                }
                // Show worked example when operation changes mid-game
                if (workedExamplesEnabledRef.current && nextRound.operation !== gameState.operation && lastSeenOperationRef.current !== nextRound.operation) {
                    lastSeenOperationRef.current = nextRound.operation
                    setWorkedExampleOp(nextRound.operation)
                    setTimeout(() => setWorkedExampleOp(null), 3000)
                }
                setFeedback(isWaveUp
                    ? t.gameLevelUp.replace('{wave}', String(nextWave + 1))
                    : t.gameFeedbackCorrect + (nextState.streak > 1 ? ' ' + t.gameFeedbackStreak.replace('{streak}', String(nextState.streak)) : ''))
            } else {
                endGame(nextState, true)
            }
        } else {
            store.recordMiss(gameState.operation)
            store.updateSR(gameState.operation, false, gameState.answeredCount)
            store.recordSkill(gameState.operation, false)
            trackMissStreak(gameState.operation)
            setFeedback(t.gameFeedbackWrong.replace('{answer}', gameState.currentQuestion.answer))
            setFeedbackOverlay({ type: 'wrong', questionPrompt: gameState.currentQuestion.prompt, correctAnswer: gameState.currentQuestion.answer, explanation: explainAnswer(gameState.currentQuestion.prompt, gameState.currentQuestion.answer) })
            setAnswerHistory(h => [{ prompt: gameState.currentQuestion.prompt, correct: false, answer: gameState.currentQuestion.answer }, ...h].slice(0, 5))
            playWrong()
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 500)
            setIsShowingResult(true)
            setTimeout(() => {
                setFeedbackOverlay(null)
                setIsShowingResult(false)
                setGameState(nextState)
                if (!sessionEnded) {
                    const qt = getQuestionTime(effectiveNextLevel, gameState.difficulty)
                    setMaxTime(qt)
                    setCountdown(qt)
                    // Show confidence prompt after wrong answer
                    if (confidenceEnabledRef.current) {
                        const tid = setTimeout(dismissConfidence, 2000)
                        setConfidencePrompt({ operation: gameState.operation, wasCorrect: false, answeredCount: gameState.answeredCount, timeoutId: tid })
                    }
                } else {
                    endGame(nextState, nextLives > 0)
                }
            }, 1500)
        }
    }, [gameState, selectedLane, endGame, t, isShowingResult, dismissConfidence, trackMissStreak])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setSelectedLane(c => (c + 3) % 4)
            if (e.key === 'ArrowRight') setSelectedLane(c => (c + 1) % 4)
            if (e.code === 'Space') { e.preventDefault(); handleShoot() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [handleShoot])

    if (!player) return null

    const isPlaying = gameState.status === 'playing' && !workedExampleOp
    const isEnded = gameState.status === 'won' || gameState.status === 'lost'
    const isExplore = settings.mode === 'explore'
    const isUrgent = isPlaying && !isExplore && countdown <= 3
    const countdownFraction = isExplore ? 1 : (maxTime > 0 ? countdown / maxTime : 1)
    const currentProgress = Math.min(100, (gameState.answeredCount / TOTAL_QUESTIONS_PER_RUN) * 100)
    const currentWave = getWave(gameState.answeredCount)
    const currentEffectiveLevel = getEffectiveLevel(gameState.level, currentWave)

    return (
        <div className="page game-page">
            <Navigation />

            <main className="container game-container">
                {/* SCOREBOARD */}
                <section className="card game-header">
                    <div className="scoreboard">
                        <div className="score-item">
                            <span className="label">{t.gameScore}</span>
                            <span className="value neon-text">{gameState.score}</span>
                        </div>
                        <div className="score-item">
                            <span className="label">{t.gameLives}</span>
                            <span className="value">{'❤️'.repeat(Math.max(0, gameState.lives))}</span>
                        </div>
                        <div className="score-item">
                            <span className="label">{t.gameStreak}</span>
                            <span className="value neon-text">
                                {gameState.streak > 0 ? (
                                    <>
                                        {gameState.streak}
                                        <span
                                            className="streak-fire"
                                            style={{ fontSize: `${Math.min(1 + gameState.streak * 0.15, 2.5)}em` }}
                                        >🔥</span>
                                    </>
                                ) : '—'}
                            </span>
                        </div>
                        <div className="score-item">
                            <span className="label">{t.gameQuestion}</span>
                            <span className="value neon-text">{gameState.answeredCount}/{TOTAL_QUESTIONS_PER_RUN}</span>
                        </div>
                    </div>
                    <div className="progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${currentProgress}%` }} />
                        </div>
                        <p className="progress-text">{t.levelLabels[currentEffectiveLevel]}</p>
                    </div>
                </section>

                <div className="game-play-area">
                    <section className={`card game-board-card${isShaking ? ' shaking' : ''}`}>
                        {/* QUESTION + COUNTDOWN */}
                        <div className="question-header">
                            <div className={`countdown-display${isUrgent ? ' urgent' : ''}${!isPlaying ? ' idle' : ''}`}>
                                <svg className="countdown-ring" viewBox="0 0 64 64" aria-hidden="true">
                                    <circle className="countdown-ring-track" cx="32" cy="32" r="28" />
                                    <circle
                                        className="countdown-ring-fill"
                                        cx="32" cy="32" r="28"
                                        style={{ strokeDashoffset: `${CIRCUMFERENCE * (1 - countdownFraction)}` }}
                                    />
                                </svg>
                                <span className="countdown-number">
                                    {isPlaying ? (isExplore ? '∞' : countdown) : '⏱'}
                                </span>
                            </div>
                            <div className="question-display">
                                <p className="question-text">
                                    {gameState.status === 'ready' ? '🚀 ?' : gameState.currentQuestion.prompt}
                                </p>
                            </div>
                        </div>

                        <GameBoard
                            options={gameState.options}
                            selectedLane={selectedLane}
                            blastLane={blastLane}
                            launchLane={launchLane}
                            onSelectLane={isPlaying ? setSelectedLane : () => { }}
                            onShoot={isPlaying ? handleShoot : () => { }}
                            onSwipeLeft={isPlaying ? () => setSelectedLane(c => (c + 3) % 4) : () => { }}
                            onSwipeRight={isPlaying ? () => setSelectedLane(c => (c + 1) % 4) : () => { }}
                        />

                        {feedbackOverlay && (
                            <div className={`answer-overlay answer-overlay--${feedbackOverlay.type}`}>
                                <div className="answer-overlay-icon">
                                    {feedbackOverlay.type === 'correct' ? '✓' : feedbackOverlay.type === 'timeout' ? '⏰' : '✗'}
                                </div>
                                {feedbackOverlay.type !== 'correct' && (
                                    <>
                                        <div className="answer-overlay-question">{feedbackOverlay.questionPrompt}</div>
                                        <div className="answer-overlay-answer">= {feedbackOverlay.correctAnswer}</div>
                                        {feedbackOverlay.explanation && (
                                            <div className="answer-overlay-explanation">{feedbackOverlay.explanation}</div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {showSwipeHint && (
                            <div className="swipe-hint">
                                <span className="swipe-hint-arrow">⬆️</span>
                                <span className="swipe-hint-text">Swipe up or tap to shoot!</span>
                            </div>
                        )}

                        {workedExampleOp && (() => {
                            const ex = getWorkedExample(workedExampleOp)
                            return (
                                <div className="worked-example-overlay">
                                    <div className="worked-example-title">📚 How it works</div>
                                    <div className="worked-example-row">
                                        <span className="worked-example-prompt">{ex.prompt}</span>
                                        <span className="worked-example-answer">{ex.answer}</span>
                                    </div>
                                    <div className="worked-example-hint">{ex.hint}</div>
                                </div>
                            )
                        })()}

                        {tipOverlay && (
                            <div className="tip-overlay">
                                <div className="tip-title">{tipOverlay.title}</div>
                                <div className="tip-body">{tipOverlay.body}</div>
                            </div>
                        )}

                        {confidencePrompt && (
                            <div className="confidence-overlay">
                                <div className="confidence-label">How did that feel?</div>
                                <div className="confidence-buttons">
                                    <button
                                        className="confidence-btn confidence-btn--unsure"
                                        onClick={() => handleConfidence(false)}
                                    >🤔 Not sure</button>
                                    <button
                                        className="confidence-btn confidence-btn--confident"
                                        onClick={() => handleConfidence(true)}
                                    >💪 Got it!</button>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="game-sidebar">
                        <section className="card controls-card">
                            <div className="controls-main">
                                <button
                                    className="btn btn-secondary btn-control"
                                    onClick={() => setSelectedLane(c => (c + 3) % 4)}
                                    disabled={!isPlaying}
                                >⬅️</button>
                                <button
                                    className="btn btn-danger btn-control"
                                    onClick={handleShoot}
                                    disabled={!isPlaying}
                                >{t.gameShoot}</button>
                                <button
                                    className="btn btn-secondary btn-control"
                                    onClick={() => setSelectedLane(c => (c + 1) % 4)}
                                    disabled={!isPlaying}
                                >➡️</button>
                            </div>

                            {isPlaying ? (
                                <button
                                    className="btn btn-danger btn-stop"
                                    onClick={stopGame}
                                >{t.gameStop}</button>
                            ) : (
                                <div className="controls-secondary">
                                    <button
                                        className="btn btn-primary btn-control"
                                        onClick={startGame}
                                        disabled={isEnded}
                                    >
                                        {isEnded
                                            ? (gameState.status === 'won' ? t.gameWon : t.gameOver)
                                            : t.gameStart}
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-control"
                                        onClick={resetGame}
                                    >{t.gameNew}</button>
                                </div>
                            )}

                            <p className="feedback">{feedback || t.gamePressStart}</p>
                        </section>
                    </div>
                </div>

                {answerHistory.length > 0 && (
                    <div className="answer-history">
                        {answerHistory.map((entry, i) => (
                            <div key={i} className={`history-pill ${entry.correct ? 'correct' : 'wrong'}`}>
                                <span className="history-icon">{entry.correct ? '✓' : '✗'}</span>
                                <span className="history-prompt">{entry.prompt}</span>
                                {!entry.correct && <span className="history-answer">={entry.answer}</span>}
                            </div>
                        ))}
                    </div>
                )}

                {!isPlaying && (
                    <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => navigate('/')}>🏠 {t.navHome}</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>🏆 {t.navHallOfFame}</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/settings')}>⚙️ {t.navSettings}</button>
                    </div>
                )}

                {gameSummary && (() => {
                    const skillStats = store.getSkillStats()
                    const badge = computeBadge(skillStats[gameState.operation]?.history ?? [])
                    return (
                        <div className="game-summary-overlay">
                            <div className="game-summary-card">
                                <div className="summary-icon">{gameSummary.won ? '🏆' : '💀'}</div>
                                <div className="summary-score">{gameSummary.score} pts</div>
                                {gameSummary.newRecord && <div className="summary-record">🌟 New Record!</div>}
                                {gameSummary.newPersonalBest && gameSummary.bestTimeMs !== null && (
                                    <div className="summary-record">⚡ New Personal Best: {(gameSummary.bestTimeMs / 1000).toFixed(1)}s!</div>
                                )}
                                {badge !== 'none' && (
                                    <div className="summary-badge">
                                        {BADGE_EMOJI[badge]} {badge.charAt(0).toUpperCase() + badge.slice(1)} Badge!
                                    </div>
                                )}
                                <div className="summary-stats">
                                    <div className="summary-stat">
                                        <span className="summary-stat-value">{gameSummary.total > 0 ? Math.round((gameSummary.correct / gameSummary.total) * 100) : 0}%</span>
                                        <span className="summary-stat-label">Correct</span>
                                    </div>
                                    <div className="summary-stat">
                                        <span className="summary-stat-value">{gameSummary.correct}/{gameSummary.total}</span>
                                        <span className="summary-stat-label">Answered</span>
                                    </div>
                                    <div className="summary-stat">
                                        <span className="summary-stat-value">{gameSummary.bestStreak}🔥</span>
                                        <span className="summary-stat-label">Best Streak</span>
                                    </div>
                                    {gameSummary.bestTimeMs !== null && (
                                        <div className="summary-stat">
                                            <span className="summary-stat-value">⚡{(gameSummary.bestTimeMs / 1000).toFixed(1)}s</span>
                                            <span className="summary-stat-label">Best Time</span>
                                        </div>
                                    )}
                                </div>
                                <p className="summary-redirect">Heading to Hall of Fame…</p>
                            </div>
                        </div>
                    )
                })()}
            </main>
        </div>
    )
}
