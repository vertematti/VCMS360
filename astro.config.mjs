// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // Renomeia o diretório de assets compilados de "_astro" para "assets",
  // para não expor qual ferramenta gerou o build no site estático publicado.
  build: {
    assets: 'assets',
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'es2020',   // permite async/await, for-of, spread, matchAll
    },
    server: {
      watch: {
        // Ignorar arquivos de dados gravados em runtime pela API.
        // Sem isso, salvar uma página dispara HMR/reload do Vite,
        // causando a "piscada" e perda do toast de sucesso.
        ignored: [
          '**/src/data/**',
          '**/public/uploads/**',
        ],
      },
    },
  },

  adapter: node({
    mode: 'standalone'
  })
});
