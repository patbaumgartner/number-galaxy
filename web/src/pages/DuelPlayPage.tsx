import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import TopBar from '../components/TopBar'
import PlayHud from '../components/PlayHud'
import AnswerGrid from '../components/arcade/AnswerGrid'
import { store } from '../store'
import { avatars } from '../constants'
import { fill, translations } from '../i18n'
import { useDocumentLanguage, useSoundSetting } from '../hooks'
import { playCorrect, playShoot, playVictory, playWrong } from '../sound'
import {
    QUESTIONS_PER_DUEL,
    advanceDuel,
    answerDuel,
    createDuel,
    duelCombined,
    duelOver,
    duelWinner,
    turnOf,
    type DuelMode,
    type DuelState,
} from '../game'

type Feedback = { outcome: 'correct' | 'wrong'; revealIndex: number; firedIndex: number }

/** A right answer needs a beat of applause, not a button. Same as the arcade. */
const CORRECT_MS = 650

/**
 * A round of two, on one device.
 *
 * Between every question the screen stops and says whose turn it is. On a shared
 * tablet that pause is the feature, not friction: without it the faster child
 * simply answers both turns, which is the failure mode a pair mode exists to
 * avoid.
 *
 * Nothing here writes to a profile. See `game/duel.ts` for why.
 */

const isMode = (value: string | null): value is DuelMode => value === 'together' || value === 'versus'

