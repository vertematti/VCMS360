// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { broadcast } from '../events';

export const prerender = false;

const filePath = () => path.resolve(process.cwd(), 'src/data/components.json');

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
    }

    let components: Record<string, any> = {};
    try {
      components = JSON.parse(await fs.readFile(filePath(), 'utf-8'));
    } catch {}

    delete components[name];
    await fs.writeFile(filePath(), JSON.stringify(components, null, 2), 'utf-8');

    // Broadcast deletion so editors remove the block from their panel
    broadcast('component:deleted', { name });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Component delete error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
