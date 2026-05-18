'use client'

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import styles from './MathInvadersGame.module.css'
import {
  createRound,
  nextQuestion,
  type Difficulty,
  type GameState,
  type Language,
  type Level,
  type Operation,
} from '@/lib/game'

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

// ── generated avatar definitions ────────────────────────────────────────────
type AvatarDef = {
  id: string
  emoji: string
  label: string
  neonColor: string
}

const AVATARS: AvatarDef[] = [
  { id: 'Avatar 01', emoji: '🦊', label: 'Comet Fox',     neonColor: '#FF6B35' },
  { id: 'Avatar 02', emoji: '🐼', label: 'Nebula Panda',  neonColor: '#C8FF5A' },
  { id: 'Avatar 03', emoji: '🦁', label: 'Solar Lion',    neonColor: '#FFD700' },
  { id: 'Avatar 04', emoji: '🐯', label: 'Tiger Spark',   neonColor: '#FF9500' },
  { id: 'Avatar 05', emoji: '🐨', label: 'Cosmo Koala',   neonColor: '#00CFFF' },
  { id: 'Avatar 06', emoji: '🦄', label: 'Star Unicorn',  neonColor: '#FF3DFF' },
  { id: 'Avatar 07', emoji: '🐬', label: 'Orbit Dolphin', neonColor: '#00FFC6' },
  { id: 'Avatar 08', emoji: '🐢', label: 'Rocket Turtle', neonColor: '#39FF14' },
  { id: 'Avatar 09', emoji: '🐙', label: 'Astro Octopus', neonColor: '#FF2079' },
  { id: 'Avatar 10', emoji: '🐸', label: 'Moon Frog',     neonColor: '#A3FF00' },
  { id: 'Avatar 11', emoji: '🐻', label: 'Galaxy Bear',   neonColor: '#BF5FFF' },
  { id: 'Avatar 12', emoji: '🐰', label: 'Meteor Bunny',  neonColor: '#FF6FF0' },
]

const AVATAR_LOOKUP = new Map(AVATARS.map((a) => [a.id, a]))
const DEFAULT_AVATAR = AVATARS[0]

function getAvatar(id: string): AvatarDef {
  return AVATAR_LOOKUP.get(id) ?? DEFAULT_AVATAR
}

