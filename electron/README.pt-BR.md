# Visual CMS 360° — Aplicação Desktop (Electron)

> 🌐 **Idioma:** **Português** · [English](README.md)

Empacota o VCMS360 como um aplicativo de desktop nativo (janela própria, ícone,
instalador), sem o usuário final precisar de Node/npm instalado.

## Como funciona

O app é um "invólucro" Electron em volta do próprio servidor do VCMS360:

1. Ao abrir, na **primeira execução** ele copia os dados iniciais (páginas,
   componentes, recursos) para uma pasta **gravável** do usuário.
2. Sobe o servidor SSR de produção (`dist/server/entry.mjs`) numa **porta fixa**
   (com o diretório de trabalho apontando para essa pasta gravável — é lá que o
   editor grava tudo: páginas, uploads, imagens importadas). A porta fixa mantém
   a origem estável, para o `localStorage` do editor persistir entre aberturas.
3. Abre a janela no editor assim que o servidor responde.
4. Ao fechar, encerra o servidor.

A exportação de site estático (botão "Build") roda **em processo, sem CLI**: como
o servidor de produção já está no ar, o app busca o HTML de cada página dele
mesmo e copia os assets já compilados. Não precisa de `npm`/Astro na máquina.

Onde ficam os dados (pasta gravável):

- **Linux:** `~/.config/Visual CMS 360/data`
- **Windows:** `%APPDATA%\Visual CMS 360\data`
- **macOS:** `~/Library/Application Support/Visual CMS 360/data`

O site estático exportado vai para `.../Visual CMS 360/site-estatico`
(menu **Arquivo → Abrir pasta de exportação**).

## Instalação: dois perfis (navegador vs desktop)

Só o modo desktop precisa do Electron — e ele já está em `devDependencies`.
Para instalar apenas o necessário, use os atalhos:

```bash
npm run setup:web       # só o site (navegador) — NÃO baixa o Electron
npm run setup:desktop   # tudo, incluindo Electron (para empacotar o app)
```

O `setup:web` mantém `npm run dev`, `npm run build` e `npm run export:static`
funcionando; ele só pula `electron` + `electron-builder` (economiza o download do
binário do Electron, ~150 MB).

> **Por que não `npm install --omit=electron`?**
> O `--omit` do npm **não aceita nome de pacote** — só os grupos `dev`,
> `optional` e `peer`. Então `--omit=electron` seria ignorado. O que funciona é
> `--omit=dev` (e como o Electron é a única devDependency aqui, na prática é a
> mesma intenção). Os scripts acima só embrulham isso com um nome mais claro; por
> baixo, `setup:web` = `npm install --omit=dev`.

Se você já rodou o install completo e quer remover só o Electron depois:

```bash
npm prune --omit=dev
```

## Rodar em desenvolvimento

```bash
npm run setup:desktop   # inclui electron e electron-builder (baixa o binário do Electron)
npm run electron:dev    # faz o build e abre o app
```

Em modo dev, o app usa a **própria pasta do projeto** como diretório de dados
(para você ver os dados reais durante o desenvolvimento).

## Gerar os instaladores

Cada comando faz o `npm run build` antes e depois empacota:

```bash
npm run dist:linux   # AppImage + .deb   (em /dist-desktop)
npm run dist:win     # instalador .exe (nsis)
npm run dist:mac     # .dmg
npm run dist         # todos os alvos configurados para o SO atual
```

Os arquivos gerados ficam em `dist-desktop/`.

### Importante sobre build multiplataforma

O empacotamento **normalmente precisa rodar no sistema-alvo**:

- **Linux (AppImage/.deb):** gere no Linux. ✅ é o caso mais simples aqui.
- **Windows (.exe):** gere no Windows. É possível gerar a partir do Linux com
  Wine instalado, mas o caminho recomendado é uma máquina Windows.
- **macOS (.dmg):** só é possível gerar **no macOS** (exigência da Apple), e
  para distribuir fora da sua máquina é preciso assinar/notarizar o app.

## Desinstalação e dados do usuário

Os dados que você cria no app (páginas, componentes, uploads, imagens
importadas) **não** ficam junto do programa — ficam na pasta gravável do usuário:

- **Linux:** `~/.config/Visual CMS 360/`
- **Windows:** `%APPDATA%\Visual CMS 360\`
- **macOS:** `~/Library/Application Support/Visual CMS 360/`

(No app, use **Arquivo → Abrir pasta de dados** para ver o caminho exato.)

**Desinstalar o `.deb` NÃO apaga essa pasta — e isso é proposital.** O `.deb`
(dpkg/apt) só remove os arquivos que ele instalou (em `/opt`). A pasta em
`~/.config` é criada em tempo de execução, por usuário, e não é rastreada pelo
gerenciador de pacotes — nem `apt remove` nem `apt purge` a removem. A vantagem é
que, ao reinstalar ou atualizar, seus sites continuam lá.

Para apagar os dados manualmente (irreversível):

```bash
rm -rf ~/.config/"Visual CMS 360"
```

Se você QUISER que a desinstalação limpe esses dados automaticamente, é possível
adicionar um script de pós-remoção ao `.deb`. Mas apagar dados do usuário na
desinstalação foge do padrão (inclusive do Debian Policy) e é arriscado (roda
como root e teria que varrer os `/home` de cada usuário), então deixei desativado
por segurança. É só pedir que eu adiciono.

## Notas

- **Ícone:** substitua `build/icon.png` (1024×1024) pelo ícone definitivo. O
  electron-builder gera automaticamente os formatos `.ico`/`.icns`.
- **Dependência via Git (A-Frame):** o `.npmrc` do projeto já traz
  `allow-git=all`, necessário desde o npm 12. Mantenha-o versionado.
- **Tamanho do pacote:** o Electron embute o Chromium (~150–200 MB). Para
  reduzir, é possível mover dependências que só servem ao build (astro, vite,
  tailwind, grapesjs…) para `devDependencies`, de modo que o electron-builder
  não as inclua no pacote. Isso é uma otimização opcional — teste o app
  empacotado após mexer nisso.
- **asar desligado:** o servidor lê `dist/client` e `node_modules` como arquivos
  reais em runtime; por isso o empacotamento usa `asar: false`.
