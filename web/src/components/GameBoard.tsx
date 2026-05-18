interface GameBoardProps {
    question: string
    options: string[]
    selectedLane: number
    blastLane: number | null
    onSelectLane: (lane: number) => void
}

export default function GameBoard({
    question,
    options,
    selectedLane,
    blastLane,
    onSelectLane,
}: GameBoardProps) {
    return (
        <div className="game-board">
            <div className="question-display">
                <p className="question-text">{question}</p>
            </div>

            <div className="battlefield">
                <div className="lanes">
                    {options.map((option, idx) => (
                        <button
                            key={idx}
                            className={`lane ${selectedLane === idx ? 'selected' : ''} ${blastLane === idx ? 'blast' : ''}`}
                            onClick={() => onSelectLane(idx)}
                        >
                            <span className="alien">👾</span>
                            <span className="value">{option}</span>
                        </button>
                    ))}
                </div>

                <div className="rocket-track">
                    <div className="rocket" style={{ transform: `translateX(calc(${selectedLane} * 100% + ${selectedLane * 4}px))` }}>
                        🚀
                    </div>
                </div>
            </div>
        </div>
    )
}
