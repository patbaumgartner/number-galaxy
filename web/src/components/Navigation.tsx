import { NavLink } from 'react-router'
import { store } from '../store'
import { translations } from '../translations'

export default function Navigation() {
    const t = translations[store.getSettings().language]

    return (
        <nav className="trainer-nav" aria-label="Primary navigation">
            <NavLink to="/" end className="trainer-nav__brand">MATH INVADERS</NavLink>
            <div className="trainer-nav__links">
                <NavLink to="/" end className="trainer-nav__link">{t.nav.home}</NavLink>
                <NavLink to="/times-tables" className="trainer-nav__link">✖️ <span>{t.tt.title}</span></NavLink>
                <NavLink to="/hall-of-fame" className="trainer-nav__link">{t.nav.hallOfFame}</NavLink>
                <NavLink to="/settings" className="trainer-nav__link">{t.nav.settings}</NavLink>
            </div>
        </nav>
    )
}
