import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export const prerender = false;

const cwd = process.cwd();

async function readFileSafe(p: string): Promise<string> {
  try { return await fs.readFile(p, 'utf-8'); } catch { return ''; }
}

async function listUploads(): Promise<string[]> {
  try {
    const dir = path.join(cwd, 'public/uploads');
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isFile()).map(e => e.name);
  } catch { return []; }
}

/** Minimal ZIP builder (stored, no compression) — no external deps */
function u8(s: string) { return new TextEncoder().encode(s); }
function le16(n: number) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; }
function le32(n: number) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; }

function crc32(data: Uint8Array): number {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xFFFFFFFF;
  for (const b of data) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

interface ZipEntry { name: string; data: Uint8Array; offset: number; crc: number; }

function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const entries: ZipEntry[] = [];
  const locals: Uint8Array[] = [];
  let offset = 0;

  for (const { name, data } of files) {
    const nameBytes = u8(name);
    const crc = crc32(data);
    const local = concat(
      new Uint8Array([0x50,0x4B,0x03,0x04]), // sig
      le16(20), le16(0), le16(0),            // version, flags, compression
      le16(0), le16(0),                       // mod time, mod date
      le32(crc), le32(data.length), le32(data.length),
      le16(nameBytes.length), le16(0),        // name len, extra len
      nameBytes, data
    );
    entries.push({ name, data, offset, crc });
    locals.push(local);
    offset += local.length;
  }

  const centralDir: Uint8Array[] = [];
  for (const e of entries) {
    const nameBytes = u8(e.name);
    centralDir.push(concat(
      new Uint8Array([0x50,0x4B,0x01,0x02]), // sig
      le16(20), le16(20), le16(0), le16(0),  // versions, flags, compression
      le16(0), le16(0),                       // mod time, date
      le32(e.crc), le32(e.data.length), le32(e.data.length),
      le16(nameBytes.length), le16(0), le16(0), le16(0), le16(0), le32(0),
      le32(e.offset), nameBytes
    ));
  }
  const cd = concat(...centralDir);
  const cdOffset = offset;
  const cdSize = cd.length;
  const eocd = concat(
    new Uint8Array([0x50,0x4B,0x05,0x06]),
    le16(0), le16(0),
    le16(entries.length), le16(entries.length),
    le32(cdSize), le32(cdOffset),
    le16(0)
  );
  return concat(...locals, cd, eocd);
}

export const GET: APIRoute = async () => {
  try {
    const files: { name: string; data: Uint8Array }[] = [];

    // ── 1. pages.json ──────────────────────────────────────────────────
    const pagesRaw = await readFileSafe(path.join(cwd, 'src/data/pages.json'));
    if (pagesRaw) files.push({ name: 'data/pages.json', data: u8(pagesRaw) });

    // ── 2. components.json ─────────────────────────────────────────────
    const compRaw = await readFileSafe(path.join(cwd, 'src/data/components.json'));
    if (compRaw) files.push({ name: 'data/components.json', data: u8(compRaw) });

    // ── 3. uploads (imagens, vídeos, etc.) ────────────────────────────
    const uploads = await listUploads();
    for (const fname of uploads) {
      const buf = await fs.readFile(path.join(cwd, 'public/uploads', fname));
      files.push({ name: `uploads/${fname}`, data: new Uint8Array(buf) });
    }

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum dado para exportar' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    const zip = buildZip(files);
    const date = new Date().toISOString().slice(0,10);

    return new Response(zip, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="visualcms360-export-${date}.zip"`,
        'Content-Length': String(zip.length),
      }
    });
  } catch (err) {
    console.error('Export error:', err);
    return new Response(JSON.stringify({ error: 'Erro ao gerar exportação' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
