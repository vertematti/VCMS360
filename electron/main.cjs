// Visual CMS 360° — Aplicação desktop (Electron)
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// O QUE FAZ
// ─────────
// Embrulha o VCMS360 numa janela nativa. No arranque:
//   1. Semeia (na 1ª vez) uma pasta gravável de dados do usuário.
//   2. Sobe o servidor SSR de produção (dist/server/entry.mjs) numa porta livre,
//      com cwd = pasta de dados (é lá que o editor grava páginas/uploads).
//   3. Abre a janela apontando para /editor quando o servidor responde.
// Ao sair, derruba o servidor.

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { findFreePort, waitForServer, seedDataDir, spawnServer } = require('./lib.cjs');

// Nome fixo do app → garante que a pasta de dados seja sempre
// ~/.config/Visual CMS 360 (Linux), independente de name/productName.
// Precisa vir ANTES de qualquer app.getPath('userData').
app.setName('Visual CMS 360');

const HOST = '127.0.0.1';
// Porta FIXA preferida do app desktop. Mantê-la estável faz o localStorage do
// editor (ex.: "Não exibir na inicialização" do painel Sobre) persistir entre
// aberturas, pois o localStorage é isolado por origem (host:porta). Se estiver
// ocupada, cai para uma porta aleatória livre (só nesse caso a preferência pode
// não persistir). Escolhida uma porta alta e incomum para não colidir com o
// servidor de desenvolvimento (npm run dev, 4321).
const PREFERRED_PORT = 47360;

// Em produção (empacotado) os arquivos ficam em resources/app (asar desligado).
// Em dev, a raiz é a própria pasta do projeto.
const APP_ROOT     = app.isPackaged ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..');
const SERVER_ENTRY = path.join(APP_ROOT, 'dist', 'server', 'entry.mjs');
const CLIENT_DIR   = path.join(APP_ROOT, 'dist', 'client');
const SEED_DIR     = path.join(APP_ROOT, 'electron', 'seed');

// Pasta gravável: em produção, userData; em dev, usamos o próprio projeto para
// enxergar os dados reais durante o desenvolvimento.
const DATA_DIR = app.isPackaged ? path.join(app.getPath('userData'), 'data') : APP_ROOT;
const OUT_DIR  = path.join(app.getPath('userData'), 'site-estatico');

let serverProc = null;
let mainWindow = null;
let baseUrl = '';

function startServer() {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Semear dados na primeira execução (somente no app empacotado; em dev
      //    o projeto já tem src/data).
      if (app.isPackaged) await seedDataDir(SEED_DIR, DATA_DIR);

      if (!fs.existsSync(SERVER_ENTRY)) {
        return reject(new Error('Build não encontrado (dist/server/entry.mjs). Rode "npm run build" antes.'));
      }

      // 2. Porta livre + servidor
      const port = await findFreePort(HOST, PREFERRED_PORT);
      baseUrl = `http://${HOST}:${port}`;

      serverProc = spawnServer({
        execPath:    process.execPath,   // o próprio Electron (roda como Node)
        serverEntry: SERVER_ENTRY,
        cwd:         DATA_DIR,
        host:        HOST,
        port,
        clientDir:   CLIENT_DIR,
        outDir:      OUT_DIR,
        asNode:      true,
        onLog:       (t) => process.stdout.write('[vcms-server] ' + t),
      });
      serverProc.on('error', reject);
      serverProc.on('exit', (code) => {
        if (code && code !== 0 && !app.isQuitting) {
          console.error('[vcms] servidor encerrou com código', code);
        }
      });

      // 3. Esperar ficar pronto
      const ok = await waitForServer(baseUrl + '/', 30000);
      if (!ok) return reject(new Error('O servidor não respondeu a tempo.'));
      resolve();
    } catch (e) { reject(e); }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0d0d1a',
    title: 'Visual CMS 360°',
    icon: path.join(APP_ROOT, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  mainWindow.loadURL(baseUrl + '/editor');

  // Links externos (http/https para outros domínios) abrem no navegador padrão,
  // não dentro do app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(baseUrl)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Abrir pasta de exportação',
          click: async () => {
            try { fs.mkdirSync(OUT_DIR, { recursive: true }); } catch (e) {}
            shell.openPath(OUT_DIR);
          },
        },
        {
          label: 'Abrir pasta de dados',
          click: () => shell.openPath(DATA_DIR),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Sair' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' }, { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' }, { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' }, { role: 'selectAll', label: 'Selecionar tudo' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar recarregamento' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom padrão' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Diminuir zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela cheia' },
        { role: 'toggleDevTools', label: 'Ferramentas de desenvolvedor' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre o Visual CMS 360°',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Visual CMS 360°',
            message: 'Visual CMS 360°',
            detail: 'Aplicação desktop.\nOs dados ficam em:\n' + DATA_DIR,
            buttons: ['OK'],
          }),
        },
        { label: 'Site do projeto', click: () => shell.openExternal('https://gersonlv.com.br/visual_cms_360') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Impede múltiplas instâncias (evita conflito de porta/dados).
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });

  app.whenReady().then(async () => {
    buildMenu();
    try {
      await startServer();
      createWindow();
    } catch (e) {
      dialog.showErrorBox('Falha ao iniciar o Visual CMS 360°', String(e && e.message || e));
      app.quit();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0 && baseUrl) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
    if (serverProc && !serverProc.killed) { try { serverProc.kill(); } catch (e) {} }
  });
}
