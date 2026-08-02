import { describe, expect, it } from 'vitest'
import { translations } from './translations'

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
