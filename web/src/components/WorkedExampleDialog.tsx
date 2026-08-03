import { useModalDialog } from '../hooks'

export type WorkedExample = {
    /** Display string in pure maths notation, e.g. `"7 + 5 = ?"`. */
    readonly prompt: string
    readonly answer: string
    /** The steps, also in maths notation, so they read the same in every language. */
    readonly steps: string
}

type WorkedExampleDialogProps = {
    readonly title: string
    readonly close: string
    readonly example: WorkedExample
    readonly onClose: () => void
}

/**
 * One solved example, shown from a game's 💡 Help button.
 *
 * The arcade and the beam had a byte-identical copy of this each, differing only
 * in the prop names they used to pass the same three strings.
 */
export default function WorkedExampleDialog({ title, close, example, onClose }: WorkedExampleDialogProps) {
    const dialog = useModalDialog<HTMLDivElement>(onClose)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="worked-example-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="worked-example-title">💡 {title}</h2>
                <p className="overlay__example">
                    <span>{example.prompt}</span>
                    <strong>{example.answer}</strong>
                </p>
                <p className="overlay__steps">{example.steps}</p>
                <button type="button" className="btn btn--primary" onClick={onClose} autoFocus>
                    {close}
                </button>
            </div>
        </div>
    )
}
