const PREFIX = 'math-invaders-'

export const storageKey = (name: string): string => `${PREFIX}${name}`

const available = (): Storage | null => {
    try {
        return typeof window === 'undefined' ? null : window.localStorage
    } catch {
        return null
    }
}

export function readJson<T>(key: string, fallback: T): T {
    const storage = available()
    if (!storage) return fallback
    try {
        const raw = storage.getItem(key)
        return raw === null ? fallback : (JSON.parse(raw) as T)
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
