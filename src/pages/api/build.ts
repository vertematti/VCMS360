// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Endpoint do botão "Build" do editor.
// Encadeia, transmitindo a saída em tempo real (SSE) para o modal:
//   1. `npm run build`          → regenera dist/ (assets /assets, CSS Tailwind)
//   2. `npm run export:static`  → gera ./dist-static (HTML puro + assets)
// O resultado em dist-static/ pode ser servido por qualquer servidor estático
// (Apache, Nginx, etc.) sem Node.

import type { APIRoute } from 'astro';
import { spawn } from 'node:child_process';

export const prerender = false;

export const POST: APIRoute = async () => {
  const cwd    = process.cwd();
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, data: string) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
          );
        } catch { /* stream já fechado */ }
      };

      // Executa um passo (npm run <script>) transmitindo stdout/stderr como 'stdout'.
      // Resolve com o código de saída do processo.
      const runStep = (args: string[], extraEnv: Record<string, string> = {}) =>
        new Promise<number>((resolve) => {
          const proc = spawn(npmCmd, args, {
            cwd,
            env: { ...process.env, FORCE_COLOR: '0', ...extraEnv },
            shell: false,
          });
          proc.stdout.on('data', (chunk: Buffer) => send('stdout', chunk.toString()));
          // Astro/Vite logam em stderr — tratamos como saída normal, não erro
          proc.stderr.on('data', (chunk: Buffer) => send('stdout', chunk.toString()));
          proc.on('close', (code: number | null) => resolve(code ?? 1));
          proc.on('error', (err: Error) => {
            send('stdout', `\n[erro ao iniciar processo] ${err.message}\n`);
            resolve(1);
          });
        });

      (async () => {
        try {
          // ── Passo 1: build do Astro ──────────────────────────────────────
          send('info', '🔨 [1/2] Compilando o projeto (npm run build)...\n\n');
          const buildCode = await runStep(['run', 'build']);
          if (buildCode !== 0) {
            send('error', `\n❌ Build falhou com código ${buildCode}. Export cancelado.`);
            return;
          }

          // ── Passo 2: export estático ─────────────────────────────────────
          send('info', '\n\n📦 [2/2] Gerando build estático (npm run export:static)...\n\n');
          const exportCode = await runStep(['run', 'export:static'], {
            EXPORT_PORT: process.env.EXPORT_PORT || '4477',
          });
          if (exportCode !== 0) {
            send('error', `\n❌ Export estático falhou com código ${exportCode}.`);
            return;
          }

          send('success', '\n✅ Build estático concluído! Pasta gerada: dist-static/');
        } catch (err: any) {
          send('error', `\n❌ Erro inesperado: ${err?.message || err}`);
        } finally {
          try { controller.close(); } catch { /* já fechado */ }
        }
      })();
    }
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
