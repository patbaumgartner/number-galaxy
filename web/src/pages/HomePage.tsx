import { useState } from 'react'
import { useNavigate } from 'react-router'
import { store, type Player } from '../store'
import { QUESTIONS_PER_MISSION, rankConfig } from '../game'
import { avatars } from '../constants'
import { fill, translations, type Translations } from '../i18n'
import { useDocumentLanguage, useModalDialog } from '../hooks'
import { nextSurprise, surpriseRoute } from '../surprise'

type ProfileView = 'none' | 'switch' | 'edit'

/**
 * The four games, easiest first.
 *
 * This order is the only guidance a child gets about where to start, so it runs
 * from seeing a quantity, through halving one, to the four operations, and ends
 * at recall. Ages are a hint, never a gate.
 */
const GAMES = [
    { route: '/number-sense', emoji: '👀', name: 'gameSense', blurb: 'gameSenseBlurb', ages: 'agesSense' },
    { route: '/number-beam', emoji: '📏', name: 'gameBeam', blurb: 'gameBeamBlurb', ages: 'agesBeam' },
    { route: '/game', emoji: '🛸', name: 'gameInvaders', blurb: 'gameInvadersBlurb', ages: 'agesInvaders' },
    { route: '/times-tables', emoji: '✖️', name: 'gameTables', blurb: 'gameTablesBlurb', ages: 'agesTables' },
] as const

