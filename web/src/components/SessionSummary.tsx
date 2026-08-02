import { useNavigate } from 'react-router'
import { store } from '../store'
import { translations } from '../translations'
import type { Phase, PlanetId } from '../timesTable/types'

type SessionSummaryProps = {
    phase: Phase
    planetId: PlanetId | 'mission'
    accuracy: number
    streak: number
    leveledUpCount: number
    earnedStars: 0 | 1 | 2 | 3
    starsChanged: boolean
    isNewBest?: boolean
    timeMs?: number
}

export function SessionSummary({
    phase, accuracy, streak, leveledUpCount, earnedStars, starsChanged, isNewBest, timeMs
}: SessionSummaryProps) {
    const lang = store.getSettings().language
    const t = translations[lang]
    const navigate = useNavigate()

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000)
        const min = Math.floor(totalSec / 60)
        const sec = totalSec % 60
        const ds = Math.floor((ms % 1000) / 100)
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ds}`
    }

    return (
        <div className="card summary-card">
            <h3 className="neon-text">{t.tt.learnFinish}</h3>
            
            <div className="summary-stats">
                <p>{t.tt.summaryAccuracy}: {Math.round(accuracy * 100)}%</p>
                {phase !== 'speed' && <p>{t.tt.summaryStreak}: {streak}</p>}
                {phase !== 'speed' && <p>{t.tt.summaryLeveledUp}: {leveledUpCount}</p>}
                
                {phase === 'speed' && timeMs !== undefined && (
                    <p>{t.tt.summaryTime}: {formatTime(timeMs)}</p>
                )}
                
                {phase === 'speed' && isNewBest && (
                    <p className="neon-text">{t.tt.summaryNewBest}</p>
                )}
            </div>

            {starsChanged && earnedStars > 0 && (
                <div className="summary-stars">
                    <p>{t.tt.summaryStarsEarned.replace('{n}', earnedStars.toString())}</p>
                    {earnedStars === 1 && phase === 'practice' && <p>{t.tt.summarySpeedUnlocked}</p>}
                    {earnedStars === 3 && <p>{t.tt.summaryMastered}</p>}
                </div>
            )}

            {!starsChanged && phase === 'practice' && accuracy < 0.8 && (
                <p>{t.tt.summaryKeepPracticing}</p>
            )}

            <div className="summary-actions" style={{ marginTop: '1rem' }}>
                <button className="btn btn--primary" onClick={() => navigate('/times-tables')}>
                    {t.tt.trainExit}
                </button>
            </div>
        </div>
    )
}
