// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;
const cwd = process.cwd();

async function readJsonSafe(p: string): Promise<Record<string, any>> {
  try { return JSON.parse(await fs.readFile(p, 'utf-8')); } catch { return {}; }
}
// Lista uploads RECURSIVAMENTE, devolvendo caminhos relativos (posix) para
// preservar a estrutura de subpastas dentro do ZIP de backup.
async function listUploads(rel = ''): Promise<string[]> {
  const dir = path.join(cwd, 'public/resources', rel);
  let entries: import('node:fs').Dirent[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
  const out: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await listUploads(childRel));
    else if (e.isFile()) out.push(childRel);
  }
  return out;
}

function u8(s: string) { return new TextEncoder().encode(s); }
function le16(n: number) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; }
function le32(n: number) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; }
function crc32(data: Uint8Array): number {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[i] = c; }
  let crc = 0xFFFFFFFF;
  for (const b of data) crc = (crc >>> 8) ^ t[(crc ^ b) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function concat(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((s, a) => s + a.length, 0));
  let off = 0; for (const a of arrays) { out.set(a, off); off += a.length; } return out;
}
interface ZipEntry { name: string; data: Uint8Array; offset: number; crc: number; }
function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const entries: ZipEntry[] = []; const locals: Uint8Array[] = []; let offset = 0;
  for (const { name, data } of files) {
    const nb = u8(name); const crc = crc32(data);
    const local = concat(new Uint8Array([0x50,0x4B,0x03,0x04]),le16(20),le16(0),le16(0),le16(0),le16(0),le32(crc),le32(data.length),le32(data.length),le16(nb.length),le16(0),nb,data);
    entries.push({ name, data, offset, crc }); locals.push(local); offset += local.length;
  }
  const cd = concat(...entries.map(e => { const nb = u8(e.name); return concat(new Uint8Array([0x50,0x4B,0x01,0x02]),le16(20),le16(20),le16(0),le16(0),le16(0),le16(0),le32(e.crc),le32(e.data.length),le32(e.data.length),le16(nb.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(e.offset),nb); }));
  return concat(...locals, cd, concat(new Uint8Array([0x50,0x4B,0x05,0x06]),le16(0),le16(0),le16(entries.length),le16(entries.length),le32(cd.length),le32(offset),le16(0)));
}

// ── GET /api/export?pages=a,b&components=c,d&filename=myfile ───────────────
export const GET: APIRoute = async ({ url }) => {
  try {
    const params = url.searchParams;
    const selectedPages = params.get('pages')?.split(',').filter(Boolean) ?? null;
    const selectedComps = params.get('components')?.split(',').filter(Boolean) ?? null;
    const filename = (params.get('filename') || `visualcms360-export-${new Date().toISOString().slice(0,10)}`).replace(/[^a-zA-Z0-9_\-]/g, '_');

    const files: { name: string; data: Uint8Array }[] = [];

    // pages.json — filtrado
    const allPages = await readJsonSafe(path.join(cwd, 'src/data/pages.json'));
    const exportPages = selectedPages ? Object.fromEntries(Object.entries(allPages).filter(([k]) => selectedPages.includes(k))) : allPages;
    if (Object.keys(exportPages).length > 0)
      files.push({ name: 'data/pages.json', data: u8(JSON.stringify(exportPages, null, 2)) });

    // components.json — filtrado
    const allComps = await readJsonSafe(path.join(cwd, 'src/data/components.json'));
    const exportComps = selectedComps ? Object.fromEntries(Object.entries(allComps).filter(([k]) => selectedComps.includes(k))) : allComps;
    if (Object.keys(exportComps).length > 0)
      files.push({ name: 'data/components.json', data: u8(JSON.stringify(exportComps, null, 2)) });

    // uploads (recursivo, preservando subpastas)
    for (const rel of await listUploads()) {
      const buf = await fs.readFile(path.join(cwd, 'public/resources', rel));
      files.push({ name: `resources/${rel}`, data: new Uint8Array(buf) });
    }

    if (files.length === 0)
      return new Response(JSON.stringify({ error: 'Nenhum dado para exportar' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const zip = buildZip(files);
    return new Response(zip, { status: 200, headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}.zip"`,
      'Content-Length': String(zip.length),
    }});
  } catch (err) {
    console.error('Export error:', err);
    return new Response(JSON.stringify({ error: 'Erro ao gerar exportação' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// ── POST /api/export/list — retorna páginas e componentes disponíveis ──────
// (reutilizamos GET com ?list=1 para evitar criar novo arquivo)
export const POST: APIRoute = async () => {
  try {
    const allPages = await readJsonSafe(path.join(cwd, 'src/data/pages.json'));
    const allComps = await readJsonSafe(path.join(cwd, 'src/data/components.json'));
    return new Response(JSON.stringify({
      pages: Object.keys(allPages),
      components: Object.keys(allComps),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
