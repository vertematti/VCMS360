// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Lista os assets de public/resources de forma RECURSIVA (suporta subpastas).
// Cada item retorna { src, name, folder } — folder é o caminho relativo da
// subpasta ('' = raiz). Inclui imagens E vídeos.

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const VALID = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.bmp',
  '.mp4', '.webm', '.ogg', '.mov',
  '.pdf', '.zip', '.doc', '.docx',
];

// Varredura recursiva de um diretório, devolvendo caminhos relativos à base.
async function walk(baseDir: string, rel = ''): Promise<{ src: string; name: string; folder: string }[]> {
  const abs = path.join(baseDir, rel);
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: { src: string; name: string; folder: string }[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // ignora .gitkeep etc.
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const sub = await walk(baseDir, childRel);
      out.push(...sub);
    } else if (VALID.includes(path.extname(entry.name).toLowerCase())) {
      const folder = rel; // '' na raiz
      out.push({
        src: `/resources/${childRel}`,
        name: entry.name,
        folder,
      });
    }
  }
  return out;
}

export const GET: APIRoute = async () => {
  try {
    const uploadDir = path.resolve(process.cwd(), 'public/resources');
    const assets = await walk(uploadDir);
    return new Response(JSON.stringify(assets), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error loading assets:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
