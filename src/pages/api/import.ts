// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;
const cwd = process.cwd();

function parseZip(buf: Uint8Array): { name: string; data: Uint8Array }[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const results: { name: string; data: Uint8Array }[] = [];
  const dec = new TextDecoder();
  let off = 0;
  while (off + 30 < buf.length) {
    if (view.getUint32(off, true) !== 0x04034B50) break;
    const compMethod = view.getUint16(off + 8,  true);
    const compSize   = view.getUint32(off + 18, true);
    const nameLen    = view.getUint16(off + 26, true);
    const extraLen   = view.getUint16(off + 28, true);
    const name       = dec.decode(buf.slice(off + 30, off + 30 + nameLen));
    const dataStart  = off + 30 + nameLen + extraLen;
    if (compMethod === 0) results.push({ name, data: buf.slice(dataStart, dataStart + compSize) });
    off = dataStart + compSize;
  }
  return results;
}

async function readJsonSafe(p: string): Promise<Record<string, any>> {
  try { return JSON.parse(await fs.readFile(p, 'utf-8')); } catch { return {}; }
}

// ── POST /api/import?action=preview — analisa o ZIP e retorna conteúdo ─────
// ── POST /api/import?action=commit  — executa a importação seletiva ─────────
export const POST: APIRoute = async ({ request, url }) => {
  try {
    const action = url.searchParams.get('action') ?? 'preview';
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !('arrayBuffer' in file))
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const buf = new Uint8Array(await file.arrayBuffer());
    const entries = parseZip(buf);
    if (entries.length === 0)
      return new Response(JSON.stringify({ error: 'ZIP vazio ou formato inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const dec = new TextDecoder();

    // Parse ZIP contents
    let zipPages: Record<string, any> = {};
    let zipComps: Record<string, any>  = {};
    const zipUploads: { name: string; data: Uint8Array }[] = [];

    for (const entry of entries) {
      if (entry.name === 'data/pages.json') {
        try { zipPages = JSON.parse(dec.decode(entry.data)); } catch {}
      } else if (entry.name === 'data/components.json') {
        try { zipComps = JSON.parse(dec.decode(entry.data)); } catch {}
      } else if (entry.name.startsWith('uploads/')) {
        const fname = path.basename(entry.name);
        if (fname && !fname.startsWith('.')) zipUploads.push({ name: fname, data: entry.data });
      }
    }

    // ── PREVIEW: retorna lista + conflitos ──────────────────────────────────
    if (action === 'preview') {
      const existingPages = await readJsonSafe(path.join(cwd, 'src/data/pages.json'));
      const existingComps = await readJsonSafe(path.join(cwd, 'src/data/components.json'));

      // Páginas marcadas como placeholder do reset não contam como conflito real:
      // são apenas a "index vazia" que o reset recria. Importar um backup sobre
      // elas é uma restauração esperada, não uma sobrescrita de conteúdo do usuário.
      const pageConflicts = Object.keys(zipPages).filter(
        k => k in existingPages && !existingPages[k]?._resetPlaceholder
      );
      const compConflicts = Object.keys(zipComps).filter(k => k in existingComps);

      return new Response(JSON.stringify({
        pages:         Object.keys(zipPages),
        components:    Object.keys(zipComps),
        uploads:       zipUploads.map(u => u.name),
        pageConflicts,
        compConflicts,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ── COMMIT: importa seleção ─────────────────────────────────────────────
    const selectedPages = (formData.get('pages') as string | null)?.split(',').filter(Boolean) ?? Object.keys(zipPages);
    const selectedComps = (formData.get('components') as string | null)?.split(',').filter(Boolean) ?? Object.keys(zipComps);

    const report: string[] = [];

    // Merge pages
    if (selectedPages.length > 0) {
      const existing = await readJsonSafe(path.join(cwd, 'src/data/pages.json'));
      for (const k of selectedPages) if (k in zipPages) existing[k] = zipPages[k];
      await fs.writeFile(path.join(cwd, 'src/data/pages.json'), JSON.stringify(existing, null, 2), 'utf-8');
      report.push(...selectedPages.map(p => `page:${p}`));
    }

    // Merge components
    if (selectedComps.length > 0) {
      const existing = await readJsonSafe(path.join(cwd, 'src/data/components.json'));
      for (const k of selectedComps) if (k in zipComps) existing[k] = zipComps[k];
      await fs.writeFile(path.join(cwd, 'src/data/components.json'), JSON.stringify(existing, null, 2), 'utf-8');
      report.push(...selectedComps.map(c => `component:${c}`));
    }

    // Uploads (sempre todos)
    for (const { name, data } of zipUploads) {
      const dest = path.join(cwd, 'public/uploads', name);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, data);
      report.push(`upload:${name}`);
    }

    return new Response(JSON.stringify({ success: true, imported: report }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Import error:', err);
    return new Response(JSON.stringify({ error: 'Erro ao processar importação' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
