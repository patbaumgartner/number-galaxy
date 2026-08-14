const PREFIX = 'number-galaxy-'

export const storageKey = (name: string): string => `${PREFIX}${name}`

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

/** A finite number, which is what every count and interval in this app is. */
export const isNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

export const isBooleanArray = (value: unknown): value is boolean[] =>
    Array.isArray(value) && value.every(entry => typeof entry === 'boolean')

/**
 * A stored map, less any entry that is no longer the right shape.
 *
 * `readRecord` only promises an object. Every store then read straight through
 * it into the entries, and half a dozen of them assumed those were still what
 * they wrote: `{ addition: { history: 7 } }` reached a spread and threw, a null
 * fact reached the review schedule, a rank tuning holding an object for its
 * history took the mission down. The error boundary caught each one, which
 * means the child got a crash screen and an app that stayed broken until
 * somebody found Delete all data.
 *
 * Dropping the bad entry rather than the whole map is the point: one damaged
 * fact should cost that fact's history, not every fact's.
 */
export function readEntries<T>(key: string, isValid: (value: unknown) => value is T): Record<string, T> {
    const kept: Record<string, T> = {}
    for (const [name, value] of Object.entries(readRecord(key))) {
        if (isValid(value)) kept[name] = value
    }
    return kept
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

export const clearAll = (): void => removeByPrefix(PREFIX)
