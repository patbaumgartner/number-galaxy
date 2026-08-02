import { Navigate, useParams } from 'react-router'
import { DailyPhase } from './trainer/DailyPhase'
import { LearnPhase } from './trainer/LearnPhase'
import { PracticePhase } from './trainer/PracticePhase'
import { SpeedPhase } from './trainer/SpeedPhase'
import { resolveTrainRoute } from '../timesTable/trainRoute'
import { ttStore } from '../timesTable/ttStore'
import type { PlanetId } from '../timesTable/types'

export default function TableTrainerPage() {
    const { planetId, phase } = useParams<{ planetId: string; phase: string }>()
    const redirect = resolveTrainRoute(planetId, phase, ttStore.getStars())
    if (redirect !== null) return <Navigate to={redirect} replace />

    if (phase === 'learn') return <LearnPhase key={`${planetId}${phase}`} planetId={planetId as PlanetId} />
    if (phase === 'practice') return <PracticePhase key={`${planetId}${phase}`} planetId={planetId as PlanetId} />
    if (phase === 'speed') return <SpeedPhase key={`${planetId}${phase}`} planetId={planetId as PlanetId} />
    if (phase === 'daily') return <DailyPhase key={`${planetId}${phase}`} />

    return null
}
