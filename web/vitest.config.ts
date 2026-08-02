import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Two projects, split by file extension so the rule is easy to remember:
 *
 * - `*.test.ts`  → `node`  — pure domain and storage logic, no DOM, fastest.
 * - `*.test.tsx` → `jsdom` — anything that renders React.
 *
 * The domain suites stub `globalThis.window` themselves, which a shared jsdom
 * environment would fight over, so keeping them in `node` is deliberate.
 */
export default defineConfig({
    plugins: [react()],
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'domain',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                },
            },
            {
                extends: true,
                test: {
                    name: 'ui',
                    environment: 'jsdom',
                    include: ['src/**/*.test.tsx'],
                    setupFiles: ['./src/test/setup.ts'],
                    restoreMocks: true,
                    // Page suites drive whole missions through userEvent; under
                    // parallel load they legitimately outlast the 5s default.
                    testTimeout: 20_000,
                },
            },
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/test/**',
                'src/main.tsx',
                'src/vite-env.d.ts',
            ],
            thresholds: {
                statements: 95,
                branches: 92,
                functions: 95,
                lines: 97,
            },
        },
    },
})
