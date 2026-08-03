import { useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../components/TopBar'
import HowToPlayDialog from '../components/HowToPlayDialog'
import { QUESTIONS_PER_MISSION, rankConfig } from '../game'
import { store } from '../store'
import { fill, translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'

/**
 * The arcade's front door.
 *
 * The other three games each open onto a map, and this one used to drop the
 * child straight into a mission — which left its two pre-flight pieces, the
 * mission summary and the leaderboard, stranded on a home page that belongs to
 * all four games equally. They live here now.
 */
export default function ArcadePage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const [howToOpen, setHowToOpen] = useState(false)

    return (
        <div className="page beam-page">
            <TopBar
                back={{ label: t.nav.home, to: '/' }}
                title={<>🛸 {t.home.gameInvaders}</>}
                actions={<>
                    <button type="button" className="btn btn--icon" onClick={() => setHowToOpen(true)}>
                        ❓<span className="game-bar__hide-sm"> {t.home.howToPlay}</span>
                    </button>
                    <button type="button" className="btn btn--icon" onClick={() => navigate('/settings')}>
                        ⚙️<span className="game-bar__hide-sm"> {t.nav.settings}</span>
                    </button>
                </>}
            />

            <main className="shell beam-shell">
                <section className="panel">
                    <div className="panel__head">
                        <h2 className="panel__title">{t.home.missionTitle}</h2>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/settings')}>
                            {t.home.change}
                        </button>
                    </div>
                    <ul className="chips">
                        {settings.operations.map(operation => (
                            <li key={operation} className="chip">{t.operations[operation]}</li>
                        ))}
                        <li className="chip chip--rank">{t.ranks[settings.rank]}</li>
                        <li className="chip">
                            {fill(t.settings.rankRange, { max: rankConfig[settings.rank].maxValue })}
                        </li>
                        <li className="chip">{settings.timer === 'off' ? '∞' : '⏱'} {QUESTIONS_PER_MISSION}</li>
                    </ul>
                </section>

                <button type="button" className="btn btn--primary btn--play" onClick={() => navigate('/game/play')}>
                    <span className="btn__icon" aria-hidden="true">🚀</span>
                    {t.home.play}
                </button>

                <nav className="home-nav">
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/hall-of-fame')}>
                        🏆 {t.nav.hallOfFame}
                    </button>
                </nav>
            </main>

            {howToOpen && (
                <HowToPlayDialog
                    title={t.home.howToTitle}
                    steps={t.home.howToSteps}
                    close={t.game.helpClose}
                    onClose={() => setHowToOpen(false)}
                />
            )}
        </div>
    )
}
