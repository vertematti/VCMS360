// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import * as cheerio from 'cheerio';

/**
 * Remove o controle de alternância de tema (o <label class="swap"> com o
 * input[data-toggle-theme]) do HTML já renderizado, quando o site estiver
 * configurado para não mostrá-lo (site.json → showThemeToggle: false).
 *
 * Feito aqui — no servidor, a cada requisição — e não editando o HTML salvo
 * do componente Header, pelo mesmo motivo do destaque de link ativo
 * (ver activeNav.ts): o Header é compartilhado entre páginas, então a
 * decisão de mostrar/ocultar é de quem está renderizando a página, lida de
 * site.json, não algo fixo no componente.
 */
export function applyThemeToggleVisibility(html: string, show: boolean): string {
  if (show) return html;
  if (!html || !html.includes('data-toggle-theme')) return html;

  const hasBody = /<body[\s>]/i.test(html);
  const $ = cheerio.load(html);

  $('input[data-toggle-theme], input[data-set-theme]').each((_, el) => {
    // Remove o <label class="swap …"> (ou qualquer ancestral mais próximo
    // marcado como o controle) inteiro, não só o <input>.
    const label = $(el).closest('label');
    if (label.length) label.remove();
    else $(el).remove();
  });

  const full = $.html();
  if (hasBody) {
    const m = full.match(/<body[\s\S]*<\/body>/i);
    return m ? m[0] : full;
  }
  const m = full.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : full;
}
