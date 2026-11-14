import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // Classic hook rules only; the React Compiler rules in the plugin's recommended set flag the load-in-effect pattern used across the app
      'react-hooks/rules-of-hooks': 'error',
      // Empty catch is used on purpose for best-effort calls (localStorage, unread counts)
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react-hooks/exhaustive-deps': 'warn',
      // Capitalized names: JSX component usage (e.g. { icon: Icon }) is not tracked without eslint-plugin-react
      'no-unused-vars': ['error', { argsIgnorePattern: '^(_|[A-Z])', varsIgnorePattern: '^[A-Z]' }],
    },
  },
];
