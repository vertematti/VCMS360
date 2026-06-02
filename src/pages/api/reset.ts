import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const cwd            = process.cwd();
    const pagesPath      = path.resolve(cwd, 'src/data/pages.json');
    const componentsPath = path.resolve(cwd, 'src/data/components.json');
    const uploadDirs     = [
      path.resolve(cwd, 'public/uploads'),       // uploads do dev server
      path.resolve(cwd, 'dist/client/uploads'),  // uploads copiados no build
    ];

    const summary = { pages: 0, components: 0, uploads: { deleted: 0, failed: 0 } };

    // ── 1. Resetar pages.json — apagar TODAS as páginas, manter só index vazia ──
    const initialPages = {
      index: {
        html: '<div class="p-8 text-center"><h1 class="text-3xl font-bold mb-4">Start Building</h1><p class="text-gray-600">Drag and drop elements here.</p></div>',
        css:  ''
      }
    };
    await fs.writeFile(pagesPath, JSON.stringify(initialPages, null, 2), 'utf-8');
    summary.pages = 1;

    // ── 2. Resetar components.json ─────────────────────────────────────────────
    await fs.writeFile(componentsPath, JSON.stringify({}, null, 2), 'utf-8');
    summary.components = 1;

    // ── 3. Apagar uploads em TODAS as pastas (dev + dist) ─────────────────────
    for (const uploadDir of uploadDirs) {
      try {
        const files = await fs.readdir(uploadDir);
        await Promise.all(
          files.map(async (file) => {
            if (file.startsWith('.')) return; // preservar .gitkeep etc.
            try {
              const filePath = path.join(uploadDir, file);
              const stat = await fs.stat(filePath);
              if (stat.isDirectory()) {
                // Apagar subpastas recursivamente
                await fs.rm(filePath, { recursive: true, force: true });
              } else {
                await fs.unlink(filePath);
              }
              summary.uploads.deleted++;
            } catch {
              summary.uploads.failed++;
            }
          })
        );
      } catch {
        // Pasta não existe — ignorar
      }
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao resetar site:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
};
