import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NumberPad } from '../../components/trainer/NumberPad'
import { SessionSummary } from '../../components/trainer/SessionSummary'
import PlayHud from '../../components/PlayHud'
import TrainerFrame from '../../components/trainer/TrainerFrame'
import { playCorrect, playLevelUp, playWrong } from '../../sound'
import { store } from '../../store'
import { factsForPlanet } from '../../timesTable/facts'
import { applyAnswer, localEpochDay } from '../../review/leitner'
import { buildDailyMission, requeueWrong } from '../../timesTable/session'
import { explainFact, getStrategyCard } from '../../timesTable/strategies'
import { GALAXIES, getPlanet } from '../../timesTable/tables'
import { computeStars, ttStore } from '../../timesTable/ttStore'
import type { Fact, FactKey, PlanetId } from '../../timesTable/types'
import { useModalDialog, useSoundSetting, useSurpriseRun, type SurpriseActions } from '../../hooks'
import { translations } from '../../i18n'

const planetForFact = (fact: Fact): PlanetId => {
    for (const galaxy of GALAXIES) {
        for (const planet of galaxy.planets) {
            if (factsForPlanet(planet.id).some(candidate => candidate.key === fact.key)) return planet.id
        }
    }
    return 't1'
}

const elapsedSince = (startedAt: number): number => performance.now() - startedAt

export function DailyPhase() {
    const settings = store.getSettings()
    useSoundSetting()
    const t = translations[settings.language].tt
    const play = translations[settings.language].play
    const surprise = useSurpriseRun()
    const surpriseActions: SurpriseActions | undefined = surprise.active
        ? {
            againLabel: translations[settings.language].surprise.again,
            homeLabel: translations[settings.language].nav.home,
            onAgain: surprise.again,
            onHome: surprise.home,
        }
        : undefined
    const [today] = useState(() => localEpochDay(Date.now(), new Date().getTimezoneOffset()))
    const [session, setSession] = useState(() => buildDailyMission(ttStore.getProgress(), ttStore.getStars(), today))
    const [index, setIndex] = useState(0)
    const [firstAttempts, setFirstAttempts] = useState<Record<FactKey, boolean>>({})
    const [value, setValue] = useState('')
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [levelledUp, setLevelledUp] = useState(0)
    const [explanation, setExplanation] = useState<string | null>(null)
    const [showStrategy, setShowStrategy] = useState(false)
    const [finished, setFinished] = useState(session.length === 0)
    const [accuracy, setAccuracy] = useState(0)
    const [touchedPlanets, setTouchedPlanets] = useState<Set<PlanetId>>(new Set())
    const startedAt = useRef(0)

    useEffect(() => { startedAt.current = performance.now() }, [index])
    const fact = session[index]
    const planetId = fact === undefined ? 't1' : planetForFact(fact)

    const finish = (wasFirstCorrect: boolean) => {
        const correct = Object.values(firstAttempts).filter(Boolean).length + Number(wasFirstCorrect)
        const resultAccuracy = session.length === 0 ? 1 : correct / session.length
        setAccuracy(resultAccuracy)
        const progress = ttStore.getProgress()
        const stars = ttStore.getStars()
        for (const touchedPlanet of touchedPlanets) {
            const previous = stars[touchedPlanet] ?? 0
            const next = computeStars(touchedPlanet, progress, previous, { phase: 'daily', accuracy: resultAccuracy }, store.getSettings().thinkingTime)
            ttStore.raiseStars(touchedPlanet, next)
            if (next > previous) playLevelUp()
        }
        setFinished(true)
    }

    const submit = () => {
        if (fact === undefined || value === '') return
        const correct = Number(value) === fact.answer
        const first = firstAttempts[fact.key] === undefined
        const wasFirstCorrect = first && correct
        setValue('')
        if (first) setFirstAttempts(current => ({ ...current, [fact.key]: correct }))
        const previous = ttStore.getProgress()[fact.key]
        const next = applyAnswer(previous, correct, elapsedSince(startedAt.current), today)
        ttStore.saveFactProgress(fact.key, next)
        setTouchedPlanets(current => new Set(current).add(planetId))
        if (correct && (previous === undefined ? next.box > 1 : next.box > previous.box)) setLevelledUp(current => current + 1)
        if (!correct) {
            playWrong()
            setStreak(0)
            setExplanation(explainFact(fact, planetId, settings.language))
            setSession(current => requeueWrong(current, fact.key))
            return
        }
        playCorrect()
        const nextStreak = streak + 1
        setStreak(nextStreak)
        setBestStreak(current => Math.max(current, nextStreak))
        if (index + 1 < session.length) setIndex(current => current + 1)
        else finish(wasFirstCorrect)
    }

    if (finished && session.length === 0) {
        return (
            <TrainerFrame title={t.dailyMission} exit={t.trainExit}>
                <section className="panel"><h2>{t.allCaughtUp}</h2></section>
            </TrainerFrame>
        )
    }
    if (finished) {
        return (
            <TrainerFrame title={t.dailyMission} exit={t.trainExit}>
                <SessionSummary
                    surprise={surpriseActions}
                    phase="daily"
                    planetId="mission"
                    accuracy={accuracy}
                    streak={bestStreak}
                    leveledUpCount={levelledUp}
                    earnedStars={0}
                    starsChanged={false}
                />
            </TrainerFrame>
        )
    }
    if (fact === undefined) return null

    const planet = getPlanet(planetId)
    const strategyCard = getStrategyCard(planetId, settings.language)
    const dismissExplanation = () => {
        setExplanation(null)
        if (index + 1 < session.length) setIndex(current => current + 1)
        else finish(false)
    }

    return (
        <TrainerFrame
            title={t.dailyMission}
            exit={t.trainExit}
            actions={ttStore.getTTSettings().strategyCards && (
                <button type="button" className="btn btn--icon" onClick={() => setShowStrategy(true)}>
                    💡<span className="game-bar__hide-sm"> {translations[settings.language].tt.help}</span>
                </button>
            )}
        >
            <PlayHud
                stats={[
                    { label: play.streak, value: <>🔥 {streak}</> },
                    { label: play.question, value: `${index + 1}/${session.length}` },
                ]}
                results={session.map((_unused, at) => (at < index ? true : undefined))}
                total={session.length}
            />
            {showStrategy && (
                <Dialog title={strategyCard.title} onClose={() => setShowStrategy(false)}>
                    {strategyCard.lines.map(line => <p key={line}>{line}</p>)}
                </Dialog>
            )}
            {explanation !== null ? (
                <Dialog title={explanation} onClose={dismissExplanation}><p>{explanation}</p></Dialog>
            ) : (
                <section className="panel practice-card">
                    <p className="question-header" aria-hidden="true">{planet?.emoji}</p>
                    <p className="question-display">{fact.a} × {fact.b} = ?</p>
                    <NumberPad value={value} onChange={setValue} onSubmit={submit} />
                </section>
            )}
        </TrainerFrame>
    )
}

type DialogProps = {
    readonly title: string
    readonly children: ReactNode
    readonly onClose: () => void
}

function Dialog({ title, children, onClose }: DialogProps) {
    const dialog = useModalDialog<HTMLDivElement>(onClose)
    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-label={title} ref={dialog}>
            <section className="overlay__card">
                <h2>{title}</h2>
                {children}
                <button type="button" className="btn btn--primary" autoFocus onClick={onClose}>OK</button>
            </section>
        </div>
    )
}
