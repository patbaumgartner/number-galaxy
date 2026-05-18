export type Language = 'de' | 'it' | 'en' | 'fr'
export type Operation =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'remainders'
export type Level = 'starter' | 'advanced' | 'challenge'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type GameStatus = 'ready' | 'playing' | 'won' | 'lost'

export type Question = {
  prompt: string
  answer: string
}

export type GameState = {
  language: Language
  operation: Operation
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

const levelOffset: Record<Level, number> = {
  starter: 0,
  advanced: 6,
  challenge: 14,
}

const difficultyMultiplier: Record<Difficulty, number> = {
  easy: 1,
  normal: 1.6,
  hard: 2.4,
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
  const choices = new Set<number>([answerValue])
  while (choices.size < 4) {
    const drift = randomInt(-8, 8) || 1
    choices.add(Math.max(0, answerValue + drift))
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

export function createRound(language: Language, operation: Operation, level: Level, difficulty: Difficulty): GameState {
  const maxValue = Math.max(
    10,
    Math.floor((12 + levelOffset[level]) * difficultyMultiplier[difficulty]),
  )

  if (operation === 'remainders') {
    const question = createRemainderQuestion(language, maxValue)
    const options = buildRemainderOptions(language, question.answer, maxValue)
    return {
      language,
      operation,
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

export function nextQuestion(previous: GameState): Pick<GameState, 'currentQuestion' | 'options' | 'correctIndex'> {
  const nextState = createRound(
    previous.language,
    previous.operation,
    previous.level,
    previous.difficulty,
  )

  return {
    currentQuestion: nextState.currentQuestion,
    options: nextState.options,
    correctIndex: nextState.correctIndex,
  }
}
