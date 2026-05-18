import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRound, nextQuestion, type GameState, type Language, type Operation, type Level, type Difficulty } from '../game'
import { store } from '../store'
import Navigation from '../components/Navigation'
import LanguageSwitcher from '../components/LanguageSwitcher'
import GameBoard from '../components/GameBoard'
import { operationLabels, levelLabels, difficultyLabels, TOTAL_QUESTIONS_PER_RUN } from '../constants'

export default function GamePage() {
    const navigate = useNavigate()
    const player = store.getPlayer()

    const [language, setLanguage] = useState<Language>('en')
    const [operation, setOperation] = useState<Operation>('addition')
    const [level, setLevel] = useState<Level>('starter')
    const [difficulty, setDifficulty] = useState<Difficulty>('easy')
    const [gameState, setGameState] = useState<GameState>(() => createRound(language, operation, level, difficulty))
    const [selectedLane, setSelectedLane] = useState(0)
    const [feedback, setFeedback] = useState('🎮 Select a lane and press Shoot!')
    const [blastLane, setBlastLane] = useState<number | null>(null)

    const saveGameState = useCallback(() => {
        if (player) {
            store.saveGameState(player.id, gameState)
        }
    }, [gameState, player])

    useEffect(() => {
        saveGameState()
    }, [gameState, saveGameState])

    const loadSavedGame = useCallback(() => {
        if (player) {
            const saved = store.getGameState(player.id)
            if (saved) {
                setLanguage(saved.language)
                setOperation(saved.operation)
                setLevel(saved.level)
                setDifficulty(saved.difficulty)
                setGameState(saved)
                setFeedback('📂 Game loaded from your save!')
            }
        }
    }, [player])

    const createNewRound = useCallback((lang: Language, op: Operation, lv: Level, diff: Difficulty) => {
        const newState = createRound(lang, op, lv, diff)
        setLanguage(lang)
        setOperation(op)
        setLevel(lv)
        setDifficulty(diff)
        setGameState(newState)
        setSelectedLane(0)
        setBlastLane(null)
        setFeedback('🎯 New mission ready!')
    }, [])

    const startGame = useCallback(() => {
        const next = { ...gameState, status: 'playing' as const }
        setGameState(next)
        setFeedback('⬅️ ➡️ Steer, Space to Shoot!')
    }, [gameState])

    const resetGame = useCallback(() => {
        const newState = createRound(language, operation, level, difficulty)
        setGameState(newState)
        setSelectedLane(0)
        setBlastLane(null)
        setFeedback('✨ Fresh mission!')
    }, [language, operation, level, difficulty])

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

        if (isCorrect) {
            setFeedback(`✅ Correct! ${nextState.streak > 1 ? `🔥 Streak x${nextState.streak}` : ''}`)
        } else {
            setFeedback(`❌ Wrong! Answer: ${gameState.currentQuestion.answer}`)
        }

        if (sessionEnded) {
            if (nextLives > 0) {
                const entry = {
                    playerId: player?.id || 'anonymous',
                    player: player?.playerName || 'Anonymous',
                    avatarId: player?.avatarId || 'Avatar 01',
                    score: nextState.score,
                    answeredCount: nextState.answeredCount,
                    language,
                    operation,
                    difficulty,
                    updatedAt: new Date().toISOString(),
                }
                const result = store.submitScore(entry)
                setFeedback(
                    result.improved
                        ? `🏆 New Record! ${nextState.score} points!`
                        : `🎉 Score: ${nextState.score}. Try for a new record!`
                )
            } else {
                setFeedback('💀 Game Over! Wanna try again?')
            }
        }
    }, [gameState, selectedLane, language, operation, difficulty, player])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setSelectedLane((c) => (c + 3) % 4)
            if (e.key === 'ArrowRight') setSelectedLane((c) => (c + 1) % 4)
            if (e.code === 'Space') {
                e.preventDefault()
                handleShoot()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleShoot])

    const currentProgress = Math.min(100, (gameState.answeredCount / TOTAL_QUESTIONS_PER_RUN) * 100)

    return (
        <div className="page game-page">
            <Navigation />
            <LanguageSwitcher language={language} onChangeLanguage={(lang) => createNewRound(lang, operation, level, difficulty)} />

            <main className="container game-container">
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
                    </div>

                    <div className="progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${currentProgress}%` }}></div>
                        </div>
                        <span className="progress-text">{gameState.answeredCount} / {TOTAL_QUESTIONS_PER_RUN}</span>
                    </div>
                </section>

                <section className="card game-board-card">
                    <GameBoard
                        question={gameState.currentQuestion.prompt}
                        options={gameState.options}
                        selectedLane={selectedLane}
                        blastLane={blastLane}
                        onSelectLane={setSelectedLane}
                    />
                </section>

                <section className="card controls-card">
                    <div className="controls">
                        <button className="btn btn-secondary" onClick={() => setSelectedLane((c) => (c + 3) % 4)}>
                            ⬅️ Left
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={startGame}
                            disabled={gameState.status === 'playing'}
                        >
                            {gameState.status === 'ready' ? '▶️ Start' : gameState.status === 'won' ? '✨ Won!' : gameState.status === 'lost' ? '💀 Lost!' : '⏸ Pause'}
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleShoot}
                            disabled={gameState.status !== 'playing'}
                        >
                            🔫 Shoot
                        </button>
                        <button className="btn btn-secondary" onClick={() => setSelectedLane((c) => (c + 1) % 4)}>
                            Right ➡️
                        </button>
                        <button className="btn btn-secondary" onClick={resetGame}>
                            🔄 New
                        </button>
                    </div>

                    <p className="feedback">{feedback}</p>
                </section>

                <section className="card settings-card">
                    <div className="settings-grid">
                        <div className="setting">
                            <label htmlFor="operation">Operation:</label>
                            <select id="operation" value={operation} onChange={(e) => createNewRound(language, e.target.value as Operation, level, difficulty)}>
                                {Object.entries(operationLabels).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </div>
                        <div className="setting">
                            <label htmlFor="level">Level:</label>
                            <select id="level" value={level} onChange={(e) => createNewRound(language, operation, e.target.value as Level, difficulty)}>
                                {Object.entries(levelLabels).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </div>
                        <div className="setting">
                            <label htmlFor="difficulty">Difficulty:</label>
                            <select id="difficulty" value={difficulty} onChange={(e) => createNewRound(language, operation, level, e.target.value as Difficulty)}>
                                {Object.entries(difficultyLabels).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={loadSavedGame}>
                        📂 Load Save
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        🏠 Home
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>
                        🏆 Hall of Fame
                    </button>
                </div>
            </main>
        </div>
    )
}
