// Visual CMS 360° — Editor CMS local com suporte a tours virtuais 360°
// Copyright (C) 2025  Gerson Luis Vertematti <gersonlv@gmail.com>
//
// Este programa é software livre: você pode redistribuí-lo e/ou modificá-lo
// sob os termos da GNU General Public License conforme publicada pela Free
// Software Foundation, na versão 3 da Licença, ou (a seu critério) qualquer
// versão posterior.
//
// Este programa é distribuído na esperança de que seja útil, mas SEM QUALQUER
// GARANTIA. Veja a GNU General Public License para mais detalhes.
//
// <https://www.gnu.org/licenses/gpl-3.0.html>

/**
 * copy-vendor.mjs
 * Executado automaticamente após cada "npm install" (postinstall).
 * Copia GrapesJS, Pannellum e A-Frame de node_modules → public/vendor/
 * para que o sistema funcione sem dependência de CDN externo.
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = resolve(__dirname, '..');
const dest      = resolve(root, 'public', 'vendor');

mkdirSync(dest, { recursive: true });

let ok     = 0;
let errors = 0;

// ── Arquivos com path fixo ─────────────────────────────────────────────────
const files = [
  {
    src:   resolve(root, 'node_modules', 'grapesjs', 'dist', 'grapes.min.js'),
    dest:  resolve(dest, 'grapes.min.js'),
    label: 'grapesjs → grapes.min.js',
  },
  {
    src:   resolve(root, 'node_modules', 'grapesjs', 'dist', 'css', 'grapes.min.css'),
    dest:  resolve(dest, 'grapes.min.css'),
    label: 'grapesjs → grapes.min.css',
  },
  {
    src:   resolve(root, 'node_modules', 'grapesjs-tailwind', 'dist', 'index.js'),
    dest:  resolve(dest, 'grapesjs-tailwind.min.js'),
    label: 'grapesjs-tailwind → grapesjs-tailwind.min.js',
  },
  {
    src:   resolve(root, 'node_modules', 'grapesjs-blocks-basic', 'dist', 'index.js'),
    dest:  resolve(dest, 'grapesjs-blocks-basic.min.js'),
    label: 'grapesjs-blocks-basic → grapesjs-blocks-basic.min.js',
  },
  {
    src:   resolve(root, 'node_modules', 'pannellum', 'build', 'pannellum.js'),
    dest:  resolve(dest, 'pannellum.min.js'),
    label: 'pannellum → pannellum.min.js',
  },
  {
    src:   resolve(root, 'node_modules', 'pannellum', 'build', 'pannellum.css'),
    dest:  resolve(dest, 'pannellum.min.css'),
    label: 'pannellum → pannellum.min.css',
  },
];

for (const file of files) {
  if (!existsSync(file.src)) {
    console.error(`  ✗ Não encontrado: ${file.src}`);
    errors++;
    continue;
  }
  try {
    copyFileSync(file.src, file.dest);
    console.log(`  ✓ ${file.label}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ Erro ao copiar ${file.label}: ${err.message}`);
    errors++;
  }
}

// ── A-Frame — path varia entre versões, tenta candidatos em ordem ──────────
const aframeCandidates = [
  resolve(root, 'node_modules', 'aframe', 'dist', 'aframe.min.js'),
  resolve(root, 'node_modules', 'aframe', 'dist', 'aframe.js'),
  resolve(root, 'node_modules', 'aframe', 'dist', 'aframe-master.min.js'),
  resolve(root, 'node_modules', 'aframe', 'dist', 'aframe-master.js'),
];
const aframeDest = resolve(dest, 'aframe.min.js');
const aframeSrc  = aframeCandidates.find(p => existsSync(p));

if (aframeSrc) {
  try {
    copyFileSync(aframeSrc, aframeDest);
    console.log(`  ✓ aframe → aframe.min.js  (de ${aframeSrc.split('/').pop()})`);
    ok++;
  } catch (err) {
    console.error(`  ✗ Erro ao copiar aframe: ${err.message}`);
    errors++;
  }
} else {
  // A-Frame não está no node_modules — tentar download direto via fetch
  console.warn('  ⚠ aframe não encontrado em node_modules — tentando download do CDN...');
  try {
    // Node 18+ tem fetch nativo
    const res = await fetch('https://cdn.jsdelivr.net/npm/aframe@1.6.0/dist/aframe.min.js');
    if (res.ok) {
      const { writeFileSync } = await import('fs');
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(aframeDest, buf);
      console.log(`  ✓ aframe → aframe.min.js  (baixado do CDN, ${(buf.length/1024).toFixed(0)} KB)`);
      ok++;
    } else {
      console.warn(`  ⚠ CDN retornou ${res.status} — vídeo 360° usará CDN em runtime`);
    }
  } catch (fetchErr) {
    console.warn(`  ⚠ Download falhou: ${fetchErr.message} — vídeo 360° usará CDN em runtime`);
  }
}

console.log(`\n📦 vendor: ${ok} arquivo(s) copiado(s)${errors ? `, ${errors} erro(s)` : ''}.`);
// Sem process.exit(1) — erros de cópia não interrompem o npm install
