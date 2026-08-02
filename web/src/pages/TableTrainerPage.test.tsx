import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, seedStars } from '../test/utils'
import TableTrainerPage from './TableTrainerPage'

const renderRoute = (route: string) => renderWithRouter(<TableTrainerPage />, {
    route,
    path: '/times-tables/train/:planetId/:phase',
})

describe('TableTrainerPage', () => {
    it('renders every valid phase route including the daily mission', () => {
        seedLanguage('en')
        const learn = renderRoute('/times-tables/train/t3/learn')
        expect(screen.getByRole('heading', { name: /×3.*learn/i })).toBeInTheDocument()
        learn.unmount()
        const practice = renderRoute('/times-tables/train/t3/practice')
        expect(screen.getByRole('heading', { name: /×3.*practice/i })).toBeInTheDocument()
        practice.unmount()
        seedStars({ t3: 1 })
        const speed = renderRoute('/times-tables/train/t3/speed')
        expect(screen.getByRole('heading', { name: /×3.*speed run/i })).toBeInTheDocument()
        speed.unmount()
        renderRoute('/times-tables/train/mission/daily')
        expect(screen.getByRole('heading', { name: /daily mission/i })).toBeInTheDocument()
    })

    it('redirects unknown, locked, and unearned speed deep links', () => {
        const unknown = renderRoute('/times-tables/train/nope/practice')
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
        unknown.unmount()
        const speed = renderRoute('/times-tables/train/t3/speed')
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables/train/t3/practice')
        speed.unmount()
        renderRoute('/times-tables/train/t15/learn')
        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
    })
})
