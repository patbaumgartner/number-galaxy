import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import TopBar from '../components/TopBar'
import PlayHud from '../components/PlayHud'
import BeamSlider from '../components/beam/BeamSlider'
import SenseVisual from '../components/sense/SenseVisual'
import WorkedExampleDialog from '../components/WorkedExampleDialog'
import {
    advanceSenseDrill,
    answerSenseDrill,
    computeSenseStars,
    createSenseDrill,
    currentSenseQuestion,
    getSenseStation,
    isSenseAnswerCorrect,
    isSenseSkill,
    isSenseStationUnlocked,
    senseCorrect,
    senseStore,
    tierForStars,
    type SenseQuestion,
    type SenseSkill,
    type SenseStarLevel,
} from '../sense'
import { store } from '../store'
import { fill, translations, type Translations } from '../i18n'
import { useDocumentLanguage, useSoundSetting, useSurpriseRun, type SurpriseActions } from '../hooks'
import { playCorrect, playShoot, playVictory, playWrong } from '../sound'

const CORRECT_MS = 700

/** How long a glance lasts. Long enough to see a pattern, too short to count it. */
const GLANCE_MS = 1400

type Feedback = { readonly correct: boolean; readonly exact: boolean; readonly answer: string }

type SenseResult = {
    readonly correct: number
    readonly total: number
    readonly accuracy: number
    readonly bestStreak: number
    readonly stars: SenseStarLevel
    readonly gained: boolean
    readonly newBest: boolean
}

/**
 * What a screen reader is told about the picture.
 *
 * Never the answer. Reading out "seven dots" would replace the whole skill with
 * listening, so the description gives the *structure* — the thing a sighted
 * child sees at a glance — and leaves the quantity to be worked out.
 */
function describe(question: SenseQuestion, labels: Translations['sense']): string {
    const { visual } = question
    if (visual.kind === 'array') return `${visual.rows} × ${visual.columns}`
    if (visual.kind === 'numberLine' && visual.jump > 0) return `${visual.from} + ${visual.jump}`
    return labels.pictureLabel
}

export default function SenseDrillPage() {
    const { skill } = useParams<{ skill: string }>()
    const [run, setRun] = useState(0)

    if (!isSenseSkill(skill) || !isSenseStationUnlocked(skill, senseStore.getStars())) {
        return <Navigate to="/number-sense" replace />
    }

    return <SenseDrill key={`${skill}-${run}`} skill={skill} onReplay={() => setRun(current => current + 1)} />
}

