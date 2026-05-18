import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { store } from '../store'
import { translations } from '../translations'

export default function Navigation() {
    const [showAuthor, setShowAuthor] = useState(false)
    const t = translations[store.getSettings().language]

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <NavLink
                    to="/"
                    className="navbar-brand"
                    onClick={(e) => { e.preventDefault(); setShowAuthor(v => !v) }}
                >
                    {showAuthor ? '👾 PATBAUMGARTNER 👾' : '⚡ MATH INVADERS ⚡'}
                </NavLink>
                <div className="nav-links">
                    <NavLink to="/" end className="nav-link">🏠 {t.navHome}</NavLink>
                    <NavLink to="/hall-of-fame" className="nav-link">🏆 {t.navHallOfFame}</NavLink>
                    <NavLink to="/settings" className="nav-link">⚙️ {t.navSettings}</NavLink>
                </div>
            </div>
        </nav>
    )
}
