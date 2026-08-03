import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import BarModelView from '../components/beam/BarModel'
import BeamSlider from '../components/beam/BeamSlider'
import PlayHud from '../components/PlayHud'
import TopBar from '../components/TopBar'
import WorkedExampleDialog from '../components/WorkedExampleDialog'
import {
    BEAM_ALIENS,
    advanceDrill,
    answerDrill,
    beamStore,
    computeBeamStars,
    createDrill,
    currentQuestion,
    drillCorrect,
    getStation,
    isBeamSkill,
    isStationUnlocked,
    tierForStars,
    type BeamSkill,
    type BeamStarLevel,
} from '../beam'
import { useDocumentLanguage, useModalDialog, useSoundSetting, useSurpriseRun, type SurpriseActions } from '../hooks'
import { playCorrect, playShoot, playVictory, playWrong } from '../sound'
import { store } from '../store'
import { fill, translations, type Translations } from '../i18n'

const CORRECT_MS = 700
const WRONG_MS = 2400

type Feedback = {
    readonly correct: boolean
    readonly answer: string
    readonly workingOut: string
}

type DrillResult = {
    readonly correct: number
    readonly total: number
    readonly accuracy: number
    readonly bestStreak: number
    readonly stars: BeamStarLevel
    readonly gained: boolean
    readonly newBest: boolean
}

export default function BeamDrillPage() {
    const { skill } = useParams<{ skill: string }>()
    const [run, setRun] = useState(0)

    if (!isBeamSkill(skill) || !isStationUnlocked(skill, beamStore.getStars())) {
        return <Navigate to="/number-beam" replace />
    }

    return (
        <BeamDrill
            key={`${skill}-${run}`}
            skill={skill}
            onReplay={() => setRun(current => current + 1)}
        />
    )
}

