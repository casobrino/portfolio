import { defineConfig, globalIgnores } from 'eslint/config'
import eslintPluginAstro from 'eslint-plugin-astro'
import { neostandard, resolveIgnoresFromGitignore } from 'neostandard'

export default defineConfig([
  globalIgnores(resolveIgnoresFromGitignore()),
  ...neostandard({
    ts: true,
    noJsx: true,
    env: ['browser', 'node'],
    files: ['**/*.astro'],
    filesTs: ['**/*.astro']
  }),
  ...eslintPluginAstro.configs.recommended
])
