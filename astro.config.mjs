// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'es2020',   // permite async/await, for-of, spread, matchAll
    },
  },

  adapter: node({
    mode: 'standalone'
  })
});
