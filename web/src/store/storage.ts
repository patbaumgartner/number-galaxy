const PREFIX = 'math-invaders-'

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

export function hasKey(key: string): boolean {
    const storage = available()
    if (!storage) return false
    try {
        return storage.getItem(key) !== null
    } catch {
        return false
    }
}

export function clearAll(): void {
    const storage = available()
    if (!storage) return
    try {
        // Collect first: removing during iteration reindexes the key list.
        const doomed: string[] = []
        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i)
            if (key !== null && key.startsWith(PREFIX)) doomed.push(key)
        }
        doomed.forEach(key => storage.removeItem(key))
    } catch {
        /* nothing to clear */
    }
}
