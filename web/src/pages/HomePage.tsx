import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import Navigation from '../components/Navigation'
import { avatars } from '../constants'
import { translations } from '../translations'

export default function HomePage() {
    const navigate = useNavigate()
    const storedPlayer = store.getPlayer()
    const t = translations[store.getSettings().language]
    const [playerName, setPlayerName] = useState(storedPlayer?.playerName ?? '')
    const [selectedAvatar, setSelectedAvatar] = useState(storedPlayer?.avatarId ?? avatars[0])
    const [message, setMessage] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (playerName.trim().length < 2) {
            setMessage(t.homeNameError)
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
            setMessage(t.homeProfileSaved)
            setTimeout(() => navigate('/game'), 800)
        } catch (err) {
            setMessage(t.homeProfileError)
        }
    }

    return (
        <div className="page">
            <Navigation />
            <main className="container">
                <section className="hero">
                    <div className="hero-content">
                        <h1 className="neon-text">⚡ MATH INVADERS ⚡</h1>
                        <p className="subtitle">{t.homeSubtitle}</p>
                        <p className="tagline">
                            {t.homeTagline}
                        </p>
                    </div>
                </section>

                <section className="card profile-card">
                    <h2 className="neon-subtitle">{t.homeProfile}</h2>
                    <p>{t.homeProfileHint}</p>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="nickname">{t.homeNameLabel}</label>
                            <input
                                id="nickname"
                                type="text"
                                placeholder={t.homeNamePlaceholder}
                                maxLength={24}
                                minLength={2}
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t.homeAvatarLabel}</label>
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
                            {storedPlayer ? t.homeBtnSave : t.homeBtnPlay}
                        </button>
                    </form>

                    {message && <p className={`message ${message.includes('❌') ? 'error' : 'success'}`}>{message}</p>}

                    {storedPlayer && (
                        <p className="status">
                            {t.homePlayingAs} <strong>{storedPlayer.playerName}</strong>
                        </p>
                    )}
                </section>

                <section className="card">
                    <h2 className="neon-subtitle">{t.homeHowToPlay}</h2>
                    <ol className="instructions">
                        {t.homeInstructions.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                </section>

                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => navigate('/game')}>
                        🚀 {t.homeBtnPlay}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/hall-of-fame')}>
                        🏆 {t.navHallOfFame}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/settings')}>
                        ⚙️ {t.navSettings}
                    </button>
                </div>


            </main>
        </div>
    )
}
