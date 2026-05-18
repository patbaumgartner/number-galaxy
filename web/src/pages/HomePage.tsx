import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import Navigation from '../components/Navigation'
import { avatars } from '../constants'

export default function HomePage() {
    const navigate = useNavigate()
    const storedPlayer = store.getPlayer()
    const [playerName, setPlayerName] = useState(storedPlayer?.playerName ?? '')
    const [selectedAvatar, setSelectedAvatar] = useState(storedPlayer?.avatarId ?? avatars[0])
    const [message, setMessage] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (playerName.trim().length < 2) {
            setMessage('Name must be at least 2 characters')
            return
        }

        try {
            if (storedPlayer) {
                store.updatePlayer({
                    ...storedPlayer,
                    playerName: playerName.trim(),
                    avatarId: selectedAvatar,
                })
            } else {
                store.savePlayer(playerName.trim(), selectedAvatar)
            }
            setMessage('✨ Profile saved!')
            setTimeout(() => navigate('/game'), 800)
        } catch (err) {
            setMessage('❌ Error saving profile')
        }
    }

    return (
        <div className="page">
            <Navigation />
            <main className="container">
                <section className="hero">
                    <div className="hero-content">
                        <h1 className="neon-text">⚡ MATH INVADERS ⚡</h1>
                        <p className="subtitle">Free math space game with neon vibes and saved progress</p>
                        <p className="tagline">
                            No tracking • No ads • No emails • 100% free
                        </p>
                    </div>
                </section>

                <section className="card profile-card">
                    <h2 className="neon-subtitle">👤 Player Profile</h2>
                    <p>Set your nickname and avatar to save progress and see yourself in the Hall of Fame</p>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="nickname">Nickname</label>
                            <input
                                id="nickname"
                                type="text"
                                placeholder="Enter your name"
                                maxLength={24}
                                minLength={2}
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Avatar Selection</label>
                            <div className="avatar-grid">
                                {avatars.map((avatar) => (
                                    <button
                                        key={avatar}
                                        type="button"
                                        className={`avatar-btn ${selectedAvatar === avatar ? 'active' : ''}`}
                                        onClick={() => setSelectedAvatar(avatar)}
                                        title={avatar}
                                    >
                                        <span className="avatar-emoji">{avatar.split(' ')[1] || '🚀'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={playerName.trim().length < 2}
                        >
                            {storedPlayer ? '💾 Update Profile' : '✨ Create Profile'}
                        </button>
                    </form>

                    {message && <p className={`message ${message.includes('❌') ? 'error' : 'success'}`}>{message}</p>}

                    {storedPlayer && (
                        <p className="status">
                            Current player: <strong>{storedPlayer.playerName}</strong>
                        </p>
                    )}
                </section>

                <section className="card">
                    <h2 className="neon-subtitle">🎮 How to Play</h2>
                    <ol className="instructions">
                        <li>Choose your math operation and difficulty level</li>
                        <li>Save your profile to track progress</li>
                        <li>Answer 10 math questions to complete a mission</li>
                        <li>Use arrow keys to move your rocket ⬅️ ➡️</li>
                        <li>Press Space or Shoot to blast the correct answer</li>
                        <li>Build streaks for bonus points!</li>
                    </ol>
                </section>

                <section className="card actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/game')}>
                        🚀 Start Playing
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>
                        🏆 Hall of Fame
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/settings')}>
                        ⚙️ Settings
                    </button>
                </section>
            </main>
        </div>
    )
}
