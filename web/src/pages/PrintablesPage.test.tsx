import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedPlayer, userEvent } from '../test/utils'
import PrintablesPage from './PrintablesPage'

describe('PrintablesPage', () => {
    beforeEach(() => {
        seedLanguage('en')
        seedPlayer()
    })
    afterEach(() => vi.restoreAllMocks())

    it('offers the three sheets a lesson away from a screen needs', () => {
        renderWithRouter(<PrintablesPage />)

        expect(screen.getByRole('heading', { name: /Dot cards/ })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Ten-frames/ })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Number lines/ })).toBeInTheDocument()
    })

    it('draws dot cards from three to nine, each as its die face', () => {
        renderWithRouter(<PrintablesPage />)

        const cards = document.querySelectorAll('.print-card')
        expect(cards).toHaveLength(7)

        // Ten is deliberately absent: it wants a ten-frame read as five and five,
        // not a tenth dot wedged under a die face.
        const filled = [...cards].map(card => card.querySelectorAll('.print-dot:not(.print-dot--off)').length)
        expect(filled).toEqual([3, 4, 5, 6, 7, 8, 9])
    })

    it('draws empty frames and lines, because a child fills these in', () => {
        renderWithRouter(<PrintablesPage />)

        expect(document.querySelectorAll('.print-frame')).toHaveLength(4)
        expect(document.querySelectorAll('.print-cell')).toHaveLength(4 * 10)
        expect(document.querySelectorAll('.print-line')).toHaveLength(4)
        expect(document.querySelectorAll('.print-line__tick')).toHaveLength(4 * 11)
    })

    it('prints on request', async () => {
        const print = vi.fn()
        vi.stubGlobal('print', print)
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PrintablesPage />)

        await user.click(screen.getByRole('button', { name: /Print/ }))
        expect(print).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    })

    it('keeps its own controls off the paper', () => {
        renderWithRouter(<PrintablesPage />)

        // The buttons live in a no-print block; the sheets must not.
        expect(screen.getByRole('button', { name: /Print/ }).closest('.no-print')).not.toBeNull()
        expect(document.querySelector('.print-sheet')?.closest('.no-print')).toBeNull()
    })

    it('goes back to settings, which is where it is reached from', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<PrintablesPage />)

        await user.click(screen.getByRole('button', { name: /Settings/ }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })
})
