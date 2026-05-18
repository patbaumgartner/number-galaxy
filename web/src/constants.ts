import type { Operation, Level, Difficulty } from './game'

export const avatars = [
    '🚀', '👾', '🤖', '👽', '🛸', '⭐', '🌙', '☄️',
    '🔥', '💫', '🌟', '⚡', '🎮', '🕹️', '🎯', '🏆',
    '💎', '🦄', '🐉', '🦅', '🦁', '🐺', '🐼', '🦊',
]

export const operationLabels: Record<Operation, string> = {
    addition: '➕ Plus',
    subtraction: '➖ Minus',
    multiplication: '✖️ Times',
    division: '➗ Divide',
    remainders: '📊 Remainders',
}

export const levelLabels: Record<Level, string> = {
    starter: '🟢 Starter (≤10)',
    beginner: '🔵 Beginner (≤20)',
    elementary: '🟡 Elementary (≤50)',
    intermediate: '🟠 Intermediate (≤100)',
    advanced: '🔴 Advanced (≤250)',
    expert: '⭐ Expert (≤500)',
    master: '💥 Master (≤1000)',
}

export const difficultyLabels: Record<Difficulty, string> = {
    easy: '😊 Easy (more time)',
    normal: '🎯 Normal',
    hard: '🔥 Hard (less time)',
}

/** 20 questions per training session (~15 min/day target). */
export const TOTAL_QUESTIONS_PER_RUN = 20
