import { Link } from 'react-router-dom'

export default function Navigation() {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    ⚡ MATH INVADERS ⚡
                </Link>
                <div className="nav-links">
                    <Link to="/" className="nav-link">🏠 Home</Link>
                    <Link to="/game" className="nav-link">🎮 Game</Link>
                    <Link to="/hall-of-fame" className="nav-link">🏆 Hall of Fame</Link>
                    <Link to="/settings" className="nav-link">⚙️ Settings</Link>
                </div>
            </div>
        </nav>
    )
}
