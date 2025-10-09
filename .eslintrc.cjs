module.exports = {
  extends: ['plugin:astro/recommended', 'eslint:recommended', 'standard'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro']
      },
      rules: {
        'semi': ['error', 'never'],
        'quotes': ['error', 'single'],
        'indent': ['error', 2],
        'no-unused-vars': 'warn',
        'no-multiple-empty-lines': ['error', { max: 1 }],
        'comma-dangle': ['error', 'never'],
        'space-before-function-paren': ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'eol-last': ['error', 'always'],
        'no-trailing-spaces': 'error'
      }
    }
  ]
}
