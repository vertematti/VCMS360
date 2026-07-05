// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Gerência de pastas de mídia sob public/resources.
//   GET  → lista pastas (1 nível) com contagem + contagem da raiz.
//   POST → ações: create | rename | delete | move.
//
// Ao renomear/mover, as referências em src/data/pages.json e components.json
// são reescritas para os novos caminhos (páginas publicadas não quebram).
// Ao excluir, conta quantas imagens estão em uso e exige confirmação.

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const IMG_VID = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.bmp',
  '.mp4', '.webm', '.ogg', '.mov',
];

const DATA_FILES = ['src/data/pages.json', 'src/data/components.json'];

function sanitizeFolder(raw: unknown): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  const clean = s.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_');
  if (!clean || clean === '.' || clean === '..') return '';
  return clean.slice(0, 60);
}

function baseDir() {
  return path.resolve(process.cwd(), 'public/resources');
}

// Garante que um caminho resolvido permanece dentro de public/resources.
function insideBase(p: string): boolean {
  const b = baseDir();
  return p === b || p.startsWith(b + path.sep);
}

async function countAssetsIn(dir: string): Promise<number> {
  let n = 0;
  let entries: import('node:fs').Dirent[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.isFile() && IMG_VID.includes(path.extname(e.name).toLowerCase())) n++;
  }
  return n;
}

// Reescreve todas as ocorrências de `from` → `to` nos arquivos de dados.
async function rewriteRefs(from: string, to: string): Promise<void> {
  const cwd = process.cwd();
  for (const rel of DATA_FILES) {
    const p = path.join(cwd, rel);
    try {
      const txt = await fs.readFile(p, 'utf-8');
      if (txt.includes(from)) {
        await fs.writeFile(p, txt.split(from).join(to), 'utf-8');
      }
    } catch { /* arquivo pode não existir */ }
  }
}

// Conta ocorrências de `needle` nos arquivos de dados.
async function countRefs(needle: string): Promise<number> {
  const cwd = process.cwd();
  let n = 0;
  for (const rel of DATA_FILES) {
    const p = path.join(cwd, rel);
    try {
      const txt = await fs.readFile(p, 'utf-8');
      n += txt.split(needle).length - 1;
    } catch { /* ignore */ }
  }
  return n;
}

// ── GET: listar pastas ──────────────────────────────────────────────────────
export const GET: APIRoute = async () => {
  try {
    const b = baseDir();
    let entries: import('node:fs').Dirent[] = [];
    try { entries = await fs.readdir(b, { withFileTypes: true }); } catch { entries = []; }

    const folders: { name: string; count: number }[] = [];
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.')) {
        folders.push({ name: e.name, count: await countAssetsIn(path.join(b, e.name)) });
      }
    }
    folders.sort((a, z) => a.name.localeCompare(z.name, 'pt-BR'));
    const rootCount = await countAssetsIn(b);

    return new Response(JSON.stringify({ folders, rootCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error listing folders:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};

// ── POST: create | rename | delete | move ───────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '');
    const b = baseDir();

    // ── create ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      const name = sanitizeFolder(body.name);
      if (!name) return json({ error: 'Nome de pasta inválido' }, 400);
      const dir = path.join(b, name);
      if (!insideBase(dir)) return json({ error: 'Caminho inválido' }, 400);
      try { await fs.access(dir); return json({ error: 'Pasta já existe' }, 409); } catch { /* ok */ }
      await fs.mkdir(dir, { recursive: true });
      return json({ ok: true, name });
    }

    // ── rename ──────────────────────────────────────────────────────────────
    if (action === 'rename') {
      const from = sanitizeFolder(body.from);
      const to   = sanitizeFolder(body.to);
      if (!from || !to) return json({ error: 'Nomes inválidos' }, 400);
      if (from === to)  return json({ ok: true, name: to });
      const src = path.join(b, from);
      const dst = path.join(b, to);
      if (!insideBase(src) || !insideBase(dst)) return json({ error: 'Caminho inválido' }, 400);
      try { await fs.access(src); } catch { return json({ error: 'Pasta de origem não existe' }, 404); }
      try { await fs.access(dst); return json({ error: 'Já existe uma pasta com esse nome' }, 409); } catch { /* ok */ }
      await fs.rename(src, dst);
      // Atualiza referências /resources/<from>/ → /resources/<to>/
      await rewriteRefs(`/resources/${from}/`, `/resources/${to}/`);
      return json({ ok: true, name: to });
    }

    // ── delete ──────────────────────────────────────────────────────────────
    if (action === 'delete') {
      const name = sanitizeFolder(body.name);
      if (!name) return json({ error: 'Nome inválido' }, 400);
      const dir = path.join(b, name);
      if (!insideBase(dir) || dir === b) return json({ error: 'Caminho inválido' }, 400);
      try { await fs.access(dir); } catch { return json({ error: 'Pasta não existe' }, 404); }

      const inUse = await countRefs(`/resources/${name}/`);
      const total = await countAssetsIn(dir);
      // Primeira chamada sem confirm → devolve contagens para o aviso
      if (!body.confirm) {
        return json({ needsConfirm: true, inUse, total });
      }
      await fs.rm(dir, { recursive: true, force: true });
      return json({ ok: true, deleted: name, inUse, total });
    }

    // ── move ────────────────────────────────────────────────────────────────
    if (action === 'move') {
      const srcUrl   = String(body.src || '');
      const toFolder = sanitizeFolder(body.toFolder); // '' = raiz
      const m = /^\/resources\/(.+)$/.exec(srcUrl);
      if (!m) return json({ error: 'src inválido' }, 400);
      const relOld = m[1];
      const fileName = path.basename(relOld);
      const oldAbs = path.join(b, relOld);
      if (!insideBase(oldAbs)) return json({ error: 'Caminho inválido' }, 400);
      try { await fs.access(oldAbs); } catch { return json({ error: 'Arquivo não existe' }, 404); }

      const destDir = toFolder ? path.join(b, toFolder) : b;
      if (!insideBase(destDir)) return json({ error: 'Destino inválido' }, 400);
      // Já está na pasta destino?
      if (path.dirname(oldAbs) === destDir) return json({ ok: true, src: srcUrl, unchanged: true });
      try { await fs.access(destDir); } catch { await fs.mkdir(destDir, { recursive: true }); }

      // Evita colisão de nome no destino
      let finalName = fileName;
      let destAbs = path.join(destDir, finalName);
      try {
        await fs.access(destAbs);
        finalName = `${Date.now()}_${fileName}`;
        destAbs = path.join(destDir, finalName);
      } catch { /* nome livre */ }

      await fs.rename(oldAbs, destAbs);
      const newRel = toFolder ? `${toFolder}/${finalName}` : finalName;
      const newUrl = `/resources/${newRel}`;
      await rewriteRefs(srcUrl, newUrl);
      return json({ ok: true, src: newUrl, from: srcUrl });
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (error) {
    console.error('Error in folders action:', error);
    return json({ error: 'Internal Server Error' }, 500);
  }
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
