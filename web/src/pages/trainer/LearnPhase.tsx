import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import TopBar from '../../components/TopBar'
import { NumberPad } from '../../components/NumberPad'
import { playCorrect, playWrong } from '../../sound'
import { useSoundSetting } from '../../hooks'
import { store } from '../../store'
import { buildLearnSession } from '../../timesTable/session'
import { getStrategyCard } from '../../timesTable/strategies'
import { getPlanet } from '../../timesTable/tables'
import type { PlanetId } from '../../timesTable/types'
import { translations } from '../../i18n'

export function LearnPhase({ planetId }: { planetId: PlanetId }) {
    const lang = store.getSettings().language
    useSoundSetting()
    const t = translations[lang]
    const navigate = useNavigate()
    const planet = getPlanet(planetId)!

    const session = useMemo(() => buildLearnSession(planetId), [planetId])
    const strategy = useMemo(() => {
        try {
            return getStrategyCard(planetId, lang)
        } catch {
            return { title: '', lines: [] }
        }
    }, [planetId, lang])

    const [step, setStep] = useState<'strategy' | 'skip-count' | 'table' | 'guided' | 'summary'>('strategy')
    const [gapProgress, setGapProgress] = useState(0)
    const [padValue, setPadValue] = useState('')
    const [misses, setMisses] = useState(0)
    const [shake, setShake] = useState(false)
    const [guidedProgress, setGuidedProgress] = useState(0)
    const [showAnswer, setShowAnswer] = useState(false)

    useEffect(() => {
        if (!shake) return
        const timer = setTimeout(() => setShake(false), 500)
        return () => clearTimeout(timer)
    }, [shake])

    const handlePadSubmit = () => {
        if (padValue === '') return
        const val = Number(padValue)
        setPadValue('')

        if (step === 'skip-count') {
            const targetIndex = session.gapIndices[gapProgress]
            const correct = val === session.skipCountSequence[targetIndex]

            if (correct) {
                playCorrect()
                setMisses(0)
                if (gapProgress + 1 < session.gapIndices.length) {
                    setGapProgress(gapProgress + 1)
                } else {
                    setStep('table')
                }
            } else {
                playWrong()
                setShake(true)
                if (misses + 1 >= 2) {
                    setPadValue(session.skipCountSequence[targetIndex].toString())
                } else {
                    setMisses(misses + 1)
                }
            }
        } else if (step === 'guided') {
            const fact = session.guidedQuestions[guidedProgress]
            const correct = val === fact.answer

            if (correct) {
                playCorrect()
                if (guidedProgress + 1 < session.guidedQuestions.length) {
                    setGuidedProgress(guidedProgress + 1)
                    setShowAnswer(false)
                } else {
                    setStep('summary')
                }
            } else {
                playWrong()
                setShake(true)
                setShowAnswer(true)
            }
        }
    }

    return (
        <div className="page trainer-page">
            <TopBar
                back={{ label: t.tt.trainExit, to: '/times-tables' }}
                title={<>{planet.emoji} {planet.label} — {t.tt.phaseLearn}</>}
            />
            <main className="shell">

                <div className="trainer-body">
                    {step === 'strategy' && (
                        <div className="card strategy-card">
                            <h3 className="neon-text">{strategy.title}</h3>
                            {strategy.lines.map((line, i) => <p key={i}>{line}</p>)}
                            <button className="btn btn--primary" onClick={() => setStep('skip-count')}>{t.tt.learnCardDismiss}</button>
                        </div>
                    )}

                    {step === 'skip-count' && (
                        <div className="card skip-count-card">
                            <div className="sequence-display">
                                {session.skipCountSequence.map((val, i) => {
                                    const isGap = session.gapIndices.includes(i)
                                    const gapIndex = session.gapIndices.indexOf(i)
                                    if (!isGap) return <span key={i} className="seq-val">{val}</span>
                                    if (gapIndex < gapProgress) return <span key={i} className="seq-val seq-filled">{val}</span>
                                    if (gapIndex === gapProgress) return <span key={i} className={`seq-gap seq-active ${shake ? 'shake' : ''}`}>_</span>
                                    return <span key={i} className="seq-gap">_</span>
                                })}
                            </div>
                            <div className="pad-wrapper">
                                <NumberPad value={padValue} onChange={setPadValue} onSubmit={handlePadSubmit} />
                            </div>
                        </div>
                    )}

                    {step === 'table' && (
                        <div className="card full-table-card">
                            <div className="table-grid">
                                {session.facts.map(f => (
                                    <div key={f.key} className="table-fact">
                                        {f.a} × {f.b} = <span className="neon-text">{f.answer}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn--primary" style={{ marginTop: '1rem' }} onClick={() => setStep('guided')}>{t.tt.learnGuided}</button>
                        </div>
                    )}

                    {step === 'guided' && (
                        <div className="card guided-card">
                            <div className={`question-display ${shake ? 'shake' : ''}`}>
                                {session.guidedQuestions[guidedProgress].a} × {session.guidedQuestions[guidedProgress].b} = ?
                            </div>
                            {showAnswer && <div className="answer-hint neon-text">{session.guidedQuestions[guidedProgress].answer}</div>}
                            <div className="pad-wrapper">
                                <NumberPad value={padValue} onChange={setPadValue} onSubmit={handlePadSubmit} />
                            </div>
                        </div>
                    )}

                    {step === 'summary' && (
                        <div className="card summary-card">
                            <h3>{t.tt.learnFinish}</h3>
                            <button className="btn btn--primary" style={{ marginTop: '1rem' }} onClick={() => navigate(`/times-tables/train/${planetId}/practice`)}>{t.tt.summaryPracticeBtn}</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
