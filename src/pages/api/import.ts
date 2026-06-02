import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const cwd = process.cwd();

/** Parse a ZIP file (stored, no compression) and return entries */
function parseZip(buf: Uint8Array): { name: string; data: Uint8Array }[] {
  const view  = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const results: { name: string; data: Uint8Array }[] = [];
  const dec = new TextDecoder();
  let off = 0;

  while (off + 30 < buf.length) {
    const sig = view.getUint32(off, true);
    if (sig !== 0x04034B50) break;                // local file header sig

    const compMethod = view.getUint16(off + 8,  true);
    const compSize   = view.getUint32(off + 18, true);
    const nameLen    = view.getUint16(off + 26, true);
    const extraLen   = view.getUint16(off + 28, true);
    const name       = dec.decode(buf.slice(off + 30, off + 30 + nameLen));
    const dataStart  = off + 30 + nameLen + extraLen;

    if (compMethod === 0) {                        // stored (no compression)
      results.push({ name, data: buf.slice(dataStart, dataStart + compSize) });
    }
    off = dataStart + compSize;
  }
  return results;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !('arrayBuffer' in file)) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    const entries = parseZip(buf);

    if (entries.length === 0) {
      return new Response(JSON.stringify({ error: 'ZIP vazio ou formato inválido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const dec = new TextDecoder();
    const report: string[] = [];

    for (const entry of entries) {
      const { name, data } = entry;

      // ── data/*.json ────────────────────────────────────────────────
      if (name === 'data/pages.json' || name === 'data/components.json') {
        const dest = path.join(cwd, 'src', name);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, dec.decode(data), 'utf-8');
        report.push(name);
        continue;
      }

      // ── uploads/* ──────────────────────────────────────────────────
      if (name.startsWith('uploads/')) {
        const fname = path.basename(name);
        if (!fname || fname.startsWith('.')) continue;  // skip hidden / empty
        const dest = path.join(cwd, 'public', 'uploads', fname);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, data);
        report.push(name);
        continue;
      }
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
