# Security Policy

## Supported Versions

Currently only the latest version on the `main` branch is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |

## Data Privacy & Architecture

Math Invaders is built as a static application with a focus on privacy by design:
- **No Backend Server:** The architecture has no API, no database server, and no cloud-stored user data.
- **Client-Side Storage:** All user profiles, game statistics, and configurations are stored purely locally in the user's browser via `localStorage`.
- **Zero Tracking:** No analytics tools, cookies, or external trackers are embedded.
- **No Private Data Exchange:** The game does not transmit personal data, identifiers, or usage logs off the user's device.

## Reporting a Vulnerability

If you believe you have found a security vulnerability in Math Invaders, please report it directly by opening an issue or contacting the maintainer via GitHub.

If the vulnerability is severe (e.g. somehow enabling cross-site scripting (XSS) within the static UI), please email the maintainer privately if contact info is available, or use GitHub's private vulnerability reporting feature if enabled on the repository.

1. **Do not** disclose the vulnerability publicly until it has been addressed.
2. Provide as much information as possible:
   - Steps to reproduce
   - Browser and OS version
   - Potential impact

We will try to review and acknowledge the report within 3-5 business days. Since this is an open-source hobby project, response times may vary, but security is taken seriously.
