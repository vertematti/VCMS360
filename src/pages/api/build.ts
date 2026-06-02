import type { APIRoute } from 'astro';
import { spawn } from 'node:child_process';
import path from 'node:path';

export const prerender = false;

export const POST: APIRoute = async () => {
  const cwd = process.cwd();
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, data: string) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
          );
        } catch { /* stream already closed */ }
      };

      send('info', '🔨 Iniciando build do Astro...\n');

      const proc = spawn(npmCmd, ['run', 'build'], {
        cwd,
        env: { ...process.env, FORCE_COLOR: '0' },
        shell: false,
      });

      proc.stdout.on('data', (chunk: Buffer) => {
        send('stdout', chunk.toString());
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        // Astro logs to stderr — treat as info, not errors
        send('stdout', chunk.toString());
      });

      proc.on('close', (code: number | null) => {
        if (code === 0) {
          send('success', '\n✅ Build concluído com sucesso!');
        } else {
          send('error', `\n❌ Build falhou com código ${code}.`);
        }
        try { controller.close(); } catch { /* already closed */ }
      });

      proc.on('error', (err: Error) => {
        send('error', `\n❌ Erro ao iniciar build: ${err.message}`);
        try { controller.close(); } catch { /* already closed */ }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
