import { useNavigate } from 'react-router'
import { store } from '../store'
import { translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'

/**
 * Paper, for the part of a maths lesson that is not a screen.
 *
 * Blitzrechnen and the Zahlenbuch both ship printable material, and a Swiss
 * classroom uses it: dot cards for a flash routine, ten-frames to fill in, an
 * empty number line to draw jumps on. None of it needs a device, and a teacher
 * with one tablet and twenty children needs the version that does not.
 *
 * Drawn from the same numbers the games use rather than scanned, so it prints at
 * whatever size the paper is and matches what the child sees on screen.
 */

/** Three to nine: past nine a quantity wants a ten-frame, not a die face. */
const DOT_CARDS = [3, 4, 5, 6, 7, 8, 9] as const

const FRAME_ROWS = [0, 1] as const

const LINE_TICKS = Array.from({ length: 11 }, (_unused, index) => index)

const dieDots = (count: number): readonly boolean[] => {
    const faces: Record<number, readonly number[]> = {
        3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
        7: [0, 2, 3, 4, 5, 6, 8], 8: [0, 1, 2, 3, 5, 6, 7, 8], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    }
    const on = new Set(faces[count] ?? [])
    return Array.from({ length: 9 }, (_unused, cell) => on.has(cell))
}

export default function PrintablesPage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    return (
        <div className="page">
            <main className="shell printables">
                <section className="panel no-print">
                    <h1 className="panel__title">🖨 {t.printables.title}</h1>
                    <p className="panel__hint">{t.printables.hint}</p>
                    <div className="printables__actions">
                        <button type="button" className="btn btn--primary" onClick={() => window.print()}>
                            🖨 {t.progress.printButton}
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => navigate('/settings')}>
                            {t.nav.settings}
                        </button>
                    </div>
                </section>

                <section className="print-sheet">
                    <h2 className="print-sheet__title">{t.printables.dotCards}</h2>
                    <div className="print-cards">
                        {DOT_CARDS.map(count => (
                            <div key={count} className="print-card">
                                <div className="print-card__face">
                                    {dieDots(count).map((filled, cell) => (
                                        <span key={cell} className={filled ? 'print-dot' : 'print-dot print-dot--off'} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="print-sheet">
                    <h2 className="print-sheet__title">{t.printables.tenFrames}</h2>
                    <div className="print-frames">
                        {[0, 1, 2, 3].map(frame => (
                            <div key={frame} className="print-frame">
                                {FRAME_ROWS.map(row => (
                                    <div key={row} className="print-frame__row">
                                        {Array.from({ length: 5 }, (_unused, cell) => (
                                            <span key={cell} className="print-cell" />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="print-sheet">
                    <h2 className="print-sheet__title">{t.printables.numberLines}</h2>
                    {[0, 1, 2, 3].map(line => (
                        <div key={line} className="print-line">
                            <div className="print-line__rail" />
                            {LINE_TICKS.map(tick => (
                                <span key={tick} className="print-line__tick" style={{ left: `${tick * 10}%` }} />
                            ))}
                        </div>
                    ))}
                </section>
            </main>
        </div>
    )
}
