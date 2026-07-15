<p align="center">
  <img src="public/VisualCMS360header.png" alt="Visual CMS 360°" height="48">
</p>

<p align="center">
  <strong>Local visual content management system for building static sites with 360° virtual tours, photo galleries and drag-and-drop visual editing.</strong>
</p>

<p align="center">
  <strong>Version:</strong> 1.0.2 · <strong>Build date:</strong> 2026-07-15
</p>

<p align="center">
  <a href="https://gersonlv.com.br/visual_cms_360">Documentation</a> ·
  <a href="https://github.com/vertematti/VCMS360">GitHub</a> ·
  <a href="mailto:gersonlv@gmail.com">Contact</a>
</p>

<p align="center">
  <img alt="License: GPL v3" src="https://img.shields.io/badge/License-GPLv3-blue.svg">
  <img alt="Node &gt;= 22" src="https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen">
  <img alt="Astro" src="https://img.shields.io/badge/Astro-7.x-orange">
</p>

<p align="center">
  <a href="README.pt-BR.md">Português</a> ·
  <strong>English</strong>
</p>

---

## 👤 Author

| **Ogro-mor** | Gerson Luis Vertematti |
|---|---|
| **Portal** | [gersonlv.com.br](https://gersonlv.com.br) |
| **Contact** | [gersonlv@gmail.com](mailto:gersonlv@gmail.com) |
| **Documentation** | [gersonlv.com.br/visual_cms_360](https://gersonlv.com.br/visual_cms_360) |
| **GitHub** | [github.com/vertematti/VCMS360](https://github.com/vertematti/VCMS360) |

### 🌟 Open Maker — Volunteer Maker Educator

<img src="public/openmaker.png" alt="Open Maker" width="72" align="left" style="margin-right:14px;">

Gerson is a **volunteer Maker Educator** at [Open Maker](https://www.dispensados.com.br), an initiative dedicated to promoting creative education, accessible technology and maker culture. Visual CMS 360° was born from that spirit: an open, local and accessible tool for content creators.

<br clear="left">

---

## ✨ Features

- **Visual page editor** — drag-and-drop with GrapesJS + Tailwind CSS (Tailblocks)
- **Component editor** — create and reuse custom blocks, with automatic synchronization across the pages that use them
- **360° Virtual Tour** — 360° Photo (Pannellum) and 360° Video (A-Frame), with interactive image, video, tooltip and scene-navigation hotspots
- **Photo Gallery** — lightbox with zoom, pan, fullscreen and mobile-first support
- **HTML/CSS/JS/jQuery code editor** — separate fields with syntax highlighting and automatic indentation; jQuery code is aggregated and automatically wrapped in `$(function(){ ... })` on the published pages
- **CSS class editor** — rename and edit properties straight from the Style Manager, with Tailwind class detection
- **Full SEO** — per-page metadata (title, description, Open Graph, Twitter Cards, JSON-LD) with live preview, cascading site-wide configuration, and generation of `sitemap.xml`/`robots.txt` in the static build
- **Build & publish** — SSR compilation (`npm run build`) and Node-free static site export (`npm run export:static`) for any host
- **Export/Import** — selective backup and restore of pages and components in a ZIP file, with conflict detection
- **Multi-page** — support for multiple pages per project

---

## 🚀 Quick Start

### Prerequisites

- **Node.js >= 22.12.0**
- npm

### Installation

VCMS 360° can run in two ways: **conventionally in the browser**, or as a
**standalone desktop application** (Electron). Pick the matching command instead
of `npm install`:

```bash
git clone https://github.com/vertematti/VCMS360.git
cd VCMS360

npm run setup:web       # browser mode only — does NOT download Electron
# or
npm run setup:desktop   # full install, including Electron (to build the app)
```

Then, for the browser mode, start the dev server:

```bash
npm run dev
```

Open the editor at: **[http://localhost:4321/editor](http://localhost:4321/editor)**

> 🖥️ **Standalone desktop app (Electron):** VCMS 360° can also be packaged as a
> native desktop application (own window + installer for Linux/Windows/macOS),
> running the same editor offline. Full guide:
> **[electron/README.md](electron/README.md)**.

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server + editor at `http://localhost:4321/editor` |
| `npm run build` | Compiles the SSR project to `/dist` (`dist/server` + `dist/client`) |
| `npm run preview` | Serves the SSR build from `/dist` locally for review |
| `npm run export:static` | Generates a **static site** in `/dist-static` to publish on any host |
| `npm run setup:web` | Installs **browser mode** only (does not download Electron) |
| `npm run setup:desktop` | Full install, **with Electron** (to build the desktop app) |
| `npm run electron:dev` | Builds and opens the **desktop app** (Electron) for testing |
| `npm run dist:linux` | Builds the desktop installer (AppImage + `.deb`) in `/dist-desktop` |
| `npm run dist:win` / `dist:mac` | Windows (`.exe`) / macOS (`.dmg`) installer — see the [Electron guide](electron/README.md) |

---

## 🌐 Publishing a static site (`npm run export:static`)

Visual CMS 360° runs in **SSR** mode (server-side rendering, via Node) while editing and previewing. But the final site you publish usually **doesn't need Node** — just HTML, CSS, JS and images. That's exactly what `export:static` produces.

### Why are there two "builds"?

- `npm run build` → generates the **SSR** application in `/dist` (needs Node running to serve the pages). It's what the editor and `preview` use.
- `npm run export:static` → generates the **publishable site** in `/dist-static` (pure HTML + assets, **no Node**).

`export:static` **does not replace** `build` — it depends on it.

### Publishing flow (2 steps)

```bash
# 1. Compile the SSR application (required before exporting)
npm run build

# 2. Generate the static site from the already-compiled SSR
npm run export:static
```

At the end, the **`/dist-static`** folder will contain the ready-to-use site. Upload the **contents of that folder** (not the folder itself) to the root of any static server: Apache, Nginx, GitHub Pages, Netlify, Vercel, Cloudflare Pages, or common shared hosting.

### How it works (and why it's reliable)

The exporter **does not reimplement** rendering. It internally starts the freshly-compiled production server on a dedicated port, requests each page exactly as a visitor would, and saves the resulting HTML to a file. This makes the static output **identical** to what the SSR would deliver — with no risk of divergence. Each page becomes `slug/index.html` (and `index` becomes `/index.html` at the root), a format compatible with any host.

### What is included and excluded

The static site includes all content from `dist/client` and `public/` (your pages, resources, and libraries from `vendor/`). The **favicons** (`favicon.ico` and `favicon.svg`) are also propagated and already referenced in the `<head>` of every published page (`<link rel="icon">`), with the `.svg` as the preferred vector icon and the `.ico` as a universal fallback. Resources that belong only to the editor interface are automatically **excluded**: the `/editor` route, the editor scripts in `js/` (`editor-main.js` and `components-main.js`, which published pages never load), and the images `glv.png`, `openmaker.png` and `VisualCMS360header.png`.

When the **base domain** is configured under SEO → Site Settings, the exporter also generates **`sitemap.xml`** and **`robots.txt`** at the root of the static site.

### Environment variables (optional)

| Variable | Default | Purpose |
|---|---|---|
| `EXPORT_HOST` | `127.0.0.1` | Host of the temporary export server |
| `EXPORT_PORT` | `4477` | Dedicated port of the export server (≠ 4321 of the editor) |
| `EXPORT_OUT` | `./dist-static` | Output folder of the static site |

Example with an alternative port (in case 4477 is busy):

```bash
EXPORT_PORT=4488 npm run export:static
```

> **Why a dedicated port?** The export needs to render against the **production** server (real assets under `/assets`). Reusing `astro dev` on port 4321 would make the HTML point to development URLs (`/@vite/…`) that don't exist on the static site.

---

## 📁 Project Structure

```
VCMS360/
├── public/
│   ├── vendor/                    # Third-party libraries (offline, no CDN)
│   │   ├── grapes.min.js/css      # GrapesJS
│   │   ├── grapesjs-blocks-basic.min.js
│   │   ├── grapesjs-tailwind.min.js
│   │   ├── aframe.min.js          # A-Frame (360° video)
│   │   ├── pannellum.min.js/css   # Pannellum (360° photo)
│   │   ├── jquery.min.js          # jQuery
│   │   └── fontawesome/           # Icons (css/ + webfonts/)
│   ├── js/
│   │   ├── editor-main.js         # Page editor logic
│   │   └── components-main.js     # Component editor logic
│   ├── resources/                 # Images and videos uploaded by the editor (runtime)
│   ├── glv.png                    # Author photo (editor only)
│   ├── openmaker.png              # Open Maker logo (editor only)
│   ├── VisualCMS360header.png     # Header logo (editor only)
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── data/                      # Persisted data (written at runtime)
│   │   ├── pages.json             # Site pages (includes per-page seo field)
│   │   ├── components.json        # Shared components
│   │   └── site.json              # Global site SEO configuration
│   ├── lib/
│   │   └── seo.ts                 # SEO resolver (cascade + <head> tags)
│   ├── layouts/
│   │   └── Layout.astro           # Base layout (Virtual Tour + Gallery + FA/jQuery)
│   ├── styles/
│   │   └── global.css             # Global styles
│   └── pages/
│       ├── editor.astro           # Page editor interface
│       ├── editor/
│       │   └── components.astro   # Component editor interface
│       ├── api/                   # API endpoints (SSR)
│       │   ├── save.ts            # Save page
│       │   ├── load.ts            # Load page
│       │   ├── delete.ts          # Delete page
│       │   ├── build.ts           # Site build
│       │   ├── export.ts          # Export project (ZIP)
│       │   ├── import.ts          # Import project (ZIP)
│       │   ├── reset.ts           # Reset pages/components
│       │   ├── events.ts          # Server-Sent Events (real-time sync)
│       │   ├── site.ts            # Load/save global SEO configuration
│       │   ├── assets/            # Image upload and listing
│       │   │   ├── upload.ts
│       │   │   └── load.ts
│       │   └── components/        # Components API
│       │       ├── save.ts
│       │       ├── load.ts
│       │       └── delete.ts
│       ├── resources/
│       │   └── [...path].ts        # Serves runtime-uploaded resources/images
│       ├── uploads/
│       │   └── [...path].ts        # Serves runtime uploads
│       └── [...slug].astro        # SSR rendering of published pages
├── scripts/
│   ├── copy-vendor.mjs            # Copies vendor libraries from node_modules
│   └── export-static.mjs          # Generates static site in /dist-static
├── electron/                      # Desktop app (Electron)
│   ├── main.cjs                   # Main process (window + boots the server)
│   ├── lib.cjs                    # Helpers (free port, seed, spawn server)
│   ├── seed/                      # Initial data (copied on first run)
│   ├── README.md                  # Desktop app guide (English)
│   └── README.pt-BR.md            # Desktop app guide (Portuguese)
├── build/
│   └── icon.png                   # Desktop app icon (1024×1024)
├── samples/
│   └── visualcms360-export-*.zip  # Sample project for testing import
├── astro.config.mjs               # Astro/Vite configuration
├── electron-builder.yml           # Desktop packaging configuration
├── .npmrc                         # allow-git=all (A-Frame's transitive Git dep)
├── LICENSE                        # GNU GPL v3
├── NOTICE                         # Third-party attributions
├── README.md                      # Documentation (English)
├── README.pt-BR.md                # Documentation (Portuguese)
└── package.json
```

---

## 🛠️ Technologies Used

| Technology | Version | License | Use |
|---|---|---|---|
| [Astro](https://astro.build) | ^7.0 | MIT | SSR/SSG framework |
| [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) | ^11.0 | MIT | SSR adapter for Node |
| [Vite](https://vitejs.dev) | ^8.0 | MIT | Bundler / dev server (via Astro) |
| [GrapesJS](https://grapesjs.com) | ^0.22 | BSD-3-Clause | Visual drag-and-drop editor |
| [grapesjs-tailwind](https://github.com/digisquad/grapesjs-tailwind) | ^1.0 | MIT | Tailwind CSS blocks |
| [grapesjs-blocks-basic](https://github.com/GrapesJS/blocks-basic) | ^1.0 | BSD-3-Clause | Basic GrapesJS blocks |
| [Pannellum](https://pannellum.org) | ^2.5 | MIT | 360° panoramic photo viewer |
| [A-Frame](https://aframe.io) | ^1.6 | MIT | 360° panoramic video (WebVR) |
| [Tailwind CSS](https://tailwindcss.com) | ^4.2 | MIT | Styling framework |
| [Cheerio](https://cheerio.js.org) | ^1.2 | MIT | Server-side HTML parser |
| [jQuery](https://jquery.com) | ^3.7 | MIT | Interactivity on published pages |
| [Font Awesome](https://fontawesome.com) | ^6.5 | MIT + SIL OFL | Icons |
| [Electron](https://www.electronjs.org) | ^35.0 | MIT | Desktop app runtime (standalone build) |
| [electron-builder](https://www.electron.build) | ^26.0 | MIT | Desktop installers (Linux/Windows/macOS) |

> Third-party dependencies **keep their original licenses** (MIT and BSD-3-Clause).
> GPL v3 applies exclusively to the original Visual CMS 360° code.

---

## 📄 License

**Visual CMS 360°** is free software distributed under the
**GNU General Public License version 3** (GPL v3).

```
Visual CMS 360° — Local CMS editor with 360° virtual tour support
Copyright (C) 2025  Gerson Luis Vertematti

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

Full text at: [LICENSE](./LICENSE) · [gnu.org/licenses/gpl-3.0](https://www.gnu.org/licenses/gpl-3.0.html)

### What does this mean in practice?

| You may | You must |
|---|---|
| ✅ Use it freely | 📋 Keep the copyright notice |
| ✅ Study and modify the code | 📋 Distribute under GPL v3 |
| ✅ Distribute copies | 📋 Make the source code available |
| ✅ Distribute modified versions | 📋 State the changes you made |
| ❌ Distribute as proprietary software | — |
| ❌ Sublicense under another license | — |

### Third-Party Dependencies

All attributions are documented in **[NOTICE](./NOTICE)**.

---

## 🔍 SEO

Visual CMS 360° includes a three-level SEO system (per page, social networks and technical), accessible through the **magnifier 🔍** button in the page editor's toolbar — placed next to the import-project button. The button opens a modal organized into three tabs: **Page**, **Code (JSON-LD / Head)** and **Site Settings**.

### "Page" tab — search and social networks

Each page's specific metadata is edited via a form, with a live preview of how the result appears on Google and social networks:

- **Search (Google)**: title, description, robots (index/noindex/nofollow) and canonical URL. The title and description fields have a **character counter** with a visual indication of the ideal range (green = good, yellow = short, red = long) and a **Google snippet preview** updated in real time.
- **Social networks (Open Graph)**: `og:title`, `og:description`, `og:image`, `og:type` and `twitter:card`, with a **social card preview** showing how the link appears when shared.

### "Code (JSON-LD / Head)" tab — advanced use

For those who need fine-grained control:

- **JSON-LD** — the page's schema.org structured-data block, injected into `<script type="application/ld+json">`.
- **Standalone `<head>` tags** — extra HTML inserted into the `<head>` (domain verification, custom meta tags, etc.).

### "Site Settings" tab — global

Global values inherited by all pages: site name, base domain (`baseUrl`), default title, **title template** (e.g. `%s — My Site`), default description, default OG image, language (`lang`), author, Twitter handle, default robots and **organization** data (name, logo, social networks) used in the global JSON-LD.

### Cascade and saving flow

**Cascade:** any field left blank on a page automatically inherits the global value defined in Site Settings. This avoids repetition and ensures consistent defaults across the whole site.

The page SEO becomes **pending** when you click *Apply page SEO*, and is only persisted when you **save the page** (the same save button as the content). The global configuration, in turn, is written immediately by the *Save site config* button.

### Base domain and URLs

The **canonical URL** and `og:url` are absolute and depend on the **base domain** (`baseUrl`) configured globally. While it is empty, these tags are omitted (instead of generating broken URLs), since the static site is portable and can be published on any host. Relative OG images (e.g. `/resources/og.jpg`) are also converted into absolute URLs when the domain is set. Set the domain before publishing.

### Sitemap and robots.txt

When running `npm run export:static`, if the base domain is configured, the following are generated automatically:

- **`sitemap.xml`** — lists all pages (except those marked as `noindex`)
- **`robots.txt`** — with a reference to the sitemap

Data is persisted in `src/data/site.json` (global) and in the `seo` field of each page in `src/data/pages.json`. All cascade resolution and `<head>` tag assembly are centralized in `src/lib/seo.ts`, reused both in SSR rendering and static generation. SEO settings are included in the backup when exporting the project as a ZIP.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a branch (`git checkout -b feature/MyFeature`)
3. Commit (`git commit -m 'Add: MyFeature'`)
4. Push (`git push origin feature/MyFeature`)
5. Open a Pull Request

By contributing, you agree that your contributions will be licensed
under the same GPL v3.

---

## ⚠️ Usage Notice

This is a **local editor** — it is not intended for production as a public multi-user service. It is suited for individual use or small teams with access to the same machine or local network.

---

<p align="center">
  <a href="https://gersonlv.com.br">Gerson Luis Vertematti</a> ·
  <a href="https://www.dispensados.com.br">Open Maker</a> ·
  <a href="https://www.gnu.org/licenses/gpl-3.0.html">GNU GPL v3</a>
</p>
