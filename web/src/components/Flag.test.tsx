import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Flag from './Flag'
import type { Language } from '../game'

const LANGUAGES: Language[] = ['de', 'it', 'en', 'fr']

const drawFlag = (language: Language) => render(<Flag language={language} />).container.querySelector('svg')

describe('Flag', () => {
    it('draws a flag for every supported language', () => {
        for (const language of LANGUAGES) {
            const svg = drawFlag(language)
            expect(svg).not.toBeNull()
            expect(svg?.querySelectorAll('rect, path').length).toBeGreaterThan(0)
        }
    })

    it('draws each language differently, so the picker is not four identical swatches', () => {
        const drawings = new Set(LANGUAGES.map(language => drawFlag(language)?.innerHTML))
        expect(drawings.size).toBe(LANGUAGES.length)
    })

    it('stays out of the accessibility tree, because the button beside it carries the name', () => {
        for (const language of LANGUAGES) {
            const svg = drawFlag(language)
            expect(svg).toHaveAttribute('aria-hidden', 'true')
            expect(svg).toHaveAttribute('role', 'presentation')
            expect(svg).toHaveAttribute('focusable', 'false')
        }
    })

    it('scales with its box rather than a fixed pixel size', () => {
        expect(drawFlag('de')).toHaveAttribute('viewBox', '0 0 24 18')
    })
})
