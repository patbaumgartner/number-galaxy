import { useState } from 'react'
import { useNavigate } from 'react-router'
import { store } from '../store'
import { QUESTIONS_PER_MISSION, rankConfig } from '../game'
import { avatars } from '../constants'
import { fill, translations } from '../translations'
import { useDocumentLanguage } from '../hooks'

export default function HomePage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const [player, setPlayer] = useState(() => store.getPlayer())
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(player?.playerName ?? '')
    const [avatar, setAvatar] = useState(player?.avatarId ?? avatars[0])

    const play = () => {
        store.ensurePlayer(t.home.defaultName, avatars[0])
        navigate('/game')
    }

    const saveProfile = () => {
        const current = store.ensurePlayer(t.home.defaultName, avatars[0])
        setPlayer(store.savePlayer({
            ...current,
            playerName: name.trim() || t.home.defaultName,
            avatarId: avatar,
        }))
        setEditing(false)
    }

    const openEditor = () => {
        const current = store.ensurePlayer(t.home.defaultName, avatars[0])
        setPlayer(current)
        setName(current.playerName)
        setAvatar(current.avatarId)
        setEditing(true)
    }

    return (
        <div className="page">
            <main className="shell shell--home">
                <section className="hero">
                    <h1 className="hero__title">
                        <span aria-hidden="true">👾</span> MATH INVADERS
                    </h1>
                    <p className="hero__tagline">{t.home.tagline}</p>
                </section>

                <button type="button" className="btn btn--primary btn--play" onClick={play}>
                    <span className="btn__icon" aria-hidden="true">🚀</span>
                    {player ? t.home.playAgain : t.home.play}
                </button>

                <button type="button" className="chip chip--player" onClick={openEditor}>
                    <span aria-hidden="true">{player?.avatarId ?? avatars[0]}</span>
                    {player ? fill(t.home.greeting, { name: player.playerName }) : t.home.rename}
                    <span className="chip__edit" aria-hidden="true">✏️</span>
                </button>

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
                        <li className="chip">{settings.timed ? '⏱' : '∞'} {QUESTIONS_PER_MISSION}</li>
                    </ul>
                </section>

                <section className="panel">
                    <h2 className="panel__title">{t.home.howToTitle}</h2>
                    <ol className="steps">
                        {t.home.howToSteps.map((step, index) => <li key={index}>{step}</li>)}
                    </ol>
                </section>

                <nav className="home-nav">
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/hall-of-fame')}>
                        🏆 {t.nav.hallOfFame}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/settings')}>
                        ⚙️ {t.nav.settings}
                    </button>
                </nav>
            </main>

            {editing && (
                <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title">
                    <div className="overlay__card">
                        <h2 className="overlay__title" id="profile-title">{t.home.rename}</h2>

                        <label className="field">
                            <span className="field__label">{t.home.nameLabel}</span>
                            <input
                                className="field__input"
                                type="text"
                                autoComplete="off"
                                maxLength={20}
                                placeholder={t.home.namePlaceholder}
                                value={name}
                                onChange={event => setName(event.target.value)}
                                autoFocus
                            />
                        </label>

                        <fieldset className="field">
                            <legend className="field__label">{t.home.avatarLabel}</legend>
                            <div className="avatars">
                                {avatars.map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`avatar${avatar === option ? ' avatar--active' : ''}`}
                                        aria-pressed={avatar === option}
                                        aria-label={option}
                                        onClick={() => setAvatar(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <div className="overlay__actions">
                            <button type="button" className="btn btn--primary" onClick={saveProfile}>
                                {t.home.save}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
                                {t.home.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
