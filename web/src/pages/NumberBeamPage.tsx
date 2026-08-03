import { useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../components/TopBar'
import HowToPlayDialog from '../components/HowToPlayDialog'
import { BEAM_ZONES, beamStore, isZoneUnlocked, nextRecommendedStation } from '../beam'
import { store } from '../store'
import { fill, translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'

export default function NumberBeamPage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const [howToOpen, setHowToOpen] = useState(false)
    const [stars] = useState(() => beamStore.getStars())
    const [bests] = useState(() => beamStore.getBests())
    const recommended = nextRecommendedStation(stars)

    return (
        <div className="page beam-page">
            <TopBar
                back={{ label: t.nav.home, to: '/' }}
                title={t.beam.title}
                actions={<>
                    <button type="button" className="btn btn--icon" onClick={() => setHowToOpen(true)}>
                        📖<span className="game-bar__hide-sm"> {t.home.howToPlay}</span>
                    </button>
                    <button type="button" className="btn btn--icon" onClick={() => navigate('/settings')}>
                        ⚙️<span className="game-bar__hide-sm"> {t.nav.settings}</span>
                    </button>
                </>}
            />

            <main className="shell beam-shell">
                <section className="panel">
                    <h2 className="panel__title">{t.beam.mapTitle}</h2>
                    <p className="panel__hint">{t.beam.mapHint}</p>
                </section>

                {BEAM_ZONES.map(zone => {
                    const unlocked = isZoneUnlocked(zone.id, stars)
                    return (
                        <section key={zone.id} className="panel beam-zone">
                            <h2 className="panel__title">{zone.emoji} {t.beam.zones[zone.id]}</h2>
                            <p className="panel__hint">{t.beam.zoneTaglines[zone.id]}</p>
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
                                            onClick={() => navigate(`/number-beam/drill/${station.id}`)}
                                        >
                                            <span className="beam-station__emoji" aria-hidden="true">{station.emoji}</span>
                                            <strong>{t.beam.skills[station.id]}</strong>
                                            <span className="beam-station__sample" aria-hidden="true">
                                                {station.sample.prompt}
                                            </span>
                                            <span aria-label={`${level} stars`}>{'⭐'.repeat(level)}</span>
                                            {best !== undefined && (
                                                <small>{fill(t.beam.best, { percent: Math.round(best * 100) })}</small>
                                            )}
                                            {station.id === recommended && (
                                                <span className="beam-station__next" aria-hidden="true">●</span>
                                            )}
                                            {!unlocked && <small>{t.beam.lockedHint}</small>}
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
                    title={t.home.howToBeamTitle}
                    steps={t.home.howToBeamSteps}
                    close={t.beam.helpClose}
                    onClose={() => setHowToOpen(false)}
                />
            )}
        </div>
    )
}
