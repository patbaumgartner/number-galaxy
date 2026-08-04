import { useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../components/TopBar'
import HowToPlayDialog from '../components/HowToPlayDialog'
import { SENSE_ZONES, isSenseZoneUnlocked, nextRecommendedSenseStation, senseStore } from '../sense'
import { store } from '../store'
import { fill, translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'

export default function NumberSensePage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const [howToOpen, setHowToOpen] = useState(false)
    const [stars] = useState(() => senseStore.getStars())
    const [bests] = useState(() => senseStore.getBests())
    const recommended = nextRecommendedSenseStation(stars)

    return (
        <div className="page beam-page">
            <TopBar
                back={{ label: t.nav.home, to: '/' }}
                title={t.sense.title}
                actions={<>
                    <button type="button" className="btn btn--icon" onClick={() => setHowToOpen(true)}>
                        ℹ️<span className="game-bar__hide-sm"> {t.home.howToPlay}</span>
                    </button>
                    <button type="button" className="btn btn--icon" onClick={() => navigate('/settings')}>
                        ⚙️<span className="game-bar__hide-sm"> {t.nav.settings}</span>
                    </button>
                </>}
            />

            <main className="shell beam-shell">
                <section className="panel">
                    <h2 className="panel__title">{t.sense.mapTitle}</h2>
                    <p className="panel__hint">{t.sense.mapHint}</p>
                </section>

                <button
                    type="button"
                    className="btn btn--ghost sense-play__entry"
                    onClick={() => navigate('/number-sense/play')}
                >
                    🧩 {t.sense.playCard}
                </button>

                {SENSE_ZONES.map(zone => {
                    const unlocked = isSenseZoneUnlocked(zone.id, stars)
                    return (
                        <section key={zone.id} className="panel beam-zone">
                            <h2 className="panel__title">{zone.emoji} {t.sense.zones[zone.id]}</h2>
                            <p className="panel__hint">{t.sense.zoneTaglines[zone.id]}</p>
                            <div className="beam-stations">
                                {zone.stations.map(station => {
                                    const level = stars[station.id] ?? 0
                                    const best = bests[station.id]
                                    return (
                                        <button
                                            key={station.id}
                                            type="button"
                                            className={`beam-station${unlocked ? '' : ' beam-station--locked'}`}
                                            disabled={!unlocked}
                                            onClick={() => navigate(`/number-sense/drill/${station.id}`)}
                                        >
                                            <span className="beam-station__emoji" aria-hidden="true">{station.emoji}</span>
                                            <strong>{t.sense.skills[station.id]}</strong>
                                            <span aria-label={`${level} stars`}>{'⭐'.repeat(level)}</span>
                                            {best !== undefined && (
                                                <small>{fill(t.beam.best, { percent: Math.round(best * 100) })}</small>
                                            )}
                                            {station.id === recommended && (
                                                <span className="beam-station__next" aria-hidden="true">●</span>
                                            )}
                                            {!unlocked && <small>{t.sense.lockedHint}</small>}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>
                    )
                })}
            </main>

            {howToOpen && (
                <HowToPlayDialog
                    title={t.home.howToSenseTitle}
                    steps={t.home.howToSenseSteps}
                    close={t.beam.helpClose}
                    onClose={() => setHowToOpen(false)}
                />
            )}
        </div>
    )
}
