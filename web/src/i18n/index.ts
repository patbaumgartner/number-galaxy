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
