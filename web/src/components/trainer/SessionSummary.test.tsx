import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SessionSummary } from './SessionSummary'
import { translations } from '../../i18n'
import { LOCATION_TEST_ID, renderWithRouter, seedLanguage, userEvent } from '../../test/utils'

const labels = translations.en.tt

function renderSummary(overrides: Partial<React.ComponentProps<typeof SessionSummary>> = {}) {
    seedLanguage('en')
    return renderWithRouter(
        <SessionSummary
            phase="practice"
            planetId="t2"
            accuracy={0.875}
            streak={5}
            leveledUpCount={2}
            earnedStars={0}
            starsChanged={false}
            {...overrides}
        />,
    )
}

describe('SessionSummary', () => {
    it('renders rounded accuracy and practice streak progress', () => {
        renderSummary()

        expect(screen.getByText(`${labels.summaryAccuracy}: 88%`)).toBeInTheDocument()
        expect(screen.getByText(`${labels.summaryStreak}: 5`)).toBeInTheDocument()
        expect(screen.getByText(`${labels.summaryLeveledUp}: 2`)).toBeInTheDocument()
    })

    it('hides streak rows for speed sessions and formats their time', () => {
        renderSummary({ phase: 'speed', timeMs: 125678, isNewBest: true })

        expect(screen.queryByText(new RegExp(labels.summaryStreak))).not.toBeInTheDocument()
        expect(screen.queryByText(new RegExp(labels.summaryLeveledUp))).not.toBeInTheDocument()
        expect(screen.getByText(`${labels.summaryTime}: 02:05.6`)).toBeInTheDocument()
        expect(screen.getByText(labels.summaryNewBest)).toBeInTheDocument()
    })

    it('only shows the speed new-best line when the session is a new best', () => {
        renderSummary({ phase: 'speed', timeMs: 1000, isNewBest: false })

        expect(screen.queryByText(labels.summaryNewBest)).not.toBeInTheDocument()
    })

    it('shows earned stars only after a positive star change and fills the star count label', () => {
        const { unmount } = renderSummary({ starsChanged: true, earnedStars: 2 })

        expect(screen.getByText('You earned 2 star(s)!')).toBeInTheDocument()
        unmount()
        renderSummary({ starsChanged: true, earnedStars: 0 })
        expect(screen.queryByText(/You earned/)).not.toBeInTheDocument()
    })

    it('unlocks speed only for one practice star and announces mastery only for three stars', () => {
        const { unmount } = renderSummary({ phase: 'practice', starsChanged: true, earnedStars: 1 })

        expect(screen.getByText(labels.summarySpeedUnlocked)).toBeInTheDocument()
        expect(screen.queryByText(labels.summaryMastered)).not.toBeInTheDocument()
        unmount()
        renderSummary({ phase: 'practice', accuracy: 1, starsChanged: true, earnedStars: 3 })
        expect(screen.getByText(labels.summaryMastered)).toBeInTheDocument()
        expect(screen.queryByText(labels.summarySpeedUnlocked)).not.toBeInTheDocument()
    })

    it('encourages only practice sessions below eighty percent with unchanged stars', () => {
        const { unmount } = renderSummary({ phase: 'practice', accuracy: 0.79, starsChanged: false })

        expect(screen.getByText(labels.summaryKeepPracticing)).toBeInTheDocument()
        unmount()
        renderSummary({ phase: 'daily', planetId: 'mission', accuracy: 0.79, starsChanged: false })
        expect(screen.queryByText(labels.summaryKeepPracticing)).not.toBeInTheDocument()
    })

    it('navigates back to the times-tables map through the exit action', async () => {
        const user = userEvent.setup({ delay: null })
        renderSummary()

        await user.click(screen.getByRole('button', { name: labels.trainExit }))

        expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
    })
})
