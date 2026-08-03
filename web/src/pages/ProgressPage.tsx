import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../components/TopBar'
import { buildReport, store, type ProgressReport } from '../store'
import { OPERATIONS } from '../game'
import { fill, translations, type Translations } from '../i18n'
import type { Strategy } from '../store'
import { useDocumentLanguage } from '../hooks'

/**
 * What a parent or a teacher sees, and only that.
 *
 * It reads what is already on the device and records nothing of its own. The
 * question it exists to answer is "what should we practise next?", so it answers
 * it in words — a named habit and a short list of sums — rather than with a
 * percentage, which says how it went and not what to do about it.
 */
export default function ProgressPage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const report = useMemo(() => buildReport(), [])

    const download = () => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `number-galaxy-${report.player || 'progress'}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="page">
            <TopBar
                back={{ label: t.nav.home, to: '/' }}
                title={t.progress.title}
                actions={
                    <button type="button" className="btn btn--icon" onClick={() => navigate('/settings')}>
                        ⚙️<span className="game-bar__hide-sm"> {t.nav.settings}</span>
                    </button>
                }
            />

            <main className="shell report">
                <header className="shell__head">
                    <p className="shell__tagline">{t.progress.tagline}</p>
                    {report.player.length > 0 && (
                        <h2 className="panel__title">{fill(t.progress.forWhom, { name: report.player })}</h2>
                    )}
                </header>

                <ArcadeSection report={report} t={t} />

                <section className="panel">
                    <h2 className="panel__title">{t.progress.tablesTitle}</h2>
                    <p>{fill(t.progress.tablesKnown, { known: report.tables.factsKnown, total: report.tables.factsTotal })}</p>
                    <p className="panel__hint">
                        {fill(t.progress.stars, { stars: report.tables.stars, outOf: report.tables.starsOutOf })}
                    </p>
                </section>

                <section className="panel">
                    <h2 className="panel__title">{t.progress.beamTitle}</h2>
                    <p>{fill(t.progress.stars, { stars: report.beam.stars, outOf: report.beam.outOf })}</p>
                </section>

                <section className="panel">
                    <h2 className="panel__title">{t.progress.senseTitle}</h2>
                    <p>{fill(t.progress.stars, { stars: report.sense.stars, outOf: report.sense.outOf })}</p>
                </section>

                <section className="panel report__actions">
                    <h2 className="panel__title">{t.progress.exportTitle}</h2>
                    <p className="panel__hint">{t.progress.exportHint}</p>
                    <div className="panel__action">
                        <button type="button" className="btn btn--ghost" onClick={download}>
                            {t.progress.exportButton}
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
                            {t.progress.printButton}
                        </button>
                    </div>
                </section>

                <p className="report__privacy">{t.progress.privacy}</p>
            </main>
        </div>
    )
}

const strategyLabel = (t: Translations, strategy: Strategy): string =>
    strategy === 'counted'
        ? t.progress.strategyStillCounting
        : strategy === 'knew' ? t.progress.strategyKnows : t.progress.strategyTricks

function ArcadeSection({ report, t }: { readonly report: ProgressReport; readonly t: Translations }) {
    const { arcade } = report

    return (
        <section className="panel">
            <h2 className="panel__title">{t.progress.arcadeTitle}</h2>

            <ul className="report__skills">
                {OPERATIONS.map(operation => {
                    const line = arcade.skills.find(entry => entry.operation === operation)
                    return (
                        <li key={operation} className="report__skill">
                            <span>{t.operations[operation]}</span>
                            <span className="report__value">
                                {line === undefined || line.accuracy === null
                                    ? t.progress.notYet
                                    : `${Math.round(line.accuracy * 100)}% · ${fill(t.progress.answered, { n: line.answered })}`}
                                {line?.strategy != null && (
                                    <small className="report__strategy">{strategyLabel(t, line.strategy)}</small>
                                )}
                            </span>
                        </li>
                    )
                })}
            </ul>

            <p>{fill(t.progress.factsKnown, { known: arcade.factsKnown, seen: arcade.factsSeen })}</p>

            {arcade.mistake !== null && <p className="equation__note">{t.misses[arcade.mistake]}</p>}

            <h3 className="panel__title">{t.progress.practiseNext}</h3>
            {arcade.practiseNext.length === 0 ? (
                <p className="panel__hint">{t.progress.nothingDue}</p>
            ) : (
                <ul className="chips">
                    {arcade.practiseNext.map(fact => <li key={fact} className="chip">{fact}</li>)}
                </ul>
            )}
        </section>
    )
}
