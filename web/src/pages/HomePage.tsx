import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { store, gameRouteOf, type Player } from '../store'
import { avatars } from '../constants'
import { fill, translations } from '../i18n'
import { useDocumentLanguage } from '../hooks'
import { nextSurprise, surpriseRoute } from '../surprise'
import { localEpochDay } from '../review/leitner'
import { countDueFacts } from '../timesTable/session'
import { ttStore } from '../timesTable/ttStore'
import PlayerSwitcher from '../components/home/PlayerSwitcher'
import ProfileEditor from '../components/home/ProfileEditor'
import Logo from '../components/Logo'

type ProfileView = 'none' | 'switch' | 'edit'

/**
 * The four games, easiest first.
 *
 * This order is the only guidance a child gets about where to start, so it runs
 * from seeing a quantity, through halving one, to the four operations, and ends
 * at recall. Ages are a hint, never a gate.
 */
const GAMES = [
    { route: '/number-sense', emoji: '👀', name: 'gameSense', blurb: 'gameSenseBlurb' },
    { route: '/number-beam', emoji: '📏', name: 'gameBeam', blurb: 'gameBeamBlurb' },
    { route: '/game', emoji: '🛸', name: 'gameInvaders', blurb: 'gameInvadersBlurb' },
    { route: '/times-tables', emoji: '✖️', name: 'gameTables', blurb: 'gameTablesBlurb' },
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
    const lastGame = store.getLastGame()

    /**
     * How many table facts are due today — never how many days in a row.
     *
     * A day counter would work by making a missed day visible, which is loss
     * aversion aimed at a seven-year-old. What is due is a fact about the
     * material; how often a child turns up is not the game's business.
     */
    const [today] = useState(() => localEpochDay(Date.now(), new Date().getTimezoneOffset()))
    const dueToday = useMemo(() => {
        const stars = ttStore.getStars()
        if (!Object.values(stars).some(star => (star ?? 0) > 0)) return 0
        return countDueFacts(ttStore.getProgress(), today)
    }, [today])

    /** The picker shows before anyone is named, so the profile is created here instead. */
    const openGame = (route: string) => {
        store.ensurePlayer(t.home.defaultName, avatars[0])
        const game = gameRouteOf(route)
        if (game !== null) store.setLastGame(game)
        navigate(route)
    }

    const play = () => {
        store.ensurePlayer(t.home.defaultName, avatars[0])
        openGame(store.getLastGame() ?? GAMES[0].route)
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
                        <Logo className="hero__logo" /> {t.home.appName}
                    </h1>
                    <p className="hero__tagline">{t.home.tagline}</p>
                </section>

                <button type="button" className="btn btn--primary btn--play" onClick={play}>
                    <span className="btn__icon" aria-hidden="true">🚀</span>
                    {lastGame === null
                        ? t.home.play
                        : `${t.home.playAgain} · ${t.home[GAMES.find(game => game.route === lastGame)?.name ?? 'gameSense']}`}
                </button>

                <button type="button" className="chip chip--player" onClick={openSwitcher}>
                    <span aria-hidden="true">{player?.avatarId ?? avatars[0]}</span>
                    {player ? fill(t.home.greeting, { name: player.playerName }) : t.home.rename}
                    <span className="chip__edit" aria-hidden="true">✏️</span>
                </button>

                <section className="panel game-picker">
                    <h2 className="panel__title">{t.home.chooseGame}</h2>
                    <div className="game-picker__cards">
                        {GAMES.map(game => (
                            <button
                                key={game.route}
                                type="button"
                                className="game-picker__card"
                                onClick={() => openGame(game.route)}
                            >
                                <span className="game-picker__emoji" aria-hidden="true">{game.emoji}</span>
                                <strong>{t.home[game.name]}</strong>
                                <small>{t.home[game.blurb]}</small>
                                {game.route === '/times-tables' && dueToday > 0 && (
                                    <span className="game-picker__due">
                                        {fill(t.home.dueToday, { n: dueToday })}
                                    </span>
                                )}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="game-picker__card game-picker__card--surprise"
                            onClick={() => openGame(surpriseRoute(nextSurprise()))}
                        >
                            <span className="game-picker__emoji" aria-hidden="true">🔀</span>
                            <strong>{t.surprise.title}</strong>
                            <small>{t.surprise.blurb}</small>
                        </button>
                    </div>
                </section>

                <nav className="home-nav">
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
