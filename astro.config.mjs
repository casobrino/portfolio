import { defineConfig } from 'astro/config';
import { adminApiPlugin } from './src/plugins/admin-api.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [adminApiPlugin()],
  },
});
