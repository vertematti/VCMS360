// Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Resolvedor de SEO: aplica a cascata página → site (global) → fallback,
// e monta o HTML das tags <head>. Usado tanto na renderização SSR
// (`[...slug].astro`) quanto na geração estática (`export-static.mjs`).

import fs from 'node:fs/promises';
import path from 'node:path';

export interface SiteConfig {
  siteName: string;
  baseUrl: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string;
  lang: string;
  author: string;
  twitterHandle: string;
  robotsDefault: string;
  organization: { name: string; logo: string; sameAs: string[] };
}

export interface PageSeo {
  title?: string;
  description?: string;
  robots?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  jsonLd?: string;
  extraHead?: string;
}

export const DEFAULT_SITE: SiteConfig = {
  siteName: 'Visual CMS 360°',
  baseUrl: '',
  defaultTitle: 'Visual CMS 360°',
  titleTemplate: '%s',
  defaultDescription: '',
  defaultOgImage: '',
  lang: 'pt-BR',
  author: '',
  twitterHandle: '',
  robotsDefault: 'index,follow',
  organization: { name: '', logo: '', sameAs: [] },
};

export async function loadSiteConfig(cwd = process.cwd()): Promise<SiteConfig> {
  try {
    const raw = await fs.readFile(path.resolve(cwd, 'src/data/site.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE,
      ...parsed,
      organization: { ...DEFAULT_SITE.organization, ...(parsed.organization || {}) },
    };
  } catch {
    return { ...DEFAULT_SITE };
  }
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Junta baseUrl + slug evitando barras duplicadas. index → raiz.
function buildUrl(baseUrl: string, slug: string): string {
  if (!baseUrl) return '';
  const base = baseUrl.replace(/\/+$/, '');
  if (!slug || slug === 'index') return base + '/';
  return base + '/' + slug.replace(/^\/+/, '');
}

// Torna um caminho de imagem absoluto quando há baseUrl; senão devolve como veio.
function absoluteImage(baseUrl: string, img: string): string {
  if (!img) return '';
  if (/^https?:\/\//i.test(img)) return img;
  if (!baseUrl) return img;
  return baseUrl.replace(/\/+$/, '') + '/' + img.replace(/^\/+/, '');
}

export interface ResolvedSeo {
  lang: string;
  title: string;
  tags: string;   // bloco HTML pronto para injetar no <head>
}

/**
 * Resolve a cascata e devolve o bloco de <head> pronto.
 * Regra: campo vazio na página herda do site.json; se ainda vazio, é omitido.
 * Se baseUrl estiver vazio, canonical e og:url são OMITIDOS (evita URLs quebradas).
 */
export function resolveSeo(seo: PageSeo, site: SiteConfig, slug: string): ResolvedSeo {
  seo = seo || {};
  const lang = site.lang || 'pt-BR';

  // Título com template (%s)
  const rawTitle = seo.title || site.defaultTitle || site.siteName || '';
  const title = rawTitle
    ? (site.titleTemplate || '%s').replace('%s', rawTitle)
    : (site.siteName || '');

  const description = seo.description || site.defaultDescription || '';
  const robots = seo.robots || site.robotsDefault || '';
  const ogType = seo.ogType || 'website';
  const twitterCard = seo.twitterCard || 'summary_large_image';

  // URL canônica: explícita > baseUrl+slug > omitida
  const pageUrl = seo.canonical || buildUrl(site.baseUrl, slug);

  const ogTitle = seo.ogTitle || rawTitle || site.defaultTitle || '';
  const ogDescription = seo.ogDescription || description;
  const ogImage = absoluteImage(site.baseUrl, seo.ogImage || site.defaultOgImage || '');

  const lines: string[] = [];

  if (title) lines.push(`<title>${esc(title)}</title>`);
  if (description) lines.push(`<meta name="description" content="${esc(description)}">`);
  if (site.author) lines.push(`<meta name="author" content="${esc(site.author)}">`);
  if (robots) lines.push(`<meta name="robots" content="${esc(robots)}">`);
  if (pageUrl) lines.push(`<link rel="canonical" href="${esc(pageUrl)}">`);

  // Open Graph
  lines.push(`<meta property="og:type" content="${esc(ogType)}">`);
  if (ogTitle) lines.push(`<meta property="og:title" content="${esc(ogTitle)}">`);
  if (ogDescription) lines.push(`<meta property="og:description" content="${esc(ogDescription)}">`);
  if (site.siteName) lines.push(`<meta property="og:site_name" content="${esc(site.siteName)}">`);
  if (pageUrl) lines.push(`<meta property="og:url" content="${esc(pageUrl)}">`);
  if (ogImage) lines.push(`<meta property="og:image" content="${esc(ogImage)}">`);

  // Twitter
  lines.push(`<meta name="twitter:card" content="${esc(twitterCard)}">`);
  if (site.twitterHandle) lines.push(`<meta name="twitter:site" content="${esc(site.twitterHandle)}">`);
  if (ogTitle) lines.push(`<meta name="twitter:title" content="${esc(ogTitle)}">`);
  if (ogDescription) lines.push(`<meta name="twitter:description" content="${esc(ogDescription)}">`);
  if (ogImage) lines.push(`<meta name="twitter:image" content="${esc(ogImage)}">`);

  // JSON-LD da página (texto livre — validado minimamente)
  const jsonLd = (seo.jsonLd || '').trim();
  if (jsonLd) {
    lines.push(`<script type="application/ld+json">${jsonLd}</script>`);
  }

  // JSON-LD de organização (global) — só se tiver nome
  if (site.organization && site.organization.name) {
    const org: any = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.organization.name,
    };
    if (site.baseUrl) org.url = site.baseUrl;
    if (site.organization.logo) org.logo = absoluteImage(site.baseUrl, site.organization.logo);
    if (Array.isArray(site.organization.sameAs) && site.organization.sameAs.length) {
      org.sameAs = site.organization.sameAs.filter(Boolean);
    }
    lines.push(`<script type="application/ld+json">${JSON.stringify(org)}</script>`);
  }

  // Tags <head> avulsas (escape hatch) — inseridas como vieram
  const extraHead = (seo.extraHead || '').trim();
  if (extraHead) lines.push(extraHead);

  return { lang, title, tags: lines.join('\n  ') };
}
