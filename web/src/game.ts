export type Language = 'de' | 'it' | 'en' | 'fr'
export type Operation =
    | 'addition'
    | 'subtraction'
    | 'multiplication'
    | 'division'
    | 'remainders'
export type Level =
    | 'starter'
    | 'beginner'
    | 'elementary'
    | 'intermediate'
    | 'advanced'
    | 'expert'
    | 'master'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type GameStatus = 'ready' | 'playing' | 'won' | 'lost'

export type Question = {
    prompt: string
    answer: string
}

export type GameState = {
    language: Language
    operation: Operation
    operationPool: Operation[]
    level: Level
    difficulty: Difficulty
    score: number
    streak: number
    lives: number
    answeredCount: number
    currentQuestion: Question
    options: string[]
    correctIndex: number
    status: GameStatus
}

type NumericQuestion = {
    prompt: string
    answerValue: number
}

const remainderSeparator: Record<Language, string> = {
    de: 'Rest',
    it: 'r',
    en: 'r',
    fr: 'r',
}

const remainderLabel = (language: Language, quotient: number, remainder: number) =>
    `${quotient} ${remainderSeparator[language]} ${remainder}`

// Max operand value per level — spans 10 → 1000
const levelMaxValue: Record<Level, number> = {
    starter: 10,
    beginner: 20,
    elementary: 50,
    intermediate: 100,
    advanced: 250,
    expert: 500,
    master: 1000,
}

// Base seconds per question per level (shorter = more challenging)
const levelSeconds: Record<Level, number> = {
    starter: 15,
    beginner: 13,
    elementary: 11,
    intermediate: 9,
    advanced: 7,
    expert: 6,
    master: 5,
}

// Difficulty shifts the timer (does NOT change number range)
const difficultySeconds: Record<Difficulty, number> = {
    easy: 3,
    normal: 0,
    hard: -2,
}

