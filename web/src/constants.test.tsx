import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Flag from './components/Flag'
import { avatars, languageNames } from './constants'
import type { Language } from './game'

const LANGUAGES: Language[] = ['de', 'it', 'en', 'fr']

describe('game constants', () => {
    it('provides unique non-empty avatars', () => {
        expect(avatars.length).toBeGreaterThan(0)
        expect(new Set(avatars).size).toBe(avatars.length)
        expect(avatars.every(avatar => avatar.trim() !== '')).toBe(true)
    })

    it('names every supported language in its own language', () => {
        expect(Object.keys(languageNames).sort()).toEqual([...LANGUAGES].sort())
        for (const language of LANGUAGES) expect(languageNames[language].trim()).not.toBe('')
    })

    it('names languages as words rather than regional-indicator emoji', () => {
        // Emoji flags collapse to bare "DE"/"GB" letters wherever the platform
        // ships no flag font, which is why the flag is drawn instead.
        for (const language of LANGUAGES) {
            expect(languageNames[language]).not.toMatch(/\p{Regional_Indicator}/u)
        }
    })
})

describe('Flag', () => {
    it('draws a distinct flag for every supported language', () => {
        const shapes = new Set<string>()

        for (const language of LANGUAGES) {
            const { container, unmount } = render(<Flag language={language} />)
            const svg = container.querySelector('svg')

            expect(svg).not.toBeNull()
            expect(svg?.getAttribute('aria-hidden')).toBe('true')
            expect(svg?.querySelectorAll('rect, path').length ?? 0).toBeGreaterThan(0)
            shapes.add(svg?.innerHTML ?? '')
            unmount()
        }

        expect(shapes.size).toBe(LANGUAGES.length)
    })
})
