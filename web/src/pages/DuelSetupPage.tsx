import { useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../components/TopBar'
import { store } from '../store'
import { avatars } from '../constants'
import { translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'
import type { DuelMode } from '../game'

/**
 * Who is playing, and whether anybody wins.
 *
 * The two names are typed here rather than taken from the device's profiles.
 * A profile carries a review schedule and a rank tuned to one child, and a
 * visiting cousin should not inherit either — nor leave anything behind in them.
 */

const MODES: readonly DuelMode[] = ['together', 'versus']

export default function DuelSetupPage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const [mode, setMode] = useState<DuelMode>('together')
    const [one, setOne] = useState('')
    const [two, setTwo] = useState('')

    const begin = () => {
        const params = new URLSearchParams({
            mode,
            one: one.trim() || t.duel.playerOne,
            two: two.trim() || t.duel.playerTwo,
        })
        navigate(`/game/two/play?${params.toString()}`)
    }

    return (
        <div className="page">
            <TopBar back={{ label: t.duel.exit, to: '/game' }} title={`👥 ${t.duel.title}`} />

            <main className="shell">
                <section className="panel">
                    <h2 className="panel__title">{t.duel.setupTitle}</h2>
                    <p className="panel__hint">{t.duel.blurb}</p>

                    <div className="duel-names">
                        <label className="duel-name">
                            <span aria-hidden="true">{avatars[0]}</span>
                            <input
                                type="text"
                                value={one}
                                maxLength={12}
                                onChange={event => setOne(event.target.value)}
                                placeholder={t.duel.playerOne}
                                aria-label={t.duel.playerOne}
                            />
                        </label>
                        <label className="duel-name">
                            <span aria-hidden="true">{avatars[1]}</span>
                            <input
                                type="text"
                                value={two}
                                maxLength={12}
                                onChange={event => setTwo(event.target.value)}
                                placeholder={t.duel.playerTwo}
                                aria-label={t.duel.playerTwo}
                            />
                        </label>
                    </div>
                </section>

                <section className="panel">
                    <h2 className="panel__title">{t.duel.modeTitle}</h2>
                    <div className="options">
                        {MODES.map(option => (
                            <button
                                key={option}
                                type="button"
                                className={`option option--block${mode === option ? ' option--active' : ''}`}
                                aria-pressed={mode === option}
                                onClick={() => setMode(option)}
                            >
                                <strong>{option === 'together' ? t.duel.modeTogether : t.duel.modeVersus}</strong>
                                <small>{option === 'together' ? t.duel.modeTogetherHint : t.duel.modeVersusHint}</small>
                            </button>
                        ))}
                    </div>
                </section>

                <button type="button" className="btn btn--primary btn--play" onClick={begin}>
                    <span className="btn__icon" aria-hidden="true">🚀</span>
                    {t.duel.start}
                </button>

                <p className="panel__hint duel-note">{t.duel.recordsNothing}</p>
            </main>
        </div>
    )
}
