import js from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * House style, enforced rather than described.
 *
 * The project drifted once already: the times-tables module arrived on two-space
 * indentation with semicolons while everything else used four and none, and a
 * few JSX returns grew past a thousand characters on one line. CONTRIBUTING can
 * ask for consistency, but only `npm run lint` can hold it, so the rules below
 * are the single source of truth and `--fix` applies them.
 */
const stylisticRules = {
    '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
    '@stylistic/semi': ['error', 'never'],
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'never' }],
    '@stylistic/jsx-quotes': ['error', 'prefer-double'],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/eol-last': ['error', 'always'],
    '@stylistic/no-trailing-spaces': 'error',
    '@stylistic/object-curly-spacing': ['error', 'always'],
    '@stylistic/max-len': ['error', { code: 140, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true }],
    // Deliberately NOT `jsx-one-expression-per-line`: its fixer splits inline
    // text and expressions onto separate lines and inserts `{' '}`, which
    // changes the rendered text nodes. Enabling it here broke three trainer
    // tests by altering what a child actually sees. Only rules that cannot
    // touch output belong in a formatter.
    '@stylistic/jsx-max-props-per-line': ['error', { maximum: 4, when: 'multiline' }],
    '@stylistic/jsx-closing-bracket-location': ['error', 'tag-aligned'],
    '@stylistic/jsx-wrap-multilines': ['error', {
        declaration: 'parens-new-line',
        assignment: 'parens-new-line',
        return: 'parens-new-line',
        arrow: 'parens-new-line',
    }],
}

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
            js.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        plugins: { '@stylistic': stylistic },
        rules: {
            ...stylisticRules,
            // The two recommended rules a TypeScript file must not be judged by
            // here. ESLint reads this project through Babel, which strips the
            // types without understanding them, so an interface member or a
            // type-only import looks like an undeclared or unused name — 1500
            // false positives and nothing true. `tsc` already answers both
            // questions properly, via `noUnusedLocals` and `noUnusedParameters`.
            'no-undef': 'off',
            'no-unused-vars': 'off',
        },
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
