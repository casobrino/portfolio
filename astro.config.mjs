import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { adminApiPlugin } from './src/plugins/admin-api.mjs'
import { dashboardApiPlugin } from './src/plugins/dashboard-api.mjs'

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [adminApiPlugin(), dashboardApiPlugin()],
  },
})
