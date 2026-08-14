import type { FactKey, FactProgress } from '../../timesTable/types'
import { cellState, VIEW_GRIDS } from '../../timesTable/heatmap'
import { canonicalKey } from '../../timesTable/facts'
import { todayEpochDay } from '../../review/leitner'
import { store } from '../../store'

type FactHeatmapProps = {
    readonly progress: Record<FactKey, FactProgress>
    readonly view: 'core' | 'extended' | 'squares'
}

/**
 * Each cell is `role="img"` rather than a bare span.
 *
 * A span with no role is generic, and a generic element takes no accessible
 * name — every one of these 144 `aria-label`s was being discarded, so the map
 * was a wall of unlabelled colour to a screen reader.
 */
export default function FactHeatmap({ progress, view }: FactHeatmapProps) {
    const grid = VIEW_GRIDS[view]
    const { thinkingTime } = store.getSettings()
    // Read once, so all 144 cells are dated the same day even if the render
    // happens to straddle midnight.
    const today = todayEpochDay()

    if (view === 'squares') {
        return (
            <div className="heatmap heatmap-squares">
                <div className="heatmap-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {grid.cols.map((num) => {
                        const key = canonicalKey(num, num)
                        const state = cellState(progress, key, thinkingTime, today)
                        const answer = num * num

                        return (
                            <span
                                key={key}
                                role="img"
                                className={`heatmap-cell heatmap-cell-${state}`}
                                title={`${num}×${num} = ${answer}`}
                                aria-label={`${num} times ${num} equals ${answer}`}
                            >
                                {num}²
                            </span>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="heatmap">
            <div className="heatmap-grid" style={{ gridTemplateColumns: `auto repeat(${grid.cols.length}, 1fr)` }}>
                {/* Top-left empty corner */}
                <span className="heatmap-header" />

                {/* Column headers */}
                {grid.cols.map(c => (
                    <span key={`col-${c}`} className="heatmap-header">{c}</span>
                ))}

                {/* Rows */}
                {grid.rows.map(r => (
                    <div key={`row-${r}`} className="heatmap-row-contents" style={{ display: 'contents' }}>
                        <span className="heatmap-header">{r}</span>
                        {grid.cols.map(c => {
                            const key = canonicalKey(r, c)
                            const state = cellState(progress, key, thinkingTime, today)
                            const answer = r * c

                            return (
                                <span
                                    key={key}
                                    role="img"
                                    className={`heatmap-cell heatmap-cell-${state}`}
                                    title={`${r}×${c} = ${answer}`}
                                    aria-label={`${r} times ${c} equals ${answer}`}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