export default function DuelPlayPage() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const settings = store.getSettings()
    const t = translations[settings.language]
    useDocumentLanguage(settings.language)
    useSoundSetting()

    const mode: DuelMode = isMode(params.get('mode')) ? (params.get('mode') as DuelMode) : 'together'
    const names = useMemo(() => [
        params.get('one')?.slice(0, 12) || t.duel.playerOne,
        params.get('two')?.slice(0, 12) || t.duel.playerTwo,
    ] as const, [params, t.duel.playerOne, t.duel.playerTwo])

    const freshRound = () => createDuel({
        mode,
        players: [
            { name: names[0], avatarId: avatars[0] },
            { name: names[1], avatarId: avatars[1] },
        ],
        language: settings.language,
        rank: settings.rank,
        timed: false,
        operations: settings.operations,
    })

    const [duel, setDuel] = useState<DuelState>(freshRound)
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    // Every question opens on the handover, including the first: on a shared
    // tablet the pause is what stops the quicker child answering both turns.
    const [handedOver, setHandedOver] = useState(true)

    const turn = turnOf(duel)
    const question = duel.mission.question
    const over = duelOver(duel)

    // Whose answer is on screen. `turnOf` moves the moment an answer lands, so
    // during feedback it already names the next child — leaving the one who just
    // answered reading somebody else's name above their own result.
    const showing = feedback === null ? turn : ((1 - turn) as 0 | 1)

    const fire = (index: number) => {
        if (feedback !== null || over) return
        const correct = index === question.correctIndex
        playShoot()
        if (correct) playCorrect()
        else playWrong()
        setFeedback({ outcome: correct ? 'correct' : 'wrong', revealIndex: question.correctIndex, firedIndex: index })
        setDuel(current => answerDuel(current, correct ? 'correct' : 'wrong'))
    }

    const next = useCallback(() => {
        setFeedback(null)
        setDuel(current => {
            const moved = advanceDuel(current)
            if (duelOver(moved)) playVictory()
            return moved
        })
        setHandedOver(true)
    }, [])

    useEffect(() => {
        // A right answer moves on by itself. Only a miss waits for a tap, because
        // only a miss puts a worked route on screen to be read — asking a child
        // to confirm they understood being right is a button that means nothing.
        if (over || feedback?.outcome !== 'correct') return
        const timer = setTimeout(next, CORRECT_MS)
        return () => clearTimeout(timer)
    }, [over, feedback?.outcome, next])

    const restart = () => {
        setDuel(freshRound())
        setFeedback(null)
        setHandedOver(true)
    }

    if (over) {
        const winner = duelWinner(duel)
        const shared = duelCombined(duel)
        return (
            <div className="page">
                <TopBar back={{ label: t.duel.exit, to: '/' }} title={`👥 ${t.duel.title}`} />
                <main className="shell">
                    <section className="panel duel-result">
                        <h2 className="panel__title">{t.duel.roundOver}</h2>

                        {duel.mode === 'together' ? (
                            <>
                                <p className="duel-result__headline">{t.duel.togetherResult}</p>
                                <p className="duel-result__score">
                                    {fill(t.duel.correctOf, { correct: shared.correct, total: QUESTIONS_PER_DUEL })}
                                </p>
                            </>
                        ) : (
                            <p className="duel-result__headline">
                                {winner === null
                                    ? t.duel.versusDraw
                                    : fill(t.duel.versusWinner, { name: names[winner] })}
                            </p>
                        )}

                        <ul className="duel-scores">
                            {[0, 1].map(index => (
                                <li key={index} className={`duel-scores__row${winner === index ? ' duel-scores__row--won' : ''}`}>
                                    <span aria-hidden="true">{avatars[index]}</span>
                                    <strong>{names[index]}</strong>
                                    <span>
                                        {fill(t.duel.correctOf, {
                                            correct: duel.tallies[index].correct,
                                            total: QUESTIONS_PER_DUEL / 2,
                                        })}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <p className="panel__hint">{t.duel.recordsNothing}</p>

                        <div className="duel-result__actions">
                            <button type="button" className="btn btn--primary" onClick={restart}>
                                {t.duel.again}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={() => navigate('/')}>
                                {t.duel.exit}
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    return (
        <div className="page page--game">
            <TopBar back={{ label: t.duel.exit, to: '/' }} title={`👥 ${t.duel.title}`} />

            <main className="stage">
                <PlayHud
                    stats={[
                        { label: names[0], value: `${duel.tallies[0].correct}`, ...(showing === 0 ? { modifier: 'score' } : {}) },
                        { label: t.play.question, value: `${duel.mission.results.length}/${QUESTIONS_PER_DUEL}` },
                        { label: names[1], value: `${duel.tallies[1].correct}`, ...(showing === 1 ? { modifier: 'score' } : {}) },
                    ]}
                    results={duel.mission.results}
                    total={QUESTIONS_PER_DUEL}
                />

                {handedOver ? (
                    <section className="equation duel-handover">
                        <p className="duel-handover__who">
                            <span aria-hidden="true">{avatars[turn]}</span>
                            {fill(t.duel.yourTurn, { name: names[turn] })}
                        </p>
                        <p className="duel-handover__hint">{t.duel.handOver}</p>
                        <button type="button" className="btn btn--primary" onClick={() => setHandedOver(false)} autoFocus>
                            {t.duel.ready}
                        </button>
                    </section>
                ) : (
                    <>
                        <section className={`equation${feedback ? ` equation--${feedback.outcome}` : ''}`}>
                            <p className="duel-turn" aria-live="polite">{fill(t.duel.turnOf, { name: names[showing] })}</p>
                            <p className="equation__prompt">{question.prompt}</p>
                            <p className="equation__result" aria-live="polite">
                                {feedback === null
                                    ? t.game.answerHint
                                    : feedback.outcome === 'correct'
                                        ? t.game.correct
                                        : `${t.game.wrong} ${t.game.theAnswerIs} ${question.answer}`}
                            </p>
                            {feedback !== null && feedback.outcome !== 'correct' && (
                                <p className="equation__working">{question.workingOut}</p>
                            )}
                            {feedback !== null && feedback.outcome !== 'correct' && (
                                <button type="button" className="btn btn--primary equation__next" onClick={next} autoFocus>
                                    {t.game.gotIt}
                                </button>
                            )}
                        </section>

                        <AnswerGrid
                            options={question.options}
                            disabled={feedback !== null}
                            firedIndex={feedback?.firedIndex ?? null}
                            revealIndex={feedback === null ? null : feedback.revealIndex}
                            groupLabel={t.game.answerHint}
                            optionLabel={option => option}
                            onFire={fire}
                        />
                    </>
                )}
            </main>
        </div>
    )
}
