import type { Operation, Level, Difficulty } from './game'

export const avatars = Array.from({ length: 24 }, (_, i) => `Avatar ${String(i + 1).padStart(2, '0')}`)

export const operationLabels: Record<Operation, string> = {
    addition: '➕ Addition',
    subtraction: '➖ Subtraction',
    multiplication: '✖️ Multiplication',
    division: '➗ Division',
    remainders: '📊 Remainders',
}

export const levelLabels: Record<Level, string> = {
    starter: '🟢 Starter (8-10)',
    advanced: '🟡 Advanced (8-10)',
    challenge: '🔴 Challenge (10+)',
}

export const difficultyLabels: Record<Difficulty, string> = {
    easy: '😊 Easy',
    normal: '🎯 Normal',
    hard: '🔥 Hard',
}

export const TOTAL_QUESTIONS_PER_RUN = 10
