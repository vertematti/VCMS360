// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Faz o Tailwind do servidor de desenvolvimento (`npm run dev`) reescanear as
// classes de pages.json / components.json depois que o editor salva.
//
// POR QUÊ: o astro.config.mjs ignora src/data/** no watcher do Vite (para o
// salvar não disparar reload/"piscada" do editor). Efeito colateral: o plugin
// do Tailwind v4 não percebe que o conteúdo mudou, e classes usadas pela
// primeira vez numa página (grid-cols-*, h-44, space-y-12…) ficam SEM CSS na
// prévia (localhost:4321) até reiniciar o servidor — enquanto o editor (canvas)
// e o build final mostram tudo certo.
//
// COMO: "tocar" (atualizar o mtime de) src/styles/global.css, a raiz do
// Tailwind. Isso força o plugin a recompilar e reescanear as @source, e o Vite
// aplica só um hot-update de CSS nas abas de prévia — o editor não importa
// global.css, então não recarrega. Só roda em dev: no build/produção/Electron
// empacotado não há nada a atualizar.

import fs from 'node:fs/promises';
import path from 'node:path';

export async function refreshTailwindSources(): Promise<void> {
  if (!import.meta.env.DEV) return;
  try {
    const root = path.resolve(process.cwd(), 'src/styles/global.css');
    const now = new Date();
    await fs.utimes(root, now, now);
  } catch {
    // Não é crítico: na pior hipótese a prévia só atualiza após reiniciar o dev.
  }
}
