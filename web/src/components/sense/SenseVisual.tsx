import type { SenseVisual as Visual } from '../../sense'

type SenseVisualProps = {
    readonly visual: Visual
    /** False hides a briefly-shown pattern, which is what makes it a glance. */
    readonly visible: boolean
    /** Language-neutral description, used as the accessible name. */
    readonly label: string
}

const FRAME_CELLS = 10

/**
 * What the child looks at, drawn from numbers rather than from a picture.
 *
 * Each arrangement is the one it would have on paper: a die face, a ten-frame in
 * two rows of five, a rekenrek with its beads in fives, a number line with its
 * jump drawn on. Structure is the whole point — scattered dots can only be
 * counted, while five and five can be *seen*, and it is the seeing that turns
 * into "7 is 5 and 2" later on.
 */
export default function SenseVisual({ visual, visible, label }: SenseVisualProps) {
    if (visual.kind === 'none') return null

    return (
        <div className={`sense-visual${visible ? '' : ' sense-visual--hidden'}`} role="img" aria-label={label}>
            {visible && <Drawing visual={visual} />}
        </div>
    )
}

function Drawing({ visual }: { readonly visual: Visual }) {
    switch (visual.kind) {
        case 'dots':
            return (
                <div
                    className="sense-dots"
                    style={{ gridTemplateColumns: `repeat(${visual.columns}, 1fr)` }}
                    aria-hidden="true"
                >
                    {Array.from({ length: 3 * visual.columns }, (_unused, cell) => {
                        const row = Math.floor(cell / visual.columns)
                        const column = cell % visual.columns
                        const dot = visual.dots.find(entry => entry.row === row && entry.column === column)
                        return (
                            <span
                                key={cell}
                                className={dot === undefined ? 'sense-dot sense-dot--empty' : `sense-dot sense-dot--g${dot.group}`}
                            />
                        )
                    })}
                </div>
            )

        case 'tenFrame':
            return (
                <div className="sense-frames" aria-hidden="true">
                    {Array.from({ length: visual.frames }, (_unused, frame) => (
                        <div key={frame} className="sense-frame">
                            {Array.from({ length: FRAME_CELLS }, (_cell, index) => (
                                <span
                                    key={index}
                                    className={`sense-cell${frame * FRAME_CELLS + index < visual.filled ? ' sense-cell--filled' : ''}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )

        case 'rekenrek':
            return (
                <div className="sense-rack" aria-hidden="true">
                    {visual.rows.map((pushed, row) => (
                        <div key={row} className="sense-rack__row">
                            {Array.from({ length: 10 }, (_unused, index) => (
                                <span
                                    key={index}
                                    className={[
                                        'sense-bead',
                                        index < 5 ? 'sense-bead--red' : 'sense-bead--white',
                                        index < pushed ? 'sense-bead--pushed' : '',
                                    ].join(' ').trim()}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )

        case 'numberLine':
            return (
                <div className="sense-line" aria-hidden="true">
                    <div className="sense-line__rail" />
                    {visual.jump > 0 && (
                        <div
                            className="sense-line__jump"
                            style={{
                                left: `${(visual.from / visual.max) * 100}%`,
                                width: `${(visual.jump / visual.max) * 100}%`,
                            }}
                        >
                            <span className="sense-line__jump-label">+{visual.jump}</span>
                        </div>
                    )}
                    {visual.jump > 0 && (
                        <span className="sense-line__mark" style={{ left: `${(visual.from / visual.max) * 100}%` }}>
                            {visual.from}
                        </span>
                    )}
                    <span className="sense-line__end sense-line__end--low">0</span>
                    <span className="sense-line__end sense-line__end--high">{visual.max}</span>
                </div>
            )

        case 'array':
            return (
                <div
                    className="sense-array"
                    style={{ gridTemplateColumns: `repeat(${visual.columns}, 1fr)` }}
                    aria-hidden="true"
                >
                    {Array.from({ length: visual.rows * visual.columns }, (_unused, index) => (
                        <span key={index} className="sense-dot sense-dot--g0" />
                    ))}
                </div>
            )

        case 'none':
            return null
    }
}
