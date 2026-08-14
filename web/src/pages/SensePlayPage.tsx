import { useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../components/TopBar'
import SenseVisual from '../components/sense/SenseVisual'
import { patternFor } from '../sense'
import { store } from '../store'
import { fill, translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'

/**
 * The only screen in the app that asks nothing.
 *
 * Every other station hands a child a question and waits. That is the right way
 * to practise and the wrong way to meet an idea for the first time: a quantity
 * becomes "7 is 5 and 2" by being looked at, not by being marked. So here one
 * number is shown four ways at once and the child moves it — nothing is scored,
 * nothing is timed, and nothing is unlocked by it.
 *
 * Seeing the same seven as a die face, on a ten-frame, on a bead rack and as a
 * place on a line is the point; the four representations are what make it one
 * number rather than four unrelated pictures.
 */

const MAX = 20

const STEPS = [1, 5, 10] as const

export default function SensePlayPage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const [value, setValue] = useState(5)

    const move = (by: number) => setValue(current => Math.min(MAX, Math.max(0, current + by)))

    // Zero has no arrangement to recognise, and `patternFor` only speaks for
    // counts it can draw as a die face or in fives. An empty grid is the honest
    // picture of none.
    const pattern = value === 0 ? { dots: [], columns: 3, parts: [] } : patternFor(value, value > 6)

    return (
        <div className="page beam-page">
            <TopBar back={{ label: t.sense.exitToMap, to: '/number-sense' }} title={`🧩 ${t.sense.playTitle}`} />

            <main className="shell beam-shell">
                <section className="panel">
                    <h2 className="panel__title">{t.sense.playTitle}</h2>
                    <p className="panel__hint">{t.sense.playHint}</p>
                </section>

                <section className="panel sense-play__number">
                    <output className="sense-play__value" aria-live="polite">{value}</output>
                    <div className="sense-play__controls">
                        {STEPS.map(step => (
                            <button
                                key={`minus-${step}`}
                                type="button"
                                className="btn btn--ghost sense-play__step"
                                onClick={() => move(-step)}
                                disabled={value === 0}
                                aria-label={fill(t.sense.playLess, { n: step })}
                            >
                                −{step}
                            </button>
                        ))}
                        {STEPS.map(step => (
                            <button
                                key={`plus-${step}`}
                                type="button"
                                className="btn btn--ghost sense-play__step"
                                onClick={() => move(step)}
                                disabled={value === MAX}
                                aria-label={fill(t.sense.playMore, { n: step })}
                            >
                                +{step}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="panel sense-play__views">
                    <h3 className="sense-play__caption">{t.sense.skills.subitize}</h3>
                    <SenseVisual
                        visual={{ kind: 'dots', dots: pattern.dots, columns: pattern.columns, brief: false }}
                        visible
                        label={fill(t.sense.playDots, { n: value })}
                    />

                    <h3 className="sense-play__caption">{t.sense.skills.tenFrame}</h3>
                    <SenseVisual
                        visual={{ kind: 'tenFrame', filled: value, frames: 2 }}
                        visible
                        label={fill(t.sense.playFrame, { n: value })}
                    />

                    <h3 className="sense-play__caption">{t.sense.skills.rekenrek}</h3>
                    <SenseVisual
                        visual={{ kind: 'rekenrek', rows: [Math.min(10, value), Math.max(0, value - 10)] }}
                        visible
                        label={fill(t.sense.playRack, { n: value })}
                    />

                    <h3 className="sense-play__caption">{t.sense.zones.line}</h3>
                    <SenseVisual
                        visual={{ kind: 'numberLine', max: MAX, from: 0, jump: value }}
                        visible
                        label={fill(t.sense.playLine, { n: value, max: MAX })}
                    />
                </section>

                <nav className="home-nav">
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/number-sense')}>
                        {t.sense.exitToMap}
                    </button>
                </nav>
            </main>
        </div>
    )
}
