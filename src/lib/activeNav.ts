// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html

import * as cheerio from 'cheerio';

/** Cor usada quando nenhuma for configurada em site.json.
 *  `currentColor` não serve aqui (seria a própria cor do link); usamos a cor
 *  primária do tema DaisyUI, que já acompanha os temas claro/escuro. */
export const DEFAULT_NAV_ACTIVE_COLOR = 'var(--color-primary)';

/** Classe aplicada ao <a> da página atual. Também serve de gancho para quem
 *  quiser estilizar o item ativo de outras formas (negrito, sublinhado…). */
export const ACTIVE_LINK_CLASS = 'vcms-nav-active';

/** Normaliza um href/slug para comparação:
 *  "/", "", "index", "/index", "/index/" → "index"
 *  "/documentacao/", "documentacao" → "documentacao" */
function normalizePath(value: string): string | null {
  if (typeof value !== 'string') return null;
  let v = value.trim();
  if (!v) return null;

  // Ignora links externos, âncoras e protocolos especiais (mailto:, tel:…).
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null;
  if (v.startsWith('#') || v.startsWith('//')) return null;

  // Remove query string e âncora.
  v = v.split('#')[0].split('?')[0];

  // Remove barras das pontas.
  v = v.replace(/^\/+/, '').replace(/\/+$/, '');

  if (v === '' || v === 'index') return 'index';

  try {
    // Slugs podem conter acentos/espaços codificados (ex.: "espaço-vinte-discos").
    v = decodeURIComponent(v);
  } catch { /* mantém como está se não for uma sequência válida */ }

  return v;
}

/**
 * Marca, dentro do HTML já renderizado da página, o(s) link(s) que apontam
 * para a página atual: adiciona a classe de destaque e `aria-current="page"`
 * (que também é o que leitores de tela anunciam).
 *
 * Funciona igualmente para o menu horizontal do desktop e para o menu que
 * abre no hambúrguer, porque no componente Header ambos são a MESMA lista
 * <ul> — apenas exibida de formas diferentes por CSS responsivo.
 *
 * Retorna o HTML possivelmente alterado. Se nada casar, devolve o original.
 */
export function markActiveNavLinks(html: string, slug: string): string {
  if (!html || !html.includes('<a')) return html;
  if (!html.includes('menu') && !html.includes('data-vcms-nav')) return html;

  const target = normalizePath(slug) || 'index';
  const hasBody = /<body[\s>]/i.test(html);
  const $ = cheerio.load(html);

  // Só links DENTRO de um menu. Marcar `a[href]` indiscriminadamente pegaria
  // também o link da marca/título do site (que aponta para "/"), deixando o
  // título colorido na página inicial. `.menu` cobre o menu do DaisyUI usado
  // no Header (a mesma <ul> serve ao topo e ao hambúrguer); `[data-vcms-nav]`
  // permite marcar manualmente qualquer outro bloco de navegação próprio.
  const selector = '.menu a[href], [data-vcms-nav] a[href]';

  let changed = false;
  $(selector).each((_, el) => {
    const href = $(el).attr('href');
    const normalized = normalizePath(href || '');
    if (normalized === null || normalized !== target) return;
    $(el).addClass(ACTIVE_LINK_CLASS);
    $(el).attr('aria-current', 'page');
    changed = true;
  });

  if (!changed) return html;

  // Mesma convenção de serialização usada em componentSync.ts, para não
  // alterar o formato do HTML (com ou sem <body> próprio).
  const full = $.html();
  if (hasBody) {
    const m = full.match(/<body[\s\S]*<\/body>/i);
    return m ? m[0] : full;
  }
  const m = full.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : full;
}

/**
 * CSS que pinta o link ativo. A cor entra numa custom property para poder ser
 * sobrescrita facilmente (inclusive por tema) sem mexer nesta regra.
 */
export function buildActiveNavCss(color?: string): string {
  const c = (color || '').trim() || DEFAULT_NAV_ACTIVE_COLOR;
  return `
:root { --vcms-nav-active-color: ${c}; }
/* Link do menu correspondente à página aberta.
   !important porque o DaisyUI define a cor dos itens de .menu com
   especificidade alta (inclusive nos estados hover/focus). */
.${ACTIVE_LINK_CLASS},
.menu li > a.${ACTIVE_LINK_CLASS},
.menu li > a.${ACTIVE_LINK_CLASS}:hover,
.menu li > a.${ACTIVE_LINK_CLASS}:focus {
  color: var(--vcms-nav-active-color) !important;
  font-weight: 600;
}`.trim();
}
