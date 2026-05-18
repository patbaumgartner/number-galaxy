# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-17

### Added
- Complete rewrite to a static architecture using React 19 and React Router 7.
- Full neon aesthetic theme (cyan/magenta/yellow on black).
- In-browser `localStorage` database (zero tracking, privacy-first).
- GitHub Pages automatic deployment pipeline using OIDC authorization.
- Comprehensive English, German, French, and Italian translations.
- Per-language localized Hall of Fame system.
- 24 selectable emoji avatars for user profiles.
- 5 Math Operations: Addition, Subtraction, Multiplication, Division, and Division with Remainders.
- 3 Difficulties (Easy, Normal, Hard) and 3 Number Ranges (Starter, Advanced, Challenge).
- Health system (3 lives) and streak bonus mechanism.
- Comprehensive documentation: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.
- Github Issue and PR templates for open-source participation.

### Removed
- Legacy Next.js backend API and SQLite database.
- Docker and Nginx containerization setup (no longer needed for static hosting).

### Fixed
- CI pipeline fixed to use Node.js 22 required for Vite 8.
- OIDC permissions for GitHub Actions to deploy to GitHub Pages without branch switching.
