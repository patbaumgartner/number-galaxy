import type { Operation } from './game'

export type Tip = { title: string; body: string }

const TIPS: Record<Operation, Tip[]> = {
    addition: [
        { title: '➕ Tip', body: 'Put the bigger number first, then count on the smaller one.' },
        { title: '➕ Near-10 trick', body: 'To add 9: add 10, then subtract 1. E.g. 7+9 = 7+10−1 = 16.' },
        { title: '➕ Doubles', body: 'Remember doubles: 6+6=12, 7+7=14, 8+8=16, 9+9=18.' },
    ],
    subtraction: [
        { title: '➖ Count-up trick', body: 'Instead of counting back, count up from the smaller number to the bigger one.' },
        { title: '➖ Near-10 trick', body: 'To subtract 9: subtract 10, then add 1 back. E.g. 15−9 = 15−10+1 = 6.' },
        { title: '➖ Use addition', body: 'Subtraction is the reverse of addition. If 7+5=12, then 12−5=7.' },
    ],
    multiplication: [
        { title: '✖️ ×9 finger trick', body: 'Hold all 10 fingers up. Fold down finger N to get 9×N. Left fingers = tens, right = ones.' },
        { title: '✖️ ×5 trick', body: 'Multiply by 10, then halve. E.g. 7×5 = 7×10÷2 = 35.' },
        { title: '✖️ ×4 trick', body: 'Double, then double again. E.g. 6×4 = 6×2×2 = 12×2 = 24.' },
        { title: '✖️ ×11 trick', body: 'For single digits: just repeat the digit. 7×11 = 77.' },
    ],
    division: [
        { title: '➗ Use multiplication', body: 'Division is reverse multiplication. For 42÷6: ask "6 times what equals 42?" → 7.' },
        { title: '➗ Halving', body: 'Dividing by 2 means halving. Dividing by 4 means halving twice.' },
        { title: '➗ Check remainder', body: 'After dividing, multiply back: quotient × divisor should equal (or be close to) the dividend.' },
    ],
    remainders: [
        { title: '📊 Remainder tip', body: 'Divide normally, then find remainder: dividend − (quotient × divisor). E.g. 17÷5: 5×3=15, 17−15=2.' },
        { title: '📊 Check it', body: 'The remainder must always be smaller than the divisor. If not, your quotient is too small!' },
    ],
}

/** Returns a random tip for the given operation. */
export function getRandomTip(operation: Operation): Tip {
    const tips = TIPS[operation]
    return tips[Math.floor(Math.random() * tips.length)]
}
