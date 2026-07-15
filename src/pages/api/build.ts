// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Endpoint do botão "Build" do editor. Transmite a saída em tempo real (SSE).
//
// DOIS MODOS:
//  • Web/dev (padrão): encadeia `npm run build` + `npm run export:static`.
//  • Desktop (Electron, quando VCMS_DESKTOP=1): NÃO usa npm/CLI. O app desktop
//    já roda o servidor SSR de produção, então a exportação é feita EM PROCESSO:
//    busca o HTML de cada página do próprio servidor e copia os assets já
//    buildados (dist/client) + os recursos graváveis (public/). Assim funciona
//    num app empacotado, sem Node/npm/Astro instalados na máquina do usuário.

import type { APIRoute } from 'astro';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

// Recursos exclusivos da interface do editor — não vão para o site publicado.
const EXCLUDE = ['glv.png', 'openmaker.png', 'VisualCMS360header.png', 'editor', 'js'];

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

export const POST: APIRoute = async () => {
  const cwd     = process.cwd();
  const npmCmd  = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const encoder = new TextEncoder();
  const isDesktop = process.env.VCMS_DESKTOP === '1';

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
        } catch { /* stream já fechado */ }
      };

      // ─────────────────────────────────────────────────────────────────────
      // MODO DESKTOP — exportação em processo, sem npm/CLI
      // ─────────────────────────────────────────────────────────────────────
      const runDesktopExport = async (): Promise<void> => {
        const base       = `http://127.0.0.1:${process.env.PORT || '4321'}`;
        const CLIENT_DIR = process.env.VCMS_CLIENT_DIR || path.join(cwd, 'dist', 'client');
        const OUT        = process.env.VCMS_OUT_DIR   || path.join(cwd, 'dist-static');
        const PUBLIC_DIR = path.join(cwd, 'public');
        const PAGES_JSON = path.join(cwd, 'src', 'data', 'pages.json');
        const SITE_JSON  = path.join(cwd, 'src', 'data', 'site.json');

        send('info', '📦 Gerando site estático (sem CLI, direto do servidor)...\n\n');

        if (!(await exists(CLIENT_DIR))) {
          send('error', `\n❌ Assets buildados não encontrados em: ${CLIENT_DIR}`);
          return;
        }

        // Páginas a exportar
        let pagesData: Record<string, any> = {};
        let slugs: string[] = [];
        try {
          pagesData = JSON.parse(await fs.readFile(PAGES_JSON, 'utf-8'));
          slugs = Object.keys(pagesData);
        } catch (e: any) {
          send('error', `\n❌ Falha ao ler pages.json: ${e?.message || e}`);
          return;
        }
        if (!slugs.length) { send('error', '\n❌ Nenhuma página para exportar.'); return; }
        send('stdout', `Páginas (${slugs.length}): ${slugs.join(', ')}\n`);

        // Saída do zero
        await fs.rm(OUT, { recursive: true, force: true });
        await fs.mkdir(OUT, { recursive: true });

        // Assets buildados + recursos graváveis por cima
        send('stdout', 'Copiando assets (dist/client)...\n');
        await fs.cp(CLIENT_DIR, OUT, { recursive: true });
        if (await exists(PUBLIC_DIR)) {
          send('stdout', 'Aplicando recursos de public/ (resources, uploads)...\n');
          await fs.cp(PUBLIC_DIR, OUT, { recursive: true });
        }
        // Remover itens exclusivos do editor
        for (const rel of EXCLUDE) {
          const target = path.join(OUT, rel);
          if (await exists(target)) { await fs.rm(target, { recursive: true, force: true }); }
        }

        // Renderizar cada página via o próprio servidor
        let ok = 0, fail = 0;
        for (const slug of slugs) {
          const urlPath = slug === 'index' ? '/' : `/${slug}`;
          const outDir  = slug === 'index' ? OUT : path.join(OUT, slug);
          const outFile = path.join(outDir, 'index.html');
          try {
            const res = await fetch(base + urlPath, { headers: { Accept: 'text/html' } });
            if (!res.ok) { send('stdout', `  ✗ ${urlPath} → HTTP ${res.status}\n`); fail++; continue; }
            const html = await res.text();
            await fs.mkdir(outDir, { recursive: true });
            await fs.writeFile(outFile, html, 'utf-8');
            send('stdout', `  ✓ ${urlPath}\n`);
            ok++;
          } catch (e: any) {
            send('stdout', `  ✗ ${urlPath} → ${e?.message || e}\n`); fail++;
          }
        }

        // sitemap.xml + robots.txt (se houver domínio base em site.json)
        try {
          let site: any = {};
          try { site = JSON.parse(await fs.readFile(SITE_JSON, 'utf-8')); } catch {}
          const baseUrl = (site.baseUrl || '').replace(/\/+$/, '');
          if (baseUrl) {
            const robotsDefault = site.robotsDefault || 'index,follow';
            const urls = slugs.filter((slug) => {
              const r = (pagesData[slug]?.seo?.robots) || robotsDefault;
              return !/noindex/i.test(r);
            }).map((slug) => {
              const loc = slug === 'index' ? baseUrl + '/' : `${baseUrl}/${slug}`;
              return `  <url><loc>${loc}</loc></url>`;
            });
            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`
              + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
              + urls.join('\n') + `\n</urlset>\n`;
            await fs.writeFile(path.join(OUT, 'sitemap.xml'), sitemap, 'utf-8');
            await fs.writeFile(path.join(OUT, 'robots.txt'),
              `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`, 'utf-8');
            send('stdout', `  ✓ sitemap.xml (${urls.length} URL) + robots.txt\n`);
          } else {
            send('stdout', '  ⚠ sitemap/robots não gerados (defina o "Domínio base" em SEO).\n');
          }
        } catch (e: any) {
          send('stdout', `  ✗ sitemap/robots: ${e?.message || e}\n`);
        }

        if (fail > 0) {
          send('error', `\n⚠️ Concluído com ${fail} falha(s). ${ok} página(s) exportada(s).`);
        } else {
          send('success', `\n✅ Site estático gerado (${ok} página(s)).\nPasta: ${OUT}\n`
            + 'Use o menu "Arquivo → Abrir pasta de exportação" para vê-la.');
        }
      };

      // ─────────────────────────────────────────────────────────────────────
      // MODO WEB/DEV — encadeia npm run build + export:static
      // ─────────────────────────────────────────────────────────────────────
      const runStep = (args: string[], extraEnv: Record<string, string> = {}) =>
        new Promise<number>((resolve) => {
          const proc = spawn(npmCmd, args, {
            cwd,
            env: { ...process.env, FORCE_COLOR: '0', ...extraEnv },
            shell: false,
          });
          proc.stdout.on('data', (chunk: Buffer) => send('stdout', chunk.toString()));
          proc.stderr.on('data', (chunk: Buffer) => send('stdout', chunk.toString()));
          proc.on('close', (code: number | null) => resolve(code ?? 1));
          proc.on('error', (err: Error) => {
            send('stdout', `\n[erro ao iniciar processo] ${err.message}\n`);
            resolve(1);
          });
        });

      const runWebBuild = async (): Promise<void> => {
        send('info', '🔨 [1/2] Compilando o projeto (npm run build)...\n\n');
        const buildCode = await runStep(['run', 'build']);
        if (buildCode !== 0) { send('error', `\n❌ Build falhou com código ${buildCode}. Export cancelado.`); return; }

        send('info', '\n\n📦 [2/2] Gerando build estático (npm run export:static)...\n\n');
        const exportCode = await runStep(['run', 'export:static'], { EXPORT_PORT: process.env.EXPORT_PORT || '4477' });
        if (exportCode !== 0) { send('error', `\n❌ Export estático falhou com código ${exportCode}.`); return; }

        send('success', '\n✅ Build estático concluído! Pasta gerada: dist-static/');
      };

      (async () => {
        try {
          if (isDesktop) await runDesktopExport();
          else await runWebBuild();
        } catch (err: any) {
          send('error', `\n❌ Erro inesperado: ${err?.message || err}`);
        } finally {
          try { controller.close(); } catch { /* já fechado */ }
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
