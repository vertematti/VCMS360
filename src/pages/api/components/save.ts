// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { broadcast } from '../events';

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

async function readPages(): Promise<Record<string, any>> {
  try {
    return JSON.parse(await fs.readFile(pagesPath(), 'utf-8'));
  } catch {
    return {};
  }
}

// Marca as páginas que usam este componente como "dirty" para re-render.
// Como o [...slug].astro lê componentes a cada request, não precisamos
// reescrever o HTML das páginas — apenas registrar timestamp de sync.
async function touchPagesUsingComponent(componentName: string): Promise<string[]> {
  const pages = await readPages();
  const affected: string[] = [];
  let changed = false;
  for (const [slug, page] of Object.entries(pages)) {
    const html = (page as any).html || '';
    // Detecta uso do componente por data-component-id
    if (html.includes(`data-component-id="${componentName}"`)) {
      affected.push(slug);
      (page as any).componentsSyncedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) {
    await fs.writeFile(pagesPath(), JSON.stringify(pages, null, 2), 'utf-8');
  }
  return affected;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, html, js, jquery, css, projectData } = body;

    if (!name || typeof name !== 'string') {
      return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
    }

    const components = await readComponents();
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

    // Varrer páginas que usam este componente e marcá-las para re-sync
    const affectedPages = await touchPagesUsingComponent(name);

    // Broadcast real-time update to all connected editors
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
