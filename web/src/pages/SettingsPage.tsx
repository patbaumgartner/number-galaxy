import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { BADGE_EMOJI, store, type GameSettings } from '../store'
import { OPERATIONS, RANKS, rankConfig, type Operation, type Rank } from '../game'
import { languageNames } from '../constants'
import Flag from '../components/Flag'
import { fill, translations, type Translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'
import type { Language } from '../game'
import { ttStore } from '../timesTable/ttStore'
import { beamStore } from '../beam'

export default function SettingsPage() {
    const navigate = useNavigate()
    const [settings, setSettings] = useState<GameSettings>(() => store.getSettings())
    const [trainerSettings, setTrainerSettings] = useState(() => ttStore.getTTSettings())
    const [beamSettings, setBeamSettings] = useState(() => beamStore.getBeamSettings())
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

    const updateTrainer = (strategyCards: boolean) => {
        const next = { strategyCards }
        setTrainerSettings(next)
        ttStore.saveTTSettings(next)
    }

    const updateBeam = (alwaysShowBar: boolean) => {
        const next = { alwaysShowBar }
        setBeamSettings(next)
        beamStore.saveBeamSettings(next)
    }

    const resetTrainer = () => {
        if (!confirm(t.tt.settingsResetConfirm)) return
        ttStore.resetTrainerProgress()
        setTrainerSettings(ttStore.getTTSettings())
    }

    const resetBeam = () => {
        if (!confirm(t.beam.settingsResetConfirm)) return
        beamStore.resetBeamProgress()
        setBeamSettings(beamStore.getBeamSettings())
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

                <section className="group">
                    <div className="group__head">
                        <h2 className="group__title">{t.settings.groupInvaders}</h2>
                        <p className="group__hint">{t.settings.groupInvadersHint}</p>
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">{t.settings.practiceTitle}</h3>
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
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">{t.settings.rankTitle}</h3>
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
                    </div>

                    <div className="panel">
                        <div className="switch-row">
                            <div>
                                <h3 className="switch-row__title">⏱ {t.settings.timerTitle}</h3>
                                <p className="panel__hint">{t.settings.timerHint}</p>
                            </div>
                            <Switch labels={t.settings} on={settings.timed} onToggle={() => update({ timed: !settings.timed })} />
                        </div>

                        <div className="switch-row">
                            <div>
                                <h3 className="switch-row__title">💡 {t.settings.hintsTitle}</h3>
                                <p className="panel__hint">{t.settings.hintsHint}</p>
                            </div>
                            <Switch labels={t.settings} on={settings.hints} onToggle={() => update({ hints: !settings.hints })} />
                        </div>
                    </div>
                </section>

                <section className="group">
                    <div className="group__head">
                        <h2 className="group__title">{t.settings.groupTables}</h2>
                        <p className="group__hint">{t.settings.groupTablesHint}</p>
                    </div>

                    <div className="panel">
                        <div className="switch-row">
                            <div>
                                <h3 className="switch-row__title">{t.tt.settingsStrategyCards}</h3>
                                <p className="panel__hint">{t.tt.settingsStrategyHint}</p>
                            </div>
                            <Switch
                                labels={t.settings}
                                on={trainerSettings.strategyCards}
                                onToggle={() => updateTrainer(!trainerSettings.strategyCards)}
                            />
                        </div>
                        <div className="panel__action">
                            <button type="button" className="btn btn--danger" onClick={resetTrainer}>{t.tt.settingsReset}</button>
                        </div>
                    </div>
                </section>

                <section className="group">
                    <div className="group__head">
                        <h2 className="group__title">{t.settings.groupBeam}</h2>
                        <p className="group__hint">{t.settings.groupBeamHint}</p>
                    </div>

                    <div className="panel">
                        <div className="switch-row">
                            <div>
                                <h3 className="switch-row__title">📏 {t.beam.settingsBar}</h3>
                                <p className="panel__hint">{t.beam.settingsBarHint}</p>
                            </div>
                            <Switch
                                labels={t.settings}
                                on={beamSettings.alwaysShowBar}
                                onToggle={() => updateBeam(!beamSettings.alwaysShowBar)}
                            />
                        </div>
                        <div className="panel__action">
                            <button type="button" className="btn btn--danger" onClick={resetBeam}>{t.beam.settingsReset}</button>
                        </div>
                    </div>
                </section>

                <section className="group">
                    <div className="group__head">
                        <h2 className="group__title">{t.settings.groupShared}</h2>
                        <p className="group__hint">{t.settings.groupSharedHint}</p>
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">{t.settings.languageTitle}</h3>
                        <div className="options">
                            {(Object.keys(languageNames) as Language[]).map(code => (
                                <button
                                    key={code}
                                    type="button"
                                    className={`option${settings.language === code ? ' option--active' : ''}`}
                                    aria-pressed={settings.language === code}
                                    onClick={() => update({ language: code })}
                                >
                                    <Flag language={code} />
                                    {languageNames[code]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="panel">
                        <div className="switch-row">
                            <div>
                                <h3 className="switch-row__title">🔊 {t.settings.soundTitle}</h3>
                                <p className="panel__hint">{t.settings.soundHint}</p>
                            </div>
                            <Switch labels={t.settings} on={settings.sound} onToggle={() => update({ sound: !settings.sound })} />
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
                    </div>
                </section>

                <nav className="home-nav">
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
                        🏠 {t.nav.home}
                    </button>
                </nav>
            </main>
        </div>
    )
}

type SwitchProps = {
    readonly labels: Translations['settings']
    readonly on: boolean
    readonly onToggle: () => void
}

function Switch({ labels, on, onToggle }: SwitchProps) {
    return (
        <button type="button" className={`switch${on ? ' switch--on' : ''}`} role="switch" aria-checked={on} onClick={onToggle}>
            <span className="switch__track"><span className="switch__thumb" /></span>
            {on ? labels.on : labels.off}
        </button>
    )
}
