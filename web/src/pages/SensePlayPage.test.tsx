import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithRouter, seedLanguage, seedPlayer, userEvent } from '../test/utils'
import SensePlayPage from './SensePlayPage'

describe('SensePlayPage', () => {
    beforeEach(() => {
        seedLanguage('en')
        seedPlayer()
    })

    it('shows one number in four representations at once', () => {
        renderWithRouter(<SensePlayPage />)

        expect(screen.getByRole('img', { name: '5 as a dot pattern' })).toBeInTheDocument()
        expect(screen.getByRole('img', { name: '5 on the ten-frame' })).toBeInTheDocument()
        expect(screen.getByRole('img', { name: '5 on the bead rack' })).toBeInTheDocument()
        expect(screen.getByRole('img', { name: '5 on the number line to 20' })).toBeInTheDocument()
    })

    it('moves every representation together when the number changes', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SensePlayPage />)

        await user.click(screen.getByRole('button', { name: '5 more' }))

        expect(screen.getByRole('img', { name: '10 as a dot pattern' })).toBeInTheDocument()
        expect(screen.getByRole('img', { name: '10 on the ten-frame' })).toBeInTheDocument()
        expect(screen.getByRole('img', { name: '10 on the bead rack' })).toBeInTheDocument()
    })

    it('stops at nothing and at twenty rather than running off either end', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<SensePlayPage />)

        for (let index = 0; index < 3; index += 1) await user.click(screen.getByRole('button', { name: '10 more' }))
        expect(screen.getByRole('img', { name: '20 as a dot pattern' })).toBeInTheDocument()

        for (let index = 0; index < 3; index += 1) await user.click(screen.getByRole('button', { name: '10 fewer' }))
        expect(screen.getByRole('img', { name: '0 on the ten-frame' })).toBeInTheDocument()
    })

    it('asks nothing and scores nothing', () => {
        renderWithRouter(<SensePlayPage />)

        // The point of this screen is the absence of a question, a clock, a score
        // and a star. If any of them turns up here it has stopped being a sandbox.
        expect(screen.queryByText(/\?/)).not.toBeInTheDocument()
        expect(document.querySelector('.hud')).toBeNull()
        expect(document.querySelector('.hud__timer')).toBeNull()
        expect(screen.queryByText('⭐')).not.toBeInTheDocument()
    })
})
