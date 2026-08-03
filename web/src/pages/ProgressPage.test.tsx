import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedPlayer, seedSenseStars, userEvent } from '../test/utils'
import { store } from '../store'
import { beamStore } from '../beam'
import ProgressPage from './ProgressPage'

describe('ProgressPage', () => {
    beforeEach(() => seedLanguage('en'))

    it('reads an empty device without inventing progress', () => {
        renderWithRouter(<ProgressPage />)

        expect(screen.getByRole('heading', { name: /Progress/ })).toBeInTheDocument()
        expect(screen.getAllByText('Not practised yet').length).toBeGreaterThan(0)
        expect(screen.getByText(/Nothing outstanding/)).toBeInTheDocument()
    })

    it('names the child it is about', () => {
        seedPlayer('Mia', '🚀')
        renderWithRouter(<ProgressPage />)
        expect(screen.getByText(/Overview for Mia/)).toBeInTheDocument()
    })

    it('reports accuracy per operation from what was answered', () => {
        for (const correct of [true, true, true, true, false]) store.recordAnswer('addition', correct, 0)
        renderWithRouter(<ProgressPage />)

        expect(screen.getByText(/80% · 5 answers/)).toBeInTheDocument()
    })

    it('lists the sums to practise next, as sums rather than keys', () => {
        store.recordFact('subtraction:5:7', false, 900)
        renderWithRouter(<ProgressPage />)

        expect(screen.getByText('12 − 7')).toBeInTheDocument()
    })

    it('names the habit worth naming, in words a parent can act on', () => {
        const miss = {
            operation: 'subtraction' as const,
            form: 'direct' as const,
            prompt: '51 − 26 = ?',
            chosen: '35',
            reason: 'smallerFromLarger' as const,
            answer: '25',
            at: '2026-01-01T00:00:00.000Z',
        }
        for (let index = 0; index < 3; index += 1) store.recordMiss(miss)
        renderWithRouter(<ProgressPage />)

        expect(screen.getByText(/smaller digit from the bigger one/)).toBeInTheDocument()
    })

    it('says how a child works an operation out, once they have said so enough', () => {
        for (let index = 0; index < 3; index += 1) store.recordStrategy('addition', 'counted')
        renderWithRouter(<ProgressPage />)

        expect(screen.getByText('Still counting')).toBeInTheDocument()
    })

    it('adds up the stars each game has earned', () => {
        beamStore.raiseStars('double', 2)
        seedSenseStars('subitize', 1)
        renderWithRouter(<ProgressPage />)

        expect(screen.getByText('2 of 27 ⭐')).toBeInTheDocument()
        expect(screen.getByText('1 of 18 ⭐')).toBeInTheDocument()
    })

    it('hands the data over as a file without sending it anywhere', async () => {
        seedPlayer('Mia', '🚀')
        const user = userEvent.setup({ delay: null })
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
        const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report')
        const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

        renderWithRouter(<ProgressPage />)
        await user.click(screen.getByRole('button', { name: /Save as a file/ }))

        expect(click).toHaveBeenCalled()
        expect(createUrl).toHaveBeenCalled()
        expect(revokeUrl).toHaveBeenCalledWith('blob:report')
    })

    it('prints', async () => {
        const user = userEvent.setup({ delay: null })
        const print = vi.spyOn(window, 'print').mockImplementation(() => {})

        renderWithRouter(<ProgressPage />)
        await user.click(screen.getByRole('button', { name: /Print/ }))

        expect(print).toHaveBeenCalled()
    })

    it('says plainly that it reads only what is already here', () => {
        renderWithRouter(<ProgressPage />)
        expect(screen.getByText(/Nothing is sent anywhere/)).toBeInTheDocument()
    })

    it('reaches settings and home', async () => {
        const user = userEvent.setup({ delay: null })
        renderWithRouter(<ProgressPage />)

        await user.click(screen.getByRole('button', { name: /settings/i }))
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
    })

    it('names the file after whoever it is about, or plainly when nobody is named', async () => {
        const user = userEvent.setup({ delay: null })
        const anchors: string[] = []
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            anchors.push(this.download)
        })
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report')
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

        const { unmount } = renderWithRouter(<ProgressPage />)
        await user.click(screen.getByRole('button', { name: /Save as a file/ }))
        expect(anchors[0]).toBe('number-galaxy-progress.json')
        unmount()

        seedPlayer('Mia', '🚀')
        renderWithRouter(<ProgressPage />)
        await user.click(screen.getByRole('button', { name: /Save as a file/ }))
        expect(anchors[1]).toBe('number-galaxy-Mia.json')
    })

    it('has a word for each way of working something out', () => {
        for (let index = 0; index < 3; index += 1) store.recordStrategy('multiplication', 'knew')
        for (let index = 0; index < 3; index += 1) store.recordStrategy('division', 'trick')
        renderWithRouter(<ProgressPage />)

        expect(screen.getByText('Knows it by heart')).toBeInTheDocument()
        expect(screen.getByText('Uses tricks')).toBeInTheDocument()
    })
})
