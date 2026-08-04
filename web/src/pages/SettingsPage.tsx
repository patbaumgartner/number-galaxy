import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { THINKING_TIMES, store, type GameSettings } from '../store'
import { OPERATIONS, type Operation } from '../game'
import { languageNames } from '../constants'
import Flag from '../components/Flag'
import Switch from '../components/settings/Switch'
import OneSwitchGroup from '../components/settings/OneSwitchGroup'
import ArcadeSettings from '../components/settings/ArcadeSettings'
import { translations, type Translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'
import type { Language } from '../game'
import { ttStore } from '../timesTable/ttStore'
import { beamStore } from '../beam'
import { senseStore } from '../sense'

const thinkingLabel = (t: Translations, value: GameSettings['thinkingTime']): string =>
    value === 1 ? t.settings.thinkingNormal : value === 1.5 ? t.settings.thinkingMore : t.settings.thinkingMost

export default function SettingsPage() {
    const navigate = useNavigate()
    const [settings, setSettings] = useState<GameSettings>(() => store.getSettings())
    const [trainerSettings, setTrainerSettings] = useState(() => ttStore.getTTSettings())
    const [beamSettings, setBeamSettings] = useState(() => beamStore.getBeamSettings())
    const [senseSettings, setSenseSettings] = useState(() => senseStore.getSenseSettings())
    const t = translations[settings.language]
    const skills = useMemo(() => store.getSkillStats(), [])
    const mistake = useMemo(() => store.getCommonMistake(), [])
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

    const updateSense = (briefGlance: boolean) => {
        const next = { briefGlance }
        setSenseSettings(next)
        senseStore.saveSenseSettings(next)
    }

    const resetSense = () => {
        if (!confirm(t.sense.settingsResetConfirm)) return
        senseStore.resetSenseProgress()
        setSenseSettings(senseStore.getSenseSettings())
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

                <OneSwitchGroup
                    labels={t.settings}
                    title={t.settings.groupSense}
                    hint={t.settings.groupSenseHint}
                    switchTitle={`👁 ${t.sense.settingsGlance}`}
                    switchHint={t.sense.settingsGlanceHint}
                    on={senseSettings.briefGlance}
                    resetLabel={t.sense.settingsReset}
                    onToggle={() => updateSense(!senseSettings.briefGlance)}
                    onReset={resetSense}
                />

                <OneSwitchGroup
                    labels={t.settings}
                    title={t.settings.groupBeam}
                    hint={t.settings.groupBeamHint}
                    switchTitle={`📏 ${t.beam.settingsBar}`}
                    switchHint={t.beam.settingsBarHint}
                    on={beamSettings.alwaysShowBar}
                    resetLabel={t.beam.settingsReset}
                    onToggle={() => updateBeam(!beamSettings.alwaysShowBar)}
                    onReset={resetBeam}
                />

                <ArcadeSettings
                    t={t}
                    settings={settings}
                    badges={badges}
                    mistake={mistake}
                    onUpdate={update}
                    onToggleOperation={toggleOperation}
                />

                <OneSwitchGroup
                    labels={t.settings}
                    title={t.settings.groupTables}
                    hint={t.settings.groupTablesHint}
                    switchTitle={t.tt.settingsStrategyCards}
                    switchHint={t.tt.settingsStrategyHint}
                    on={trainerSettings.strategyCards}
                    resetLabel={t.tt.settingsReset}
                    onToggle={() => updateTrainer(!trainerSettings.strategyCards)}
                    onReset={resetTrainer}
                />

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
                        <h3 className="panel__title">🧠 {t.settings.thinkingTitle}</h3>
                        <p className="panel__hint">{t.settings.thinkingHint}</p>
                        <div className="options options--row">
                            {THINKING_TIMES.map(value => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`option${settings.thinkingTime === value ? ' option--active' : ''}`}
                                    aria-pressed={settings.thinkingTime === value}
                                    onClick={() => update({ thinkingTime: value })}
                                >
                                    {thinkingLabel(t, value)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="panel">
                        <div className="switch-row">
                            <div>
                                <h3 className="switch-row__title">🔤 {t.settings.readableTitle}</h3>
                                <p className="panel__hint">{t.settings.readableHint}</p>
                            </div>
                            <Switch
                                labels={t.settings}
                                on={settings.readableText}
                                onToggle={() => update({ readableText: !settings.readableText })}
                            />
                        </div>
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">🖨 {t.printables.title}</h3>
                        <p className="panel__hint">{t.printables.hint}</p>
                        <div className="panel__action">
                            <button type="button" className="btn btn--ghost" onClick={() => navigate('/printables')}>
                                {t.printables.title}
                            </button>
                        </div>
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">{t.progress.title}</h3>
                        <p className="panel__hint">{t.progress.tagline}</p>
                        <div className="panel__action">
                            <button type="button" className="btn btn--ghost" onClick={() => navigate('/progress')}>
                                {t.progress.title}
                            </button>
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
