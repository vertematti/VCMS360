// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Sincronização de componentes compartilhados dentro do HTML/CSS já
// GRAVADOS de cada página (src/data/pages.json).
//
// Contexto: o [...slug].astro já injeta o componente "ao vivo" (sempre
// fresco) a cada requisição — então o site publicado nunca fica
// desatualizado. O problema é o SNAPSHOT gravado em pages.json (o HTML/CSS
// exportado pelo GrapesJS da última vez que a página foi salva no editor):
// esse snapshot embute uma cópia do componente do jeito que ele estava
// NAQUELE momento, e o GrapesJS despeja o CSS do componente misturado com o
// CSS da própria página, sem separar um do outro.
//
// Isso cria dois problemas quando o componente é editado depois:
//  1. O snapshot da página fica desatualizado (só "pega" a versão nova do
//     componente se alguém reabrir aquela página no editor e salvar de novo).
//  2. O CSS antigo do componente nunca é removido — fica "escondido" porque
//     o CSS novo (injetado por cima, em tempo de render) tem prioridade na
//     cascata. Regras que existiam na versão antiga e foram removidas na
//     nova versão continuam ativas para sempre (CSS morto e duplicado).
//
// As funções abaixo resolvem os dois problemas, atualizando o snapshot
// gravado sempre que um componente é salvo: trocam o HTML embutido dentro
// do wrapper `[data-component-id]` e substituem o bloco de CSS do
// componente por um bloco delimitado por marcadores — fácil de localizar e
// trocar de novo na próxima sincronização, sem nunca duplicar.

import * as cheerio from 'cheerio';

export interface PageRecord {
  slug: string;
  html?: string;
  css?: string;
  js?: string;
  jquery?: string;
  seo?: Record<string, any>;
  projectData?: any;
  componentsSyncedAt?: string;
  [key: string]: any;
}

const markerStart = (name: string) => `/* [[vcms:component:${name}:start]] */`;
const markerEnd = (name: string) => `/* [[vcms:component:${name}:end]] */`;

function escapeAttr(name: string): string {
  return name.replace(/"/g, '&quot;');
}

/** Verifica (sem alterar nada) se uma página usa o componente indicado. */
export function pageUsesComponent(page: PageRecord, name: string): boolean {
  const html = page.html || '';
  return html.includes(`data-component-id="${escapeAttr(name)}"`);
}

/**
 * Varre todas as páginas e retorna as que usam o componente indicado.
 * Usado para montar a janela de confirmação antes de salvar.
 */
export function findPagesUsingComponent(pages: Record<string, PageRecord>, name: string): PageRecord[] {
  return Object.values(pages).filter((p) => pageUsesComponent(p, name));
}

/**
 * Divide um bloco CSS em "statements" de nível superior (regras normais
 * `seletor{...}` ou at-rules como `@media(...){...}`), respeitando chaves
 * aninhadas. Suficiente para o CSS "achatado" exportado pelo GrapesJS —
 * não é um parser CSS completo, mas não precisa ser: só usamos isso para
 * comparar blocos inteiros e removê-los se já existirem.
 */
export function splitTopLevelCss(css: string): string[] {
  const statements: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        statements.push(css.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
  }
  const rest = css.slice(start).trim();
  if (rest) statements.push(rest);
  return statements.filter(Boolean);
}

function normalizeCss(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Remove um bloco marcado por uma sincronização anterior (se existir). */
function stripMarkedBlock(css: string, name: string): string {
  const start = markerStart(name);
  const end = markerEnd(name);
  const startIdx = css.indexOf(start);
  if (startIdx === -1) return css;
  const endIdx = css.indexOf(end, startIdx);
  if (endIdx === -1) return css;
  return (css.slice(0, startIdx) + css.slice(endIdx + end.length)).trim();
}

/**
 * Remove do CSS da página quaisquer statements de nível superior idênticos
 * aos da versão ANTERIOR do componente (comparando por conteúdo, ignorando
 * espaços). Cobre o caso "legado": páginas salvas antes deste recurso
 * existir, cujo CSS do componente foi despejado pelo GrapesJS sem nenhum
 * marcador — a primeira sincronização já limpa essa duplicação histórica.
 */
function removeLegacyDuplicateCss(pageCss: string, oldComponentCss: string): string {
  if (!oldComponentCss || !oldComponentCss.trim()) return pageCss;
  const oldStatements = new Set(splitTopLevelCss(oldComponentCss).map(normalizeCss));
  if (oldStatements.size === 0) return pageCss;
  const kept = splitTopLevelCss(pageCss).filter((s) => !oldStatements.has(normalizeCss(s)));
  return kept.join('\n');
}

/**
 * Atualiza o CSS gravado da página: remove a versão antiga do CSS do
 * componente (marcada de um sync anterior, ou legada/sem marcação) e
 * acrescenta a versão nova dentro de um bloco identificável — assim a
 * PRÓXIMA sincronização encontra e substitui exatamente esse bloco, sem
 * nunca duplicar.
 */
export function syncComponentCss(
  pageCss: string,
  name: string,
  oldComponentCss: string,
  newComponentCss: string
): string {
  let css = stripMarkedBlock(pageCss || '', name);
  css = removeLegacyDuplicateCss(css, oldComponentCss).trim();

  const trimmedNew = (newComponentCss || '').trim();
  if (!trimmedNew) return css;

  const block = `${markerStart(name)}\n${trimmedNew}\n${markerEnd(name)}`;
  return css ? `${css}\n\n${block}` : block;
}

/**
 * Atualiza o HTML gravado da página: troca o conteúdo interno de cada
 * wrapper `[data-component-id="name"]` pelo HTML atual do componente
 * (substituição total do miolo — nunca acrescenta, então nunca duplica).
 * Retorna `null` se o componente não aparece nessa página (nada a fazer).
 */
export function syncComponentHtml(pageHtml: string, name: string, newComponentHtml: string): string | null {
  const html = pageHtml || '';
  if (!html.includes(`data-component-id="${escapeAttr(name)}"`)) return null;

  const hasBody = /<body[\s>]/i.test(html);
  const $ = cheerio.load(html);
  const nodes = $(`[data-component-id="${name}"]`);
  if (nodes.length === 0) return null;

  nodes.each((_, el) => {
    $(el).html(newComponentHtml || '');
  });

  const full = $.html();
  if (hasBody) {
    // Mantém o mesmo formato já usado em pages.json: a tag <body> inteira,
    // igual à extração feita em [...slug].astro na renderização.
    const m = full.match(/<body[\s\S]*<\/body>/i);
    return m ? m[0] : full;
  }
  // Página gravada como fragmento (sem <body> próprio): extrai só o miolo
  // do body "virtual" que o cheerio cria ao carregar o fragmento.
  const m = full.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : full;
}

/**
 * Aplica a sincronização (HTML + CSS) em TODAS as páginas afetadas por um
 * componente. Muta o objeto `pages` recebido e devolve a lista de slugs
 * realmente alterados (para exibir/persistir).
 */
export function syncPagesForComponent(
  pages: Record<string, PageRecord>,
  name: string,
  oldComponentCss: string,
  newComponentHtml: string,
  newComponentCss: string
): string[] {
  const affected: string[] = [];
  const now = new Date().toISOString();

  for (const page of Object.values(pages)) {
    const newHtml = syncComponentHtml(page.html || '', name, newComponentHtml);
    if (newHtml === null) continue; // este componente não é usado nesta página

    page.html = newHtml;
    page.css = syncComponentCss(page.css || '', name, oldComponentCss, newComponentCss);
    page.componentsSyncedAt = now;
    affected.push(page.slug);
  }

  return affected;
}
