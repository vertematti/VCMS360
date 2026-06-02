import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const slug = data.slug;

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug is required' }), { status: 400 });
    }

    if (slug === 'index') {
      return new Response(JSON.stringify({ error: 'Cannot delete the index page' }), { status: 403 });
    }

    const filePath = path.resolve(process.cwd(), 'src/data/pages.json');
    let pages: any = {};

    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      pages = JSON.parse(fileData);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'pages.json not found' }), { status: 404 });
    }

    if (!pages[slug]) {
      return new Response(JSON.stringify({ error: 'Page not found' }), { status: 404 });
    }

    // Delete the page
    delete pages[slug];

    // Save back to file
    await fs.writeFile(filePath, JSON.stringify(pages, null, 2), 'utf-8');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
