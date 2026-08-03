import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import FactHeatmap from '../components/trainer/FactHeatmap'
import TopBar from '../components/TopBar'
import HowToPlayDialog from '../components/HowToPlayDialog'
import { useDocumentLanguage, useModalDialog } from '../hooks'
import { translations } from '../i18n'
import { localEpochDay } from '../review/leitner'
import { countDueFacts } from '../timesTable/session'
import { GALAXIES, getPlanet, isPlanetUnlocked, RECOMMENDED_ORDER } from '../timesTable/tables'
import { ttStore } from '../timesTable/ttStore'
import type { GalaxyId, PlanetId } from '../timesTable/types'
import { store } from '../store'

const galaxyText = (id: GalaxyId, t: ReturnType<typeof translationsFor>) => {
    switch (id) {
        case 'home': return { title: t.galaxyHome, tagline: t.galaxyHomeTagline, lockedHint: '' }
        case 'squares': return { title: t.galaxySquares, tagline: t.galaxySquaresTagline, lockedHint: t.lockedHintSquares }
        case 'shortcuts': return { title: t.galaxyShortcuts, tagline: t.galaxyShortcutsTagline, lockedHint: t.lockedHintShortcuts }
        case 'deep': return { title: t.galaxyDeep, tagline: t.galaxyDeepTagline, lockedHint: t.lockedHintDeep }
    }
}

const translationsFor = () => translations[store.getSettings().language].tt

export default function TimesTablesPage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language].tt
    const home = translations[settings.language].home
    useDocumentLanguage(settings.language)
    const [activePlanet, setActivePlanet] = useState<PlanetId | null>(null)
    const [heatmapView, setHeatmapView] = useState<'core' | 'extended' | 'squares'>('core')
    const [progress] = useState(() => ttStore.getProgress())
    const [howToOpen, setHowToOpen] = useState(false)
    const [stars] = useState(() => ttStore.getStars())
    const [today] = useState(() => localEpochDay(Date.now(), new Date().getTimezoneOffset()))
    const dueCount = useMemo(() => countDueFacts(progress, today), [progress, today])
    const hasAnyStar = Object.values(stars).some(star => (star ?? 0) > 0)
    const nextRecommended = RECOMMENDED_ORDER.find(planetId => (stars[planetId] ?? 0) === 0)
    const activePlanetInfo = activePlanet === null ? undefined : getPlanet(activePlanet)

    const selectPlanet = (planetId: PlanetId) => {
        if (isPlanetUnlocked(planetId, stars)) setActivePlanet(planetId)
    }

    const train = (phase: 'learn' | 'practice' | 'speed') => {
        if (activePlanet === null) return
        setActivePlanet(null)
        navigate(`/times-tables/train/${activePlanet}/${phase}`)
        window.scrollTo(0, 0)
    }

    return (
        <div className="page trainer-page">
            <TopBar
                back={{ label: translations[settings.language].nav.home, to: '/' }}
                title={t.title}
                actions={<>
                    <button type="button" className="btn btn--icon" onClick={() => setHowToOpen(true)}>
                        📖<span className="game-bar__hide-sm"> {home.howToPlay}</span>
                    </button>
                    <button type="button" className="btn btn--icon" onClick={() => navigate('/settings')}>
                        ⚙️<span className="game-bar__hide-sm"> {translations[settings.language].nav.settings}</span>
                    </button>
                </>}
            />
            <main className="shell trainer-shell">

                <section className="panel trainer-daily">
                    <h2 className="panel__title">{t.dailyMission}</h2>
                    {!hasAnyStar || dueCount === 0 ? <p className="panel__hint">{t.allCaughtUp}</p> : (
                        <button type="button" className="btn btn--primary" onClick={() => navigate('/times-tables/train/mission/daily')}>
                            {dueCount} {t.duePlayMission}
                        </button>
                    )}
                </section>

                {GALAXIES.map(galaxy => {
                    const text = galaxyText(galaxy.id, t)
                    return (
                        <section key={galaxy.id} className="panel trainer-galaxy">
                            <h2 className="panel__title">{text.title}</h2>
                            <p className="panel__hint">{text.tagline}</p>
                            <div className="trainer-planets">
                                {galaxy.planets.map(planet => {
                                    const unlocked = isPlanetUnlocked(planet.id, stars)
                                    const starLevel = stars[planet.id] ?? 0
                                    return (
                                        <button
                                            key={planet.id}
                                            type="button"
                                            className={`trainer-planet${unlocked ? '' : ' trainer-planet--locked'}`}
                                            disabled={!unlocked}
                                            onClick={() => selectPlanet(planet.id)}
                                        >
                                            <span aria-hidden="true">{planet.emoji}</span>
                                            <strong>{planet.label}</strong>
                                            <span aria-label={`${starLevel} stars`}>{'⭐'.repeat(starLevel)}</span>
                                            {planet.id === nextRecommended && <span className="trainer-planet__next">●</span>}
                                            {!unlocked && <small>{text.lockedHint}</small>}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>
                    )
                })}

                <section className="panel">
                    <h2 className="panel__title">{t.heatmapTitle}</h2>
                    <div className="trainer-tabs" role="tablist" aria-label={t.heatmapTitle}>
                        {(['core', 'extended', 'squares'] as const).map(view => {
                            const label = view === 'core'
                                ? t.heatmapCore
                                : view === 'extended' ? t.heatmapExtended : t.heatmapSquares
                            return (
                                <button
                                    key={view}
                                    id={`heatmap-tab-${view}`}
                                    type="button"
                                    role="tab"
                                    className="btn btn--ghost btn--sm"
                                    aria-selected={heatmapView === view}
                                    aria-controls="heatmap-panel"
                                    onClick={() => setHeatmapView(view)}
                                >{label}</button>
                            )
                        })}
                    </div>
                    <div id="heatmap-panel" role="tabpanel" aria-labelledby={`heatmap-tab-${heatmapView}`}>
                        <FactHeatmap progress={progress} view={heatmapView} />
                    </div>
                </section>
            </main>

            {activePlanet !== null && activePlanetInfo !== undefined && (
                <PhaseChooser title={`${activePlanetInfo.emoji} ${activePlanetInfo.label}`} onClose={() => setActivePlanet(null)}>
                    <button type="button" className="btn btn--ghost" autoFocus onClick={() => train('learn')}>{t.phaseLearn}</button>
                    <button type="button" className="btn btn--primary" onClick={() => train('practice')}>{t.phasePractice}</button>
                    <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={(stars[activePlanet] ?? 0) < 1}
                        onClick={() => train('speed')}
                    >{t.phaseSpeed}</button>
                </PhaseChooser>
            )}

            {howToOpen && (
                <HowToPlayDialog
                    title={home.howToTablesTitle}
                    steps={home.howToTablesSteps}
                    close={translations[settings.language].beam.helpClose}
                    onClose={() => setHowToOpen(false)}
                />
            )}
        </div>
    )
}

type PhaseChooserProps = {
    readonly title: string
    readonly onClose: () => void
    readonly children: ReactNode
}

function PhaseChooser({ title, onClose, children }: PhaseChooserProps) {
    const dialog = useModalDialog<HTMLDivElement>(onClose)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="phase-chooser-title" onClick={onClose} ref={dialog}>
            <div className="overlay__card trainer-phase-dialog" onClick={event => event.stopPropagation()}>
                <h2 className="overlay__title" id="phase-chooser-title">{title}</h2>
                {children}
            </div>
        </div>
    )
}
