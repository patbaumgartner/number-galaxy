import { describe, expect, it } from 'vitest'
import { avatars, languageLabels } from './constants'
import type { Language } from './game'

describe('game constants', () => {
    it('provides unique non-empty avatars', () => {
        expect(avatars.length).toBeGreaterThan(0)
        expect(new Set(avatars).size).toBe(avatars.length)
        expect(avatars.every(avatar => avatar.trim() !== '')).toBe(true)
    })

    it('labels every supported language with a flag emoji', () => {
        const languages: Language[] = ['de', 'it', 'en', 'fr']
        expect(Object.keys(languageLabels).sort()).toEqual([...languages].sort())
        for (const language of languages) expect(languageLabels[language]).toMatch(/^\p{Regional_Indicator}{2}/u)
    })
})