/** Inline SVG-circle avatar — fully generated from the avatar definition. */
function AvatarCircle({
  avatar,
  size = 62,
}: {
  avatar: AvatarDef
  size?: number
}) {
  const fs = Math.round(size * 0.56)
  const style: CSSProperties = {
    ['--avatar-neon' as string]: avatar.neonColor,
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${fs}px`,
  }
  return (
    <div className={styles.avatarCircle} style={style}>
      {avatar.emoji}
    </div>
  )
}

// ── static data ──────────────────────────────────────────────────────────────
const PLAYER_STORAGE_KEY = 'math-invaders-player'
const TOTAL_QUESTIONS_PER_RUN = 10

const stars = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  style: {
    left: `${(i * 19 + 3) % 100}%`,
    top: `${(i * 11) % 80}%`,
    animationDelay: `${(i % 10) * 0.6}s`,
    animationDuration: `${8 + (i % 6)}s`,
    width: i % 3 === 0 ? '4px' : '2px',
    height: i % 3 === 0 ? '4px' : '2px',
  },
}))

// ── i18n text ────────────────────────────────────────────────────────────────
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
    freePromise: string
  }
> = {
  de: {
    subtitle: 'Buntes Mathe-Abenteuer im All mit speicherbarem Lernstand und kindgerechtem Design.',
    privacy: 'Kein Tracking, keine Werbung, keine Paywalls und keine E-Mail-Pflicht.',
    registration: 'Spielprofil',
    registrationHint: 'Wähle Spitznamen und Crew-Avatar, um Fortschritt und Ruhmeshalle zu speichern.',
    saveProfile: 'Profil speichern',
    operations: 'Rechenart',
    level: 'Level',
    difficulty: 'Schwierigkeit',
    gameplay: 'Mission',
    hallOfFame: 'Ruhmeshalle',
    freePromise: 'Vollständig frei, freundlich und ohne Dark Patterns.',
  },
  it: {
    subtitle: 'Avventura matematica nello spazio con progressi salvati e design allegro per bambini.',
    privacy: 'Nessun tracciamento, nessuna pubblicità, nessun paywall e nessuna email obbligatoria.',
    registration: 'Profilo giocatore',
    registrationHint: 'Scegli soprannome e avatar della squadra per salvare progressi e Hall of Fame.',
    saveProfile: 'Salva profilo',
    operations: 'Operazione',
    level: 'Livello',
    difficulty: 'Difficoltà',
    gameplay: 'Missione',
    hallOfFame: 'Hall of Fame',
    freePromise: 'Completamente libero, amichevole e senza dark pattern.',
  },
  en: {
    subtitle: 'A neon math adventure with saved progress, bright space visuals, and child-friendly play.',
    privacy: 'No tracking, no ads, no paywalls, and no email required.',
    registration: 'Player profile',
    registrationHint: 'Choose a nickname and crew avatar to save progress and Hall of Fame scores.',
    saveProfile: 'Save profile',
    operations: 'Operation',
    level: 'Level',
    difficulty: 'Difficulty',
    gameplay: 'Mission',
    hallOfFame: 'Hall of Fame',
    freePromise: 'Fully free, friendly, and designed without dark patterns.',
  },
  fr: {
    subtitle: 'Une aventure mathématique lumineuse avec progression sauvegardée et univers spatial pour enfants.',
    privacy: 'Aucun suivi, aucune publicité, aucun paywall et aucun email obligatoire.',
    registration: 'Profil joueur',
    registrationHint: "Choisis un pseudo et un avatar d'équipage pour sauvegarder progrès et Hall of Fame.",
    saveProfile: 'Enregistrer le profil',
    operations: 'Opération',
    level: 'Niveau',
    difficulty: 'Difficulté',
    gameplay: 'Mission',
    hallOfFame: 'Hall of Fame',
    freePromise: 'Entièrement libre, accueillant et sans dark patterns.',
  },
}

const operationLabels: Record<Operation, string> = {
  addition: '➕ Addition',
  subtraction: '➖ Subtraction',
  multiplication: '✖️ Multiplication',
  division: '➗ Division',
  remainders: '🔢 Division + remainders',
}

const levelLabels: Record<Level, string> = {
  starter: '🌱 Starter (8–10)',
  advanced: '🚀 Advanced (8–10)',
  challenge: '⚡ Challenge (10+)',
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: '😊 Easy',
  normal: '🎯 Normal',
  hard: '🔥 Hard',
}

const defaultGameState = createRound('en', 'addition', 'starter', 'easy')

// ── helpers ──────────────────────────────────────────────────────────────────
function parseStoredPlayer(): Player | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Player
  } catch {
    return null
  }
}

// ── component ────────────────────────────────────────────────────────────────
export default function MathInvadersGame() {
  const [storedPlayer] = useState<Player | null>(() => parseStoredPlayer())
  const [language, setLanguage] = useState<Language>('en')
  const [operation, setOperation] = useState<Operation>('addition')
  const [level, setLevel] = useState<Level>('starter')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [playerName, setPlayerName] = useState(storedPlayer?.playerName ?? '')
  const [selectedAvatar, setSelectedAvatar] = useState(storedPlayer?.avatarId ?? AVATARS[0].id)
  const [player, setPlayer] = useState<Player | null>(storedPlayer)
  const [gameState, setGameState] = useState<GameState>(defaultGameState)
  const [selectedLane, setSelectedLane] = useState(0)
  const [blastLane, setBlastLane] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('🎯 Pick a glowing lane and blast the correct answer!')
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([])
  const [profileMessage, setProfileMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const isSubmittingScoreRef = useRef(false)
  const text = useMemo(() => uiText[language], [language])
  const activeAvatar = getAvatar(selectedAvatar)
  const playerAvatar = player ? getAvatar(player.avatarId) : null

  // ── API helpers ──────────────────────────────────────────────────────────
  const fetchHallOfFame = useCallback(async (lang: Language) => {
    const res = await fetch(`/api/hall-of-fame?language=${lang}`)
    const payload = (await res.json()) as { entries: HallOfFameEntry[] }
    setHallOfFame(payload.entries)
  }, [])

  const saveGameState = useCallback(
    async (nextState: GameState, nextPlayer?: Player | null) => {
      const p = nextPlayer ?? player
      if (!p) return
      await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: p.id, ...nextState }),
      })
    },
    [player],
  )

  const submitScore = useCallback(
    async (finishedState: GameState, activePlayer: Player | null) => {
      if (!activePlayer || isSubmittingScoreRef.current) return
      isSubmittingScoreRef.current = true
      try {
        const res = await fetch('/api/hall-of-fame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: activePlayer.id,
            score: finishedState.score,
            answeredCount: finishedState.answeredCount,
            language: finishedState.language,
            operation: finishedState.operation,
            difficulty: finishedState.difficulty,
          }),
        })
        const payload = (await res.json()) as { improved: boolean; entries: HallOfFameEntry[] }
        setHallOfFame(payload.entries)
        setFeedback(
          payload.improved
            ? '🏆 New record! Your score was saved to the Hall of Fame!'
            : '🎉 Mission complete! Your previous high score is still king.',
        )
      } finally {
        isSubmittingScoreRef.current = false
      }
    },
    [],
  )

  // ── effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    fetch(`/api/hall-of-fame?language=${language}`)
      .then(async (r) => {
        const p = (await r.json()) as { entries: HallOfFameEntry[] }
        if (active) setHallOfFame(p.entries)
      })
      .catch(() => {
        if (active) setFeedback('⚠️ Backend unavailable — practice still works locally.')
      })
    return () => { active = false }
  }, [language])

  useEffect(() => {
    if (!storedPlayer) return
    fetch(`/api/game-state?playerId=${storedPlayer.id}`)
      .then(async (r) => {
        const p = (await r.json()) as { gameState: GameState | null }
        if (!p.gameState) return
        const s = p.gameState
        setLanguage(s.language)
        setOperation(s.operation)
        setLevel(s.level)
        setDifficulty(s.difficulty)
        setGameState(s)
        setFeedback('💾 Saved mission loaded from the database!')
      })
      .catch(() => setFeedback('⚠️ Could not load saved progress.'))
  }, [storedPlayer])

  // arrow-key navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setSelectedLane((c) => (c + 3) % 4)
      if (e.key === 'ArrowRight') setSelectedLane((c) => (c + 1) % 4)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const applySettings = useCallback(
    (lang: Language, op: Operation, lv: Level, diff: Difficulty) => {
      const next = createRound(lang, op, lv, diff)
      setLanguage(lang); setOperation(op); setLevel(lv); setDifficulty(diff)
      setGameState(next); setSelectedLane(0); setBlastLane(null)
      setFeedback('🚀 New mission queued — launch when ready!')
      saveGameState(next).catch(() => undefined)
    },
    [saveGameState],
  )

  const startRun = useCallback(() => {
    const next = { ...gameState, status: 'playing' as const }
    setGameState(next)
    setFeedback('🎮 Use ← → to steer, then press Shoot or Space bar!')
    saveGameState(next).catch(() => undefined)
  }, [gameState, saveGameState])

  const resetRun = useCallback(() => {
    const next = createRound(language, operation, level, difficulty)
    setGameState(next); setSelectedLane(0); setBlastLane(null)
    setFeedback('✨ Fresh mission ready — let\'s light up the galaxy!')
    saveGameState(next).catch(() => undefined)
  }, [difficulty, language, level, operation, saveGameState])

  const handleShoot = useCallback(() => {
    if (gameState.status !== 'playing') return

    setBlastLane(selectedLane)
    window.setTimeout(() => setBlastLane(null), 240)

    const isCorrect = selectedLane === gameState.correctIndex
    const answeredCount = gameState.answeredCount + 1
    const nextLives = isCorrect ? gameState.lives : gameState.lives - 1
    const sessionEnded = answeredCount >= TOTAL_QUESTIONS_PER_RUN || nextLives <= 0
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
        ? `🎯 Direct hit! ${nextState.streak > 1 ? `Streak x${nextState.streak}! 🔥` : 'Amazing!'}`
        : `💥 Almost! The answer was ${gameState.currentQuestion.answer}.`,
    )

    saveGameState(nextState)
      .then(() => { if (sessionEnded) return submitScore(nextState, player) })
      .catch(() => setFeedback('⚠️ Mission continues locally — backend unreachable.'))
  }, [gameState, player, saveGameState, selectedLane, submitScore])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); handleShoot() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleShoot])

  const handleProfileSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setIsSavingProfile(true); setProfileMessage('')
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: player?.id, playerName, avatarId: selectedAvatar }),
        })
        if (!res.ok) {
          const p = (await res.json()) as { error: string }
          setProfileMessage(p.error); return
        }
        const p = (await res.json()) as { player: Player }
        setPlayer(p.player)
        window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(p.player))
        setProfileMessage('✅ Profile saved! Progress will now sync to the database.')
        await saveGameState(gameState, p.player)
        await fetchHallOfFame(language)
      } finally {
        setIsSavingProfile(false)
      }
    },
    [fetchHallOfFame, gameState, language, player?.id, playerName, saveGameState, selectedAvatar],
  )

  const currentProgress = Math.min(100, (gameState.answeredCount / TOTAL_QUESTIONS_PER_RUN) * 100)

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <main className={styles.shell}>
      {/* starfield */}
      <div className={styles.starfield} aria-hidden="true">
        {stars.map((s) => (
          <span key={s.id} className={styles.star} style={s.style} />
        ))}
      </div>

      {/* ── hero ── */}
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>🛸 Single container · Next.js · SQLite</span>
          <h1>Math Invaders</h1>
          <p className={styles.heroLead}>{text.subtitle}</p>
          <p className={styles.heroSubtle}>{text.privacy}</p>
          <p className={styles.freePromise}>{text.freePromise}</p>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.languageSelector} role="group" aria-label="language">
            {(['de', 'it', 'en', 'fr'] as Language[]).map((lang) => (
              <button
                key={lang}
                className={language === lang ? styles.languageChipActive : styles.languageChip}
                onClick={() => applySettings(lang, operation, level, difficulty)}
                type="button"
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <div className={styles.heroMascot}>
            <span className={styles.heroMascotGlow} />
            <div className={styles.heroMascotAvatar}>
              <AvatarCircle avatar={activeAvatar} size={90} />
            </div>
            <span className={styles.heroMascotName}>{activeAvatar.label}</span>
          </div>
        </div>
      </section>

      {/* ── profile + settings ── */}
      <section className={styles.topGrid}>
        {/* profile */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>��‍🚀 Crew profile</p>
              <h2>{text.registration}</h2>
            </div>
            {playerAvatar ? (
              <div className={styles.playerBadge}>
                <AvatarCircle avatar={playerAvatar} size={28} />
                <span>{player?.playerName}</span>
              </div>
            ) : null}
          </div>
          <p className={styles.panelText}>{text.registrationHint}</p>
          <form className={styles.profileForm} onSubmit={handleProfileSubmit}>
            <label className={styles.formField}>
              <span>Nickname</span>
              <input
                type="text"
                placeholder="Ada"
                aria-label="Player name"
                maxLength={24}
                minLength={2}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </label>
            <div className={styles.formField}>
              <span>Avatar</span>
              <div className={styles.avatarGrid}>
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    aria-pressed={selectedAvatar === av.id}
                    className={selectedAvatar === av.id ? styles.avatarActive : styles.avatar}
                    style={{ ['--avatar-neon' as string]: av.neonColor } as CSSProperties}
                    onClick={() => setSelectedAvatar(av.id)}
                  >
                    <AvatarCircle avatar={av} size={56} />
                    <span className={styles.avatarLabel}>{av.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSavingProfile || playerName.trim().length < 2}
            >
              {isSavingProfile ? '⏳ Saving…' : text.saveProfile}
            </button>
          </form>
          <p className={styles.panelText}>
            {player ? `Current pilot: ${player.playerName}` : 'No profile yet — anonymous mission.'}
          </p>
          {profileMessage ? <p className={styles.panelText}>{profileMessage}</p> : null}
        </article>

        {/* settings */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>⚙️ Launch settings</p>
              <h2>Learning setup</h2>
            </div>
          </div>

          <div className={styles.settingsGrid}>
            <label className={styles.formField}>
              <span>{text.operations}</span>
              <select value={operation} onChange={(e) => applySettings(language, e.target.value as Operation, level, difficulty)}>
                {Object.entries(operationLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className={styles.formField}>
              <span>{text.level}</span>
              <select value={level} onChange={(e) => applySettings(language, operation, e.target.value as Level, difficulty)}>
                {Object.entries(levelLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className={styles.formField}>
              <span>{text.difficulty}</span>
              <select value={difficulty} onChange={(e) => applySettings(language, operation, level, e.target.value as Difficulty)}>
                {Object.entries(difficultyLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.manualCard}>
            <p className={styles.eyebrow}>📋 Quick guide</p>
            <ol>
              <li>Choose your operation, level, and difficulty.</li>
              <li>Pick a nickname and avatar to save progress.</li>
              <li>Press <strong>Start mission</strong> or just jump straight in.</li>
              <li>Steer the 🚀 rocket to the correct answer lane.</li>
              <li>Press <strong>Shoot</strong> or <strong>Space</strong> to fire.</li>
              <li>Answer 10 questions to complete a mission.</li>
            </ol>
          </div>
        </article>
      </section>

      {/* ── game ── */}
      <section className={styles.panel}>
        <div className={styles.missionHeader}>
          <div>
            <p className={styles.eyebrow}>🎮 Active mission</p>
            <h2>{text.gameplay}</h2>
            <p className={styles.panelText}>Fast, clear, and focused — 10 questions per run.</p>
          </div>
          <div className={styles.scoreboard}>
            <div className={styles.scoreCard}>
              <span>Score</span>
              <strong>{gameState.score}</strong>
            </div>
            <div className={styles.scoreCard}>
              <span>Lives</span>
              <strong>{'❤️'.repeat(Math.max(0, gameState.lives))}</strong>
            </div>
            <div className={styles.scoreCard}>
              <span>Streak</span>
              <strong>{gameState.streak > 0 ? `${gameState.streak} 🔥` : gameState.streak}</strong>
            </div>
          </div>
        </div>

        <div className={styles.progressRow} aria-label="mission progress">
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${currentProgress}%` }} />
          </div>
          <span className={styles.progressLabel}>
            {gameState.answeredCount}/{TOTAL_QUESTIONS_PER_RUN}
          </span>
        </div>

        <div className={styles.questionCard}>
          <p className={styles.eyebrow}>🧮 Math mission</p>
          <h3>{gameState.currentQuestion.prompt}</h3>
          <p>Pick the glowing lane with the correct answer, then fire!</p>
        </div>

        <div className={styles.battlefield} role="application" aria-label="math invaders battlefield">
          <div className={styles.laneGlow} />
          <div className={styles.invaders}>
            {gameState.options.map((option, index) => (
              <button
                key={`${option}-${index}`}
                type="button"
                className={[
                  styles.invader,
                  selectedLane === index ? styles.invaderSelected : '',
                  blastLane === index ? styles.invaderBlast : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedLane(index)}
              >
                <span className={styles.invaderEmoji}>👾</span>
                <span className={styles.invaderValue}>{option}</span>
              </button>
            ))}
          </div>
          <div className={styles.shipRow}>
            <div className={styles.shipTrack}>
              <div className={styles.ship} style={{ transform: `translateX(${selectedLane * 100}%)` }}>
                🚀
              </div>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <button className={styles.secondaryButton} type="button" onClick={() => setSelectedLane((c) => (c + 3) % 4)}>
            ← Left
          </button>
          <button className={styles.primaryButton} type="button" onClick={startRun} disabled={gameState.status === 'playing'}>
            {gameState.status === 'ready' ? '▶ Start mission' : '▶ Resume'}
          </button>
          <button className={styles.primaryButton} type="button" onClick={handleShoot} disabled={gameState.status !== 'playing'}>
            🔫 Shoot
          </button>
          <button className={styles.secondaryButton} type="button" onClick={() => setSelectedLane((c) => (c + 1) % 4)}>
            Right →
          </button>
          <button className={styles.secondaryButton} type="button" onClick={resetRun}>
            🔄 New mission
          </button>
        </div>

        <p className={styles.feedback} aria-live="polite">
          {gameState.status === 'won'
            ? '🏆 Mission complete! All 10 answers solved!'
            : gameState.status === 'lost'
              ? '💀 Mission over! Recharge and try another round!'
              : feedback}
        </p>
      </section>

      {/* ── hall of fame + value ── */}
      <section className={styles.bottomGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>🏆 Top pilots</p>
              <h2>{text.hallOfFame}</h2>
            </div>
          </div>
          <p className={styles.panelText}>Top saved scores for the selected language.</p>
          <div className={styles.tableWrap}>
            <table className={styles.scoreTable}>
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
                    <td colSpan={4}>No saved scores yet — be the first!</td>
                  </tr>
                ) : (
                  hallOfFame.map((entry) => {
                    const av = getAvatar(entry.avatarId)
                    return (
                      <tr key={entry.playerId}>
                        <td>{entry.player}</td>
                        <td>
                          <span
                            className={styles.hallAvatar}
                            style={{ ['--avatar-neon' as string]: av.neonColor } as CSSProperties}
                          >
                            <AvatarCircle avatar={av} size={28} />
                            <span>{av.label}</span>
                          </span>
                        </td>
                        <td><strong>{entry.score}</strong></td>
                        <td>{entry.answeredCount}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>🎓 Why it works</p>
              <h2>Pedagogical value</h2>
            </div>
          </div>
          <ul className={styles.valueList}>
            <li>🧠 Short 10-question missions keep brains focused without endless loops.</li>
            <li>🛡️ No ads, no tracking, no forced email — 100 % child-safe.</li>
            <li>⚡ Immediate neon feedback rewards correct answers without manipulation.</li>
            <li>🎹 Keyboard controls make play fast, fun, and accessible.</li>
            <li>🌍 Four languages so children worldwide can practice in their mother tongue.</li>
            <li>🏆 Hall of Fame builds healthy motivation without dark-pattern streaks.</li>
          </ul>
        </article>
      </section>
    </main>
  )
}
