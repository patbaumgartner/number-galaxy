import js from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [
            ['@babel/preset-typescript', { ignoreExtensions: true }],
            '@babel/preset-react',
          ],
        },
      },
      globals: globals.browser,
    },
  },
  {
    // Test code is never hot-reloaded, so the Fast Refresh export rule has
    // nothing to protect here — it would only forbid sharing test helpers.
    files: [
      '**/*.test.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
      'e2e/**/*.ts',
      '*.config.{ts,js}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
])
