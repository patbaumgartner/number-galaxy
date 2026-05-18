import { useRef } from 'react'

const MIN_SWIPE = 40

interface GameBoardProps {
    options: string[]
    selectedLane: number
    blastLane: number | null
    onSelectLane: (lane: number) => void
    onShoot: () => void
    onSwipeLeft: () => void
    onSwipeRight: () => void
}

export default function GameBoard({
    options,
    selectedLane,
    blastLane,
    onSelectLane,
    onShoot,
    onSwipeLeft,
    onSwipeRight,
}: GameBoardProps) {
    const touchStartX = useRef<number | null>(null)
    const touchStartY = useRef<number | null>(null)
    const didSwipe = useRef(false)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        didSwipe.current = false  // Reset at the start of every new touch sequence
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        const dy = e.changedTouches[0].clientY - touchStartY.current
        touchStartX.current = null
        touchStartY.current = null
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (absDx > absDy && absDx >= MIN_SWIPE) {
            didSwipe.current = true
            if (dx > 0) onSwipeRight()
            else onSwipeLeft()
        } else if (dy < -MIN_SWIPE && absDy > absDx) {
            didSwipe.current = true
            onShoot()
        }
    }

    const handleLaneClick = (idx: number) => {
        // On touch devices a swipe fires the lane's onClick too — ignore it
        if (didSwipe.current) {
            didSwipe.current = false
            return
        }
        if (idx === selectedLane) {
            onShoot()
        } else {
            onSelectLane(idx)
        }
    }

    return (
        <div
            className="battlefield"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="lanes">
                {options.map((option, idx) => (
                    <button
                        key={idx}
                        aria-label={`Lane ${idx + 1}: ${option}`}
                        className={`lane ${selectedLane === idx ? 'selected' : ''} ${blastLane === idx ? 'blast' : ''}`}
                        onClick={() => handleLaneClick(idx)}
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
