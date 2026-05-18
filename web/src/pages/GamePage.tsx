import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRound, nextQuestion, getQuestionTime, getWave, getEffectiveLevel, type GameState } from '../game'
import { store } from '../store'
import Navigation from '../components/Navigation'
import GameBoard from '../components/GameBoard'
import { TOTAL_QUESTIONS_PER_RUN } from '../constants'
import { translations } from '../translations'

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
    const [maxTime, setMaxTime] = useState(() => getQuestionTime(settings.level, settings.difficulty))
    const [countdown, setCountdown] = useState(() => getQuestionTime(settings.level, settings.difficulty))

    // Redirect to home if no player profile exists
    useEffect(() => {
        if (!player) navigate('/', { replace: true })
    }, [navigate, player])

    // Persist game state on each change
    useEffect(() => {
        if (player) store.saveGameState(player.id, gameState)
    }, [gameState, player])

    // Stable ref to handleTimeExpired — initialised with a placeholder so it can
    // be declared before handleTimeExpired without a temporal-dead-zone error.
    // The ref is kept current by the effect declared after handleTimeExpired.
    const handleTimeExpiredRef = useRef<() => void>(() => { })

    // Countdown tick — fires time-expired handler via ref when reaching 0
    useEffect(() => {
        if (gameState.status !== 'playing') return
        if (countdown === 0) {
            handleTimeExpiredRef.current()
            return
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown, gameState.status])

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
            : t.gameFeedbackStopped.replace('{score}', String(state.score))
        setFeedback(msg)
        setTimeout(() => navigate('/hall-of-fame'), 1800)
    }, [submitScore, navigate, t])

    const handleTimeExpired = useCallback(() => {
        if (gameState.status !== 'playing') return
        const answeredCount = gameState.answeredCount + 1
        const nextLives = gameState.lives - 1
        const sessionEnded = answeredCount >= TOTAL_QUESTIONS_PER_RUN || nextLives <= 0
        const nextWave = getWave(answeredCount)
        const effectiveNextLevel = getEffectiveLevel(gameState.level, nextWave)
        const nextRound = nextQuestion(gameState, effectiveNextLevel)
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
        setGameState(newState)
        if (sessionEnded) {
            endGame(newState, nextLives > 0)
        } else {
            const qt = getQuestionTime(effectiveNextLevel, gameState.difficulty)
            setMaxTime(qt)
            setCountdown(qt)
            setFeedback(t.gameFeedbackTimeout.replace('{answer}', gameState.currentQuestion.answer))
        }
    }, [gameState, endGame, t])

    // Keep the ref current so the countdown effect always calls the latest version
    useEffect(() => { handleTimeExpiredRef.current = handleTimeExpired })

    const startGame = useCallback(() => {
        const qt = getQuestionTime(gameState.level, gameState.difficulty)
        setMaxTime(qt)
        setCountdown(qt)
        setGameState(s => ({ ...s, status: 'playing' }))
        setFeedback(t.gameSteering)
    }, [gameState.level, gameState.difficulty, t])

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
        setMaxTime(qt)
        setCountdown(qt)
    }, [])

    const handleShoot = useCallback(() => {
        if (gameState.status !== 'playing') return
        setBlastLane(selectedLane)
        setTimeout(() => setBlastLane(null), 240)
        const isCorrect = selectedLane === gameState.correctIndex
        const answeredCount = gameState.answeredCount + 1
        const nextLives = isCorrect ? gameState.lives : gameState.lives - 1
        const sessionEnded = answeredCount >= TOTAL_QUESTIONS_PER_RUN || nextLives <= 0
        const currentWave = getWave(gameState.answeredCount)
        const nextWave = getWave(answeredCount)
        const effectiveNextLevel = getEffectiveLevel(gameState.level, nextWave)
        const nextRound = nextQuestion(gameState, effectiveNextLevel)
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
        setGameState(nextState)
        if (!sessionEnded) {
            const qt = getQuestionTime(effectiveNextLevel, gameState.difficulty)
            setMaxTime(qt)
            setCountdown(qt)
            const isWaveUp = nextWave > currentWave
            setFeedback(isCorrect && isWaveUp
                ? t.gameLevelUp.replace('{wave}', String(nextWave + 1))
                : isCorrect
                    ? t.gameFeedbackCorrect + (nextState.streak > 1 ? ' ' + t.gameFeedbackStreak.replace('{streak}', String(nextState.streak)) : '')
                    : t.gameFeedbackWrong.replace('{answer}', gameState.currentQuestion.answer))
        } else {
            endGame(nextState, nextLives > 0)
        }
    }, [gameState, selectedLane, endGame, t])

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

    const isPlaying = gameState.status === 'playing'
    const isEnded = gameState.status === 'won' || gameState.status === 'lost'
    const isUrgent = isPlaying && countdown <= 3
    const countdownFraction = maxTime > 0 ? countdown / maxTime : 1
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
                            <span className="value neon-text">{gameState.streak > 0 ? `${gameState.streak}🔥` : '—'}</span>
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
                    <section className="card game-board-card">
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
                                    {isPlaying ? countdown : '⏱'}
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
                            onSelectLane={isPlaying ? setSelectedLane : () => { }}
                        />
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

                {!isPlaying && (
                    <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => navigate('/')}>🏠 {t.navHome}</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>🏆 {t.navHallOfFame}</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/settings')}>⚙️ {t.navSettings}</button>
                    </div>
                )}
            </main>
        </div>
    )
}
