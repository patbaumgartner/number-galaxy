import { useEffect, useRef, useState } from 'react'
import PlayHud from '../../components/PlayHud'
import TrainerFrame from '../../components/trainer/TrainerFrame'
import { NumberPad } from '../../components/trainer/NumberPad'
import { SessionSummary } from '../../components/trainer/SessionSummary'
import { playCorrect, playLevelUp, playWrong } from '../../sound'
import { store } from '../../store'
import { applyAnswer, localEpochDay } from '../../review/leitner'
import { buildPracticeSession } from '../../timesTable/session'
import { explainFact, getStrategyCard } from '../../timesTable/strategies'
import { getPlanet } from '../../timesTable/tables'
import { computeStars, ttStore } from '../../timesTable/ttStore'
import type { Fact, FactKey, PlanetId, StarLevel } from '../../timesTable/types'
import type { Language } from '../../game'
import { useModalDialog, useSoundSetting, useSurpriseRun, type SurpriseActions } from '../../hooks'
import { translations } from '../../i18n'

export function PracticePhase({ planetId }: { planetId: PlanetId }) {
    const lang = store.getSettings().language
    useSoundSetting()
    const ttSettings = ttStore.getTTSettings()
    const t = translations[lang]
    const surprise = useSurpriseRun()
    const surpriseActions: SurpriseActions | undefined = surprise.active
        ? {
            againLabel: t.surprise.again,
            homeLabel: t.nav.home,
            onAgain: surprise.again,
            onHome: surprise.home,
        }
        : undefined
    const planet = getPlanet(planetId)!
    const [todayEpochDay] = useState(() => localEpochDay(Date.now(), new Date().getTimezoneOffset()))
    const [initialSession] = useState<Fact[]>(
        () => [...buildPracticeSession(planetId, ttStore.getProgress(), todayEpochDay)],
    )
    const [session, setSession] = useState<Fact[]>(initialSession)
    const initialSessionSize = initialSession.length
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
        if (!shake) return
        const timer = setTimeout(() => setShake(false), 500)
        return () => clearTimeout(timer)
    }, [shake])

    const title = <>{planet.emoji} {planet.label} — {t.tt.phasePractice}</>

    if (finished) {
        return (
            <TrainerFrame title={title} exit={t.tt.trainExit}>
                <SessionSummary
                    surprise={surpriseActions}
                    phase="practice"
                    planetId={planetId}
                    accuracy={accuracy}
                    streak={bestStreak}
                    leveledUpCount={leveledUpCount}
                    earnedStars={earnedStars}
                    starsChanged={starsChanged}
                />
            </TrainerFrame>
        )
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
            const newStars = computeStars(planetId, ttStore.getProgress(), oldStars, { phase: 'practice', accuracy: acc }, store.getSettings().thinkingTime)
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
    return (
        <TrainerFrame
            title={title}
            exit={t.tt.trainExit}
            actions={ttSettings.strategyCards && (
                <button type="button" className="btn btn--icon" onClick={() => setShowStrategy(true)}>
                    💡<span className="game-bar__hide-sm"> {t.beam.help}</span>
                </button>
            )}
        >
            <PlayHud
                stats={[
                    { label: t.play.streak, value: <>🔥 {streak}</> },
                    { label: t.play.question, value: `${currentIdx + 1}/${session.length}` },
                ]}
                results={session.map((_unused, index) => (index < currentIdx ? firstAttempt[session[index].key] : undefined))}
                total={session.length}
            />
            {showStrategy && (
                <StrategyOverlay
                    planetId={planetId}
                    lang={lang}
                    dismiss={t.tt.learnCardDismiss}
                    onClose={() => setShowStrategy(false)}
                />
            )}
            {explanation ? (
                <ExplanationDialog
                    explanation={explanation}
                    dismiss={t.tt.learnCardDismiss}
                    onClose={() => { setExplanation(null); advance() }}
                />
            ) : (
                <div className="panel practice-card">
                    <div className={`question-display ${shake ? 'shake' : ''}`}>{currentFact.a} × {currentFact.b} = ?</div>
                    <div className="pad-wrapper">
                        <NumberPad value={padValue} onChange={setPadValue} onSubmit={handlePadSubmit} />
                    </div>
                </div>
            )}
        </TrainerFrame>
    )
}

type StrategyOverlayProps = {
    readonly planetId: PlanetId
    readonly lang: Language
    readonly dismiss: string
    readonly onClose: () => void
}

function StrategyOverlay({ planetId, lang, dismiss, onClose }: StrategyOverlayProps) {
    const dialog = useModalDialog<HTMLDivElement>(onClose)
    const card = getStrategyCard(planetId, lang)

    return (
        <div className="overlay strategy-overlay">
            <div className="panel strategy-card" role="dialog" aria-modal="true" aria-labelledby="strategy-title" ref={dialog}>
                <h3 id="strategy-title">{card.title}</h3>
                {card.lines.map((line, index) => <p key={index}>{line}</p>)}
                <button className="btn btn--primary" autoFocus onClick={onClose}>{dismiss}</button>
            </div>
        </div>
    )
}

type ExplanationDialogProps = {
    readonly explanation: string
    readonly dismiss: string
    readonly onClose: () => void
}

function ExplanationDialog({ explanation, dismiss, onClose }: ExplanationDialogProps) {
    const dialog = useModalDialog<HTMLDivElement>(onClose)

    return (
        <div className="panel explanation-card" role="dialog" aria-modal="true" aria-labelledby="explanation-text" ref={dialog}>
            <p id="explanation-text" tabIndex={-1} ref={element => element?.focus()}>{explanation}</p>
            <button className="btn btn--primary" onClick={onClose}>{dismiss}</button>
        </div>
    )
}
