import { useModalDialog } from '../hooks'

type HowToPlayDialogProps = {
    readonly title: string
    readonly steps: readonly string[]
    readonly close: string
    readonly onClose: () => void
}

/**
 * The rules, where the game is.
 *
 * These used to sit in three stacked blocks on the home screen, which every
 * player scrolled past every time to reach the thing they came for. A child
 * wants the rules when they are looking at the game and cannot work out what to
 * do, so that is where they live.
 */
export default function HowToPlayDialog({ title, steps, close, onClose }: HowToPlayDialogProps) {
    const dialog = useModalDialog<HTMLDivElement>(onClose)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="how-to-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="how-to-title">{title}</h2>
                <ol className="steps">
                    {steps.map(step => <li key={step}>{step}</li>)}
                </ol>
                <button type="button" className="btn btn--primary" onClick={onClose} autoFocus>
                    {close}
                </button>
            </div>
        </div>
    )
}