function SenseDrill({ skill, onReplay }: { readonly skill: SenseSkill; readonly onReplay: () => void }) {
    const navigate = useNavigate()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)
    useSoundSetting()

    const station = getSenseStation(skill)
    const [briefGlance] = useState(() => senseStore.getSenseSettings().briefGlance)
    const [startStars] = useState<SenseStarLevel>(() => senseStore.getStars()[skill] ?? 0)
    const [drill, setDrill] = useState(() => createSenseDrill(skill, tierForStars(startStars)))
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const [beamValue, setBeamValue] = useState(0)
    const [glanceOver, setGlanceOver] = useState(false)
    const [helpOpen, setHelpOpen] = useState(false)
    const [result, setResult] = useState<SenseResult | null>(null)
    const savedRef = useRef(false)
    const surprise = useSurpriseRun()

    const surpriseActions: SurpriseActions | undefined = surprise.active
        ? { againLabel: t.surprise.again, homeLabel: t.nav.home, onAgain: surprise.again, onHome: surprise.home }
        : undefined

    const question = currentSenseQuestion(drill)
    const answering = drill.phase === 'answering'
    const total = drill.questions.length
    const isGlance = question.visual.kind === 'dots' && question.visual.brief && briefGlance

    useEffect(() => {
        if (!isGlance) return
        const timer = setTimeout(() => setGlanceOver(true), GLANCE_MS)
        return () => clearTimeout(timer)
    }, [isGlance, drill.index])

    const resolve = useCallback(() => {
        if (drill.phase !== 'answering') return
        playShoot()
        const correct = isSenseAnswerCorrect(question, beamValue)
        if (correct) playCorrect()
        else playWrong()
        setFeedback({ correct, exact: beamValue === question.value, answer: question.answer })
        setDrill(answerSenseDrill(drill, correct))
    }, [drill, question, beamValue])

    useEffect(() => {
        if (drill.phase !== 'feedback') return
        const timer = setTimeout(() => {
            setFeedback(null)
            setBeamValue(0)
            setGlanceOver(false)
            setDrill(current => advanceSenseDrill(current))
        }, feedback?.correct === true ? CORRECT_MS : 2200)
        return () => clearTimeout(timer)
    }, [drill.phase, feedback?.correct])

    useEffect(() => {
        if (drill.phase !== 'summary' || savedRef.current) return
        savedRef.current = true

        const correct = senseCorrect(drill)
        const accuracy = correct / total
        const stars = computeSenseStars(startStars, correct, total)
        senseStore.raiseStars(skill, stars)
        const newBest = senseStore.updateBest(skill, accuracy)
        if (stars > startStars) playVictory()

        setResult({ correct, total, accuracy, bestStreak: drill.bestStreak, stars, gained: stars > startStars, newBest })
    }, [drill, skill, startStars, total])

    // The heading is always the thing being asked about — for `placeNumber` that
    // is the number itself, which an earlier version replaced with the
    // instruction, leaving a child with nothing on screen to place.
    const heading = question.prompt === '?' ? t.sense.howMany : question.prompt
    const instruction = skill === 'placeNumber'
        ? t.sense.placeIt
        : isGlance ? t.sense.glanceHint : t.beam.slideHint
    const resultText = feedback === null
        ? instruction
        : feedback.correct
            ? (feedback.exact ? t.beam.correct : t.sense.closeEnough)
            : `${t.beam.wrong} ${t.beam.theAnswerIs} ${feedback.answer}`

    return (
        <div className="page beam-drill">
            <TopBar
                back={{ label: t.sense.exitToMap, to: '/number-sense' }}
                title={<>{station.emoji}<span className="game-bar__hide-sm"> {t.sense.skills[skill]}</span></>}
                actions={<>
                    <span className="chip chip--sm">{fill(t.sense.tier, { n: drill.tier + 1 })}</span>
                    <button
                        type="button"
                        className="btn btn--icon"
                        onClick={() => setHelpOpen(true)}
                        disabled={drill.phase === 'summary'}
                    >
                        💡<span className="game-bar__hide-sm"> {t.sense.help}</span>
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
                    <p className="equation__prompt">{heading}</p>
                    <p className="equation__result" aria-live="polite">{resultText}</p>
                    {feedback !== null && !feedback.correct && (
                        <p className="equation__working">{question.workingOut}</p>
                    )}
                </section>

                <SenseVisual
                    visual={question.visual}
                    visible={!isGlance || !glanceOver || feedback !== null}
                    label={describe(question, t.sense)}
                />

                {isGlance && feedback === null && (
                    <button
                        type="button"
                        className={`btn btn--ghost${glanceOver ? '' : ' is-reserved'}`}
                        onClick={() => setGlanceOver(false)}
                    >
                        👁 {t.sense.lookAgain}
                    </button>
                )}

                <BeamSlider
                    max={question.beamMax}
                    step={question.beamStep}
                    value={beamValue}
                    alien="👾"
                    disabled={!answering}
                    labels={{
                        move: t.beam.beamMove,
                        fire: t.beam.beamFire,
                        less: t.beam.beamLess,
                        more: t.beam.beamMore,
                    }}
                    onChange={setBeamValue}
                    onFire={resolve}
                />
            </main>
            {helpOpen && (
                <WorkedExampleDialog
                    title={t.sense.helpTitle}
                    close={t.sense.helpClose}
                    example={station.sample}
                    onClose={() => setHelpOpen(false)}
                />
            )}


            {result !== null && (
                <SenseSummary
                    labels={t}
                    result={result}
                    onPlayAgain={onReplay}
                    onExit={() => navigate('/number-sense')}
                    surprise={surpriseActions}
                />
            )}
        </div>
    )
}

type SenseSummaryProps = {
    readonly labels: Translations
    readonly result: SenseResult
    readonly onPlayAgain: () => void
    readonly onExit: () => void
    readonly surprise?: SurpriseActions | undefined
}

function SenseSummary({ labels, result, onPlayAgain, onExit, surprise }: SenseSummaryProps) {
    const t = labels.beam

    return (
        <div className="summary" role="dialog" aria-modal="true" aria-labelledby="sense-summary-title">
            <div className="summary__card">
                <h2 className="summary__title" id="sense-summary-title">{t.summaryTitle}</h2>
                <div className="summary__stars" aria-label={`${result.stars}/3`}>
                    {[0, 1, 2].map(index => (
                        <span
                            key={index}
                            className={`summary__star${index < result.stars ? ' summary__star--earned' : ''}`}
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    ))}
                </div>

                {result.gained && <p className="summary__badge">⭐ {fill(t.summaryStars, { n: result.stars })}</p>}
                {result.newBest && <p className="summary__badge">🏆 {t.summaryNewBest}</p>}
                {!result.gained && !result.newBest && <p className="summary__hint">{t.summaryKeepGoing}</p>}

                <dl className="summary__stats">
                    <div className="summary__stat">
                        <dt>{t.summaryAccuracy}</dt>
                        <dd>{result.correct}/{result.total}</dd>
                    </div>
                    <div className="summary__stat">
                        <dt>{t.summaryStreak}</dt>
                        <dd>{result.bestStreak}🔥</dd>
                    </div>
                </dl>

                <div className="summary__actions">
                    {surprise === undefined ? (
                        <>
                            <button type="button" className="btn btn--primary btn--lg" onClick={onPlayAgain}>
                                {t.playAgain}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={onExit}>
                                {t.exit}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn--primary btn--lg" onClick={surprise.onAgain}>
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
