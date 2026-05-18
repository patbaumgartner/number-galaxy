import type { Language } from '../game'

interface LanguageSwitcherProps {
    language: Language
    onChangeLanguage: (lang: Language) => void
}

export default function LanguageSwitcher({ language, onChangeLanguage }: LanguageSwitcherProps) {
    const languages: Language[] = ['de', 'it', 'en', 'fr']

    return (
        <div className="language-switcher">
            {languages.map((lang) => (
                <button
                    key={lang}
                    className={`lang-btn ${language === lang ? 'active' : ''}`}
                    onClick={() => onChangeLanguage(lang)}
                    title={lang.toUpperCase()}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>
    )
}
