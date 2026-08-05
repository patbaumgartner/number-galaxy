import type { Language } from '../game'
import { de } from './de'
import { en } from './en'
import { fr } from './fr'
import { it } from './it'
import type { Translations } from './types'

export type { Translations } from './types'

export const translations: Record<Language, Translations> = { de, en, it, fr }

/** Replaces every `{name}` the caller supplies; unknown placeholders are left alone. */
export function fill(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        template,
    )
}

/**
 * Picks the singular or the plural wording, then fills `{n}`.
 *
 * Only counts a child actually reads are worth this, and the app announces
 * exactly one: stars, which never exceed three. The alternative these replaced
 * was "1 star(s)", which is a form no seven-year-old has ever met in a book.
 */
export const plural = (n: number, one: string, many: string): string => fill(n === 1 ? one : many, { n })
