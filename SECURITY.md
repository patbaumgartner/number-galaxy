# Security Policy

## Supported Versions

Currently only the latest version on the `main` branch is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |

## Data Privacy & Architecture

Number Galaxy is built as a static application with a focus on privacy by design:
- **No Backend Server:** The architecture has no API, no database server, and no cloud-stored user data.
- **Client-Side Storage:** All user profiles, game statistics, and configurations are stored purely locally in the user's browser via `localStorage`.
- **Zero Tracking:** No analytics tools, cookies, or external trackers are embedded.
- **No Private Data Exchange:** The game does not transmit personal data, identifiers, or usage logs off the user's device.

## Reporting a Vulnerability

**[Report it privately here.](https://github.com/patbaumgartner/number-galaxy/security/advisories/new)**
GitHub's private vulnerability reporting is enabled on this repository, so the report
stays between you and the maintainer until there is a fix to disclose alongside it.

Please do not open a public issue for a vulnerability. Everything else — bugs, wrong
answers, broken layouts — belongs in the [issue tracker](https://github.com/patbaumgartner/number-galaxy/issues),
and is more useful there.

Include what you would want if you were fixing it:

- Steps to reproduce, ideally from a clean profile
- Browser and operating system version
- What an attacker gets out of it

You will get an acknowledgement within about five days. This is a hobby project run by
one person, so a fix may take longer than that — you will be told either way, and
credited in the advisory unless you would rather not be.

### What counts

The app is a static bundle with no server, so the interesting surface is small and
mostly one of these:

- Script execution in the page — anything that gets attacker-controlled markup or code
  past React's escaping, including through a profile name, a URL parameter or stored data.
- A way to make the service worker serve, cache or keep content it should not.
- A supply-chain problem in a dependency that actually reaches the browser bundle.
- Anything that sends a user's data off the device, which nothing is supposed to do.

Findings that need an already-compromised device or a browser the vendor no longer
supports are out of scope: on a static site with no backend, both mean the attacker was
already past the app.
