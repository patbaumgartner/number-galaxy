import type { Translations } from '../../i18n'

type SwitchProps = {
    readonly labels: Translations['settings']
    readonly on: boolean
    readonly onToggle: () => void
}

/** The on/off control every settings row uses. */
export default function Switch({ labels, on, onToggle }: SwitchProps) {
    return (
        <button type="button" className={`switch${on ? ' switch--on' : ''}`} role="switch" aria-checked={on} onClick={onToggle}>
            <span className="switch__track"><span className="switch__thumb" /></span>
            {on ? labels.on : labels.off}
        </button>
    )
}
