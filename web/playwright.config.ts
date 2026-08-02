import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end configuration.
 *
 * The suite runs against the real production bundle (`vite preview`) rather
 * than the dev server, so what CI exercises is what GitHub Pages ships —
 * including the `/math-invaders/` base path the router depends on.
 */
const PORT = 4173
const HOST = '127.0.0.1'
const BASE_URL = `http://${HOST}:${PORT}/math-invaders/`

export default defineConfig({
    testDir: './e2e',
    outputDir: './test-results',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    timeout: 60_000,
    expect: { timeout: 10_000 },
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium-desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
        },
        {
            name: 'chromium-mobile',
            use: { ...devices['Pixel 7'] },
        },
    ],
    webServer: {
        // The host is pinned rather than left to default: `vite preview` binds
        // `localhost`, which resolves to ::1 on GitHub's runners while Playwright
        // polls 127.0.0.1, so the server is never seen and the wait times out.
        command: `npm run build && npx vite preview --host ${HOST} --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
})
