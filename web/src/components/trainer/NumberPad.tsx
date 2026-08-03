import { useEffect } from 'react'
import { store } from '../../store'
import { translations } from '../../i18n'

type NumberPadProps = {
    readonly value: string
    readonly onChange: (value: string) => void
    readonly onSubmit: () => void
    readonly disabled?: boolean
}

export function NumberPad({ value, onChange, onSubmit, disabled }: NumberPadProps) {
    const t = translations[store.getSettings().language]

    useEffect(() => {
        if (disabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault()
                if (value.length < 3) {
                    onChange(value + e.key)
                }
            } else if (e.key === 'Backspace') {
                e.preventDefault()
                onChange(value.slice(0, -1))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (value !== '') {
                    onSubmit()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [value, onChange, onSubmit, disabled])

    const handleDigit = (digit: string) => {
        if (disabled) return
        if (value.length < 3) {
            onChange(value + digit)
        }
    }

    const handleBackspace = () => {
        if (disabled) return
        onChange(value.slice(0, -1))
    }

    const handleSubmit = () => {
        if (disabled) return
        if (value !== '') {
            onSubmit()
        }
    }

    return (
        <div className="numpad">
            <div className="numpad-display" aria-live="polite">
                {value}
            </div>
            <div className="numpad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                        key={digit}
                        className="numpad-btn"
                        onClick={() => handleDigit(digit.toString())}
                        disabled={disabled}
                    >
                        {digit}
                    </button>
                ))}
                <button
                    className="numpad-btn numpad-btn-action"
                    onClick={handleBackspace}
                    disabled={disabled}
                    aria-label={t.tt.padDelete}
                >
                    ⌫
                </button>
                <button
                    className="numpad-btn"
                    onClick={() => handleDigit('0')}
                    disabled={disabled}
                >
                    0
                </button>
                <button
                    className="numpad-btn numpad-btn-action"
                    onClick={handleSubmit}
                    disabled={disabled || value === ''}
                    aria-label={t.tt.padSubmit}
                >
                    ✓
                </button>
            </div>
        </div>
    )
}
