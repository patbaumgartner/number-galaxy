type LogoProps = {
    readonly className?: string
}

/**
 * The Number Galaxy mark, drawn inline.
 *
 * It is the same geometry as `favicon.svg` without that file's background
 * plate, so the tab and the homepage carry one identity. Inline rather than an
 * `<img>` because an offline-first app should not spend a request on its own
 * logo, and because the cut-out plus then shows the real page behind it — grid
 * and all — instead of a swatch guessing at the background colour.
 */
export default function Logo({ className }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            aria-hidden="true"
            focusable="false"
            className={className}
        >
            <defs>
                <mask id="ng-logo-plus">
                    <rect width="64" height="64" fill="#fff" />
                    <path d="M28 21h8v7h7v8h-7v7h-8v-7h-7v-8h7z" />
                </mask>
            </defs>

            {/* Ring and planet are masked together: masking the planet alone
                would punch a hole the ring behind it shows straight through. */}
            <g mask="url(#ng-logo-plus)">
                <ellipse
                    cx="32"
                    cy="32"
                    rx="27"
                    ry="9.5"
                    transform="rotate(-20 32 32)"
                    fill="none"
                    stroke="#ffcf00"
                    strokeWidth="4.5"
                />
                <circle cx="32" cy="32" r="18" fill="#00f5ff" />
            </g>
        </svg>
    )
}
