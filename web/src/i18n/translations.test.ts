import { describe, expect, it } from 'vitest'
import { fill, translations } from './index'

type TranslationValue = string | TranslationValue[] | { [key: string]: TranslationValue }

function deepKeys(value: TranslationValue, path = ''): string[] {
    if (typeof value === 'string') return [path]
    if (Array.isArray(value)) return value.flatMap((item, index) => deepKeys(item, `${path}[${index}]`))
    return Object.entries(value).flatMap(([key, item]) => deepKeys(item, path === '' ? key : `${path}.${key}`))
}

function leafStrings(value: TranslationValue): string[] {
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return value.flatMap(leafStrings)
    return Object.values(value).flatMap(leafStrings)
}

function arrayLengths(value: TranslationValue, path = ''): Record<string, number> {
    if (typeof value === 'string') return {}
    if (Array.isArray(value)) {
        return {
            [path]: value.length,
            ...value.reduce<Record<string, number>>((lengths, item, index) => ({
                ...lengths,
                ...arrayLengths(item, `${path}[${index}]`),
            }), {}),
        }
    }
    return Object.entries(value).reduce<Record<string, number>>((lengths, [key, item]) => ({
        ...lengths,
        ...arrayLengths(item, path === '' ? key : `${path}.${key}`),
    }), {})
}

function stringsByPath(value: TranslationValue, path = ''): Record<string, string> {
    if (typeof value === 'string') return { [path]: value }
    if (Array.isArray(value)) {
        return value.reduce<Record<string, string>>((strings, item, index) => ({
            ...strings,
            ...stringsByPath(item, `${path}[${index}]`),
        }), {})
    }
    return Object.entries(value).reduce<Record<string, string>>((strings, [key, item]) => ({
        ...strings,
        ...stringsByPath(item, path === '' ? key : `${path}.${key}`),
    }), {})
}

function placeholders(text: string): string[] {
    return [...text.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort()
}

describe('trainer translations', () => {
    it('provides every trainer label for each supported locale', () => {
        const [first, ...rest] = Object.values(translations)
        if (first === undefined) throw new Error('missing translations')

        const keys = Object.keys(first.tt) as (keyof typeof first.tt)[]
        for (const locale of rest) {
            for (const key of keys) expect(locale.tt[key]).not.toBe('')
        }
    })
})

describe('translation integrity', () => {
    it('keeps the complete nested key set identical to German', () => {
        const germanKeys = deepKeys(translations.de).sort()
        for (const language of ['it', 'en', 'fr'] as const) {
            expect(deepKeys(translations[language]).sort()).toEqual(germanKeys)
        }
    })

    it('keeps every leaf string non-empty after trimming', () => {
        for (const locale of Object.values(translations)) {
            expect(leafStrings(locale).every(text => text.trim() !== '')).toBe(true)
        }
    })

    it('keeps every nested array length identical to German', () => {
        const germanLengths = arrayLengths(translations.de)
        for (const language of ['it', 'en', 'fr'] as const) {
            expect(arrayLengths(translations[language])).toEqual(germanLengths)
        }
    })

    it('keeps placeholders aligned with the German source strings', () => {
        const germanStrings = stringsByPath(translations.de)
        for (const language of ['it', 'en', 'fr'] as const) {
            const localizedStrings = stringsByPath(translations[language])
            for (const [path, german] of Object.entries(germanStrings)) {
                expect(placeholders(localizedStrings[path])).toEqual(placeholders(german))
            }
        }
    })

    it('fills supplied placeholders while leaving unknown placeholders intact', () => {
        expect(fill('Hi {name}, up to {max}; {unknown}', { name: 'Ace', max: 12 })).toBe('Hi Ace, up to 12; {unknown}')
    })

    // Swiss Standard German has no ß, and this app is written for Swiss schools.
    it('writes German in Swiss orthography, never with ß', () => {
        const offenders = Object.entries(stringsByPath(translations.de))
            .filter(([, text]) => text.includes('ß'))
            .map(([path, text]) => `${path}: ${text}`)
        expect(offenders).toEqual([])
    })
    /**
     * The masculine forms these languages inflect, which were being used for
     * every child: a girl read "Pilot", "Débutant" and "Bambino 1" as herself.
     *
     * This refuses the masculine generic rather than pinning any wording, so a
     * translator may reword freely so long as the result stays neutral.
     */
    it('addresses every child, not only the boys', () => {
        const masculineGeneric = {
            de: ['Spieler', 'Kadett', 'Pilot', 'Neuling', 'Lehrer', 'Schüler', 'Anfänger', 'Nutzer', 'Gewinner', 'Sieger'],
            fr: ['débutant', 'joueur', 'joueurs', 'gagnant', 'utilisateur', 'enseignants', 'chacun', 'prêt'],
            it: ['bambino', 'bambini', 'novellino', 'cadetto', 'giocatore', 'vincitore', 'pronto', 'alunno', 'ragazzi'],
            en: ['he', 'she', 'his', 'him', 'her', 'himself', 'herself'],
        } as const

        const offenders: string[] = []
        for (const language of ['de', 'fr', 'it', 'en'] as const) {
            const strings = stringsByPath(translations[language])
            for (const word of masculineGeneric[language]) {
                // Letter boundaries rather than \\b, so umlauts and accents count
                // as letters and "this" does not read as "his".
                const pattern = new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, 'iu')
                for (const [path, text] of Object.entries(strings)) {
                    if (pattern.test(text)) offenders.push(`${language} ${path}: ${text}`)
                }
            }
        }
        expect(offenders).toEqual([])
    })
})
