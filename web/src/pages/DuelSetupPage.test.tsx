import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedPlayer, userEvent } from '../test/utils'
import DuelSetupPage from './DuelSetupPage'

describe('DuelSetupPage', () => {
    beforeEach(() => {
        seedLanguage('en')
        seedPlayer()
    })

    it('offers both shapes and starts on the kinder one', () => {
        renderWithRouter(<DuelSetupPage />)

        expect(screen.getByRole('button', { name: /Together/ })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', { name: /Head to head/ })).toHaveAttribute('aria-pressed', 'false')
    })

    it('switches to head to head when asked', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<DuelSetupPage />)

        await user.click(screen.getByRole('button', { name: /Head to head/ }))

        expect(screen.getByRole('button', { name: /Head to head/ })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', { name: /Together/ })).toHaveAttribute('aria-pressed', 'false')
    })

    it('carries the names and the shape into the round', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<DuelSetupPage />)

        await user.type(screen.getByLabelText('Child 1'), 'Nova')
        await user.type(screen.getByLabelText('Child 2'), 'Kim')
        await user.click(screen.getByRole('button', { name: /Head to head/ }))
        await user.click(screen.getByRole('button', { name: 'Start' }))

        const location = screen.getByTestId(LOCATION_TEST_ID).textContent ?? ''
        expect(location).toContain('/game/two/play')
        expect(location).toContain('mode=versus')
        expect(location).toContain('one=Nova')
        expect(location).toContain('two=Kim')
    })

    it('falls back to plain labels when nobody types a name', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<DuelSetupPage />)

        await user.click(screen.getByRole('button', { name: 'Start' }))

        const location = screen.getByTestId(LOCATION_TEST_ID).textContent ?? ''
        expect(location).toContain('one=Child+1')
        expect(location).toContain('two=Child+2')
    })

    it('says up front that the round is not recorded', () => {
        renderWithRouter(<DuelSetupPage />)

        expect(screen.getByText(/is not saved/)).toBeInTheDocument()
    })
})
