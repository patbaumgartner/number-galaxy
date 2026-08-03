import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { store, type ScoreEntry } from '../store'
import { RANKS, type Rank } from '../game'
import TopBar from '../components/TopBar'
import { translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'

type Group = { rank: Rank; timed: boolean; entries: ScoreEntry[] }

export default function HallOfFamePage() {
    const navigate = useNavigate()
    const language = store.getSettings().language
    const t = translations[language]
    useDocumentLanguage(language)
    const scores = useMemo(() => store.getScores(), [])
    const legacy = useMemo(() => store.getLegacyScores(), [])

    const groups = useMemo<Group[]>(() => {
        const result: Group[] = []
        for (const rank of [...RANKS].reverse()) {
            for (const timed of [true, false]) {
                const entries = scores.filter(entry => entry.rank === rank && entry.timed === timed)
                if (entries.length > 0) result.push({ rank, timed, entries })
            }
        }
        return result
    }, [scores])

    return (
        <div className="page">
            <TopBar
                back={{ label: t.nav.home, to: '/' }}
                title={<>🏆 {t.hof.title}</>}
                actions={<button type="button" className="btn btn--icon" onClick={() => navigate('/settings')}>
                    ⚙️<span className="game-bar__hide-sm"> {t.nav.settings}</span>
                </button>}
            />
            <main className="shell">
                <header className="shell__head">
                    <p className="shell__tagline">{t.hof.subtitle}</p>
                </header>

                {groups.length === 0 && legacy.length === 0 && (
                    <section className="panel panel--empty">
                        <p>{t.hof.empty}</p>
                    </section>
                )}

                {groups.map(({ rank, timed, entries }) => (
                    <section key={`${rank}-${timed}`} className="panel">
                        <div className="panel__head">
                            <h2 className="panel__title">{t.ranks[rank]}</h2>
                            <span className="chip chip--sm">
                                {timed ? `⏱ ${t.hof.timed}` : `∞ ${t.hof.untimed}`}
                            </span>
                        </div>
                        <ol className="board">
                            {entries.map((entry, index) => (
                                <li
                                    key={`${entry.playerId}-${index}`}
                                    className={`board__row${index === 0 ? ' board__row--first' : ''}`}
                                >
                                    <span className="board__rank" aria-hidden="true">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                    </span>
                                    <span className="board__avatar" aria-hidden="true">{entry.avatarId}</span>
                                    <span className="board__name">{entry.player}</span>
                                    <span className="board__stars" aria-hidden="true">
                                        {'★'.repeat(entry.stars)}{'☆'.repeat(3 - entry.stars)}
                                    </span>
                                    <span className="board__meta">
                                        {t.hof.accuracy} {entry.correct}/{entry.total}
                                        {' · '}
                                        {t.hof.streak} {entry.bestStreak}
                                    </span>
                                    <span className="board__score">{entry.score}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                ))}

                {legacy.length > 0 && (
                    <details className="panel panel--details">
                        <summary className="panel__title">{t.hof.legacyTitle}</summary>
                        <p className="panel__hint">{t.hof.legacyHint}</p>
                        <ol className="board board--legacy">
                            {legacy.map((entry, index) => (
                                <li key={index} className="board__row">
                                    <span className="board__rank" aria-hidden="true">{index + 1}</span>
                                    <span className="board__avatar" aria-hidden="true">{entry.avatarId}</span>
                                    <span className="board__name">{entry.player}</span>
                                    <span className="board__score">{entry.score}</span>
                                </li>
                            ))}
                        </ol>
                    </details>
                )}

            </main>
        </div>
    )
}
