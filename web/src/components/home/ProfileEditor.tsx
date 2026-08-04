import type { Translations } from '../../i18n'
import { useModalDialog } from '../../hooks'
import { avatars } from '../../constants'

type ProfileEditorProps = {
    readonly labels: Translations['home']
    readonly title: string
    readonly name: string
    readonly avatar: string
    readonly onName: (name: string) => void
    readonly onAvatar: (avatar: string) => void
    readonly onSave: () => void
    readonly onCancel: () => void
}

/** Naming a child and picking their rocket — used for both adding and renaming. */
export default function ProfileEditor({
    labels,
    title,
    name,
    avatar,
    onName,
    onAvatar,
    onSave,
    onCancel,
}: ProfileEditorProps) {
    const dialog = useModalDialog<HTMLDivElement>(onCancel)

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title" ref={dialog}>
            <div className="overlay__card">
                <h2 className="overlay__title" id="profile-title">{title}</h2>

                <label className="field">
                    <span className="field__label">{labels.nameLabel}</span>
                    <input
                        className="field__input"
                        type="text"
                        autoComplete="off"
                        maxLength={20}
                        placeholder={labels.namePlaceholder}
                        value={name}
                        onChange={event => onName(event.target.value)}
                        autoFocus
                    />
                </label>

                <fieldset className="field">
                    <legend className="field__label">{labels.avatarLabel}</legend>
                    <div className="avatars">
                        {avatars.map(option => (
                            <button
                                key={option}
                                type="button"
                                className={`avatar${avatar === option ? ' avatar--active' : ''}`}
                                aria-pressed={avatar === option}
                                aria-label={option}
                                onClick={() => onAvatar(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <div className="overlay__actions">
                    <button type="button" className="btn btn--primary" onClick={onSave}>
                        {labels.save}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onCancel}>
                        {labels.cancel}
                    </button>
                </div>
            </div>
        </div>
    )
}
