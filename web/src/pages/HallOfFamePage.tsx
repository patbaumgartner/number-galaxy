import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import Navigation from '../components/Navigation'
import LanguageSwitcher from '../components/LanguageSwitcher'
import type { Language } from '../game'

export default function HallOfFamePage() {
    const navigate = useNavigate()
    const [language, setLanguage] = useState<Language>('en')

    const hallOfFame = useMemo(() => store.getHallOfFame(language), [language])

    return (
        <div className="page">
            <Navigation />
            <LanguageSwitcher language={language} onChangeLanguage={setLanguage} />

            <main className="container">
                <section className="hero">
                    <h1 className="neon-text">🏆 HALL OF FAME 🏆</h1>
                    <p className="subtitle">Top scores for {language.toUpperCase()}</p>
                </section>

                <section className="card">
                    {hallOfFame.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-message">🚀 No scores yet. Be the first to claim glory!</p>
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
                                        <th>Operation</th>
                                        <th>Difficulty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hallOfFame.map((entry, idx) => (
                                        <tr key={entry.playerId} className={idx === 0 ? 'champion' : ''}>
                                            <td className="rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                                            <td className="player-name">{entry.player}</td>
                                            <td className="avatar">{entry.avatarId}</td>
                                            <td className="score neon-text">{entry.score}</td>
                                            <td className="questions">{entry.answeredCount}/10</td>
                                            <td className="operation">{entry.operation}</td>
                                            <td className="difficulty">{entry.difficulty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={() => navigate('/game')}>
                        🎮 Play Game
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        🏠 Home
                    </button>
                </div>
            </main>
        </div>
    )
}
