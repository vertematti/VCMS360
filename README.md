# VisualCMS360°

**VisualCMS360°** é um editor CMS local baseado em Node.js que integra edição visual de páginas web (GrapesJS), tours virtuais 360° (Pannellum + A-Frame), galerias de fotos e geração de sites estáticos via Astro.

---

## ✨ Funcionalidades

- **Editor visual de páginas** — drag-and-drop com GrapesJS + Tailwind CSS (Tailblocks)
- **Editor de componentes** — criação e reutilização de blocos customizados
- **Tour Virtual 360°** — tours panorâmicos com foto e vídeo 360°, hotspots interativos (imagem, vídeo, tooltip, navegação entre cenas)
- **Galeria de Fotos** — lightbox com zoom, pan, fullscreen e suporte a imagens mobile-first
- **Build integrado** — geração de site estático diretamente pelo editor
- **Exportar/Importar** — backup e restauração de todo o projeto em arquivo ZIP
- **Multi-página** — suporte a múltiplas páginas por projeto

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js **>= 22.12.0**
- npm

### Instalação

```bash
git clone https://github.com/seu-usuario/VisualCMS360.git
cd VisualCMS360
npm install
npm run dev
```

Acesse o editor em: [http://localhost:4321/editor](http://localhost:4321/editor)

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o site estático em `/dist` |
| `npm run preview` | Visualiza o build gerado |

---

## 📁 Estrutura do Projeto

```
VisualCMS360/
├── public/
│   ├── vendor/          # Bibliotecas JS/CSS de terceiros
│   └── uploads/         # Imagens enviadas pelo editor
├── src/
│   ├── layouts/
│   │   └── Layout.astro  # Layout principal com Tour Virtual e Galeria
│   └── pages/
│       ├── editor.astro          # Editor de páginas
│       ├── editor/
│       │   └── components.astro  # Editor de componentes
│       ├── api/                  # Endpoints da API
│       └── [...slug].astro       # Renderização das páginas editadas
├── scripts/
│   └── copy-vendor.mjs
├── LICENSE
├── NOTICE
└── package.json
```

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Licença | Uso |
|---|---|---|---|
| [Astro](https://astro.build) | ^6.4 | MIT | Framework SSR/SSG |
| [GrapesJS](https://grapesjs.com) | ^0.22 | BSD-3-Clause | Editor visual |
| [grapesjs-tailwind](https://github.com/digisquad/grapesjs-tailwind) | ^1.0 | MIT | Blocos Tailwind |
| [grapesjs-blocks-basic](https://github.com/GrapesJS/blocks-basic) | ^1.0 | BSD-3-Clause | Blocos básicos |
| [Pannellum](https://pannellum.org) | ^2.5 | MIT | Viewer panorâmico 360° |
| [A-Frame](https://aframe.io) | ^1.6 | MIT | Vídeo panorâmico 360° |
| [Tailwind CSS](https://tailwindcss.com) | ^4.2 | MIT | Estilização |
| [Cheerio](https://cheerio.js.org) | ^1.2 | MIT | Parser HTML server-side |

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** — veja o arquivo [LICENSE](./LICENSE) para detalhes.

As atribuições às bibliotecas de terceiros estão documentadas em [NOTICE](./NOTICE).

> **Nota sobre Creative Commons:** A licença CC BY 4.0 é destinada a obras criativas (textos, imagens, música). Para software, a MIT License oferece os mesmos princípios de abertura e atribuição, sendo o padrão reconhecido pela comunidade open-source. Se desejar que documentação ou assets visuais específicos sejam CC BY 4.0, isso pode ser declarado explicitamente nesses arquivos.

---

## 🤝 Contribuindo

1. Fork do repositório
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit (`git commit -m 'Add: MinhaFeature'`)
4. Push (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## ⚠️ Aviso

Editor local — não preparado para produção como serviço multi-usuário. Indicado para uso individual ou equipes pequenas em rede local.
