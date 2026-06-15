// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const filePath = () => path.resolve(process.cwd(), 'src/data/site.json');

const DEFAULT_SITE = {
  siteName: 'Visual CMS 360°',
  baseUrl: '',
  defaultTitle: 'Visual CMS 360°',
  titleTemplate: '%s',
  defaultDescription: '',
  defaultOgImage: '',
  lang: 'pt-BR',
  author: '',
  twitterHandle: '',
  robotsDefault: 'index,follow',
  organization: { name: '', logo: '', sameAs: [] as string[] },
};

async function readSite(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(filePath(), 'utf-8');
    return { ...DEFAULT_SITE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SITE };
  }
}

export const GET: APIRoute = async () => {
  const site = await readSite();
  return new Response(JSON.stringify(site), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const current = await readSite();

    // Merge raso + organização aninhada
    const merged = {
      ...current,
      ...data,
      organization: { ...current.organization, ...(data.organization || {}) },
    };

    await fs.writeFile(filePath(), JSON.stringify(merged, null, 2), 'utf-8');

    return new Response(JSON.stringify({ success: true, site: merged }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving site config:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