/** Returns the countdown seconds for one question at the given level + difficulty. */
export function getQuestionTime(level: Level, difficulty: Difficulty): number {
    return Math.max(3, levelSeconds[level] + difficultySeconds[difficulty])
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function createAdditionQuestion(maxValue: number): NumericQuestion {
    const left = randomInt(2, maxValue - 2)
    const right = randomInt(2, maxValue - left)
    return {
        prompt: `${left} + ${right} = ?`,
        answerValue: left + right,
    }
}

function createSubtractionQuestion(maxValue: number): NumericQuestion {
    const left = randomInt(4, maxValue)
    const right = randomInt(1, left - 1)
    return {
        prompt: `${left} - ${right} = ?`,
        answerValue: left - right,
    }
}

function createMultiplicationQuestion(maxValue: number): NumericQuestion {
    const maxFactor = Math.max(2, Math.floor(Math.sqrt(maxValue)))
    const left = randomInt(2, maxFactor)
    const right = randomInt(2, Math.max(2, Math.floor(maxValue / left)))
    return {
        prompt: `${left} × ${right} = ?`,
        answerValue: left * right,
    }
}

function createDivisionQuestion(maxValue: number): NumericQuestion {
    const maxFactor = Math.max(2, Math.floor(Math.sqrt(maxValue)))
    const divisor = randomInt(2, maxFactor)
    const quotient = randomInt(2, Math.max(2, Math.floor(maxValue / divisor)))
    const dividend = divisor * quotient
    return {
        prompt: `${dividend} ÷ ${divisor} = ?`,
        answerValue: quotient,
    }
}

function createRemainderQuestion(language: Language, maxValue: number) {
    const maxFactor = Math.max(2, Math.floor(Math.sqrt(maxValue)))
    const divisor = randomInt(2, maxFactor)
    const remainder = randomInt(1, divisor - 1)
    const quotient = randomInt(1, Math.max(1, Math.floor((maxValue - remainder) / divisor)))
    const dividend = divisor * quotient + remainder
    return {
        prompt: `${dividend} ÷ ${divisor} = ?`,
        answer: remainderLabel(language, quotient, remainder),
    }
}

function buildNumericOptions(answerValue: number) {
    const drift = Math.max(3, Math.round(answerValue * 0.25))
    const choices = new Set<number>([answerValue])
    while (choices.size < 4) {
        const delta = randomInt(-drift, drift) || 1
        choices.add(Math.max(0, answerValue + delta))
    }
    return Array.from(choices)
        .sort(() => Math.random() - 0.5)
        .map(String)
}

function buildRemainderOptions(language: Language, answer: string, maxValue: number) {
    const choices = new Set<string>([answer])
    while (choices.size < 4) {
        const quotient = randomInt(1, Math.max(3, Math.floor(maxValue / 3)))
        const remainder = randomInt(1, 4)
        choices.add(remainderLabel(language, quotient, remainder))
    }
    return Array.from(choices).sort(() => Math.random() - 0.5)
}

export const WAVE_SIZE = 5

const levelOrder: Level[] = [
    'starter', 'beginner', 'elementary', 'intermediate', 'advanced', 'expert', 'master',
]

/** Zero-based wave index (0–3). Each wave spans WAVE_SIZE answered questions. */
export function getWave(answeredCount: number): number {
    return Math.min(3, Math.floor(answeredCount / WAVE_SIZE))
}

/** Advance the base level by one step per wave (capped at master). */
export function getEffectiveLevel(baseLevel: Level, wave: number): Level {
    const baseIdx = levelOrder.indexOf(baseLevel)
    return levelOrder[Math.min(levelOrder.length - 1, baseIdx + wave)]
}

export function createRound(language: Language, operationPool: Operation[], level: Level, difficulty: Difficulty): GameState {
    const operation = operationPool[Math.floor(Math.random() * operationPool.length)]
    const maxValue = levelMaxValue[level]

    if (operation === 'remainders') {
        const question = createRemainderQuestion(language, maxValue)
        const options = buildRemainderOptions(language, question.answer, maxValue)
        return {
            language,
            operation,
            operationPool,
            level,
            difficulty,
            score: 0,
            streak: 0,
            lives: 3,
            answeredCount: 0,
            currentQuestion: {
                prompt: question.prompt,
                answer: question.answer,
            },
            options,
            correctIndex: options.indexOf(question.answer),
            status: 'ready',
        }
    }

    const questionFactory: Record<Exclude<Operation, 'remainders'>, (maxValue: number) => NumericQuestion> = {
        addition: createAdditionQuestion,
        subtraction: createSubtractionQuestion,
        multiplication: createMultiplicationQuestion,
        division: createDivisionQuestion,
    }

    const question = questionFactory[operation](maxValue)
    const answer = String(question.answerValue)
    const options = buildNumericOptions(question.answerValue)

    return {
        language,
        operation,
        operationPool,
        level,
        difficulty,
        score: 0,
        streak: 0,
        lives: 3,
        answeredCount: 0,
        currentQuestion: {
            prompt: question.prompt,
            answer,
        },
        options,
        correctIndex: options.indexOf(answer),
        status: 'ready',
    }
}

/** Generates a simple worked-example object for an operation. */
export function getWorkedExample(operation: Operation): { prompt: string; answer: string; hint: string } {
    switch (operation) {
        case 'addition':
            return { prompt: '7 + 5 = ?', answer: '12', hint: '7 → 8, 9, 10, 11, 12 (count on 5)' }
        case 'subtraction':
            return { prompt: '13 - 4 = ?', answer: '9', hint: '13 → 12, 11, 10, 9 (count back 4)' }
        case 'multiplication':
            return { prompt: '4 × 6 = ?', answer: '24', hint: '4 groups of 6: 6+6+6+6 = 24' }
        case 'division':
            return { prompt: '24 ÷ 6 = ?', answer: '4', hint: '24 ÷ 6: how many 6s? 6,12,18,24 → 4' }
        case 'remainders':
            return { prompt: '14 ÷ 4 = ?', answer: '3 r 2', hint: '4×3=12, 14−12=2, so 3 remainder 2' }
    }
}

export function nextQuestion(
    previous: GameState,
    effectiveLevel?: Level,
    weakness?: Record<string, number>,
    srData?: Record<string, { interval: number; due: number }>,
    currentQ?: number,
): Pick<GameState, 'currentQuestion' | 'options' | 'correctIndex' | 'operation'> {
    // Weighted operation selection combining weakness and spaced-repetition due status
    let pool = previous.operationPool
    if (pool.length > 1) {
        const qNum = currentQ ?? 0
        const weights = pool.map(op => {
            const weaknessBoost = weakness ? (weakness[op] ?? 0) * 2 : 0
            const srEntry = srData?.[op]
            // SR boost: overdue operations get 4× weight; due this question = 3×
            const srBoost = srEntry
                ? (qNum >= srEntry.due ? (qNum - srEntry.due + 1) * 2 : 0)
                : 0
            return 1 + weaknessBoost + srBoost
        })
        const totalWeight = weights.reduce((s, w) => s + w, 0)
        let rand = Math.random() * totalWeight
        const pickedIdx = weights.findIndex(w => { rand -= w; return rand <= 0 })
        pool = [pool[pickedIdx >= 0 ? pickedIdx : 0]]
    }

    const nextState = createRound(
        previous.language,
        pool,
        effectiveLevel ?? previous.level,
        previous.difficulty,
    )

    return {
        operation: nextState.operation,
        currentQuestion: nextState.currentQuestion,
        options: nextState.options,
        correctIndex: nextState.correctIndex,
    }
}
