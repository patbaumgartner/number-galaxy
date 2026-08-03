const PREFIX = 'number-galaxy-'

/**
 * The namespace used before the app was renamed. Not dead code: renaming the
 * prefix orphans the old keys rather than deleting them, and "Delete all data"
 * only ever clears the current namespace — so a child's name and progress would
 * sit on the device forever with nothing in the UI able to reach them. Progress
 * from before the rename is deliberately not carried over, so the old namespace
 * is dropped outright, once, on startup.
 */
const RETIRED_PREFIX = 'math-invaders-'

export const storageKey = (name: string): string => `${PREFIX}${name}`

/** Strips the shared prefix, so a key can be re-homed under a profile. */
export const storageName = (key: string): string =>
    key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key

const available = (): Storage | null => {
    try {
        return typeof window === 'undefined' ? null : window.localStorage
    } catch {
        return null
    }
}

/**
 * Whether a parsed value can stand in for the fallback.
 *
 * Tampered or half-written storage parses cleanly into the wrong kind: `'null'`
 * yields null without throwing, and a bare string or number then blows up on the
 * first property write ("Cannot create property 'addition' on string"). A null
 * fallback means the caller does its own validation, so anything is let through.
 */
function matchesShape(parsed: unknown, fallback: unknown): boolean {
    if (fallback === null || fallback === undefined) return true
    if (Array.isArray(fallback)) return Array.isArray(parsed)
    if (typeof fallback === 'object') {
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
    }
    return typeof parsed === typeof fallback
}

export function readJson<T>(key: string, fallback: T): T {
    const storage = available()
    if (!storage) return fallback
    try {
        const raw = storage.getItem(key)
        if (raw === null) return fallback
        const parsed: unknown = JSON.parse(raw)
        return matchesShape(parsed, fallback) ? (parsed as T) : fallback
    } catch {
        return fallback
    }
}

/** Never throws — a full or blocked quota must not take the game down. */
export function writeJson(key: string, value: unknown): void {
    const storage = available()
    if (!storage) return
    try {
        storage.setItem(key, JSON.stringify(value))
    } catch {
        /* storage unavailable — the session simply will not persist */
    }
}

/** Narrows a parsed value to a plain object, rejecting null and arrays. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * A stored keyed collection, or an empty one.
 *
 * Every feature store keeps its progress as `{ [id]: entry }` and has to cope
 * with the same tampering, so the parse lives here once rather than in each of
 * them; the caller still validates its own entry shape.
 */
export function readRecord(key: string): Record<string, unknown> {
    const stored = readJson<unknown>(key, null)
    return isRecord(stored) ? stored : {}
}

export function hasKey(key: string): boolean {
    const storage = available()
    if (!storage) return false
    try {
        return storage.getItem(key) !== null
    } catch {
        return false
    }
}

/** Drops every key under `prefix`, which is how each game resets only its own progress. */
export function removeByPrefix(prefix: string): void {
    const storage = available()
    if (!storage) return
    try {
        // Collect first: removing during iteration reindexes the key list.
        const doomed: string[] = []
        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i)
            if (key !== null && key.startsWith(prefix)) doomed.push(key)
        }
        doomed.forEach(key => storage.removeItem(key))
    } catch {
        /* nothing to clear */
    }
}

/** Every key this app owns, snapshotted so callers may write while iterating. */
export function listKeys(): string[] {
    const storage = available()
    if (!storage) return []
    try {
        const keys: string[] = []
        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i)
            if (key !== null && key.startsWith(PREFIX)) keys.push(key)
        }
        return keys
    } catch {
        return []
    }
}

/** Re-homes a stored value, leaving anything already at `to` untouched. */
export function moveKey(from: string, to: string): void {
    const storage = available()
    if (!storage) return
    try {
        const value = storage.getItem(from)
        if (value === null || storage.getItem(to) !== null) return
        storage.setItem(to, value)
        storage.removeItem(from)
    } catch {
        /* a full or blocked quota leaves the original where it is */
    }
}

export const clearAll = (): void => removeByPrefix(PREFIX)

export const purgeRetiredStorage = (): void => removeByPrefix(RETIRED_PREFIX)
