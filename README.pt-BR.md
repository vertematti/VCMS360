<p align="center">
  <img src="public/VisualCMS360header.png" alt="Visual CMS 360°" height="48">
</p>

<p align="center">
  <strong>Sistema de gerenciamento de conteúdo visual local para criação de sites estáticos com tours virtuais 360°, galerias de fotos e edição visual drag-and-drop.</strong>
</p>

<p align="center">
  <strong>Versão:</strong> 1.0.1 · <strong>Data de compilação:</strong> 2026-07-06
</p>

<p align="center">
  <a href="https://gersonlv.com.br/visual_cms_360">Documentação</a> ·
  <a href="https://github.com/vertematti/VCMS360">GitHub</a> ·
  <a href="mailto:gersonlv@gmail.com">Contato</a>
</p>

<p align="center">
  <img alt="License: GPL v3" src="https://img.shields.io/badge/License-GPLv3-blue.svg">
  <img alt="Node &gt;= 22" src="https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen">
  <img alt="Astro" src="https://img.shields.io/badge/Astro-7.x-orange">
</p>

<p align="center">
  <strong>Português</strong> ·
  <a href="README.md">English</a>
</p>

---

## 👤 Autor

| **Ogro-mor** | Gerson Luis Vertematti |
|---|---|
| **Portal** | [gersonlv.com.br](https://gersonlv.com.br) |
| **Contato** | [gersonlv@gmail.com](mailto:gersonlv@gmail.com) |
| **Documentação** | [gersonlv.com.br/visual_cms_360](https://gersonlv.com.br/visual_cms_360) |
| **GitHub** | [github.com/vertematti/VCMS360](https://github.com/vertematti/VCMS360) |

### 🌟 Open Maker — Educador Maker Voluntário

<img src="public/openmaker.png" alt="Open Maker" width="72" align="left" style="margin-right:14px;">

Gerson é **Educador Maker voluntário** do [Open Maker](https://www.dispensados.com.br), iniciativa dedicada à promoção da educação criativa, tecnologia acessível e cultura maker. O Visual CMS 360° nasceu desse espírito: uma ferramenta aberta, local e acessível para criadores de conteúdo.

<br clear="left">

---

## ✨ Funcionalidades

- **Editor visual de páginas** — drag-and-drop com GrapesJS + Tailwind CSS (Tailblocks)
- **Editor de componentes** — criação e reutilização de blocos customizados, com sincronização automática nas páginas que os utilizam
- **Tour Virtual 360°** — Foto 360° (Pannellum) e Vídeo 360° (A-Frame), com hotspots interativos de imagem, vídeo, tooltip e navegação entre cenas
- **Galeria de Fotos** — lightbox com zoom, pan, fullscreen e suporte mobile-first
- **Editor de código HTML/CSS/JS/jQuery** — campos separados com syntax highlight e indentação automática; o código jQuery é agregado e envolvido em `$(function(){ ... })` automaticamente nas páginas publicadas
- **Editor de classes CSS** — renomeação e edição de propriedades direto no Style Manager, com detecção de classes Tailwind
- **SEO completo** — metadados por página (title, description, Open Graph, Twitter Cards, JSON-LD) com preview ao vivo, configuração global do site em cascata, e geração de `sitemap.xml`/`robots.txt` no build estático
- **Build & publicação** — compilação SSR (`npm run build`) e exportação de site estático sem Node (`npm run export:static`) para qualquer host
- **Exportar/Importar** — backup e restauração seletiva de páginas e componentes em arquivo ZIP, com detecção de conflitos
- **Multi-página** — suporte a múltiplas páginas por projeto

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js >= 22.12.0**
- npm

### Instalação

```bash
git clone https://github.com/vertematti/VCMS360.git
cd VCMS360
npm install
npm run dev
```

Acesse o editor em: **[http://localhost:4321/editor](http://localhost:4321/editor)**

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento + editor em `http://localhost:4321/editor` |
| `npm run build` | Compila o projeto SSR para `/dist` (`dist/server` + `dist/client`) |
| `npm run preview` | Sobe localmente o build SSR de `/dist` para conferência |
| `npm run export:static` | Gera um **site estático** em `/dist-static` para publicar em qualquer host |

---

## 🌐 Publicando um site estático (`npm run export:static`)

O Visual CMS 360° roda em modo **SSR** (renderização no servidor, via Node) durante a edição e na pré-visualização. Mas o site final que você publica normalmente **não precisa de Node** — basta HTML, CSS, JS e imagens. É exatamente isso que o `export:static` produz.

### Por que existem dois "builds"?

- `npm run build` → gera a aplicação **SSR** em `/dist` (precisa de Node rodando para servir as páginas). É o que o editor e o `preview` usam.
- `npm run export:static` → gera o **site publicável** em `/dist-static` (HTML puro + assets, **sem Node**).

O `export:static` **não substitui** o `build` — ele depende dele.

### Fluxo de publicação (2 passos)

```bash
# 1. Compilar a aplicação SSR (obrigatório antes de exportar)
npm run build

# 2. Gerar o site estático a partir do SSR já compilado
npm run export:static
```

Ao final, a pasta **`/dist-static`** conterá o site pronto. Suba o **conteúdo dessa pasta** (não a pasta em si) na raiz de qualquer servidor estático: Apache, Nginx, GitHub Pages, Netlify, Vercel, Cloudflare Pages, ou hospedagem compartilhada comum.

### Como funciona (e por que é confiável)

O exportador **não reimplementa** a renderização. Ele sobe internamente o servidor de produção recém-compilado numa porta dedicada, pede cada página exatamente como um visitante pediria, e salva o HTML resultante em arquivo. Assim o estático é **idêntico** ao que o SSR entregaria — sem risco de divergência. Cada página vira `slug/index.html` (e a `index` vira `/index.html` na raiz), um formato compatível com qualquer host.

### O que é incluído e excluído

O site estático inclui todo o conteúdo de `dist/client` e `public/` (suas páginas, recursos (resources), e bibliotecas de `vendor/`). Os **favicons** (`favicon.ico` e `favicon.svg`) também são propagados e já vêm referenciados no `<head>` de cada página publicada (`<link rel="icon">`), com o `.svg` como ícone vetorial preferencial e o `.ico` como fallback universal. São **excluídos** automaticamente os recursos que pertencem apenas à interface do editor: a rota `/editor`, os scripts do editor em `js/` (`editor-main.js` e `components-main.js`, que as páginas publicadas nunca carregam), e as imagens `glv.png`, `openmaker.png` e `VisualCMS360header.png`.

Quando o **domínio base** está configurado em SEO → Configurações do Site, o exportador também gera **`sitemap.xml`** e **`robots.txt`** na raiz do site estático.

### Variáveis de ambiente (opcionais)

| Variável | Padrão | Função |
|---|---|---|
| `EXPORT_HOST` | `127.0.0.1` | Host do servidor temporário de exportação |
| `EXPORT_PORT` | `4477` | Porta dedicada do servidor de exportação (≠ 4321 do editor) |
| `EXPORT_OUT` | `./dist-static` | Pasta de saída do site estático |

Exemplo com porta alternativa (caso a 4477 esteja ocupada):

```bash
EXPORT_PORT=4488 npm run export:static
```

> **Por que uma porta dedicada?** O export precisa renderizar contra o servidor de **produção** (assets reais em `/assets`). Reaproveitar o `astro dev` da porta 4321 faria o HTML apontar para URLs de desenvolvimento (`/@vite/…`) que não existem no site estático.

---

## 📁 Estrutura do Projeto

```
VCMS360/
├── public/
│   ├── vendor/                    # Bibliotecas de terceiros (offline, sem CDN)
│   │   ├── grapes.min.js/css      # GrapesJS
│   │   ├── grapesjs-blocks-basic.min.js
│   │   ├── grapesjs-tailwind.min.js
│   │   ├── aframe.min.js          # A-Frame (vídeo 360°)
│   │   ├── pannellum.min.js/css   # Pannellum (foto 360°)
│   │   ├── jquery.min.js          # jQuery
│   │   └── fontawesome/           # Ícones (css/ + webfonts/)
│   ├── js/
│   │   ├── editor-main.js         # Lógica do editor de páginas
│   │   └── components-main.js     # Lógica do editor de componentes
│   ├── resources/                 # Imagens e vídeos enviados pelo editor (runtime)
│   ├── glv.png                    # Foto do autor (somente editor)
│   ├── openmaker.png              # Logo Open Maker (somente editor)
│   ├── VisualCMS360header.png     # Logo do header (somente editor)
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── data/                      # Dados persistidos (gravados em runtime)
│   │   ├── pages.json             # Páginas do site (inclui campo seo por página)
│   │   ├── components.json        # Componentes compartilhados
│   │   └── site.json              # Configuração global de SEO do site
│   ├── lib/
│   │   └── seo.ts                 # Resolvedor de SEO (cascata + tags <head>)
│   ├── layouts/
│   │   └── Layout.astro           # Layout base (Tour Virtual + Galeria + FA/jQuery)
│   ├── styles/
│   │   └── global.css             # Estilos globais
│   └── pages/
│       ├── editor.astro           # Interface do editor de páginas
│       ├── editor/
│       │   └── components.astro   # Interface do editor de componentes
│       ├── api/                   # Endpoints da API (SSR)
│       │   ├── save.ts            # Salvar página
│       │   ├── load.ts            # Carregar página
│       │   ├── delete.ts          # Excluir página
│       │   ├── build.ts           # Build do site
│       │   ├── export.ts          # Exportar projeto (ZIP)
│       │   ├── import.ts          # Importar projeto (ZIP)
│       │   ├── reset.ts           # Resetar páginas/componentes
│       │   ├── events.ts          # Server-Sent Events (sync em tempo real)
│       │   ├── site.ts            # Carregar/salvar configuração global de SEO
│       │   ├── assets/            # Upload e listagem de imagens
│       │   │   ├── upload.ts
│       │   │   └── load.ts
│       │   └── components/        # API dos componentes
│       │       ├── save.ts
│       │       ├── load.ts
│       │       └── delete.ts
│       └── [...slug].astro        # Renderização SSR das páginas publicadas
├── scripts/
│   ├── copy-vendor.mjs            # Copia bibliotecas vendor do node_modules
│   └── export-static.mjs          # Gera site estático em /dist-static
├── astro.config.mjs               # Configuração do Astro/Vite
├── LICENSE                        # GNU GPL v3
├── NOTICE                         # Atribuições de terceiros
└── package.json
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Licença | Uso |
|---|---|---|---|
| [Astro](https://astro.build) | ^7.0 | MIT | Framework SSR/SSG |
| [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) | ^11.0 | MIT | Adapter SSR para Node |
| [Vite](https://vitejs.dev) | ^8.0 | MIT | Bundler / dev server (via Astro) |
| [GrapesJS](https://grapesjs.com) | ^0.22 | BSD-3-Clause | Editor visual drag-and-drop |
| [grapesjs-tailwind](https://github.com/digisquad/grapesjs-tailwind) | ^1.0 | MIT | Blocos Tailwind CSS |
| [grapesjs-blocks-basic](https://github.com/GrapesJS/blocks-basic) | ^1.0 | BSD-3-Clause | Blocos básicos GrapesJS |
| [Pannellum](https://pannellum.org) | ^2.5 | MIT | Viewer de foto panorâmica 360° |
| [A-Frame](https://aframe.io) | ^1.6 | MIT | Vídeo panorâmico 360° (WebVR) |
| [Tailwind CSS](https://tailwindcss.com) | ^4.2 | MIT | Framework de estilização |
| [Cheerio](https://cheerio.js.org) | ^1.2 | MIT | Parser HTML server-side |
| [jQuery](https://jquery.com) | ^3.7 | MIT | Interatividade nas páginas publicadas |
| [Font Awesome](https://fontawesome.com) | ^6.5 | MIT + SIL OFL | Ícones |

> As dependências de terceiros **mantêm suas licenças originais** (MIT e BSD-3-Clause).
> A GPL v3 se aplica exclusivamente ao código original do Visual CMS 360°.

---

## 📄 Licença

**Visual CMS 360°** é software livre distribuído sob a
**GNU General Public License versão 3** (GPL v3).

```
Visual CMS 360° — Editor CMS local com suporte a tours virtuais 360°
Copyright (C) 2025  Gerson Luis Vertematti

Este programa é software livre: você pode redistribuí-lo e/ou
modificá-lo sob os termos da GNU General Public License conforme
publicada pela Free Software Foundation, na versão 3 da Licença,
ou (a seu critério) qualquer versão posterior.

Este programa é distribuído na esperança de que seja útil,
mas SEM QUALQUER GARANTIA; sem mesmo a garantia implícita de
COMERCIALIZAÇÃO ou ADEQUAÇÃO A UM DETERMINADO FIM.
Veja a GNU General Public License para mais detalhes.

Você deveria ter recebido uma cópia da GNU General Public License
junto com este programa. Se não, veja <https://www.gnu.org/licenses/>.
```

Texto completo em: [LICENSE](./LICENSE) · [gnu.org/licenses/gpl-3.0](https://www.gnu.org/licenses/gpl-3.0.html)

### O que isso significa na prática?

| Você pode | Você deve |
|---|---|
| ✅ Usar livremente | 📋 Manter o aviso de copyright |
| ✅ Estudar e modificar o código | 📋 Distribuir sob GPL v3 |
| ✅ Distribuir cópias | 📋 Disponibilizar o código-fonte |
| ✅ Distribuir versões modificadas | 📋 Indicar as modificações feitas |
| ❌ Distribuir como software proprietário | — |
| ❌ Sublicenciar sob outra licença | — |

### Dependências de Terceiros

Todas as atribuições estão documentadas em **[NOTICE](./NOTICE)**.

---

## 🔍 SEO

O Visual CMS 360° inclui um sistema de SEO em três níveis (por página, redes sociais e técnico), acessível pelo botão de **lupa 🔍** na barra de ferramentas do editor de páginas — posicionado ao lado do botão de importar projeto. O botão abre um modal organizado em três abas: **Página**, **Código (JSON-LD / Head)** e **Configurações do Site**.

### Aba "Página" — busca e redes sociais

Os metadados específicos de cada página são editados em formulário, com pré-visualização ao vivo de como o resultado aparece no Google e nas redes sociais:

- **Busca (Google)**: título, descrição, robots (index/noindex/nofollow) e URL canônica. Os campos de título e descrição têm **contador de caracteres** com indicação visual da faixa ideal (verde = bom, amarelo = curto, vermelho = longo) e um **preview do snippet do Google** atualizado em tempo real.
- **Redes sociais (Open Graph)**: `og:title`, `og:description`, `og:image`, `og:type` e `twitter:card`, com **preview de card social** mostrando como o link aparece ao ser compartilhado.

### Aba "Código (JSON-LD / Head)" — uso avançado

Para quem precisa de controle fino:

- **JSON-LD** — bloco de dados estruturados schema.org da página, injetado em `<script type="application/ld+json">`.
- **Tags `<head>` avulsas** — HTML extra inserido no `<head>` (verificação de domínio, meta tags customizadas, etc.).

### Aba "Configurações do Site" — global

Valores globais herdados por todas as páginas: nome do site, domínio base (`baseUrl`), título padrão, **template de título** (ex.: `%s — Meu Site`), descrição padrão, imagem OG padrão, idioma (`lang`), autor, handle do Twitter, robots padrão e dados de **organização** (nome, logo, redes sociais) usados no JSON-LD global.

### Cascata e fluxo de salvamento

**Cascata:** qualquer campo deixado em branco numa página herda automaticamente o valor global definido em Configurações do Site. Isso evita repetição e garante defaults consistentes em todo o site.

O SEO da página fica **pendente** ao clicar em *Aplicar SEO da página*, sendo persistido somente quando você **salva a página** (mesmo botão de salvar do conteúdo). Já a configuração global é gravada imediatamente pelo botão *Salvar config do site*.

### Domínio base e URLs

A **URL canônica** e a `og:url` são absolutas e dependem do **Domínio base** (`baseUrl`) configurado globalmente. Enquanto ele estiver vazio, essas tags são omitidas (em vez de gerar URLs quebradas), já que o site estático é portável e pode ser publicado em qualquer host. Imagens OG relativas (ex.: `/resources/og.jpg`) também são convertidas em URLs absolutas quando o domínio está definido. Defina o domínio antes de publicar.

### Sitemap e robots.txt

Ao rodar `npm run export:static`, se o domínio base estiver configurado, são gerados automaticamente:

- **`sitemap.xml`** — lista todas as páginas (exceto as marcadas como `noindex`)
- **`robots.txt`** — com a referência ao sitemap

Os dados são persistidos em `src/data/site.json` (global) e no campo `seo` de cada página em `src/data/pages.json`. Toda a resolução da cascata e a montagem das tags `<head>` ficam centralizadas em `src/lib/seo.ts`, reutilizado tanto na renderização SSR quanto na geração estática. As configurações de SEO são incluídas no backup ao exportar o projeto em ZIP.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork do repositório
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit (`git commit -m 'Add: MinhaFeature'`)
4. Push (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

Ao contribuir, você concorda que suas contribuições serão licenciadas
sob a mesma GPL v3.

---

## ⚠️ Aviso de Uso

Este é um **editor local** — não está preparado para produção como serviço multi-usuário público. É indicado para uso individual ou em equipes pequenas com acesso à mesma máquina ou rede local.

---

<p align="center">
  <a href="https://gersonlv.com.br">Gerson Luis Vertematti</a> ·
  <a href="https://www.dispensados.com.br">Open Maker</a> ·
  <a href="https://www.gnu.org/licenses/gpl-3.0.html">GNU GPL v3</a>
</p>
