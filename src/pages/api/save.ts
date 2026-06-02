import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const slug = data.slug || 'index';

    const filePath = path.resolve(process.cwd(), 'src/data/pages.json');
    let pages: Record<string, any> = {};

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      pages = JSON.parse(raw);
    } catch {
      // File doesn't exist yet – start fresh
    }

    // Store the full payload keyed by slug
    pages[slug] = {
      slug,
      html: data.html || '',
      css: data.css || '',
      projectData: data.projectData || {}
    };

    await fs.writeFile(filePath, JSON.stringify(pages, null, 2), 'utf-8');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving page:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
