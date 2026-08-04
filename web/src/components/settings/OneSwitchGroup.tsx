import type { Translations } from '../../i18n'
import Switch from './Switch'

type OneSwitchGroupProps = {
    readonly labels: Translations['settings']
    readonly title: string
    readonly hint: string
    readonly switchTitle: string
    readonly switchHint: string
    readonly on: boolean
    readonly resetLabel: string
    readonly onToggle: () => void
    readonly onReset: () => void
}

/**
 * A game whose only setting is one switch, plus a way to wipe its own progress.
 *
 * Number Sense, Number Beam and the tables trainer each had this markup written
 * out in full — three copies of one layout, and three chances for one of them to
 * drift away from the other two.
 */
export default function OneSwitchGroup({
    labels,
    title,
    hint,
    switchTitle,
    switchHint,
    on,
    resetLabel,
    onToggle,
    onReset,
}: OneSwitchGroupProps) {
    return (
        <section className="group">
            <div className="group__head">
                <h2 className="group__title">{title}</h2>
                <p className="group__hint">{hint}</p>
            </div>

            <div className="panel">
                <div className="switch-row">
                    <div>
                        <h3 className="switch-row__title">{switchTitle}</h3>
                        <p className="panel__hint">{switchHint}</p>
                    </div>
                    <Switch labels={labels} on={on} onToggle={onToggle} />
                </div>
                <div className="panel__action">
                    <button type="button" className="btn btn--danger" onClick={onReset}>{resetLabel}</button>
                </div>
            </div>
        </section>
    )
}
