import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import BarModelView from '../components/beam/BarModel'
import BeamSlider from '../components/beam/BeamSlider'
import DrillSummary, { type DrillResult } from '../components/DrillSummary'
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
import { useDocumentLanguage, useSoundSetting, useSurpriseActions } from '../hooks'
import { playCorrect, playShoot, playVictory, playWrong } from '../sound'
import { store } from '../store'
import { fill, translations } from '../i18n'

const CORRECT_MS = 700
const WRONG_MS = 2400

type Feedback = {
    readonly correct: boolean
    readonly answer: string
    readonly workingOut: string
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
    const surpriseActions = useSurpriseActions(t)

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
