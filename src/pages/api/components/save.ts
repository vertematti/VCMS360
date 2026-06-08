// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { broadcast } from '../events';

export const prerender = false;

const filePath = () => path.resolve(process.cwd(), 'src/data/components.json');

async function readComponents(): Promise<Record<string, any>> {
  try {
    return JSON.parse(await fs.readFile(filePath(), 'utf-8'));
  } catch {
    return {};
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, html, js, css, projectData } = body;

    if (!name || typeof name !== 'string') {
      return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
    }

    const components = await readComponents();
    components[name] = { name, html: html || '', js: js || '', css: css || '', projectData: projectData || {}, updatedAt: new Date().toISOString() };

    await fs.writeFile(filePath(), JSON.stringify(components, null, 2), 'utf-8');

    // Broadcast real-time update to all connected editors
    broadcast('component:updated', { name, html: components[name].html, js: components[name].js || '', css: components[name].css });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Component save error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
