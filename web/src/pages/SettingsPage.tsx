import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import type { GameSettings } from '../store'
import Navigation from '../components/Navigation'
import { operationLabels, levelLabels, difficultyLabels } from '../constants'
import type { Language, Operation, Level, Difficulty } from '../game'

const languageLabels: Record<Language, string> = {
    de: '🇩🇪 Deutsch',
    it: '🇮🇹 Italiano',
    en: '🇬🇧 English',
    fr: '🇫🇷 Français',
}

export default function SettingsPage() {
    const navigate = useNavigate()
    const player = store.getPlayer()
    const [settings, setSettings] = useState<GameSettings>(store.getSettings())

    const update = (patch: Partial<GameSettings>) => {
        const next = { ...settings, ...patch }
        setSettings(next)
        store.saveSettings(next)
    }

    const toggleOperation = (op: Operation) => {
        const ops = settings.operations.includes(op)
            ? settings.operations.filter((o) => o !== op)
            : [...settings.operations, op]
        if (ops.length === 0) return // at least one required
        update({ operations: ops })
    }

    const handleClearData = () => {
        if (confirm('This will delete your name, avatar and all scores.\nAre you sure?')) {
            store.clearAllData()
            setSettings(store.getSettings())
            navigate('/')
        }
    }

    return (
        <div className="page">
            <Navigation />

            <main className="container">
                <section className="hero">
                    <h1 className="neon-text">⚙️ SETTINGS ⚙️</h1>
                    <p className="tagline">Changes are saved right away and used in your next game.</p>
                </section>

                {/* LANGUAGE */}
                <section className="card">
                    <h2 className="neon-subtitle">🌐 Language</h2>
                    <div className="toggle-group">
                        {(Object.entries(languageLabels) as [Language, string][]).map(([lang, label]) => (
                            <button
                                key={lang}
                                className={`toggle-btn ${settings.language === lang ? 'active' : ''}`}
                                onClick={() => update({ language: lang })}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* OPERATIONS */}
                <section className="card">
                    <h2 className="neon-subtitle">➕ What to Practise</h2>
                    <p className="config-hint">Choose one or more — they’ll be mixed together!</p>
                    <div className="toggle-group toggle-group--wrap">
                        {(Object.entries(operationLabels) as [Operation, string][]).map(([op, label]) => (
                            <button
                                key={op}
                                className={`toggle-btn ${settings.operations.includes(op) ? 'active' : ''}`}
                                onClick={() => toggleOperation(op)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* LEVEL */}
                <section className="card">
                    <h2 className="neon-subtitle">📊 How Big Are the Numbers?</h2>
                    <div className="toggle-group">
                        {(Object.entries(levelLabels) as [Level, string][]).map(([lv, label]) => (
                            <button
                                key={lv}
                                className={`toggle-btn ${settings.level === lv ? 'active' : ''}`}
                                onClick={() => update({ level: lv })}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* DIFFICULTY */}
                <section className="card">
                    <h2 className="neon-subtitle">⏱️ Time per Question</h2>
                    <div className="toggle-group">
                        {(Object.entries(difficultyLabels) as [Difficulty, string][]).map(([diff, label]) => (
                            <button
                                key={diff}
                                className={`toggle-btn ${settings.difficulty === diff ? 'active' : ''}`}
                                onClick={() => update({ difficulty: diff })}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* PLAYER */}
                <section className="card">
                    <h2 className="neon-subtitle">👤 Your Profile</h2>
                    {player ? (
                        <div className="player-info">
                            <p><strong>Name:</strong> {player.playerName}</p>
                            <p><strong>Avatar:</strong> {player.avatarId}</p>
                            <p><strong>Playing since:</strong> {new Date(player.createdAt).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>
                            No profile yet —{' '}
                            <button className="link-btn" onClick={() => navigate('/')}>create one on the home page</button>.
                        </p>
                    )}
                </section>

                {/* DATA */}
                <section className="card">
                    <h2 className="neon-subtitle">💾 Your Data</h2>
                    <ul className="info-list" style={{ marginBottom: '1.25rem' }}>
                        <li>All your scores are saved on this device</li>
                        <li>Nothing is sent to the internet</li>
                        <li>Works offline too!</li>
                    </ul>
                    <button className="btn btn-danger" onClick={handleClearData}>
                        🗑️ Delete Everything
                    </button>
                </section>

                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        🎮 Play
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

