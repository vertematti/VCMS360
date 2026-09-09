// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { broadcast } from '../events';
import { findPagesUsingComponent, syncPagesForComponent, type PageRecord } from '../../../lib/componentSync';

export const prerender = false;

const filePath = () => path.resolve(process.cwd(), 'src/data/components.json');
const pagesPath = () => path.resolve(process.cwd(), 'src/data/pages.json');

async function readComponents(): Promise<Record<string, any>> {
  try {
    return JSON.parse(await fs.readFile(filePath(), 'utf-8'));
  } catch {
    return {};
  }
}

async function readPages(): Promise<Record<string, PageRecord>> {
  try {
    return JSON.parse(await fs.readFile(pagesPath(), 'utf-8'));
  } catch {
    return {};
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, html, js, jquery, css, projectData, confirmed } = body;

    if (!name || typeof name !== 'string') {
      return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
    }

    const pages = await readPages();
    const usingPages = findPagesUsingComponent(pages, name);

    // Se o componente já está em uso em alguma página e o front-end ainda
    // não confirmou a sincronização, devolvemos a lista de páginas afetadas
    // SEM gravar nada — o editor mostra a janela de confirmação e só reenvia
    // esta mesma chamada com `confirmed: true` se o usuário aceitar.
    if (usingPages.length > 0 && !confirmed) {
      return new Response(
        JSON.stringify({
          requiresConfirmation: true,
          affectedPages: usingPages.map((p) => p.slug),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const components = await readComponents();
    const oldCss = components[name]?.css || '';

    components[name] = {
      name,
      html: html || '',
      js: js || '',
      jquery: jquery || '',
      css: css || '',
      projectData: projectData || {},
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath(), JSON.stringify(components, null, 2), 'utf-8');

    // Sincroniza de verdade o HTML e o CSS gravados de cada página afetada
    // (troca o miolo do wrapper [data-component-id] e substitui o bloco de
    // CSS do componente, sem duplicar — ver src/lib/componentSync.ts).
    const affectedPages = syncPagesForComponent(
      pages,
      name,
      oldCss,
      components[name].html,
      components[name].css
    );

    if (affectedPages.length > 0) {
      await fs.writeFile(pagesPath(), JSON.stringify(pages, null, 2), 'utf-8');
    }

    // Broadcast real-time update to all connected editors (mantém os
    // canvases abertos em sincronia imediata, além do que já foi gravado).
    broadcast('component:updated', {
      name,
      html: components[name].html,
      js: components[name].js || '',
      jquery: components[name].jquery || '',
      css: components[name].css,
      affectedPages,
    });

    return new Response(JSON.stringify({ success: true, affectedPages }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Component save error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