function BeamDrill({ skill, onReplay }: { readonly skill: BeamSkill; readonly onReplay: () => void }) {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)
    useSoundSetting()

    const station = getStation(skill)
    const [alwaysShowBar] = useState(() => beamStore.getBeamSettings().alwaysShowBar)
    const [startStars] = useState<BeamStarLevel>(() => beamStore.getStars()[skill] ?? 0)
    const [drill, setDrill] = useState(() => createDrill(skill, tierForStars(startStars)))
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const [beamValue, setBeamValue] = useState(0)
    const [helpOpen, setHelpOpen] = useState(false)
    const [result, setResult] = useState<DrillResult | null>(null)
    const savedRef = useRef(false)
    const surprise = useSurpriseRun()

    const surpriseActions: SurpriseActions | undefined = surprise.active
        ? {
            againLabel: t.surprise.again,
            homeLabel: t.nav.home,
            onAgain: surprise.again,
            onHome: surprise.home,
        }
        : undefined

    const question = currentQuestion(drill)
    const answering = drill.phase === 'answering' && !helpOpen
    const total = drill.questions.length

    const resolve = useCallback((correct: boolean) => {
        if (drill.phase !== 'answering') return
        playShoot()
        if (correct) playCorrect()
        else playWrong()
        setFeedback({ correct, answer: question.answer, workingOut: question.workingOut })
        setDrill(answerDrill(drill, correct))
    }, [drill, question])

    useEffect(() => {
        if (drill.phase !== 'feedback') return
        const timer = setTimeout(() => {
            setFeedback(null)
            setBeamValue(0)
            setDrill(current => advanceDrill(current))
        }, feedback?.correct === true ? CORRECT_MS : WRONG_MS)
        return () => clearTimeout(timer)
    }, [drill.phase, feedback?.correct])

    useEffect(() => {
        if (drill.phase !== 'summary' || savedRef.current) return
        savedRef.current = true

        const correct = drillCorrect(drill)
        const accuracy = correct / total
        const stars = computeBeamStars(startStars, correct, total)
        beamStore.raiseStars(skill, stars)
        const newBest = beamStore.updateBest(skill, accuracy)
        if (stars > startStars) playVictory()

        setResult({
            correct,
            total,
            accuracy,
            bestStreak: drill.bestStreak,
            stars,
            gained: stars > startStars,
            newBest,
        })
    }, [drill, skill, startStars, total])

    const resultText = feedback === null
        ? t.beam.slideHint
        : feedback.correct
            ? t.beam.correct
            : `${t.beam.wrong} ${t.beam.theAnswerIs} ${feedback.answer}`

    return (
        <div className="page beam-drill">
            <TopBar
                back={{ label: t.beam.exit, to: '/number-beam' }}
                title={<>{station.emoji}<span className="game-bar__hide-sm"> {t.beam.skills[skill]}</span></>}
                actions={<>
                    <span className="chip chip--sm">{fill(t.beam.tier, { n: drill.tier + 1 })}</span>
                    <button
                        type="button"
                        className="btn btn--icon"
                        onClick={() => setHelpOpen(true)}
                        disabled={drill.phase === 'summary'}
                    >
                        💡<span className="game-bar__hide-sm"> {t.beam.help}</span>
                    </button>
                </>}
            />

            <main className="shell beam-stage">
                <PlayHud
                    stats={[
                        { label: t.play.streak, value: <>🔥 {drill.streak}</> },
                        { label: t.play.question, value: `${Math.min(drill.results.length + 1, total)}/${total}` },
                    ]}
                    results={drill.results}
                    total={total}
                />

                <section className={`equation${feedback === null ? '' : ` equation--${feedback.correct ? 'correct' : 'wrong'}`}`}>
                    <p className="equation__prompt">{question.prompt}</p>
                    <p className="equation__result" aria-live="polite">{resultText}</p>
                    {feedback !== null && !feedback.correct && (
                        <p className="equation__working">{question.workingOut}</p>
                    )}
                </section>

                {(alwaysShowBar || feedback !== null) && (
                    <BarModelView model={question.bar} revealed={feedback !== null} label={t.beam.barLabel} />
                )}

                <BeamSlider
                    max={question.beamMax}
                    step={question.beamStep}
                    value={beamValue}
                    alien={BEAM_ALIENS[0]}
                    disabled={!answering}
                    labels={{
                        move: t.beam.beamMove,
                        fire: t.beam.beamFire,
                        less: t.beam.beamLess,
                        more: t.beam.beamMore,
                    }}
                    onChange={setBeamValue}
                    onFire={() => resolve(beamValue === question.value)}
                />
            </main>

            {helpOpen && (
                <WorkedExampleDialog
                    title={t.beam.helpTitle}
                    close={t.beam.helpClose}
                    example={station.sample}
                    onClose={() => setHelpOpen(false)}
                />
            )}

            {result !== null && (
                <DrillSummary
                    labels={t.beam}
                    result={result}
                    onPlayAgain={onReplay}
                    onExit={() => navigate('/number-beam')}
                    surprise={surpriseActions}
                />
            )}
        </div>
    )
}

type DrillSummaryProps = {
    readonly labels: Translations['beam']
    readonly result: DrillResult
    readonly onPlayAgain: () => void
    readonly onExit: () => void
    /** Set when the picker chose this station, not the player. */
    readonly surprise?: SurpriseActions | undefined
}

function DrillSummary({ labels, result, onPlayAgain, onExit, surprise }: DrillSummaryProps) {
    const dialog = useModalDialog<HTMLDivElement>()

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="beam-summary-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="beam-summary-title">{labels.summaryTitle}</h2>
                <p className="overlay__stars" aria-label={`${result.stars} stars`}>
                    {'⭐'.repeat(result.stars) || '☆'}
                </p>
                <p className="overlay__steps">
                    {labels.summaryAccuracy}: {result.correct}/{result.total} ({Math.round(result.accuracy * 100)}%)
                    {' · '}
                    {labels.summaryStreak}: {result.bestStreak}
                </p>
                {result.gained && <p className="overlay__note">{fill(labels.summaryStars, { n: result.stars })}</p>}
                {result.newBest && <p className="overlay__note">{labels.summaryNewBest}</p>}
                {!result.gained && result.stars === 0 && <p className="overlay__note">{labels.summaryKeepGoing}</p>}
                <div className="overlay__actions">
                    {surprise === undefined ? (
                        <>
                            <button type="button" className="btn btn--primary" onClick={onPlayAgain}>
                                {labels.playAgain}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={onExit}>
                                {labels.exit}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn--primary" onClick={surprise.onAgain}>
                                {surprise.againLabel}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={surprise.onHome}>
                                {surprise.homeLabel}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
