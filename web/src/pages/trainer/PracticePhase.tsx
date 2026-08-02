import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import Navigation from '../../components/Navigation'
import { NumberPad } from '../../components/NumberPad'
import { SessionSummary } from '../../components/SessionSummary'
import { playCorrect, playLevelUp, playWrong } from '../../sound'
import { store } from '../../store'
import { applyAnswer, localEpochDay } from '../../timesTable/leitner'
import { buildPracticeSession } from '../../timesTable/session'
import { explainFact, getStrategyCard } from '../../timesTable/strategies'
import { getPlanet } from '../../timesTable/tables'
import { computeStars, ttStore } from '../../timesTable/ttStore'
import type { Fact, FactKey, PlanetId, StarLevel } from '../../timesTable/types'
import { translations } from '../../translations'

export function PracticePhase({ planetId }: { planetId: PlanetId }) {
    const lang = store.getSettings().language
    const ttSettings = ttStore.getTTSettings()
    const t = translations[lang]
    const navigate = useNavigate()
    const planet = getPlanet(planetId)!
    const [todayEpochDay] = useState(() => localEpochDay(Date.now(), new Date().getTimezoneOffset()))
    const [initialSessionSize] = useState(() => [...buildPracticeSession(planetId, ttStore.getProgress(), localEpochDay(Date.now(), new Date().getTimezoneOffset()))].length)
    const [session, setSession] = useState<Fact[]>(() => [...buildPracticeSession(planetId, ttStore.getProgress(), localEpochDay(Date.now(), new Date().getTimezoneOffset()) )])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [firstAttempt, setFirstAttempt] = useState<Record<FactKey, boolean>>({})
    const [padValue, setPadValue] = useState('')
    const [shake, setShake] = useState(false)
    const [explanation, setExplanation] = useState<string | null>(null)
    const startTimeRef = useRef<number>(0)
    const [showStrategy, setShowStrategy] = useState(false)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [leveledUpCount, setLeveledUpCount] = useState(0)
    const [finished, setFinished] = useState(false)
    const [earnedStars, setEarnedStars] = useState<StarLevel>(0)
    const [starsChanged, setStarsChanged] = useState(false)
    const [accuracy, setAccuracy] = useState(0)

    useEffect(() => { startTimeRef.current = window.performance.now() }, [])
    useEffect(() => {
        if (shake) {
            const timer = setTimeout(() => setShake(false), 500)
            return () => clearTimeout(timer)
        }
    }, [shake])

    if (finished) {
        return <div className="page trainer-page"><Navigation /><main className="shell"><header className="trainer-header"><h2>{planet.emoji} {planet.label} - {t.tt.phasePractice}</h2><button className="btn btn--ghost btn--sm" onClick={() => navigate('/times-tables')}>{t.tt.trainExit}</button></header><div className="trainer-body"><SessionSummary phase="practice" planetId={planetId} accuracy={accuracy} streak={bestStreak} leveledUpCount={leveledUpCount} earnedStars={earnedStars} starsChanged={starsChanged} /></div></main></div>
    }
    if (session.length === 0) return null
    const currentFact = session[currentIdx]
    const advance = (newIsFirstCorrect = false) => {
        if (currentIdx + 1 < session.length) {
            setCurrentIdx(currentIdx + 1)
            startTimeRef.current = window.performance.now()
        } else {
            const corrects = Object.values(firstAttempt).filter(x => x).length
            const acc = initialSessionSize > 0 ? (corrects + (newIsFirstCorrect ? 1 : 0)) / initialSessionSize : 1
            setAccuracy(acc)
            const oldStars = ttStore.getStars()[planetId] || 0
            const newStars = computeStars(planetId, ttStore.getProgress(), oldStars, { phase: 'practice', accuracy: acc })
            ttStore.raiseStars(planetId, newStars)
            setEarnedStars(newStars)
            setStarsChanged(newStars > oldStars)
            if (newStars > oldStars) playLevelUp()
            setFinished(true)
        }
    }
    const handlePadSubmit = () => {
        if (padValue === '') return
        const correct = Number(padValue) === currentFact.answer
        setPadValue('')
        const isFirst = firstAttempt[currentFact.key] === undefined
        const newIsFirstCorrect = isFirst && correct
        if (isFirst) setFirstAttempt(prev => ({ ...prev, [currentFact.key]: correct }))
        const oldEntry = ttStore.getProgress()[currentFact.key]
        const newEntry = applyAnswer(oldEntry, correct, window.performance.now() - startTimeRef.current, todayEpochDay)
        ttStore.saveFactProgress(currentFact.key, newEntry)
        if (correct && oldEntry && newEntry.box > oldEntry.box) setLeveledUpCount(prev => prev + 1)
        else if (correct && !oldEntry && newEntry.box > 1) setLeveledUpCount(prev => prev + 1)
        if (correct) {
            playCorrect()
            const newStreak = streak + 1
            setStreak(newStreak)
            setBestStreak(Math.max(bestStreak, newStreak))
            advance(newIsFirstCorrect)
        } else {
            playWrong()
            setShake(true)
            setStreak(0)
            setExplanation(explainFact(currentFact, planetId, lang))
            setSession(prev => prev.filter(f => f.key === currentFact.key).length > 1 ? prev : [...prev, currentFact])
        }
    }
    return <div className="page trainer-page"><Navigation /><main className="shell"><header className="trainer-header"><h2>{planet.emoji} {planet.label} - {t.tt.phasePractice}</h2><button className="btn btn--ghost btn--sm" onClick={() => navigate('/times-tables')}>{t.tt.trainExit}</button></header><div className="trainer-body">{showStrategy && <div className="overlay strategy-overlay"><div className="panel strategy-card" role="dialog" aria-modal="true" aria-labelledby="strategy-title"><h3 id="strategy-title">{getStrategyCard(planetId, lang).title}</h3>{getStrategyCard(planetId, lang).lines.map((line, i) => <p key={i}>{line}</p>)}<button className="btn btn--primary" autoFocus onClick={() => setShowStrategy(false)}>{t.tt.learnCardDismiss}</button></div></div>}{explanation ? <div className="panel explanation-card" role="dialog" aria-modal="true" aria-labelledby="explanation-text"><p id="explanation-text" tabIndex={-1} ref={(element) => element?.focus()}>{explanation}</p><button className="btn btn--primary" onClick={() => { setExplanation(null); advance() }}>{t.tt.learnCardDismiss}</button></div> : <div className="panel practice-card"><div className="progress-bar">{currentIdx + 1} / {session.length}</div><div className="streak-bar"><span>🔥 {streak}</span>{ttSettings.strategyCards && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowStrategy(true)}>💡</button>}</div><div className={`question-display ${shake ? 'shake' : ''}`}>{currentFact.a} × {currentFact.b} = ?</div><div className="pad-wrapper"><NumberPad value={padValue} onChange={setPadValue} onSubmit={handlePadSubmit} /></div></div>}</div></main></div>
}
