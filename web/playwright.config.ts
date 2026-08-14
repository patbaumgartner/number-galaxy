import { defineConfig, devices } from '@playwright/test'
import { BASE_PATH } from './base.ts'

/**
 * End-to-end configuration.
 *
 * The suite runs against the real production bundle (`vite preview`) rather
 * than the dev server, so what CI exercises is what GitHub Pages ships —
 * including the base path the router depends on.
 */
const PORT = 4173
const HOST = '127.0.0.1'
const BASE_URL = `http://${HOST}:${PORT}${BASE_PATH}`

export default defineConfig({
    testDir: './e2e',
    outputDir: './test-results',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    // Spread rather than `: undefined` — an explicit undefined is not the same
    // as an absent key once `exactOptionalPropertyTypes` is on.
    ...(process.env.CI ? { workers: 2 } : {}),
    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    timeout: 60_000,
    expect: { timeout: 10_000 },
    use: {
        baseURL: BASE_URL,
        // The device the whole suite runs on. A first visit with nothing stored
        // opens in the device's own language, so without pinning this the
        // default-language assertions would pass on a Swiss laptop and fail on
        // a runner set to English. Specs that want another language seed it.
        locale: 'de-CH',
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
        // Never reuse a server somebody left running. This suite's whole claim
        // is that it exercises the bundle GitHub Pages will serve, and reuse
        // quietly drops the `npm run build` in front of it: a stale preview on
        // this port makes every spec pass against the previous release. It
        // reads as a green run, which is worse than a red one. With reuse off
        // the port clash is loud, and the answer is to stop the other server.
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
})
