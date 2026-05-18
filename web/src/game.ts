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
  const left = randomInt(2, maxValue)
  const right = randomInt(2, maxValue)
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
  const left = randomInt(2, Math.max(3, Math.floor(maxValue / 2)))
  const right = randomInt(2, Math.max(3, Math.floor(maxValue / 2)))
  return {
    prompt: `${left} × ${right} = ?`,
    answerValue: left * right,
  }
}

function createDivisionQuestion(maxValue: number): NumericQuestion {
  const divisor = randomInt(2, Math.max(3, Math.floor(maxValue / 3)))
  const quotient = randomInt(2, Math.max(4, Math.floor(maxValue / 3)))
  const dividend = divisor * quotient
  return {
    prompt: `${dividend} ÷ ${divisor} = ?`,
    answerValue: quotient,
  }
}

function createRemainderQuestion(language: Language, maxValue: number) {
  const divisor = randomInt(2, Math.max(3, Math.floor(maxValue / 3)))
  const quotient = randomInt(2, Math.max(4, Math.floor(maxValue / 4)))
  const remainder = randomInt(1, divisor - 1)
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
    const remainder = randomInt(0, 4)
    choices.add(remainderLabel(language, quotient, remainder))
  }
  return Array.from(choices).sort(() => Math.random() - 0.5)
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

export function nextQuestion(previous: GameState): Pick<GameState, 'currentQuestion' | 'options' | 'correctIndex' | 'operation'> {
  const nextState = createRound(
    previous.language,
    previous.operationPool,
    previous.level,
    previous.difficulty,
  )

  return {
    operation: nextState.operation,
    currentQuestion: nextState.currentQuestion,
    options: nextState.options,
    correctIndex: nextState.correctIndex,
  }
}
