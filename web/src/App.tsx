import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  createRound,
  nextQuestion,
  type Difficulty,
  type GameState,
  type Language,
  type Level,
  type Operation,
} from './game'

type Player = {
  id: string
  playerName: string
  avatarId: string
}

type HallOfFameEntry = {
  playerId: string
  player: string
  avatarId: string
  score: number
  answeredCount: number
  language: Language
  operation: Operation
  difficulty: Difficulty
  updatedAt: string
}

const avatars = Array.from({ length: 24 }, (_, index) => `Avatar ${String(index + 1).padStart(2, '0')}`)
const PLAYER_STORAGE_KEY = 'math-invaders-player'
const TOTAL_QUESTIONS_PER_RUN = 10

const uiText: Record<
  Language,
  {
    subtitle: string
    privacy: string
    registration: string
    registrationHint: string
    saveProfile: string
    operations: string
    level: string
    difficulty: string
    gameplay: string
    hallOfFame: string
    manual: string
    freePromise: string
  }
> = {
  de: {
    subtitle: 'Kostenloses Mathe-Weltraumspiel mit speicherbaren Lernständen und kindgerechtem Design.',
    privacy: 'Kein Tracking, keine Werbung, keine Bezahlmechaniken und keine Pflicht zur E-Mail.',
    registration: 'Spielprofil',
    registrationHint: 'Lege einen Spitznamen und einen Avatar an, um Lernstand und Ruhmeshalle in der Datenbank zu speichern.',
    saveProfile: 'Profil speichern',
    operations: 'Rechenart',
    level: 'Level',
    difficulty: 'Schwierigkeit',
    gameplay: 'Spiel',
    hallOfFame: 'Ruhmeshalle',
    manual: 'Kurzanleitung',
    freePromise: 'Vollständig frei und ohne Dark Patterns.',
  },
  it: {
    subtitle: 'Gioco spaziale di matematica gratuito con salvataggio dei progressi e design adatto ai bambini.',
    privacy: 'Nessun tracciamento, nessuna pubblicità, nessuna monetizzazione e nessun obbligo di email.',
    registration: 'Profilo giocatore',
    registrationHint: 'Salva soprannome e avatar per memorizzare progressi e Hall of Fame nel database.',
    saveProfile: 'Salva profilo',
    operations: 'Operazione',
    level: 'Livello',
    difficulty: 'Difficoltà',
    gameplay: 'Gioco',
    hallOfFame: 'Hall of Fame',
    manual: 'Guida rapida',
    freePromise: 'Completamente libero e senza dark pattern.',
  },
  en: {
    subtitle: 'Free math space game with saved progress, a real Hall of Fame, and child-friendly design.',
    privacy: 'No tracking, no ads, no paywalls, and no email is required to create a learner profile.',
    registration: 'Player profile',
    registrationHint: 'Save a nickname and avatar to store learning progress and Hall of Fame scores in the database.',
    saveProfile: 'Save profile',
    operations: 'Operation',
    level: 'Level',
    difficulty: 'Difficulty',
    gameplay: 'Game',
    hallOfFame: 'Hall of Fame',
    manual: 'Quick manual',
    freePromise: 'Fully free and designed without dark patterns.',
  },
  fr: {
    subtitle: 'Jeu spatial de maths gratuit avec progression sauvegardée et design adapté aux enfants.',
    privacy: 'Aucun suivi, aucune publicité, aucun paywall et aucune obligation de saisir un email.',
    registration: 'Profil joueur',
    registrationHint: 'Enregistre un pseudo et un avatar pour stocker les progrès et la Hall of Fame dans la base de données.',
    saveProfile: 'Enregistrer le profil',
    operations: 'Opération',
    level: 'Niveau',
    difficulty: 'Difficulté',
    gameplay: 'Jeu',
    hallOfFame: 'Hall of Fame',
    manual: 'Guide rapide',
    freePromise: 'Entièrement libre et sans dark patterns.',
  },
}

const operationLabels: Record<Operation, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
  remainders: 'Division with remainders',
}

const levelLabels: Record<Level, string> = {
  starter: '8-10 starter',
  advanced: '8-10 advanced',
  challenge: '10+ challenge',
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
}

const defaultGameState = createRound('en', 'addition', 'starter', 'easy')

function parseStoredPlayer() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Player
  } catch {
    return null
  }
}

