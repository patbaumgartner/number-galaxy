import { readJson, removeByPrefix, storageKey, writeJson } from './storage'

/**
 * Who is playing, and where their things are kept.
 *
 * A tablet is shared — by siblings at a kitchen table, by a class at a school
 * one. One profile for all of them made every adaptive signal in the app a lie:
 * the review schedule, the weak-fact list and the star map all described a
 * composite child who does not exist. So every key a child owns is namespaced by
 * their id, and switching child switches all of it at once.
 *
 * The score board is namespaced too, deliberately. A shared board would turn a
 * private record of personal bests into a leaderboard with visible peers, which
 * is the one thing the evidence is unambiguous about harming the children who
 * are already struggling most.
 */

export type Player = {
    id: string
    playerName: string
    avatarId: string
    createdAt: string
}

const PLAYERS_KEY = storageKey('players')
const ACTIVE_KEY = storageKey('active-player')

/**
 * The id the first child gets, fixed rather than generated.
 *
 * Deriving a storage key must never write, because a blocked or full
 * `localStorage` would then hand out a fresh id — and so a fresh, empty set of
 * keys — on every single call. A constant keeps every read and write in a
 * session agreeing with each other even when nothing can be persisted at all.
 */
const DEFAULT_ID = 'me'

const DEFAULT_AVATAR = '🚀'

export const profilePrefix = (id: string): string => storageKey(`u${id}-`)

const isPlayer = (value: unknown): value is Player =>
    typeof value === 'object' && value !== null
    && typeof (value as Player).id === 'string' && (value as Player).id.length > 0

const blankPlayer = (id: string): Player => ({
    id,
    playerName: '',
    avatarId: DEFAULT_AVATAR,
    createdAt: new Date().toISOString(),
})

function readPlayers(): Player[] {
    const stored = readJson<Player[]>(PLAYERS_KEY, [])
    return Array.isArray(stored) ? stored.filter(isPlayer) : []
}

const activeId = (): string => {
    const stored = readJson<string>(ACTIVE_KEY, '')
    return typeof stored === 'string' && stored.length > 0 ? stored : DEFAULT_ID
}

/** Where the active child's copy of `name` lives. */
export const profileKey = (name: string): string => `${profilePrefix(activeId())}${name}`

export function getPlayers(): Player[] {
    return readPlayers()
}

export function getPlayer(): Player | null {
    const players = getPlayers()
    return players.find(player => player.id === activeId()) ?? players[0] ?? null
}

export function savePlayer(player: Player): Player {
    const players = getPlayers()
    const index = players.findIndex(entry => entry.id === player.id)
    if (index >= 0) players[index] = player
    else players.push(player)
    writeJson(PLAYERS_KEY, players)
    return player
}

/**
 * Guarantees a named profile exists so the player can hit Play without filling
 * in a form first. Naming and avatar stay editable afterwards.
 */
export function ensurePlayer(defaultName: string, defaultAvatar: string): Player {
    const existing = getPlayer()
    if (existing !== null) return existing
    return savePlayer({ ...blankPlayer(activeId()), playerName: defaultName, avatarId: defaultAvatar })
}

/** Adds a child and switches to them, so the next run is already theirs. */
export function addPlayer(playerName: string, avatarId: string): Player {
    const id = getPlayers().length === 0 ? DEFAULT_ID : crypto.randomUUID()
    const player = savePlayer({ ...blankPlayer(id), playerName, avatarId })
    writeJson(ACTIVE_KEY, player.id)
    return player
}

export function selectPlayer(id: string): void {
    if (getPlayers().some(player => player.id === id)) writeJson(ACTIVE_KEY, id)
}

/**
 * The four game routes, and the only values {@link getLastGame} will return.
 * A stored value is checked against this list rather than trusted: a stray or
 * tampered one would otherwise be handed straight to the router.
 */
const GAME_ROUTES = ['/number-sense', '/number-beam', '/game', '/times-tables'] as const

export type GameRoute = (typeof GAME_ROUTES)[number]

const lastGameKey = () => profileKey('last-game')

/** Where this child was last playing, so "Weiterspielen" has somewhere to go. */
export function getLastGame(): GameRoute | null {
    const stored = readJson<string>(lastGameKey(), '')
    return GAME_ROUTES.some(route => route === stored) ? (stored as GameRoute) : null
}

export function setLastGame(route: GameRoute): void {
    writeJson(lastGameKey(), route)
}

/** The game a deep route belongs to, so Surprise me is remembered as its game. */
export function gameRouteOf(path: string): GameRoute | null {
    return GAME_ROUTES.find(route => path === route || path.startsWith(`${route}/`)) ?? null
}

/**
 * Removes a child and everything they own. The last profile stays — a device
 * with no profile has nowhere to put the next answer.
 */
export function removePlayer(id: string): boolean {
    const players = getPlayers()
    if (players.length <= 1 || !players.some(player => player.id === id)) return false

    removeByPrefix(profilePrefix(id))
    const remaining = players.filter(player => player.id !== id)
    writeJson(PLAYERS_KEY, remaining)
    if (activeId() === id) writeJson(ACTIVE_KEY, remaining[0].id)
    return true
}

export const profileKeys = {
    players: PLAYERS_KEY,
    active: ACTIVE_KEY,
    defaultId: DEFAULT_ID,
}
