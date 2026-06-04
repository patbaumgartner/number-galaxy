import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store, computeBadge, BADGE_EMOJI, type GameSettings } from '../store'
import Navigation from '../components/Navigation'
import { languageLabels } from '../constants'
import type { Language, Operation, Level, Difficulty } from '../game'
import { translations } from '../translations'

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

    const skillStats = store.getSkillStats()

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
                        {(Object.entries(t.operationLabels) as [Operation, string][]).map(([op, label]) => {
                            const badge = computeBadge(skillStats[op]?.history ?? [])
                            return (
                                <button
                                    key={op}
                                    className={`toggle-btn ${settings.operations.includes(op) ? 'active' : ''}`}
                                    onClick={() => toggleOperation(op)}
                                >
                                    {BADGE_EMOJI[badge] && <span className="badge-icon">{BADGE_EMOJI[badge]}</span>}
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* LEVEL */}
                <section className="card">
                    <h2 className="neon-subtitle">{t.settingsLevelSection}</h2>
                    <div className="toggle-group">
                        {(Object.entries(t.levelLabels) as [Level, string][]).map(([lv, label]) => (
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
                        {(Object.entries(t.difficultyLabels) as [Difficulty, string][]).map(([diff, label]) => (
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

                {/* MODE */}
                <section className="card">
                    <h2 className="neon-subtitle">⏱ Mode</h2>
                    <p className="config-hint">Drill: countdown pressure · Explore: no timer, learn at your own pace</p>
                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${settings.mode === 'drill' ? 'active' : ''}`}
                            onClick={() => update({ mode: 'drill' })}
                        >⏱ Drill</button>
                        <button
                            className={`toggle-btn ${settings.mode === 'explore' ? 'active' : ''}`}
                            onClick={() => update({ mode: 'explore' })}
                        >🔭 Explore</button>
                    </div>
                </section>

                {/* CONFIDENCE CHECK */}
                <section className="card">
                    <h2 className="neon-subtitle">🤔 Confidence Check</h2>
                    <p className="config-hint">After each answer, ask yourself: "Did I really know that?" Helps with self-reflection.</p>
                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${settings.confidence ? 'active' : ''}`}
                            onClick={() => update({ confidence: true })}
                        >✅ On</button>
                        <button
                            className={`toggle-btn ${!settings.confidence ? 'active' : ''}`}
                            onClick={() => update({ confidence: false })}
                        >⛔ Off</button>
                    </div>
                </section>

                {/* DATA */}
                <section className="card">
                    <h2 className="neon-subtitle">{t.settingsDataSection}</h2>
                    <ul className="info-list">
                        {t.settingsDataInfo.map((info, i) => <li key={i}>{info}</li>)}
                    </ul>
                    <button className="btn btn-danger" onClick={handleClearData}>
                        {t.settingsDeleteBtn}
                    </button>
                </section>

                <div className="action-buttons">
                    {player && (
                        <button className="btn btn-primary" onClick={() => navigate('/game')}>
                            {t.settingsPlayBtn}
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        🏠 {t.navHome}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>
                        🏆 {t.navHallOfFame}
                    </button>
                </div>
            </main>
        </div>
    )
}
