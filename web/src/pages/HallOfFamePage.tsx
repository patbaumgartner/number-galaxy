import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import type { HallOfFameEntry } from '../store'
import type { Difficulty, Level } from '../game'
import Navigation from '../components/Navigation'
import { TOTAL_QUESTIONS_PER_RUN } from '../constants'
import { translations } from '../translations'

const DIFFICULTY_ORDER: Difficulty[] = ['hard', 'normal', 'easy']
const LEVEL_ORDER: Level[] = ['master', 'expert', 'advanced', 'intermediate', 'elementary', 'beginner', 'starter']

export default function HallOfFamePage() {
    const navigate = useNavigate()
    const t = translations[store.getSettings().language]
    const player = store.getPlayer()
    const hallOfFame = useMemo(() => store.getHallOfFame(), [])

    type Group = { difficulty: Difficulty; level: Level; entries: HallOfFameEntry[] }
    const groups = useMemo<Group[]>(() => {
        const result: Group[] = []
        for (const difficulty of DIFFICULTY_ORDER) {
            for (const level of LEVEL_ORDER) {
                const entries = hallOfFame
                    .filter((e) => e.difficulty === difficulty && e.level === level)
                    .sort((a, b) => b.score - a.score || b.answeredCount - a.answeredCount)
                if (entries.length > 0) result.push({ difficulty, level, entries })
            }
        }
        return result
    }, [hallOfFame])

    return (
        <div className="page">
            <Navigation />

            <main className="container">
                <section className="hero">
                    <h1 className="neon-text">{t.hofTitle}</h1>
                    <p className="subtitle">{t.hofSubtitle}</p>
                </section>

                {groups.length === 0 ? (
                    <section className="card">
                        <div className="empty-state">
                            <p className="empty-message">{t.hofEmpty}</p>
                        </div>
                    </section>
                ) : (
                    groups.map(({ difficulty, level, entries }) => (
                        <section key={`${difficulty}-${level}`} className="card">
                            <h2 className="section-title">
                                {t.difficultyLabels[difficulty]} &nbsp;·&nbsp; {t.levelLabels[level]}
                            </h2>
                            <div className="hall-of-fame-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{t.hofColPlayer}</th>
                                            <th></th>
                                            <th>{t.hofColScore}</th>
                                            <th>{t.hofColQuestions}</th>
                                            <th>{t.hofColMath}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map((entry, idx) => (
                                            <tr key={`${entry.playerId}-${entry.level}-${entry.difficulty}-${idx}`} className={idx === 0 ? 'champion' : ''}>
                                                <td className="rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                                                <td className="player-name">{entry.player}</td>
                                                <td className="avatar">{entry.avatarId}</td>
                                                <td className="score neon-text">{entry.score}</td>
                                                <td className="questions">{entry.answeredCount}/{TOTAL_QUESTIONS_PER_RUN}</td>
                                                <td className="operation">{t.operationLabels[entry.operation] ?? entry.operation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))
                )}

                <div className="action-buttons">
                    {player && (
                        <button className="btn btn-primary" onClick={() => navigate('/game')}>
                            {t.hofPlayNow}
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        🏠 {t.navHome}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/settings')}>
                        ⚙️ {t.navSettings}
                    </button>
                </div>
            </main>
        </div>
    )
}
