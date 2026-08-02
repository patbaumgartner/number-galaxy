import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../../components/TopBar'
import { NumberPad } from '../../components/NumberPad'
import { SessionSummary } from '../../components/SessionSummary'
import { playCorrect, playLevelUp, playWrong } from '../../sound'
import { useSoundSetting } from '../../hooks'
import { store } from '../../store'
import { applyAnswer, localEpochDay } from '../../timesTable/leitner'
import { buildSpeedSession } from '../../timesTable/session'
import { getPlanet } from '../../timesTable/tables'
import { computeStars, ttStore } from '../../timesTable/ttStore'
import type { Fact, PlanetId, StarLevel } from '../../timesTable/types'
import { translations } from '../../translations'

export function SpeedPhase({ planetId }: { planetId: PlanetId }) {
    const lang = store.getSettings().language
    useSoundSetting()
    const t = translations[lang]
    const navigate = useNavigate()
    const planet = getPlanet(planetId)!
    const [todayEpochDay] = useState(() => localEpochDay(Date.now(), new Date().getTimezoneOffset()))
    const [session] = useState<Fact[]>(() => [...buildSpeedSession(planetId)])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [padValue, setPadValue] = useState('')
    const [shake, setShake] = useState(false)
    const startTimeRef = useRef<number>(0)
    const [totalMs, setTotalMs] = useState(0)
    const [accuracy, setAccuracy] = useState(0)
    const [correctsCount, setCorrectsCount] = useState(0)
    const [finished, setFinished] = useState(false)
    const [earnedStars, setEarnedStars] = useState<StarLevel>(0)
    const [starsChanged, setStarsChanged] = useState(false)
    const [isNewBest, setIsNewBest] = useState(false)
    const [countdown, setCountdown] = useState(3)
    const [started, setStarted] = useState(false)
    const [displayTime, setDisplayTime] = useState(0)

    useEffect(() => {
        const stars = ttStore.getStars()[planetId] || 0
        if (stars < 1) navigate(`/times-tables/train/${planetId}/practice`, { replace: true })
    }, [planetId, navigate])
    useEffect(() => {
        if (!started && session.length > 0) {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
                return () => clearTimeout(timer)
            }
            const timerId = setTimeout(() => { setStarted(true); startTimeRef.current = window.performance.now() }, 0)
            return () => clearTimeout(timerId)
        }
    }, [countdown, started, session])
    useEffect(() => {
        if (started && !finished) {
            const interval = setInterval(() => setDisplayTime(window.performance.now() - startTimeRef.current), 10)
            return () => clearInterval(interval)
        }
    }, [started, finished])
    useEffect(() => {
        if (shake) {
            const timer = setTimeout(() => setShake(false), 500)
            return () => clearTimeout(timer)
        }
    }, [shake])

    if (session.length === 0) return null
    if (finished) return <div className="page trainer-page"><TopBar back={{ label: t.tt.trainExit, to: '/times-tables' }} title={<span className="game-bar__player">{planet.emoji}<span className="game-bar__hide-sm"> {planet.label} — {t.tt.phaseSpeed}</span></span>} /><main className="shell"><div className="trainer-body"><SessionSummary phase="speed" planetId={planetId} accuracy={accuracy} streak={0} leveledUpCount={0} earnedStars={earnedStars} starsChanged={starsChanged} timeMs={totalMs} isNewBest={isNewBest} /></div></main></div>
    if (!started) return <div className="page trainer-page"><TopBar back={{ label: t.tt.trainExit, to: '/times-tables' }} title={<span className="game-bar__player">{planet.emoji}<span className="game-bar__hide-sm"> {planet.label} — {t.tt.phaseSpeed}</span></span>} /><main className="shell"><div className="trainer-body"><div className="panel speed-ready-card"><h2>{countdown > 0 ? countdown : t.tt.speedGo}</h2></div></div></main></div>

    const currentFact = session[currentIdx]
    const handlePadSubmit = () => {
        if (padValue === '') return
        const correct = Number(padValue) === currentFact.answer
        setPadValue('')
        const ms = window.performance.now() - startTimeRef.current
        if (correct) { setCorrectsCount(prev => prev + 1); playCorrect() } else { playWrong(); setShake(true) }
        const oldEntry = ttStore.getProgress()[currentFact.key]
        ttStore.saveFactProgress(currentFact.key, applyAnswer(oldEntry, correct, ms, todayEpochDay))
        if (currentIdx + 1 < session.length) {
            setCurrentIdx(currentIdx + 1)
        } else {
            const finalTime = window.performance.now() - startTimeRef.current
            setTotalMs(finalTime)
            const acc = (correctsCount + (correct ? 1 : 0)) / session.length
            setAccuracy(acc)
            const oldStars = ttStore.getStars()[planetId] || 0
            const newStars = computeStars(planetId, ttStore.getProgress(), oldStars, { phase: 'speed', accuracy: acc })
            ttStore.raiseStars(planetId, newStars)
            setEarnedStars(newStars)
            setStarsChanged(newStars > oldStars)
            let newBest = false
            if (acc >= 0.9) { newBest = ttStore.updateBest(planetId, finalTime); setIsNewBest(newBest) }
            if (newStars > oldStars || newBest) playLevelUp()
            setFinished(true)
        }
    }
    const formatDisplayTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000)
        const min = Math.floor(totalSec / 60)
        const sec = totalSec % 60
        const ds = Math.floor((ms % 1000) / 100)
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ds}`
    }
    return <div className="page trainer-page"><TopBar back={{ label: t.tt.trainExit, to: '/times-tables' }} title={<span className="game-bar__player">{planet.emoji}<span className="game-bar__hide-sm"> {planet.label} — {t.tt.phaseSpeed}</span></span>} /><main className="shell"><div className="trainer-body"><div className="panel speed-card"><div className="speed-timer">{formatDisplayTime(displayTime)}</div><div className="progress-bar">{currentIdx + 1} / {session.length}</div><div className={`question-display ${shake ? 'shake' : ''}`}>{currentFact.a} × {currentFact.b} = ?</div><div className="pad-wrapper"><NumberPad value={padValue} onChange={setPadValue} onSubmit={handlePadSubmit} /></div></div></div></main></div>
}
