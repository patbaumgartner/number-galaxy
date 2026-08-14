import { useEffect, useRef, useState } from 'react'

const ALIENS = ['👾', '👽', '🤖', '🛸']

/** Column count of the grid — arrow-key up/down move by this much. */
const COLUMNS = 2

export type TileState = 'idle' | 'hit' | 'missed' | 'revealed'

type AnswerGridProps = {
    options: string[]
    disabled: boolean
    firedIndex: number | null
    revealIndex: number | null
    groupLabel: string
    optionLabel: (option: string) => string
    onFire: (index: number) => void
}

function tileState(index: number, firedIndex: number | null, revealIndex: number | null): TileState {
    if (firedIndex === null) return 'idle'
    if (index === firedIndex) return index === revealIndex ? 'hit' : 'missed'
    if (index === revealIndex) return 'revealed'
    return 'idle'
}

/**
 * Four answers, one tap each.
 *
 * There is no aim step: touching a tile fires at it. Enter and Space are left
 * to the browser's native button activation — adding a global handler for them
 * on top would fire the same answer twice.
 *
 * The tiles are held with `aria-disabled` rather than `disabled`, and keyed by
 * position rather than by the number they show. Both exist to keep the same
 * four DOM nodes under the keyboard for a whole mission: `disabled` blurs the
 * element it lands on, and a key built from the option remounts the tile as
 * soon as the next question changes the number. Either one drops the child back
 * to the top of the page after every single answer.
 */
export default function AnswerGrid({
    options,
    disabled,
    firedIndex,
    revealIndex,
    groupLabel,
    optionLabel,
    onFire,
}: AnswerGridProps) {
    const [focusIndex, setFocusIndex] = useState(0)
    const tiles = useRef<Array<HTMLButtonElement | null>>([])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (disabled) return

            const digit = Number(event.key)
            if (Number.isInteger(digit) && digit >= 1 && digit <= options.length) {
                event.preventDefault()
                setFocusIndex(digit - 1)
                onFire(digit - 1)
                return
            }

            const step = {
                ArrowRight: 1,
                ArrowLeft: -1,
                ArrowDown: COLUMNS,
                ArrowUp: -COLUMNS,
            }[event.key]
            if (step === undefined) return

            event.preventDefault()
            setFocusIndex(current => {
                const next = (current + step + options.length) % options.length
                tiles.current[next]?.focus()
                return next
            })
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [disabled, onFire, options.length])

    return (
        <div className="answer-grid" role="group" aria-label={groupLabel}>
            {options.map((option, index) => {
                const state = tileState(index, firedIndex, revealIndex)
                return (
                    <button
                        key={index}
                        ref={element => { tiles.current[index] = element }}
                        type="button"
                        className={`answer-tile answer-tile--${state}`}
                        // Roving tabindex: one stop for the whole grid, arrows move within it.
                        tabIndex={index === focusIndex ? 0 : -1}
                        aria-disabled={disabled}
                        aria-label={optionLabel(option)}
                        onFocus={() => setFocusIndex(index)}
                        onClick={() => { if (!disabled) onFire(index) }}
                    >
                        <span className="answer-tile__alien" aria-hidden="true">
                            {ALIENS[index % ALIENS.length]}
                        </span>
                        <span className="answer-tile__value">{option}</span>
                        <span className="answer-tile__beam" aria-hidden="true" />
                        <span className="answer-tile__key" aria-hidden="true">{index + 1}</span>
                    </button>
                )
            })}
        </div>
    )
}