function App() {
  const [storedPlayer] = useState<Player | null>(() => parseStoredPlayer())
  const [language, setLanguage] = useState<Language>('en')
  const [operation, setOperation] = useState<Operation>('addition')
  const [level, setLevel] = useState<Level>('starter')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [playerName, setPlayerName] = useState(storedPlayer?.playerName ?? '')
  const [selectedAvatar, setSelectedAvatar] = useState(storedPlayer?.avatarId ?? avatars[0])
  const [player, setPlayer] = useState<Player | null>(storedPlayer)
  const [gameState, setGameState] = useState<GameState>(defaultGameState)
  const [selectedLane, setSelectedLane] = useState(0)
  const [blastLane, setBlastLane] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('Pick a lane and shoot the correct answer.')
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([])
  const [profileMessage, setProfileMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const text = useMemo(() => uiText[language], [language])

  const fetchHallOfFame = useCallback(async (nextLanguage: Language) => {
    const response = await fetch(`/api/hall-of-fame?language=${nextLanguage}`)
    const payload = (await response.json()) as { entries: HallOfFameEntry[] }
    setHallOfFame(payload.entries)
  }, [])

  const saveGameState = useCallback(
    async (nextState: GameState, nextPlayer?: Player | null) => {
      const activePlayer = nextPlayer ?? player
      if (!activePlayer) {
        return
      }

      await fetch('/api/game-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: activePlayer.id,
          ...nextState,
        }),
      })
    },
    [player],
  )

  const submitScore = useCallback(
    async (finishedState: GameState, activePlayer: Player | null) => {
      if (!activePlayer || isSubmittingScore) {
        return
      }

      setIsSubmittingScore(true)
      try {
        const response = await fetch('/api/hall-of-fame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: activePlayer.id,
            score: finishedState.score,
            answeredCount: finishedState.answeredCount,
            language: finishedState.language,
            operation: finishedState.operation,
            difficulty: finishedState.difficulty,
          }),
        })
        const payload = (await response.json()) as {
          improved: boolean
          entries: HallOfFameEntry[]
        }
        setHallOfFame(payload.entries)
        setFeedback(
          payload.improved
            ? 'Great job. Your best score was saved to the Hall of Fame.'
            : 'Session finished. Your existing Hall of Fame score stays higher.',
        )
      } finally {
        setIsSubmittingScore(false)
      }
    },
    [isSubmittingScore],
  )

  useEffect(() => {
    let isActive = true

    async function loadHallOfFame() {
      try {
        const response = await fetch(`/api/hall-of-fame?language=${language}`)
        const payload = (await response.json()) as { entries: HallOfFameEntry[] }
        if (isActive) {
          setHallOfFame(payload.entries)
        }
      } catch {
        if (isActive) {
          setFeedback('Backend unavailable. The game still works locally, but saving is paused.')
        }
      }
    }

    void loadHallOfFame()

    return () => {
      isActive = false
    }
  }, [language])

  useEffect(() => {
    if (!storedPlayer) {
      return
    }

    fetch(`/api/game-state?playerId=${storedPlayer.id}`)
      .then(async (response) => {
        const payload = (await response.json()) as { gameState: GameState | null }
        if (!payload.gameState) {
          return
        }

        const savedState = payload.gameState
        setLanguage(savedState.language)
        setOperation(savedState.operation)
        setLevel(savedState.level)
        setDifficulty(savedState.difficulty)
        setGameState(savedState)
        setFeedback('Saved progress loaded from the database.')
      })
      .catch(() => {
        setFeedback('Could not load saved progress from the database.')
      })
  }, [storedPlayer])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setSelectedLane((current) => (current + 3) % 4)
      }
      if (event.key === 'ArrowRight') {
        setSelectedLane((current) => (current + 1) % 4)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const applySettings = useCallback(
    (nextLanguage: Language, nextOperation: Operation, nextLevel: Level, nextDifficulty: Difficulty) => {
      const nextState = createRound(nextLanguage, nextOperation, nextLevel, nextDifficulty)
      setLanguage(nextLanguage)
      setOperation(nextOperation)
      setLevel(nextLevel)
      setDifficulty(nextDifficulty)
      setGameState(nextState)
      setSelectedLane(0)
      setBlastLane(null)
      setFeedback('New learning session prepared. Press start when you are ready.')
      saveGameState(nextState).catch(() => undefined)
    },
    [saveGameState],
  )

  const startRun = useCallback(() => {
    const nextState = {
      ...gameState,
      status: 'playing' as const,
    }
    setGameState(nextState)
    setFeedback('Use ← and → to choose a lane, then press Shoot or Space.')
    saveGameState(nextState).catch(() => undefined)
  }, [gameState, saveGameState])

  const resetRun = useCallback(() => {
    const nextState = createRound(language, operation, level, difficulty)
    setGameState(nextState)
    setSelectedLane(0)
    setBlastLane(null)
    setFeedback('Fresh mission ready. Start when you want another practice run.')
    saveGameState(nextState).catch(() => undefined)
  }, [difficulty, language, level, operation, saveGameState])

  const handleShoot = useCallback(() => {
    if (gameState.status !== 'playing') {
      return
    }

    setBlastLane(selectedLane)
    window.setTimeout(() => setBlastLane(null), 240)

    const isCorrect = selectedLane === gameState.correctIndex
    const answeredCount = gameState.answeredCount + 1
    const isFinalQuestion = answeredCount >= TOTAL_QUESTIONS_PER_RUN
    const nextLives = isCorrect ? gameState.lives : gameState.lives - 1
    const sessionEnded = isFinalQuestion || nextLives <= 0
    const nextRound = nextQuestion(gameState)

    const nextState: GameState = {
      ...gameState,
      score: isCorrect ? gameState.score + 10 + gameState.streak * 2 : gameState.score,
      streak: isCorrect ? gameState.streak + 1 : 0,
      lives: nextLives,
      answeredCount,
      currentQuestion: sessionEnded ? gameState.currentQuestion : nextRound.currentQuestion,
      options: sessionEnded ? gameState.options : nextRound.options,
      correctIndex: sessionEnded ? gameState.correctIndex : nextRound.correctIndex,
      status: sessionEnded ? (nextLives > 0 ? 'won' : 'lost') : 'playing',
    }

    setGameState(nextState)
    setFeedback(
      isCorrect
        ? 'Correct shot. Nice mathematical thinking.'
        : `Not this one. The correct answer was ${gameState.currentQuestion.answer}.`,
    )

    saveGameState(nextState)
      .then(() => {
        if (sessionEnded) {
          return submitScore(nextState, player)
        }
        return undefined
      })
      .catch(() => {
        setFeedback('Your local session continues, but the backend could not be updated.')
      })
  }, [gameState, player, saveGameState, selectedLane, submitScore])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        handleShoot()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleShoot])

  const handleProfileSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setIsSavingProfile(true)
      setProfileMessage('')

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: player?.id,
            playerName,
            avatarId: selectedAvatar,
          }),
        })

        if (!response.ok) {
          const payload = (await response.json()) as { error: string }
          setProfileMessage(payload.error)
          return
        }

        const payload = (await response.json()) as { player: Player }
        setPlayer(payload.player)
        window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(payload.player))
        setProfileMessage('Profile saved. Progress will now be written to the database.')
        await saveGameState(gameState, payload.player)
        await fetchHallOfFame(language)
      } finally {
        setIsSavingProfile(false)
      }
    },
    [fetchHallOfFame, gameState, language, player?.id, playerName, saveGameState, selectedAvatar],
  )

  const currentProgress = Math.min(100, (gameState.answeredCount / TOTAL_QUESTIONS_PER_RUN) * 100)

  return (
    <main className="app">
      <header className="panel hero">
        <div>
          <p className="badge">React + Next.js + SQLite</p>
          <h1>Math Invaders</h1>
          <p>{text.subtitle}</p>
          <p className="muted">{text.privacy}</p>
          <p className="promise">{text.freePromise}</p>
        </div>
        <div className="language-selector" role="group" aria-label="language">
          {(['de', 'it', 'en', 'fr'] as Language[]).map((lang) => (
            <button
              key={lang}
              className={language === lang ? 'chip active' : 'chip'}
              onClick={() => applySettings(lang, operation, level, difficulty)}
              type="button"
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className="grid">
        <article className="panel">
          <h2>{text.registration}</h2>
          <p>{text.registrationHint}</p>
          <form onSubmit={handleProfileSubmit}>
            <label>
              Nickname
              <input
                type="text"
                placeholder="Ada"
                aria-label="Player name"
                maxLength={24}
                minLength={2}
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
              />
            </label>
            <div>
              <span className="label-text">Avatar</span>
              <div className="avatars compact">
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={selectedAvatar === avatar ? 'avatar active' : 'avatar'}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isSavingProfile || playerName.trim().length < 2}>
              {isSavingProfile ? 'Saving…' : text.saveProfile}
            </button>
          </form>
          <p className="status-text">{player ? `Current profile: ${player.playerName}` : 'No profile saved yet.'}</p>
          {profileMessage ? <p className="status-text">{profileMessage}</p> : null}
        </article>

        <article className="panel settings-panel">
          <h2>Learning setup</h2>
          <label>
            {text.operations}
            <select
              value={operation}
              onChange={(event) => applySettings(language, event.target.value as Operation, level, difficulty)}
            >
              {Object.entries(operationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.level}
            <select
              value={level}
              onChange={(event) => applySettings(language, operation, event.target.value as Level, difficulty)}
            >
              {Object.entries(levelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.difficulty}
            <select
              value={difficulty}
              onChange={(event) => applySettings(language, operation, level, event.target.value as Difficulty)}
            >
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="manual-card">
            <h3>{text.manual}</h3>
            <ol>
              <li>Choose an operation, level, and difficulty.</li>
              <li>Save a nickname if you want database-backed progress.</li>
              <li>Move the ship to the lane with the correct answer.</li>
              <li>Shoot the answer. Ten questions complete one mission.</li>
            </ol>
          </div>
        </article>
      </section>

      <section className="panel game-panel">
        <div className="section-heading">
          <div>
            <h2>{text.gameplay}</h2>
            <p className="muted">Answer by shooting the correct result. The game is short, clear, and focused on practice.</p>
          </div>
          <div className="scoreboard">
            <span>Score: {gameState.score}</span>
            <span>Lives: {'❤️'.repeat(gameState.lives)}</span>
            <span>Streak: {gameState.streak}</span>
          </div>
        </div>
        <div className="progress-row" aria-label="mission progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${currentProgress}%` }} />
          </div>
          <span>
            {gameState.answeredCount}/{TOTAL_QUESTIONS_PER_RUN} questions
          </span>
        </div>
        <div className="game-area">
          <div className="question-card">
            <p className="eyebrow">Math mission</p>
            <h3>{gameState.currentQuestion.prompt}</h3>
            <p>Pick the lane that shows the correct result, then shoot.</p>
          </div>
          <div className="battlefield" role="application" aria-label="math invaders battlefield">
            <div className="invaders">
              {gameState.options.map((option, index) => (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  className={[
                    'invader',
                    selectedLane === index ? 'selected' : '',
                    blastLane === index ? 'blast' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedLane(index)}
                >
                  <span className="alien">👾</span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
            <div className="ship-row">
              <div className="ship-track">
                <div className="ship" style={{ transform: `translateX(${selectedLane * 100}%)` }}>
                  🚀
                </div>
              </div>
            </div>
          </div>
          <div className="controls">
            <button type="button" onClick={() => setSelectedLane((current) => (current + 3) % 4)}>
              Move left
            </button>
            <button type="button" onClick={startRun} disabled={gameState.status === 'playing'}>
              {gameState.status === 'ready' ? 'Start mission' : 'Resume'}
            </button>
            <button type="button" onClick={handleShoot} disabled={gameState.status !== 'playing'}>
              Shoot
            </button>
            <button type="button" onClick={() => setSelectedLane((current) => (current + 1) % 4)}>
              Move right
            </button>
            <button type="button" onClick={resetRun}>
              New mission
            </button>
          </div>
          <p className="feedback" aria-live="polite">
            {gameState.status === 'won'
              ? 'Mission complete. Ten questions solved.'
              : gameState.status === 'lost'
                ? 'Mission complete. Review and try another round.'
                : feedback}
          </p>
        </div>
      </section>

      <section className="grid bottom-grid">
        <article className="panel hall-panel">
          <h2>{text.hallOfFame}</h2>
          <p className="muted">Top saved scores for the selected language.</p>
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Avatar</th>
                <th>Score</th>
                <th>Questions</th>
              </tr>
            </thead>
            <tbody>
              {hallOfFame.length === 0 ? (
                <tr>
                  <td colSpan={4}>No saved scores yet.</td>
                </tr>
              ) : (
                hallOfFame.map((entry) => (
                  <tr key={entry.playerId}>
                    <td>{entry.player}</td>
                    <td>{entry.avatarId}</td>
                    <td>{entry.score}</td>
                    <td>{entry.answeredCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <h2>Pedagogical value</h2>
          <ul>
            <li>Short 10-question sessions keep focus on learning rather than endless retention loops.</li>
            <li>Operations and difficulty levels map to age-appropriate challenge ranges.</li>
            <li>Progress can be saved without collecting email addresses or personal data.</li>
            <li>The interface is keyboard-friendly, ad-free, and fully free.</li>
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
