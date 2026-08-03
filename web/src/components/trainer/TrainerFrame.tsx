import type { ReactNode } from 'react'
import TopBar from '../TopBar'

type TrainerFrameProps = {
    /** A node, not a string: most phases title themselves with a planet emoji and label. */
    readonly title: ReactNode
    readonly exit: string
    /** Goes in the top bar, where every other game keeps its Help button. */
    readonly actions?: ReactNode
    readonly children: ReactNode
}

/**
 * The page shell every times-tables phase sits in.
 *
 * All four phases need the same bar, shell and body wrapper, and three of them
 * used to inline it once per early return — eleven copies of the same markup.
 */
export default function TrainerFrame({ title, exit, actions, children }: TrainerFrameProps) {
    return (
        <div className="page trainer-page">
            <TopBar back={{ label: exit, to: '/times-tables' }} title={title} actions={actions} />
            <main className="shell">
                <div className="trainer-body">{children}</div>
            </main>
        </div>
    )
}
