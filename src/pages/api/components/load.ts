import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const filePath = () => path.resolve(process.cwd(), 'src/data/components.json');

async function readComponents(): Promise<Record<string, any>> {
  try {
    return JSON.parse(await fs.readFile(filePath(), 'utf-8'));
  } catch {
    return {};
  }
}

export const GET: APIRoute = async () => {
  const components = await readComponents();
  return new Response(JSON.stringify(components), {
    headers: { 'Content-Type': 'application/json' }
  });
};
