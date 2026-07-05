// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Serve arquivos enviados (public/resources) por uma rota SSR.
//
// Por que isto existe:
//   No `astro dev`, e também no servidor standalone de produção, os arquivos
//   estáticos de public/ são "fotografados" no início. Arquivos GRAVADOS em
//   runtime (upload pela galeria/asset manager, ou restauração via importação)
//   NÃO passam a ser servidos pelo handler estático até reiniciar o servidor —
//   o que causava 404 em /resources/<arquivo> logo após enviar a imagem, mesmo
//   com o arquivo já gravado em disco.
//
//   Esta rota lê o arquivo direto do disco a cada requisição, então imagens
//   recém-enviadas (ou recém-importadas) aparecem IMEDIATAMENTE, sem reiniciar.
//
// Prioridade de rota: "resources/[...path]" é mais específica que o catch-all
// "[...slug]", então não há conflito. Em produção, arquivos já existentes no
// build continuam sendo servidos pelo handler estático; esta rota cobre os
// que foram adicionados depois.

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg':  'image/svg+xml',
  '.bmp':  'image/bmp',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.pdf':  'application/pdf',
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const rel = String(params.path || '').replace(/\\/g, '/');

    // Bloquear path traversal e nomes vazios
    if (!rel || rel.includes('..') || rel.startsWith('/')) {
      return new Response(null, { status: 404 });
    }

    const baseDir = path.resolve(process.cwd(), 'public/resources');
    const filePath = path.resolve(baseDir, rel);

    // Garantir que o caminho resolvido permanece dentro de public/resources
    if (filePath !== baseDir && !filePath.startsWith(baseDir + path.sep)) {
      return new Response(null, { status: 404 });
    }

    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        // no-cache para refletir substituições de imagem na hora durante a edição
        'Cache-Control': 'no-cache, must-revalidate',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
};
