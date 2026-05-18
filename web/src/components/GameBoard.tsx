interface GameBoardProps {
    options: string[]
    selectedLane: number
    blastLane: number | null
    onSelectLane: (lane: number) => void
}

export default function GameBoard({
    options,
    selectedLane,
    blastLane,
    onSelectLane,
}: GameBoardProps) {
    return (
        <div className="battlefield">
            <div className="lanes">
                {options.map((option, idx) => (
                    <button
                        key={idx}
                        aria-label={`Lane ${idx + 1}: ${option}`}
                        className={`lane ${selectedLane === idx ? 'selected' : ''} ${blastLane === idx ? 'blast' : ''}`}
                        onClick={() => onSelectLane(idx)}
                    >
                        <span className="alien">👾</span>
                        <span className="value">{option}</span>
                    </button>
                ))}
            </div>

            <div className="rocket-track">
                {options.map((_, idx) => (
                    <div key={idx} className="rocket-cell">
                        {selectedLane === idx && <span className="rocket">🚀</span>}
                    </div>
                ))}
            </div>
        </div>
    )
}
