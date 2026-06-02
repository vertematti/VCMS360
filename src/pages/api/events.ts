export const prerender = false;

// In-memory set of SSE clients
const clients: Set<ReadableStreamDefaultController<Uint8Array>> = new Set();

// Exported so other API routes can broadcast events
export function broadcast(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  for (const ctrl of clients) {
    try { ctrl.enqueue(encoded); } catch { clients.delete(ctrl); }
  }
}

import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      clients.add(ctrl);

      // Heartbeat every 25 s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(new TextEncoder().encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
          clients.delete(ctrl);
        }
      }, 25_000);

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clients.delete(ctrl);
        try { ctrl.close(); } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
};
