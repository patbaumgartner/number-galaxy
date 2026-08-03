import { describeBar } from '../../beam/bars'
import type { BarModel } from '../../beam/types'

type BarModelProps = {
    readonly model: BarModel
    /** True swaps every `?` for the number behind it. */
    readonly revealed: boolean
    readonly label: string
}

/**
 * The bar model: the whole on top, the parts that make it underneath.
 *
 * Both rows are laid out against `model.scale` rather than their own total, so
 * a doubled bar really is drawn twice as long — that comparison is the entire
 * teaching point, and it disappears the moment each row is stretched to fit.
 */
export default function BarModelView({ model, revealed, label }: BarModelProps) {
    return (
        <div className="bar-model" role="img" aria-label={`${label}: ${describeBar(model, revealed)}`}>
            {model.rows.map((row, rowIndex) => {
                const filled = row.segments.reduce((total, segment) => total + segment.value, 0)
                return (
                    <div className="bar-row" key={rowIndex}>
                        <div className="bar-row__track">
                            {row.segments.map((segment, index) => (
                                <div
                                    key={index}
                                    className={`bar-seg bar-seg--${segment.tone}`}
                                    style={{ flexGrow: segment.value }}
                                >
                                    <span className="bar-seg__alien" aria-hidden="true">{segment.alien}</span>
                                    <span className="bar-seg__label" aria-hidden="true">
                                        {revealed ? segment.revealedLabel : segment.label}
                                    </span>
                                </div>
                            ))}
                            {filled < model.scale && (
                                <div className="bar-row__rest" style={{ flexGrow: model.scale - filled }} />
                            )}
                        </div>
                        <span className="bar-row__total" aria-hidden="true">
                            {revealed ? row.revealedTotal : row.total}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
