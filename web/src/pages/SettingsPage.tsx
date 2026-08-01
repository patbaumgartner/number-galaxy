import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { BADGE_EMOJI, store, type GameSettings } from '../store'
import { OPERATIONS, RANKS, rankConfig, type Operation, type Rank } from '../game'
import { languageLabels } from '../constants'
import { fill, translations } from '../translations'
import { useDocumentLanguage } from '../hooks'
import type { Language } from '../game'

export default function SettingsPage() {
    const navigate = useNavigate()
    const [settings, setSettings] = useState<GameSettings>(() => store.getSettings())
    const t = translations[settings.language]
    const skills = useMemo(() => store.getSkillStats(), [])
    const badges = useMemo(
        () => new Map(OPERATIONS.map(op => [op, store.computeBadge(skills[op]?.history ?? [])])),
        [skills],
    )
    useDocumentLanguage(settings.language)

    const update = (patch: Partial<GameSettings>) => {
        const next = { ...settings, ...patch }
        setSettings(next)
        store.saveSettings(next)
    }

    const toggleOperation = (operation: Operation) => {
        const next = settings.operations.includes(operation)
            ? settings.operations.filter(entry => entry !== operation)
            : [...settings.operations, operation]
        if (next.length === 0) return
        update({ operations: next })
    }

    const reset = () => {
        if (!confirm(t.settings.resetConfirm)) return
        store.clearAllData()
        setSettings(store.getSettings())
        navigate('/')
    }

    return (
        <div className="page">
            <main className="shell">
                <header className="shell__head">
                    <h1 className="shell__title">⚙️ {t.settings.title}</h1>
                    <p className="shell__tagline">{t.settings.tagline}</p>
                </header>

                <section className="panel">
                    <h2 className="panel__title">{t.settings.practiceTitle}</h2>
                    <p className="panel__hint">{t.settings.practiceHint}</p>
                    <div className="options">
                        {OPERATIONS.map(operation => {
                            const badge = badges.get(operation) ?? 'none'
                            const active = settings.operations.includes(operation)
                            const locked = active && settings.operations.length === 1
                            return (
                                <button
                                    key={operation}
                                    type="button"
                                    className={`option${active ? ' option--active' : ''}${locked ? ' option--locked' : ''}`}
                                    aria-pressed={active}
                                    aria-disabled={locked}
                                    onClick={() => toggleOperation(operation)}
                                >
                                    {t.operations[operation]}
                                    <span className="option__marks">
                                        {badge !== 'none' && (
                                            <span className="option__badge" aria-hidden="true">{BADGE_EMOJI[badge]}</span>
                                        )}
                                        <span className="option__state" aria-hidden="true">
                                            {locked ? '🔒' : active ? '✓' : ''}
                                        </span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                    {settings.operations.length === 1 && (
                        <p className="panel__note">{t.settings.keepOne}</p>
                    )}
                </section>

                <section className="panel">
                    <h2 className="panel__title">{t.settings.rankTitle}</h2>
                    <p className="panel__hint">{t.settings.rankHint}</p>
                    <div className="ladder">
                        {RANKS.map((rank: Rank) => (
                            <button
                                key={rank}
                                type="button"
                                className={`rung${settings.rank === rank ? ' rung--active' : ''}`}
                                aria-pressed={settings.rank === rank}
                                onClick={() => update({ rank })}
                            >
                                <span className="rung__name">{t.ranks[rank]}</span>
                                <span className="rung__meta">
                                    {fill(t.settings.rankRange, { max: rankConfig[rank].maxValue })}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="panel">
                    <h2 className="panel__title">{t.settings.languageTitle}</h2>
                    <div className="options">
                        {(Object.entries(languageLabels) as [Language, string][]).map(([code, label]) => (
                            <button
                                key={code}
                                type="button"
                                className={`option${settings.language === code ? ' option--active' : ''}`}
                                aria-pressed={settings.language === code}
                                onClick={() => update({ language: code })}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                <details className="panel panel--details">
                    <summary className="panel__title">{t.settings.moreTitle}</summary>

                    <div className="switch-row">
                        <div>
                            <h3 className="switch-row__title">⏱ {t.settings.timerTitle}</h3>
                            <p className="panel__hint">{t.settings.timerHint}</p>
                        </div>
                        <button
                            type="button"
                            className={`switch${settings.timed ? ' switch--on' : ''}`}
                            role="switch"
                            aria-checked={settings.timed}
                            onClick={() => update({ timed: !settings.timed })}
                        >
                            <span className="switch__track"><span className="switch__thumb" /></span>
                            {settings.timed ? t.settings.on : t.settings.off}
                        </button>
                    </div>

                    <div className="switch-row">
                        <div>
                            <h3 className="switch-row__title">🔊 {t.settings.soundTitle}</h3>
                            <p className="panel__hint">{t.settings.soundHint}</p>
                        </div>
                        <button
                            type="button"
                            className={`switch${settings.sound ? ' switch--on' : ''}`}
                            role="switch"
                            aria-checked={settings.sound}
                            onClick={() => update({ sound: !settings.sound })}
                        >
                            <span className="switch__track"><span className="switch__thumb" /></span>
                            {settings.sound ? t.settings.on : t.settings.off}
                        </button>
                    </div>

                    <div className="switch-row">
                        <div>
                            <h3 className="switch-row__title">💡 {t.settings.hintsTitle}</h3>
                            <p className="panel__hint">{t.settings.hintsHint}</p>
                        </div>
                        <button
                            type="button"
                            className={`switch${settings.hints ? ' switch--on' : ''}`}
                            role="switch"
                            aria-checked={settings.hints}
                            onClick={() => update({ hints: !settings.hints })}
                        >
                            <span className="switch__track"><span className="switch__thumb" /></span>
                            {settings.hints ? t.settings.on : t.settings.off}
                        </button>
                    </div>

                    <div className="switch-row switch-row--stack">
                        <div>
                            <h3 className="switch-row__title">🗄 {t.settings.dataTitle}</h3>
                            <ul className="panel__list">
                                {t.settings.dataInfo.map((info, index) => <li key={index}>{info}</li>)}
                            </ul>
                        </div>
                        <button type="button" className="btn btn--danger" onClick={reset}>
                            {t.settings.reset}
                        </button>
                    </div>
                </details>

                <nav className="home-nav">
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/game')}>
                        🚀 {t.settings.done}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/')}>
                        🏠 {t.nav.home}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/hall-of-fame')}>
                        🏆 {t.nav.hallOfFame}
                    </button>
                </nav>
            </main>
        </div>
    )
}
