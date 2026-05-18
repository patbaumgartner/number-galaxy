import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRound, nextQuestion, getQuestionTime, type GameState } from '../game'
import { store } from '../store'
import Navigation from '../components/Navigation'
import GameBoard from '../components/GameBoard'
import { TOTAL_QUESTIONS_PER_RUN } from '../constants'

const CIRCUMFERENCE = 2 * Math.PI * 28

export default function GamePage() {
    const navigate = useNavigate()
    const player = store.getPlayer()

    // Guard: must come via Home (profile required)
    useEffect(() => {
        if (!player) navigate('/', { replace: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!player) return null

    const [gameState, setGameState] = useState<GameState>(() => {
        const s = store.getSettings()
        return createRound(s.language, s.operations, s.level, s.difficulty)
    })
    const [selectedLane, setSelectedLane] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [blastLane, setBlastLane] = useState<number | null>(null)
    const [maxTime, setMaxTime] = useState(() => {
        const s = store.getSettings()
        return getQuestionTime(s.level, s.difficulty)
    })
    const [countdown, setCountdown] = useState(maxTime)

    // Persist game state
    useEffect(() => {
        if (player) store.saveGameState(player.id, gameState)
    }, [gameState, player])

    // Countdown tick
    useEffect(() => {
        if (gameState.status !== 'playing' || countdown <= 0) return
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown, gameState.status])

    // Reset countdown when question changes
    useEffect(() => {
        if (gameState.status === 'playing') {
            const t = getQuestionTime(gameState.level, gameState.difficulty)
            setMaxTime(t)
            setCountdown(t)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.currentQuestion])

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
        let msg: string
        if (won) {
            msg = result?.improved
                ? `🏆 New Record! ${state.score} pts — entering Hall of Fame…`
                : `🎉 Mission complete! ${state.score} pts — entering Hall of Fame…`
        } else {
            msg = `🛑 Stopped. ${state.score} pts — entering Hall of Fame…`
        }
        setFeedback(msg)
        setTimeout(() => navigate('/hall-of-fame'), 1800)
    }, [submitScore, navigate])

    const handleTimeExpired = useCallback(() => {
        if (gameState.status !== 'playing') return
        const answeredCount = gameState.answeredCount + 1
        const nextLives = gameState.lives - 1
        const sessionEnded = answeredCount >= TOTAL_QUESTIONS_PER_RUN || nextLives <= 0
        const nextRound = nextQuestion(gameState)
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
            setFeedback(`⏰ Time's up! Answer: ${gameState.currentQuestion.answer}`)
        }
    }, [gameState, endGame])

    useEffect(() => {
        if (countdown === 0) handleTimeExpired()
    }, [countdown, handleTimeExpired])

    const startGame = useCallback(() => {
        const t = getQuestionTime(gameState.level, gameState.difficulty)
        setMaxTime(t)
        setCountdown(t)
        setGameState(s => ({ ...s, status: 'playing' }))
        setFeedback('⬅️ ➡️ Steer · Space/Tap to Shoot!')
    }, [gameState.level, gameState.difficulty])

    const stopGame = useCallback(() => {
        const finalState = { ...gameState, status: 'lost' as const }
        setGameState(finalState)
        endGame(finalState, false)
    }, [gameState, endGame])

    const resetGame = useCallback(() => {
        const s = store.getSettings()
        const newState = createRound(s.language, s.operations, s.level, s.difficulty)
        const t = getQuestionTime(newState.level, newState.difficulty)
        setGameState(newState)
        setSelectedLane(0)
        setBlastLane(null)
        setFeedback('')
        setMaxTime(t)
        setCountdown(t)
    }, [])

    const handleShoot = useCallback(() => {
        if (gameState.status !== 'playing') return
        setBlastLane(selectedLane)
        setTimeout(() => setBlastLane(null), 240)
        const isCorrect = selectedLane === gameState.correctIndex
        const answeredCount = gameState.answeredCount + 1
        const nextLives = isCorrect ? gameState.lives : gameState.lives - 1
        const sessionEnded = answeredCount >= TOTAL_QUESTIONS_PER_RUN || nextLives <= 0
        const nextRound = nextQuestion(gameState)
        const nextState: GameState = {
            ...gameState,
            operation: sessionEnded ? gameState.operation : nextRound.operation,
            score: isCorrect ? gameState.score + 10 + Math.max(0, gameState.streak) * 2 : gameState.score,
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
            setFeedback(isCorrect
                ? `✅ Correct!${nextState.streak > 1 ? ` 🔥 Streak ×${nextState.streak}` : ''}`
                : `❌ Wrong! Answer: ${gameState.currentQuestion.answer}`)
        } else {
            endGame(nextState, nextLives > 0)
        }
    }, [gameState, selectedLane, endGame])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setSelectedLane(c => (c + 3) % 4)
            if (e.key === 'ArrowRight') setSelectedLane(c => (c + 1) % 4)
            if (e.code === 'Space') { e.preventDefault(); handleShoot() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [handleShoot])

    const isPlaying = gameState.status === 'playing'
    const isEnded = gameState.status === 'won' || gameState.status === 'lost'
    const isUrgent = isPlaying && countdown <= 3
    const countdownFraction = maxTime > 0 ? countdown / maxTime : 1
    const currentProgress = Math.min(100, (gameState.answeredCount / TOTAL_QUESTIONS_PER_RUN) * 100)

    return (
        <div className="page game-page">
            <Navigation />

            <main className="container game-container">
                {/* SCOREBOARD */}
                <section className="card game-header">
                    <div className="scoreboard">
                        <div className="score-item">
                            <span className="label">Score</span>
                            <span className="value neon-text">{gameState.score}</span>
                        </div>
                        <div className="score-item">
                            <span className="label">Lives</span>
                            <span className="value">{'❤️'.repeat(Math.max(0, gameState.lives))}</span>
                        </div>
                        <div className="score-item">
                            <span className="label">Streak</span>
                            <span className="value neon-text">{gameState.streak > 0 ? `${gameState.streak}🔥` : '—'}</span>
                        </div>
                        <div className="score-item">
                            <span className="label">Q</span>
                            <span className="value neon-text">{gameState.answeredCount}/{TOTAL_QUESTIONS_PER_RUN}</span>
                        </div>
                    </div>
                    <div className="progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${currentProgress}%` }} />
                        </div>
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
                                <p className="question-text">{gameState.currentQuestion.prompt}</p>
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
                                >🎯 Shoot</button>
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
                                >🛑 Stop Game</button>
                            ) : (
                                <div className="controls-secondary">
                                    <button
                                        className="btn btn-primary btn-control"
                                        onClick={startGame}
                                        disabled={isEnded}
                                    >
                                        {isEnded
                                            ? (gameState.status === 'won' ? '✨ Won!' : '💀 Over!')
                                            : '▶️ Start'}
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-control"
                                        onClick={resetGame}
                                    >🔄 New</button>
                                </div>
                            )}

                            <p className="feedback">{feedback || '🎮 Press Start to launch!'}</p>
                        </section>
                    </div>
                </div>

                {!isPlaying && (
                    <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => navigate('/')}>🏠 Home</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>🏆 Hall of Fame</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/settings')}>⚙️ Settings</button>
                    </div>
                )}
            </main>
        </div>
    )
}
