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
                        <p className="subtitle">Shoot the right answer and get better at math every day!</p>
                        <p className="tagline">
                            No login needed • Always free • Works offline
                        </p>
                    </div>
                </section>

                <section className="card profile-card">
                    <h2 className="neon-subtitle">👤 Who Are You?</h2>
                    <p>Pick a name and an avatar — your scores will be saved!</p>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="nickname">Your Name</label>
                            <input
                                id="nickname"
                                type="text"
                                placeholder="Type your name here"
                                maxLength={24}
                                minLength={2}
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Choose Your Avatar</label>
                            <div className="avatar-grid">
                                {avatars.map((avatar) => (
                                    <button
                                        key={avatar}
                                        type="button"
                                        className={`avatar-btn ${selectedAvatar === avatar ? 'active' : ''}`}
                                        onClick={() => setSelectedAvatar(avatar)}
                                        title={avatar}
                                    >
                                        <span className="avatar-emoji">{avatar}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={playerName.trim().length < 2}
                        >
                            {storedPlayer ? '💾 Save Changes' : '✨ Let\'s Play!'}
                        </button>
                    </form>

                    {message && <p className={`message ${message.includes('❌') ? 'error' : 'success'}`}>{message}</p>}

                    {storedPlayer && (
                        <p className="status">
                            Playing as: <strong>{storedPlayer.playerName}</strong>
                        </p>
                    )}
                </section>

                <section className="card">
                    <h2 className="neon-subtitle">🎮 How to Play</h2>
                    <ol className="instructions">
                        <li>Go to Settings and pick what math you want to practise</li>
                        <li>Enter your name and pick an avatar</li>
                        <li>Press ▶️ Start and answer 20 questions!</li>
                        <li>Steer your rocket with ⬅️ ➡️ arrow keys</li>
                        <li>Press Space or tap 🎯 Shoot to fire at the right answer</li>
                        <li>Get answers right in a row for bonus points! 🔥</li>
                    </ol>
                </section>

                <section className="card actions">
                    <button className="btn btn-primary" onClick={() => navigate('/game')}>
                        🚀 Play Now!
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
