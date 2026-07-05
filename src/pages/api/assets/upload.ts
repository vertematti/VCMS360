// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Recebe uploads e grava em public/resources[/<folder>]. O campo opcional
// "folder" (form field) direciona o arquivo para uma subpasta já existente
// ou nova. Sanitiza nome de pasta e de arquivo; bloqueia path traversal.

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

// Sanitiza um segmento de pasta: só letras/números/-/_; sem '..'; sem barras.
function sanitizeFolder(raw: unknown): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  const clean = s.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_');
  if (!clean || clean === '.' || clean === '..') return '';
  return clean.slice(0, 60);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const folder = sanitizeFolder(formData.get('folder'));

    const files = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'folder') continue;
      if (value && typeof value === 'object' && 'arrayBuffer' in value && 'name' in value) {
        files.push(value as File);
      }
    }

    if (files.length === 0) {
      console.error('No files uploaded. Keys received:', Array.from(formData.keys()));
      return new Response(JSON.stringify({ error: 'No files uploaded' }), { status: 400 });
    }

    const baseDir = path.resolve(process.cwd(), 'public/resources');
    const uploadDir = folder ? path.join(baseDir, folder) : baseDir;

    // Garante que o destino permanece dentro de public/resources
    if (uploadDir !== baseDir && !uploadDir.startsWith(baseDir + path.sep)) {
      return new Response(JSON.stringify({ error: 'Invalid folder' }), { status: 400 });
    }

    try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }

    const data = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const uniqueName = `${Date.now()}_${safeName}`;
      const filePath = path.join(uploadDir, uniqueName);
      const buffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));
      const relPath = folder ? `${folder}/${uniqueName}` : uniqueName;
      data.push({ src: `/resources/${relPath}`, name: safeName, folder });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
