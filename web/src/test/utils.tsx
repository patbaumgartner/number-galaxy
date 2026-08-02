import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import type { Language, Operation, Rank } from '../game'
import { store, type GameSettings } from '../store'
import type { FactKey, FactProgress, PlanetId, StarLevel } from '../timesTable/types'
import { ttStore } from '../timesTable/ttStore'

/**
 * Helpers shared by every `*.test.tsx` suite.
 *
 * They exist so a UI test says what it is about — "a player with two stars on
 * the 3x planet" — instead of restating localStorage plumbing each time.
 */

export const LOCATION_TEST_ID = 'test-location'

/** Reports the current route so navigation can be asserted from the outside. */
export function LocationProbe() {
    const location = useLocation()
    return <div data-testid={LOCATION_TEST_ID}>{location.pathname}</div>
}

export type RouterRenderOptions = RenderOptions & {
    /** Initial URL, e.g. `/times-tables/train/t3/practice`. */
    route?: string
    /** Route pattern to mount `ui` at. Defaults to a catch-all. */
    path?: string
}

/**
 * Renders `ui` inside a MemoryRouter so `useNavigate` and `NavLink` work, plus
 * a {@link LocationProbe} for asserting where a click sent the player.
 */
export function renderWithRouter(
    ui: ReactElement,
    { route = '/', path = '*', ...options }: RouterRenderOptions = {},
): RenderResult {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <LocationProbe />
            <Routes>
                <Route path={path} element={ui} />
                <Route path="*" element={ui} />
            </Routes>
        </MemoryRouter>,
        options,
    )
}

/** Writes settings before a component reads them on its first render. */
export function seedSettings(patch: Partial<GameSettings> = {}): GameSettings {
    const next: GameSettings = { ...store.getSettings(), ...patch }
    store.saveSettings(next)
    return next
}

export const seedLanguage = (language: Language): void => void seedSettings({ language })
export const seedOperations = (operations: Operation[]): void => void seedSettings({ operations })
export const seedRank = (rank: Rank): void => void seedSettings({ rank })

export function seedPlayer(playerName = 'Testpilot', avatarId = '🚀') {
    return store.savePlayer({
        id: 'test-player-id',
        playerName,
        avatarId,
        createdAt: '2026-01-01T00:00:00.000Z',
    })
}

/** A fact history that satisfies `isMastered`: box 4+ with three fast hits. */
export const masteredFact: FactProgress = {
    box: 5,
    lastDay: 0,
    last3: [
        { correct: true, ms: 1200 },
        { correct: true, ms: 1300 },
        { correct: true, ms: 1400 },
    ],
}

export function seedFactProgress(entries: Record<FactKey, FactProgress>): void {
    for (const [key, progress] of Object.entries(entries)) {
        ttStore.saveFactProgress(key as FactKey, progress)
    }
}

export function seedStars(stars: Partial<Record<PlanetId, StarLevel>>): void {
    for (const [planetId, level] of Object.entries(stars)) {
        ttStore.raiseStars(planetId as PlanetId, level as StarLevel)
    }
}

export { userEvent }
