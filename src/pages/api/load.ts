import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug') || 'index';

    const filePath = path.resolve(process.cwd(), 'src/data/pages.json');
    let pages = {};

    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      pages = JSON.parse(fileData);
    } catch (e) {
      // Return empty if not found
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let responseData = pages[slug] || {};
    
    // Inject available pages for the UI dropdown
    let available = Object.keys(pages);
    if (!available.includes('index')) available.unshift('index');
    responseData.availablePages = available;

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error loading page:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