export default function HomePage() {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)

    const [player, setPlayer] = useState(() => store.getPlayer())
    const [players, setPlayers] = useState<Player[]>(() => store.getPlayers())
    const [view, setView] = useState<ProfileView>('none')
    const [adding, setAdding] = useState(false)
    const [name, setName] = useState(player?.playerName ?? '')
    const [avatar, setAvatar] = useState(player?.avatarId ?? avatars[0])

    const play = () => {
        setPlayer(store.ensurePlayer(t.home.defaultName, avatars[0]))
        setPlayers(store.getPlayers())
    }

    /** Re-reads everything, because switching child switches every store at once. */
    const refresh = () => {
        setPlayer(store.getPlayer())
        setPlayers(store.getPlayers())
        setView('none')
    }

    const saveProfile = () => {
        const chosen = name.trim() || t.home.defaultName
        if (adding) {
            // Progress starts fresh, but language and sound describe the
            // household rather than the child, so they carry over.
            const { language, sound } = store.getSettings()
            store.addPlayer(chosen, avatar)
            store.saveSettings({ ...store.getSettings(), language, sound })
        } else {
            const current = store.ensurePlayer(t.home.defaultName, avatars[0])
            store.savePlayer({ ...current, playerName: chosen, avatarId: avatar })
        }
        setAdding(false)
        refresh()
    }

    const openSwitcher = () => {
        // Always the list, even for one child: it is the only route to "add someone".
        const current = store.ensurePlayer(t.home.defaultName, avatars[0])
        setPlayers(store.getPlayers())
        setPlayer(current)
        setName(current.playerName)
        setAvatar(current.avatarId)
        setAdding(false)
        setView('switch')
    }

    const openEditor = (forNewPlayer: boolean) => {
        setAdding(forNewPlayer)
        setName(forNewPlayer ? '' : (player?.playerName ?? ''))
        setAvatar(forNewPlayer ? avatars[0] : (player?.avatarId ?? avatars[0]))
        setView('edit')
    }

    const choosePlayer = (id: string) => {
        store.selectPlayer(id)
        refresh()
    }

    const dropPlayer = (target: Player) => {
        if (!window.confirm(fill(t.home.removeConfirm, { name: target.playerName }))) return
        store.removePlayer(target.id)
        setPlayers(store.getPlayers())
        setPlayer(store.getPlayer())
    }

    return (
        <div className="page">
            <main className="shell shell--home">
                <section className="hero">
                    <h1 className="hero__title">
                        <span aria-hidden="true">🌌</span> {t.home.appName}
                    </h1>
                    <p className="hero__tagline">{t.home.tagline}</p>
                </section>

                <button type="button" className="btn btn--primary btn--play" onClick={play}>
                    <span className="btn__icon" aria-hidden="true">🚀</span>
                    {player ? t.home.playAgain : t.home.play}
                </button>

                <button type="button" className="chip chip--player" onClick={openSwitcher}>
                    <span aria-hidden="true">{player?.avatarId ?? avatars[0]}</span>
                    {player ? fill(t.home.greeting, { name: player.playerName }) : t.home.rename}
                    <span className="chip__edit" aria-hidden="true">✏️</span>
                </button>

                {player && (
                    <section className="panel game-picker">
                        <h2 className="panel__title">{t.home.chooseGame}</h2>
                        <div className="game-picker__cards">
                            {GAMES.map(game => (
                                <button
                                    key={game.route}
                                    type="button"
                                    className="game-picker__card"
                                    onClick={() => navigate(game.route)}
                                >
                                    <span className="game-picker__emoji" aria-hidden="true">{game.emoji}</span>
                                    <strong>{t.home[game.name]}</strong>
                                    <small>{t.home[game.blurb]}</small>
                                    <span className="chip chip--sm">{t.home[game.ages]}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                className="game-picker__card game-picker__card--surprise"
                                onClick={() => navigate(surpriseRoute(nextSurprise()))}
                            >
                                <span className="game-picker__emoji" aria-hidden="true">🎲</span>
                                <strong>{t.surprise.title}</strong>
                                <small>{t.surprise.blurb}</small>
                            </button>
                        </div>
                    </section>
                )}

                <section className="panel">
                    <div className="panel__head">
                        <h2 className="panel__title">🛸 {t.home.missionTitle}</h2>
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

                <nav className="home-nav">
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/hall-of-fame')}>
                        🏆 {t.nav.hallOfFame}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/settings')}>
                        ⚙️ {t.nav.settings}
                    </button>
                </nav>
            </main>

            {view === 'switch' && (
                <PlayerSwitcher
                    labels={t.home}
                    players={players}
                    activeId={player?.id ?? ''}
                    onChoose={choosePlayer}
                    onRemove={dropPlayer}
                    onAdd={() => openEditor(true)}
                    onRename={() => openEditor(false)}
                    onCancel={() => setView('none')}
                />
            )}

            {view === 'edit' && (
                <ProfileEditor
                    labels={t.home}
                    title={adding ? t.home.newPlayer : t.home.rename}
                    name={name}
                    avatar={avatar}
                    onName={setName}
                    onAvatar={setAvatar}
                    onSave={saveProfile}
                    onCancel={() => setView('none')}
                />
            )}
        </div>
    )
}

type PlayerSwitcherProps = {
    labels: Translations['home']
    players: Player[]
    activeId: string
    onChoose: (id: string) => void
    onRemove: (player: Player) => void
    onAdd: () => void
    onRename: () => void
    onCancel: () => void
}

function PlayerSwitcher({
    labels,
    players,
    activeId,
    onChoose,
    onRemove,
    onAdd,
    onRename,
    onCancel,
}: PlayerSwitcherProps) {
    const dialog = useModalDialog<HTMLDivElement>(onCancel)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="switcher-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="switcher-title">{labels.whoIsPlaying}</h2>

                <ul className="players">
                    {players.map(entry => (
                        <li key={entry.id} className="players__row">
                            <button
                                type="button"
                                className={`players__pick${entry.id === activeId ? ' players__pick--active' : ''}`}
                                aria-current={entry.id === activeId}
                                aria-label={fill(labels.switchTo, { name: entry.playerName })}
                                onClick={() => onChoose(entry.id)}
                            >
                                <span aria-hidden="true">{entry.avatarId}</span>
                                <strong>{entry.playerName}</strong>
                                {entry.id === activeId && <small>{labels.playingNow}</small>}
                            </button>
                            {players.length > 1 && (
                                <button
                                    type="button"
                                    className="btn btn--ghost btn--sm"
                                    aria-label={`${labels.removePlayer} ${entry.playerName}`}
                                    onClick={() => onRemove(entry)}
                                >
                                    🗑
                                </button>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="overlay__actions">
                    <button type="button" className="btn btn--primary" onClick={onAdd}>
                        ➕ {labels.addPlayer}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onRename}>
                        ✏️ {labels.rename}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onCancel}>
                        {labels.cancel}
                    </button>
                </div>
            </div>
        </div>
    )
}

type ProfileEditorProps = {
    labels: Translations['home']
    title: string
    name: string
    avatar: string
    onName: (name: string) => void
    onAvatar: (avatar: string) => void
    onSave: () => void
    onCancel: () => void
}

function ProfileEditor({ labels, title, name, avatar, onName, onAvatar, onSave, onCancel }: ProfileEditorProps) {
    const dialog = useModalDialog<HTMLDivElement>(onCancel)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="profile-title">{title}</h2>

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
