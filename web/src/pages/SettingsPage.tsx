import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import type { GameSettings } from '../store'
import Navigation from '../components/Navigation'
import { operationLabels, levelLabels, difficultyLabels } from '../constants'
import type { Language, Operation, Level, Difficulty } from '../game'
import { translations } from '../translations'

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
    const t = translations[settings.language]

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
        if (confirm(t.settingsDeleteConfirm)) {
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
                    <h1 className="neon-text">{t.settingsTitle}</h1>
                    <p className="tagline">{t.settingsTagline}</p>
                </section>

                {/* LANGUAGE */}
                <section className="card">
                    <h2 className="neon-subtitle">{t.settingsLangSection}</h2>
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
                    <h2 className="neon-subtitle">{t.settingsOpsSection}</h2>
                    <p className="config-hint">{t.settingsOpsHint}</p>
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
                    <h2 className="neon-subtitle">{t.settingsLevelSection}</h2>
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
                    <h2 className="neon-subtitle">{t.settingsDiffSection}</h2>
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
                    <h2 className="neon-subtitle">{t.settingsProfileSection}</h2>
                    {player ? (
                        <div className="player-info">
                            <p><strong>{t.settingsProfileName}</strong> {player.playerName}</p>
                            <p><strong>{t.settingsProfileAvatar}</strong> {player.avatarId}</p>
                            <p><strong>{t.settingsProfileSince}</strong> {new Date(player.createdAt).toLocaleDateString(settings.language, { dateStyle: 'long' })}</p>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>
                            {t.settingsNoProfile}{' '}
                            <button className="link-btn" onClick={() => navigate('/')}>{t.settingsNoProfileLink}</button>.
                        </p>
                    )}
                </section>

                {/* DATA */}
                <section className="card">
                    <h2 className="neon-subtitle">{t.settingsDataSection}</h2>
                    <ul className="info-list" style={{ marginBottom: '1.25rem' }}>
                        {t.settingsDataInfo.map((info, i) => <li key={i}>{info}</li>)}
                    </ul>
                    <button className="btn btn-danger" onClick={handleClearData}>
                        {t.settingsDeleteBtn}
                    </button>
                </section>

                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => navigate('/game')}>
                        {t.settingsPlayBtn}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        {t.gameHome}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>
                        {t.gameHallOfFame}
                    </button>
                </div>
            </main>
        </div>
    )
}

