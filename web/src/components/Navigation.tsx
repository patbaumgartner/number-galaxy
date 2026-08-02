import { NavLink } from 'react-router'
import { store } from '../store'
import { translations } from '../translations'

/**
 * Top bar for the Times Tables Galaxy only.
 *
 * It deliberately omits the Hall of Fame: that leaderboard belongs to the
 * Math Invaders arcade game and has nothing to show a child practising times
 * tables. Keeping the two games' navigation apart is the point.
 */
export default function Navigation() {
    const t = translations[store.getSettings().language]

    return (
        <nav className="trainer-nav" aria-label={t.tt.title}>
            <NavLink to="/" end className="trainer-nav__brand">{t.nav.home}</NavLink>
            <div className="trainer-nav__links">
                <NavLink to="/times-tables" className="trainer-nav__link">{t.tt.title}</NavLink>
                <NavLink to="/settings" className="trainer-nav__link">{t.nav.settings}</NavLink>
            </div>
        </nav>
    )
}
