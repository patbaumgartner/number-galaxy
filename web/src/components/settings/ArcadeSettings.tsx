import { BADGE_EMOJI, TIMER_MODES, type BadgeTier, type GameSettings, type NamedMissReason, type TimerMode } from '../../store'
import { OPERATIONS, RANKS, rankConfig, type Operation, type Rank } from '../../game'
import { fill, type Translations } from '../../i18n'
import Switch from './Switch'

const timerLabel = (t: Translations, mode: TimerMode): string =>
    mode === 'off' ? t.settings.timerOff : mode === 'gentle' ? t.settings.timerGentle : t.settings.timerTimed

type ArcadeSettingsProps = {
    readonly t: Translations
    readonly settings: GameSettings
    readonly badges: ReadonlyMap<Operation, BadgeTier>
    readonly mistake: NamedMissReason | null
    readonly onUpdate: (patch: Partial<GameSettings>) => void
    readonly onToggleOperation: (operation: Operation) => void
}

/** Everything the arcade asks for: what to practise, how hard, and how much help. */
export default function ArcadeSettings({
    t,
    settings,
    badges,
    mistake,
    onUpdate,
    onToggleOperation,
}: ArcadeSettingsProps) {
    return (
        <section className="group">
            <div className="group__head">
                <h2 className="group__title">{t.settings.groupInvaders}</h2>
                <p className="group__hint">{t.settings.groupInvadersHint}</p>
            </div>

            {mistake !== null && (
                <div className="panel">
                    <h3 className="panel__title">{t.settings.practiseNextTitle}</h3>
                    <p className="panel__hint">{t.settings.practiseNextHint}</p>
                    <p className="equation__note">{t.misses[mistake]}</p>
                </div>
            )}

            <div className="panel">
                <h3 className="panel__title">{t.settings.practiceTitle}</h3>
                <p className="panel__hint">{t.settings.practiceHint}</p>
                <div className="options">
                    {OPERATIONS.map(operation => {
                        const badge = badges.get(operation) ?? 'none'
                        const active = settings.operations.includes(operation)
                        const locked = active && settings.operations.length === 1
                        return (
                            <button
                                key={operation}
                                type="button"
                                className={`option${active ? ' option--active' : ''}${locked ? ' option--locked' : ''}`}
                                aria-pressed={active}
                                aria-disabled={locked}
                                onClick={() => onToggleOperation(operation)}
                            >
                                {t.operations[operation]}
                                <span className="option__marks">
                                    {badge !== 'none' && (
                                        <span className="option__badge" aria-hidden="true">{BADGE_EMOJI[badge]}</span>
                                    )}
                                    <span className="option__state" aria-hidden="true">
                                        {locked ? '🔒' : active ? '✓' : ''}
                                    </span>
                                </span>
                            </button>
                        )
                    })}
                </div>
                {settings.operations.length === 1 && (
                    <p className="panel__note">{t.settings.keepOne}</p>
                )}
            </div>

            <div className="panel">
                <h3 className="panel__title">{t.settings.rankTitle}</h3>
                <p className="panel__hint">{t.settings.rankHint}</p>
                <div className="ladder">
                    {RANKS.map((rank: Rank) => (
                        <button
                            key={rank}
                            type="button"
                            className={`rung${settings.rank === rank ? ' rung--active' : ''}`}
                            aria-pressed={settings.rank === rank}
                            onClick={() => onUpdate({ rank })}
                        >
                            <span className="rung__name">{t.ranks[rank]}</span>
                            <span className="rung__meta">
                                {fill(t.settings.rankRange, { max: rankConfig[rank].maxValue })}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel">
                <div>
                    <h3 className="switch-row__title">⏱ {t.settings.timerTitle}</h3>
                    <p className="panel__hint">{t.settings.timerHint}</p>
                </div>
                <div className="options options--row">
                    {TIMER_MODES.map(mode => (
                        <button
                            key={mode}
                            type="button"
                            className={`option${settings.timer === mode ? ' option--active' : ''}`}
                            aria-pressed={settings.timer === mode}
                            onClick={() => onUpdate({ timer: mode })}
                        >
                            {timerLabel(t, mode)}
                        </button>
                    ))}
                </div>
                <p className="panel__hint">{t.settings.timerGentleHint}</p>

                <div className="switch-row">
                    <div>
                        <h3 className="switch-row__title">💡 {t.settings.hintsTitle}</h3>
                        <p className="panel__hint">{t.settings.hintsHint}</p>
                    </div>
                    <Switch labels={t.settings} on={settings.hints} onToggle={() => onUpdate({ hints: !settings.hints })} />
                </div>

                <div className="switch-row">
                    <div>
                        <h3 className="switch-row__title">📖 {t.settings.storiesTitle}</h3>
                        <p className="panel__hint">{t.settings.storiesHint}</p>
                    </div>
                    <Switch labels={t.settings} on={settings.stories} onToggle={() => onUpdate({ stories: !settings.stories })} />
                </div>

                <div className="switch-row">
                    <div>
                        <h3 className="switch-row__title">🏅 {t.settings.showScoreTitle}</h3>
                        <p className="panel__hint">{t.settings.showScoreHint}</p>
                    </div>
                    <Switch
                        labels={t.settings}
                        on={settings.showScore}
                        onToggle={() => onUpdate({ showScore: !settings.showScore })}
                    />
                </div>
            </div>
        </section>
    )
}
