// Visual CMS 360° — utilitários do app desktop (Electron)
// GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
//
// Funções PURAS (sem dependência do Electron) para serem testáveis com Node
// puro. O main.cjs consome estas funções.

const net = require('node:net');
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Descobre uma porta TCP para o servidor.
// - Se `preferred` for informada e estiver livre, usa-a (origem estável → o
//   localStorage do editor persiste entre aberturas do app).
// - Se estiver ocupada (ou não informada), o SO escolhe uma livre (:0).
function findFreePort(host = '127.0.0.1', preferred = 0) {
  const tryListen = (port) => new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(port, host, () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
  if (preferred && preferred > 0) {
    return tryListen(preferred).catch(() => tryListen(0));
  }
  return tryListen(0);
}

// Aguarda o servidor HTTP responder (qualquer status serve — só queremos saber
// que a porta está atendendo). Resolve true se respondeu dentro do tempo.
function waitForServer(baseUrl, timeoutMs = 30000, intervalMs = 300) {
  const start = Date.now();
  return new Promise((resolve) => {
    const tryOnce = () => {
      const req = http.request(baseUrl, { method: 'HEAD', timeout: 2000 }, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
      req.end();
    };
    const retry = () => {
      if (Date.now() - start >= timeoutMs) return resolve(false);
      setTimeout(tryOnce, intervalMs);
    };
    tryOnce();
  });
}

// Semeia o diretório de dados gravável do usuário na PRIMEIRA execução.
// Copia `seedDir` → `dataDir` apenas se o destino ainda não tiver os dados,
// e garante a estrutura mínima (src/data, public/resources, public/uploads).
// Retorna dataDir.
async function seedDataDir(seedDir, dataDir) {
  const pagesPath = path.join(dataDir, 'src', 'data', 'pages.json');
  const alreadySeeded = fs.existsSync(pagesPath);

  if (!alreadySeeded) {
    await fsp.mkdir(dataDir, { recursive: true });
    if (fs.existsSync(seedDir)) {
      await fsp.cp(seedDir, dataDir, { recursive: true });
    }
  }

  // Garante a estrutura mínima mesmo que a semente esteja incompleta.
  for (const rel of ['src/data', 'public/resources', 'public/uploads']) {
    await fsp.mkdir(path.join(dataDir, rel), { recursive: true });
  }
  return dataDir;
}

// Sobe o servidor SSR de produção (dist/server/entry.mjs) como processo filho.
// - execPath: binário que roda o Node (em produção é o próprio Electron com
//   ELECTRON_RUN_AS_NODE=1; em teste, o node do sistema).
// - cwd: pasta gravável de dados (define process.cwd() usado pelas rotas de API).
// - clientDir/outDir: informados ao servidor para a exportação estática sem CLI.
// Retorna o ChildProcess.
function spawnServer(opts) {
  const {
    execPath, serverEntry, cwd, host, port,
    clientDir, outDir, extraEnv = {}, asNode = true, onLog,
  } = opts;

  const env = {
    ...process.env,
    HOST: host,
    PORT: String(port),
    VCMS_DESKTOP: '1',
    VCMS_CLIENT_DIR: clientDir || '',
    VCMS_OUT_DIR: outDir || '',
    ...extraEnv,
  };
  if (asNode) env.ELECTRON_RUN_AS_NODE = '1';

  const child = spawn(execPath, [serverEntry], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  if (onLog) {
    child.stdout.on('data', (b) => onLog(b.toString()));
    child.stderr.on('data', (b) => onLog(b.toString()));
  }
  return child;
}

module.exports = { findFreePort, waitForServer, seedDataDir, spawnServer };
