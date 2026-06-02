import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    
    let files = [];
    try {
      files = await fs.readdir(uploadDir);
    } catch {
      // Directory doesn't exist yet, return empty array
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Filter only images/common assets if needed
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.pdf', '.zip', '.doc', '.docx'];
    const assets = files
      .filter(file => validExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => ({
        src: `/uploads/${file}`,
        name: file
      }));

    return new Response(JSON.stringify(assets), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error loading assets:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
