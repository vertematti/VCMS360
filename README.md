<p align="center">
  <img src="public/VisualCMS360header.png" alt="Visual CMS 360°" height="48">
</p>

<p align="center">
  <strong>Editor CMS local para criação de sites estáticos com tours virtuais 360°, galerias de fotos e edição visual drag-and-drop.</strong>
</p>

<p align="center">
  <a href="https://gersonlv.com.br/visual_cms_360">Documentação</a> ·
  <a href="https://github.com/vertematti/VisualCMS360">GitHub</a> ·
  <a href="mailto:gersonlv@gmail.com">Contato</a>
</p>

<p align="center">
  <img alt="License: GPL v3" src="https://img.shields.io/badge/License-GPLv3-blue.svg">
  <img alt="Node >= 22" src="https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen">
  <img alt="Astro" src="https://img.shields.io/badge/Astro-6.x-orange">
</p>

---

## 👤 Autor

| **Ogro-mor** | Gerson Luis Vertematti |
|---|---|
| **Portal** | [gersonlv.com.br](https://gersonlv.com.br) |
| **Contato** | [gersonlv@gmail.com](mailto:gersonlv@gmail.com) |
| **Documentação** | [gersonlv.com.br/visual_cms_360](https://gersonlv.com.br/visual_cms_360) |
| **GitHub** | [github.com/vertematti/VisualCMS360](https://github.com/vertematti/VisualCMS360) |

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
git clone https://github.com/vertematti/VisualCMS360.git
cd VisualCMS360
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

O site estático inclui todo o conteúdo de `dist/client` e `public/` (suas páginas, uploads, e bibliotecas de `vendor/`). São **excluídos** automaticamente os recursos que pertencem apenas à interface do editor: a rota `/editor`, e as imagens `glv.png`, `openmaker.png` e `VisualCMS360header.png`.

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

> **Por que uma porta dedicada?** O export precisa renderizar contra o servidor de **produção** (assets reais em `/_astro`). Reaproveitar o `astro dev` da porta 4321 faria o HTML apontar para URLs de desenvolvimento (`/@vite/…`) que não existem no site estático.

---

## 📁 Estrutura do Projeto

```
VisualCMS360/
├── public/
│   ├── vendor/              # Bibliotecas JS/CSS de terceiros
│   ├── js/                  # Scripts principais do editor
│   │   ├── editor-main.js   # Lógica do editor de páginas
│   │   └── components-main.js # Lógica do editor de componentes
│   ├── uploads/             # Imagens enviadas pelo editor (runtime)
│   └── openmaker.png        # Logo Open Maker
├── src/
│   ├── layouts/
│   │   └── Layout.astro     # Layout com Tour Virtual e Galeria
│   └── pages/
│       ├── editor.astro           # Editor de páginas
│       ├── editor/
│       │   └── components.astro   # Editor de componentes
│       ├── api/                   # Endpoints da API (save, load, build, export...)
│       └── [...slug].astro        # Renderização das páginas editadas
├── scripts/
│   └── copy-vendor.mjs      # Copia vendor files do node_modules
├── LICENSE                  # GNU GPL v3
├── NOTICE                   # Atribuições de terceiros
└── package.json
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Licença | Uso |
|---|---|---|---|
| [Astro](https://astro.build) | ^6.4 | MIT | Framework SSR/SSG |
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
