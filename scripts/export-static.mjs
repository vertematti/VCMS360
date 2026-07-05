// Visual CMS 360° — Exportador de site estático
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// O QUE ESTE SCRIPT FAZ
// ─────────────────────
// Gera uma pasta `dist-static/` com o site publicado em HTML puro + assets,
// pronta para subir em QUALQUER servidor estático (Apache, Nginx, GitHub
// Pages, Netlify, hospedagem compartilhada…) SEM Node.
//
// COMO FUNCIONA (e por que é seguro)
// ──────────────────────────────────
// Ele NÃO altera o projeto nem o modo de build. Ele sobe o servidor SSR já
// buildado (dist/server/entry.mjs), pede cada página do pages.json como um
// visitante pediria, e salva o HTML resultante em arquivo. Assim o estático
// é byte-a-byte igual ao que o SSR entrega — sem reimplementar renderização,
// sem risco de divergência, sem mexer no editor.
//
// PRÉ-REQUISITO: rodar `npm run build` antes (gera dist/server e dist/client).
//
// USO:
//   npm run build          # gera dist/server + dist/client (obrigatório antes)
//   npm run export:static  # gera ./dist-static
//
// VARIÁVEIS DE AMBIENTE (opcionais):
//   EXPORT_HOST   (padrão 127.0.0.1)
//   EXPORT_PORT   (padrão 4477 — porta dedicada do servidor temporário de export)
//   EXPORT_OUT    (padrão ./dist-static)

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT         = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST         = process.env.EXPORT_HOST || '127.0.0.1';
// Porta DEDICADA (não a 4321 do editor): o export precisa renderizar contra o
// servidor de PRODUÇÃO recém-buildado, para o HTML referenciar os assets reais
// de /assets. Se reaproveitasse um `astro dev` na 4321, o HTML sairia apontando
// para URLs de desenvolvimento (/@vite/…) que não existem no estático.
const PORT         = process.env.EXPORT_PORT || '4477';
const BASE         = `http://${HOST}:${PORT}`;
const OUT          = path.resolve(ROOT, process.env.EXPORT_OUT || 'dist-static');
const SERVER_ENTRY = path.join(ROOT, 'dist', 'server', 'entry.mjs');
const CLIENT_DIR   = path.join(ROOT, 'dist', 'client');
const PUBLIC_DIR   = path.join(ROOT, 'public');
const PAGES_JSON   = path.join(ROOT, 'src', 'data', 'pages.json');
const SITE_JSON    = path.join(ROOT, 'src', 'data', 'site.json');

// Recursos que existem só na interface do editor e NÃO devem ir para o site
// estático publicado. Caminhos relativos à raiz do build (dist-static/).
// Para excluir mais itens no futuro, basta acrescentar aqui (arquivo ou pasta).
const EXCLUDE = [
  'glv.png',
  'openmaker.png',
  'VisualCMS360header.png',
  'editor',   // interface do editor — depende de Node/API, não vai no site estático
  'js',       // scripts do editor (editor-main.js, components-main.js) — usados só pelo editor, não pelas páginas publicadas
];

const log = (...a) => console.log('[export]', ...a);

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

// Aguarda o servidor responder (qualquer status HTTP serve — só queremos saber
// que a porta está atendendo).
async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(BASE + '/', { method: 'HEAD' });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return false;
}

