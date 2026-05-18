import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import Navigation from '../components/Navigation'
import { operationLabels, difficultyLabels } from '../constants'
import { TOTAL_QUESTIONS_PER_RUN } from '../constants'

export default function HallOfFamePage() {
    const navigate = useNavigate()

    const hallOfFame = useMemo(() => store.getHallOfFame(), [])

    return (
        <div className="page">
            <Navigation />

            <main className="container">
                <section className="hero">
                    <h1 className="neon-text">🏆 BEST SCORES 🏆</h1>
                    <p className="subtitle">Can you make it to the top?</p>
                </section>

                <section className="card">
                    {hallOfFame.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-message">🚀 Nobody here yet — play a game and be first on the board!</p>
                        </div>
                    ) : (
                        <div className="hall-of-fame-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Player</th>
                                        <th>Avatar</th>
                                        <th>Score</th>
                                        <th>Questions</th>
                                        <th>Math</th>
                                        <th>Speed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hallOfFame.map((entry, idx) => (
                                        <tr key={entry.playerId} className={idx === 0 ? 'champion' : ''}>
                                            <td className="rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                                            <td className="player-name">{entry.player}</td>
                                            <td className="avatar">{entry.avatarId}</td>
                                            <td className="score neon-text">{entry.score}</td>
                                            <td className="questions">{entry.answeredCount}/{TOTAL_QUESTIONS_PER_RUN}</td>
                                            <td className="operation">{operationLabels[entry.operation] ?? entry.operation}</td>
                                            <td className="difficulty">{difficultyLabels[entry.difficulty] ?? entry.difficulty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        🎮 Play Now!
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        🏠 Home
                    </button>
                </div>
            </main>
        </div>
    )
}
