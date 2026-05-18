import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import Navigation from '../components/Navigation'

export default function SettingsPage() {
    const navigate = useNavigate()
    const player = store.getPlayer()

    const handleClearData = () => {
        if (confirm('⚠️ This will delete ALL your saved progress. Are you sure?')) {
            store.clearAllData()
            alert('✨ All data cleared!')
            navigate('/')
        }
    }

    return (
        <div className="page">
            <Navigation />

            <main className="container">
                <section className="hero">
                    <h1 className="neon-text">⚙️ SETTINGS ⚙️</h1>
                </section>

                <section className="card">
                    <h2 className="neon-subtitle">👤 Player Information</h2>
                    {player ? (
                        <div className="player-info">
                            <p><strong>Name:</strong> {player.playerName}</p>
                            <p><strong>Avatar:</strong> {player.avatarId}</p>
                            <p><strong>Created:</strong> {new Date(player.createdAt).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <p>No player profile. Create one on the home page!</p>
                    )}
                </section>

                <section className="card">
                    <h2 className="neon-subtitle">💾 Data Management</h2>
                    <p>Your game data is saved locally in your browser. No data is sent to any server.</p>
                    <div className="info-box">
                        <p>✨ Everything is stored privately on your device</p>
                        <p>📱 Works offline once loaded</p>
                        <p>🔒 No tracking, no analytics, no ads</p>
                    </div>
                </section>

                <section className="card">
                    <h2 className="neon-subtitle">🔧 Storage</h2>
                    <p>Click below to clear all your game data and start fresh.</p>
                    <button className="btn btn-danger" onClick={handleClearData}>
                        🗑️ Clear All Data
                    </button>
                </section>

                <section className="card">
                    <h2 className="neon-subtitle">ℹ️ About</h2>
                    <ul className="info-list">
                        <li>✅ Free and open source</li>
                        <li>✅ No email required</li>
                        <li>✅ Multiple languages (DE, IT, EN, FR)</li>
                        <li>✅ 5 operations, 3 levels, 3 difficulties</li>
                        <li>✅ 24 awesome avatars</li>
                        <li>✅ Works on desktop and mobile</li>
                    </ul>
                </section>

                <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                        🏠 Home
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/game')}>
                        🎮 Play Game
                    </button>
                </div>
            </main>
        </div>
    )
}
