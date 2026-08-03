import { Component, type ErrorInfo, type ReactNode } from 'react'
import { store } from '../store'
import { translations } from '../i18n'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/** Last line of defence: a render error must degrade to a message, not a blank page. */
export default class ErrorBoundary extends Component<Props, State> {
    override state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('Number Galaxy crashed:', error, info.componentStack)
    }

    override render(): ReactNode {
        if (!this.state.hasError) return this.props.children

        let t = translations.en.error
        try {
            t = translations[store.getSettings().language].error
        } catch {
            /* settings unreadable — the English copy still gets the message across */
        }

        return (
            <div className="page">
                <main className="shell">
                    <section className="panel" role="alert">
                        <h1 className="shell__title">{t.title}</h1>
                        <p className="panel__hint">{t.body}</p>
                        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
                            {t.reload}
                        </button>
                    </section>
                </main>
            </div>
        )
    }
}
