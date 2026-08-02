import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

type TopBarProps = {
    /** Where the exit arrow goes, and what it is called. */
    readonly back: { readonly label: string; readonly to: string }
    /** Where the player currently is, within this game. */
    readonly title: ReactNode
    readonly actions?: ReactNode
}

/**
 * The single navigation bar for every game screen, in both games.
 *
 * Both games previously invented their own chrome: the arcade had one bar, the
 * trainer stacked two, and the arcade's Hall of Fame had none at all. One
 * component keeps the exit in the same corner wherever a child happens to be.
 */
export default function TopBar({ back, title, actions }: TopBarProps) {
    const navigate = useNavigate()

    return (
        <header className="game-bar">
            <button type="button" className="btn btn--icon" onClick={() => navigate(back.to)}>
                ←<span className="game-bar__hide-sm"> {back.label}</span>
            </button>
            <h1 className="game-bar__title">{title}</h1>
            <span className="game-bar__actions">{actions}</span>
        </header>
    )
}
