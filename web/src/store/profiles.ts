import { hasKey, listKeys, moveKey, readJson, removeByPrefix, storageKey, storageName, writeJson } from './storage'

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

/** The single-profile key this module replaced; read once by {@link adoptLegacyProfile}. */
const LEGACY_PLAYER_KEY = storageKey('player')

/** Keys that describe the device rather than any one child. */
const SHARED_KEYS = new Set([PLAYERS_KEY, ACTIVE_KEY, LEGACY_PLAYER_KEY])

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

/**
 * Moves a pre-profile install under its owner, once.
 *
 * The trigger is any key still sitting outside a profile, not the presence of a
 * saved name: settings and progress are written from the first tap, while a name
 * is only ever written when someone opens the profile editor, so keying off the
 * name would strand everyone who simply played without introducing themselves.
 *
 * Everything that is not device-level belonged to whoever was using the tablet,
 * so it all moves wholesale rather than being enumerated — a list would silently
 * strand any key added after this was written.
 */
export function adoptLegacyProfile(): void {
    if (hasKey(PLAYERS_KEY)) return

    const prefix = profilePrefix(DEFAULT_ID)
    const strays = listKeys().filter(key => !SHARED_KEYS.has(key) && !key.startsWith(prefix))
    if (strays.length === 0) return

    for (const key of strays) moveKey(key, `${prefix}${storageName(key)}`)

    const legacy = readJson<unknown>(LEGACY_PLAYER_KEY, null)
    const owner: Player = isPlayer(legacy) ? { ...legacy, id: DEFAULT_ID } : blankPlayer(DEFAULT_ID)
    if (owner.playerName.length > 0) writeJson(PLAYERS_KEY, [owner])
}

export function getPlayers(): Player[] {
    adoptLegacyProfile()
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
    legacyPlayer: LEGACY_PLAYER_KEY,
    defaultId: DEFAULT_ID,
}
