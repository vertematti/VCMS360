import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const files = [];
    for (const value of formData.values()) {
      // Duck type check for File/Blob to avoid Node.js instanceof quirks
      if (value && typeof value === 'object' && 'arrayBuffer' in value && 'name' in value) {
        files.push(value);
      }
    }
    
    if (files.length === 0) {
      // Also log the keys to debug what GrapesJS actually sent
      console.error('No files uploaded. Keys received:', Array.from(formData.keys()));
      return new Response(JSON.stringify({ error: 'No files uploaded' }), { status: 400 });
    }

    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    
    // Ensure directory exists
    try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }

    const data = [];

    for (const file of files) {
      // Sanitize filename
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const uniqueName = `${Date.now()}_${safeName}`;
      const filePath = path.join(uploadDir, uniqueName);
      
      const buffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));
      
      data.push({
        src: `/uploads/${uniqueName}`,
        name: safeName
      });
    }

    // GrapesJS expects this exact format by default: { data: [ { src: '...' } ] }
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
