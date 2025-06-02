import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat()
export default [
  ...compat.extends('@react-native'),
  {
    rules: {
      '@typescript-eslint/func-call-spacing': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      curly: 'off',
      eqeqeq: 0,
      'no-console': 'warn',
      'no-extra-semi': 0,
      'prefer-const': 'off',
      'prettier/prettier': 'off',
      quotes: ['off', 'single', { allowTemplateLiterals: true }],
      'react-hooks/exhaustive-deps': 0,
      'react-native/no-inline-styles': 0,
      semi: 0,
    },
  },
]
