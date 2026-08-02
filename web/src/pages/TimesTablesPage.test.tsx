import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { canonicalKey } from '../timesTable/facts'
import { localEpochDay } from '../timesTable/leitner'
import { ttStore } from '../timesTable/ttStore'
import { LOCATION_TEST_ID, renderWithRouter, seedFactProgress, seedLanguage, seedStars, userEvent } from '../test/utils'
import TimesTablesPage from './TimesTablesPage'

const planetButton = (label: string) => {
    const button = screen.getAllByRole('button').find(node => node.querySelector('strong')?.textContent === label)
    if (!button) throw new Error(`Missing planet ${label}`)
    return button
}

describe('TimesTablesPage', () => {
    beforeEach(() => seedLanguage('en'))

    it('renders all galaxies, planets, locks, star labels, and the next recommendation', () => {
        seedStars({ t1: 1 })
        const { container } = renderWithRouter(<TimesTablesPage />)
        expect(screen.getByText('Home Galaxy')).toBeInTheDocument()
        expect(screen.getByText('Squares Nebula')).toBeInTheDocument()
        expect(screen.getByText('Shortcuts Belt')).toBeInTheDocument()
        expect(screen.getByText('Deep Space')).toBeInTheDocument()
        expect(planetButton('×1')).toBeEnabled()
        expect(screen.getByRole('button', { name: /1²–12²/i })).toBeDisabled()
        expect(screen.getAllByText(/Earn ⭐⭐ on 5 Home Galaxy planets/i)).toHaveLength(2)
        expect(screen.getByLabelText('1 stars')).toBeInTheDocument()
        expect(container.querySelector('.trainer-planet__next')?.parentElement).toHaveTextContent('×2')
    })

    it('opens and closes the phase chooser and navigates selected unlocked phases', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<TimesTablesPage />)
        await user.click(planetButton('×3'))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Speed Run' })).toBeDisabled()
        await user.click(screen.getByRole('button', { name: 'Practice' }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables/train/t3/practice')

        await user.click(planetButton('×3'))
        await user.keyboard('{Escape}')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        await user.click(planetButton('×3'))
        fireEvent.click(screen.getByRole('dialog'))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('shows daily availability and switches mastery-map tabs', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<TimesTablesPage />)
        expect(screen.getByText('All caught up!')).toBeInTheDocument()
        await user.click(screen.getByRole('tab', { name: /extended/i }))
        expect(screen.getByRole('tab', { name: /extended/i })).toHaveAttribute('aria-pressed', 'true')
        await user.click(screen.getByRole('tab', { name: /squares/i }))
        expect(screen.getByRole('tab', { name: /squares/i })).toHaveAttribute('aria-pressed', 'true')

        const today = localEpochDay(Date.now(), new Date().getTimezoneOffset())
        seedStars({ t1: 1 })
        seedFactProgress({ [canonicalKey(1, 1)]: { box: 1, lastDay: today, last3: [] } })
        const due = renderWithRouter(<TimesTablesPage />)
        expect(screen.getByRole('button', { name: /1 due facts/i })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /1 due facts/i }))
        expect(screen.getAllByTestId(LOCATION_TEST_ID).at(-1)).toHaveTextContent('/times-tables/train/mission/daily')
        due.unmount()
        expect(ttStore.getStars().t1).toBe(1)
    })
})
