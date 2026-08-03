import { useState } from 'react'
import { useNavigate } from 'react-router'
import { store } from '../store'
import { QUESTIONS_PER_MISSION, rankConfig } from '../game'
import { avatars } from '../constants'
import { fill, translations, type Translations } from '../i18n'
import { useDocumentLanguage, useModalDialog } from '../hooks'
import { nextSurprise, surpriseRoute } from '../surprise'

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
        setPlayer(store.ensurePlayer(t.home.defaultName, avatars[0]))
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

                {player && (
                    <section className="panel game-picker">
                        <h2 className="panel__title">{t.home.chooseGame}</h2>
                        <div className="game-picker__cards">
                            <button type="button" className="game-picker__card" onClick={() => navigate('/game')}>
                                <span aria-hidden="true">🛸</span>
                                <strong>{t.home.gameInvaders}</strong>
                                <small>{t.home.gameInvadersBlurb}</small>
                            </button>
                            <button type="button" className="game-picker__card" onClick={() => navigate('/times-tables')}>
                                <span aria-hidden="true">✖️</span>
                                <strong>{t.home.gameTables}</strong>
                                <small>{t.home.gameTablesBlurb}</small>
                            </button>
                            <button type="button" className="game-picker__card" onClick={() => navigate('/number-beam')}>
                                <span aria-hidden="true">📏</span>
                                <strong>{t.home.gameBeam}</strong>
                                <small>{t.home.gameBeamBlurb}</small>
                            </button>
                        </div>
                        <div className="game-picker__surprise">
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={() => navigate(surpriseRoute(nextSurprise()))}
                            >
                                {t.surprise.title}
                            </button>
                            <p className="panel__hint">{t.surprise.blurb}</p>
                        </div>
                    </section>
                )}

                <section className="group">
                    <div className="group__head">
                        <h2 className="group__title">🛸 {t.home.gameInvaders}</h2>
                    </div>

                    <div className="panel">
                        <div className="panel__head">
                            <h3 className="panel__title">{t.home.missionTitle}</h3>
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
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">{t.home.howToTitle}</h3>
                        <ol className="steps">
                            {t.home.howToSteps.map((step, index) => <li key={index}>{step}</li>)}
                        </ol>
                        <div className="panel__action">
                            <button type="button" className="btn btn--ghost" onClick={() => navigate('/hall-of-fame')}>
                                🏆 {t.nav.hallOfFame}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="group">
                    <div className="group__head">
                        <h2 className="group__title">{t.tt.title}</h2>
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">{t.home.howToTablesTitle}</h3>
                        <ol className="steps">
                            {t.home.howToTablesSteps.map((step, index) => <li key={index}>{step}</li>)}
                        </ol>
                    </div>
                </section>

                <section className="group">
                    <div className="group__head">
                        <h2 className="group__title">{t.beam.title}</h2>
                    </div>

                    <div className="panel">
                        <h3 className="panel__title">{t.home.howToBeamTitle}</h3>
                        <ol className="steps">
                            {t.home.howToBeamSteps.map((step, index) => <li key={index}>{step}</li>)}
                        </ol>
                    </div>
                </section>

                <nav className="home-nav">
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/settings')}>
                        ⚙️ {t.nav.settings}
                    </button>
                </nav>
            </main>

            {editing && (
                <ProfileEditor
                    labels={t.home}
                    name={name}
                    avatar={avatar}
                    onName={setName}
                    onAvatar={setAvatar}
                    onSave={saveProfile}
                    onCancel={() => setEditing(false)}
                />
            )}
        </div>
    )
}

type ProfileEditorProps = {
    labels: Translations['home']
    name: string
    avatar: string
    onName: (name: string) => void
    onAvatar: (avatar: string) => void
    onSave: () => void
    onCancel: () => void
}

function ProfileEditor({ labels, name, avatar, onName, onAvatar, onSave, onCancel }: ProfileEditorProps) {
    const dialog = useModalDialog<HTMLDivElement>(onCancel)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="profile-title">{labels.rename}</h2>

                <label className="field">
                    <span className="field__label">{labels.nameLabel}</span>
                    <input
                        className="field__input"
                        type="text"
                        autoComplete="off"
                        maxLength={20}
                        placeholder={labels.namePlaceholder}
                        value={name}
                        onChange={event => onName(event.target.value)}
                        autoFocus
                    />
                </label>

                <fieldset className="field">
                    <legend className="field__label">{labels.avatarLabel}</legend>
                    <div className="avatars">
                        {avatars.map(option => (
                            <button
                                key={option}
                                type="button"
                                className={`avatar${avatar === option ? ' avatar--active' : ''}`}
                                aria-pressed={avatar === option}
                                aria-label={option}
                                onClick={() => onAvatar(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <div className="overlay__actions">
                    <button type="button" className="btn btn--primary" onClick={onSave}>
                        {labels.save}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onCancel}>
                        {labels.cancel}
                    </button>
                </div>
            </div>
        </div>
    )
}