async function main() {
  // 1. Validar que o build existe
  if (!(await exists(CLIENT_DIR)) || !(await exists(SERVER_ENTRY))) {
    console.error('\n[export] ERRO: build não encontrado.');
    console.error('[export] Rode `npm run build` antes de exportar.\n');
    process.exit(1);
  }

  // 2. Descobrir as páginas publicadas a partir do pages.json
  let slugs, pagesData = {};
  try {
    pagesData = JSON.parse(await fs.readFile(PAGES_JSON, 'utf-8'));
    slugs = Object.keys(pagesData);
  } catch (e) {
    console.error('[export] ERRO ao ler pages.json:', e.message);
    process.exit(1);
  }
  if (!slugs.length) {
    console.error('[export] Nenhuma página em pages.json. Nada a exportar.');
    process.exit(1);
  }
  log(`Páginas a exportar (${slugs.length}):`, slugs.join(', '));

  // 3. Subir SEMPRE um servidor de produção próprio nesta porta dedicada.
  //    (Não reaproveitamos servidores existentes para garantir que o HTML
  //    aponte para os assets de produção /assets, e não os de dev.)
  let child = null;
  {
    // Aviso se a porta já estiver ocupada por outra coisa
    const portBusy = await (async () => {
      try { await fetch(BASE + '/', { method: 'HEAD' }); return true; } catch { return false; }
    })();
    if (portBusy) {
      console.error(`[export] ERRO: a porta ${PORT} já está em uso.`);
      console.error(`[export] Rode com outra porta livre, ex.: EXPORT_PORT=4488 npm run export:static`);
      process.exit(1);
    }

    log(`Subindo servidor de produção temporário (${BASE})…`);
    child = spawn(process.execPath, [SERVER_ENTRY], {
      cwd: ROOT,                              // para achar src/data/*.json
      env: { ...process.env, HOST, PORT },
      stdio: ['ignore', 'ignore', 'inherit'], // mostra só erros do servidor
    });
    child.on('error', (e) => {
      console.error('[export] Falha ao iniciar o servidor:', e.message);
      process.exit(1);
    });
    if (!(await waitForServer())) {
      console.error('[export] Servidor não respondeu a tempo. Abortando.');
      if (child) child.kill();
      process.exit(1);
    }
    log('Servidor pronto.');
  }

  // Garante que o servidor temporário seja derrubado em qualquer saída
  const cleanup = () => { if (child && !child.killed) child.kill(); };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });

  try {
    // 4. Preparar a pasta de saída do zero
    await fs.rm(OUT, { recursive: true, force: true });
    await fs.mkdir(OUT, { recursive: true });

    // 4a. Copiar os assets já buildados (inclui /assets e o snapshot do public)
    log('Copiando assets de dist/client…');
    await fs.cp(CLIENT_DIR, OUT, { recursive: true });

    // 4b. Copiar public/ por cima (pega resources/vendor mais recentes que o build)
    if (await exists(PUBLIC_DIR)) {
      log('Atualizando assets de public/ (resources, vendor)…');
      await fs.cp(PUBLIC_DIR, OUT, { recursive: true });
    }

    // 4c. Remover recursos exclusivos do editor (logos, etc.) do site publicado
    for (const rel of EXCLUDE) {
      const target = path.join(OUT, rel);
      if (await exists(target)) {
        await fs.rm(target, { recursive: true, force: true });
        log(`Removido do estático (somente editor): ${rel}`);
      }
    }

    // 5. Renderizar cada página via servidor e gravar como HTML estático
    let ok = 0, fail = 0;
    for (const slug of slugs) {
      const urlPath = slug === 'index' ? '/' : `/${slug}`;
      // Formato de diretório (slug/index.html) — amigável a qualquer host estático
      const outDir  = slug === 'index' ? OUT : path.join(OUT, slug);
      const outFile = path.join(outDir, 'index.html');

      try {
        const res = await fetch(BASE + urlPath, { headers: { 'Accept': 'text/html' } });
        if (!res.ok) {
          console.error(`[export]   ✗ ${urlPath} → HTTP ${res.status}`);
          fail++;
          continue;
        }
        const html = await res.text();
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(outFile, html, 'utf-8');
        log(`  ✓ ${urlPath}  →  ${path.relative(ROOT, outFile)}`);
        ok++;
      } catch (e) {
        console.error(`[export]   ✗ ${urlPath} → ${e.message}`);
        fail++;
      }
    }

    log('');
    log(`Concluído: ${ok} página(s) exportada(s), ${fail} falha(s).`);

    // 6. Gerar sitemap.xml e robots.txt (SEO técnico — Nível 3)
    //    Lê site.json para baseUrl e respeita robots "noindex" por página.
    try {
      let site = {};
      try { site = JSON.parse(await fs.readFile(SITE_JSON, 'utf-8')); } catch {}
      const baseUrl = (site.baseUrl || '').replace(/\/+$/, '');

      if (baseUrl) {
        const robotsDefault = site.robotsDefault || 'index,follow';
        const urls = slugs.filter(slug => {
          const pageRobots = (pagesData[slug]?.seo?.robots) || robotsDefault;
          return !/noindex/i.test(pageRobots);   // não lista páginas noindex
        }).map(slug => {
          const loc = slug === 'index' ? baseUrl + '/' : `${baseUrl}/${slug}`;
          return `  <url><loc>${loc}</loc></url>`;
        });

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`
          + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
          + urls.join('\n') + `\n</urlset>\n`;
        await fs.writeFile(path.join(OUT, 'sitemap.xml'), sitemap, 'utf-8');
        log(`  ✓ sitemap.xml (${urls.length} URL(s))`);

        const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
        await fs.writeFile(path.join(OUT, 'robots.txt'), robotsTxt, 'utf-8');
        log('  ✓ robots.txt');
      } else {
        log('  ⚠ sitemap.xml/robots.txt não gerados (defina o "Domínio base" em SEO → Configurações do Site).');
      }
    } catch (e) {
      console.error('[export]   ✗ Falha ao gerar sitemap/robots:', e.message);
    }

    log('');
    log(`Saída: ${OUT}`);
    log('Suba o conteúdo dessa pasta em qualquer servidor estático.');
    if (fail > 0) process.exitCode = 1;
  } finally {
    cleanup();
  }
}

main().catch((e) => {
  console.error('[export] Erro inesperado:', e);
  process.exit(1);
});
