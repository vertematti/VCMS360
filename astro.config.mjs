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
    optimizeDeps: {
      // O scanner automático de dependências (baseado em Rolldown, no Vite 8)
      // quebra ao tentar analisar os módulos virtuais gerados a partir do
      // frontmatter dos arquivos .astro deste projeto ("Failed to run
      // dependency scan"). Isso não quebra o site (o Vite cai para
      // bundling sob demanda), mas gera esse erro no console e deixa o
      // primeiro carregamento de cada página um pouco mais lento.
      // Desativando a varredura automática e listando manualmente as
      // dependências npm usadas no server (cheerio), evitamos que o
      // scanner rode e o erro desaparece.
      noDiscovery: true,
      include: ['cheerio'],
    },
    server: {
      watch: {
        // Ignorar arquivos de dados gravados em runtime pela API.
        // Sem isso, salvar uma página dispara HMR/reload do Vite,
        // causando a "piscada" e perda do toast de sucesso.
        ignored: [
          '**/src/data/**',
          '**/public/resources/**',
        ],
      },
    },
  },

  adapter: node({
    mode: 'standalone'
  })
});
