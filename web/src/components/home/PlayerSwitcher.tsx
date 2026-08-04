import { fill, type Translations } from '../../i18n'
import { useModalDialog } from '../../hooks'
import type { Player } from '../../store'

type PlayerSwitcherProps = {
    readonly labels: Translations['home']
    readonly players: Player[]
    readonly activeId: string
    readonly onChoose: (id: string) => void
    readonly onRemove: (player: Player) => void
    readonly onAdd: () => void
    readonly onRename: () => void
    readonly onCancel: () => void
}

/** Who is playing — one row per child on this device. */
export default function PlayerSwitcher({
    labels,
    players,
    activeId,
    onChoose,
    onRemove,
    onAdd,
    onRename,
    onCancel,
}: PlayerSwitcherProps) {
    const dialog = useModalDialog<HTMLDivElement>(onCancel)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="switcher-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="switcher-title">{labels.whoIsPlaying}</h2>

                <ul className="players">
                    {players.map(entry => (
                        <li key={entry.id} className="players__row">
                            <button
                                type="button"
                                className={`players__pick${entry.id === activeId ? ' players__pick--active' : ''}`}
                                aria-current={entry.id === activeId}
                                aria-label={fill(labels.switchTo, { name: entry.playerName })}
                                onClick={() => onChoose(entry.id)}
                            >
                                <span aria-hidden="true">{entry.avatarId}</span>
                                <strong>{entry.playerName}</strong>
                                {entry.id === activeId && <small>{labels.playingNow}</small>}
                            </button>
                            {players.length > 1 && (
                                <button
                                    type="button"
                                    className="btn btn--ghost btn--sm"
                                    aria-label={`${labels.removePlayer} ${entry.playerName}`}
                                    onClick={() => onRemove(entry)}
                                >
                                    🗑
                                </button>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="overlay__actions">
                    <button type="button" className="btn btn--primary" onClick={onAdd}>
                        ➕ {labels.addPlayer}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onRename}>
                        ✏️ {labels.rename}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onCancel}>
                        {labels.cancel}
                    </button>
                </div>
            </div>
        </div>
    )
}
