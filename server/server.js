// Çok oyunculu oyun sunucusu: statik dosyaları sunar ve WebSocket üzerinden odaları yönetir.
// Çalıştırma: npm start  (PORT ortam değişkeni, varsayılan 3000)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { Game, GameError } = require('./game');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const GAME_TTL_MS = 6 * 60 * 60 * 1000;      // 6 saat hareketsiz oda silinir
const LOBBY_LEAVE_MS = 2 * 60 * 1000;        // lobide kopan oyuncu 2 dk sonra çıkarılır
const CODE_LETTERS = 'ABCDEFGHJKLMNPRSTUVYZ';

// ---------------- statik dosyalar ----------------
const STATIC = {
  '/': 'public/index.html',
  '/index.html': 'public/index.html',
  '/shared/data.js': 'shared/data.js',
  '/style.css': 'public/style.css',
  '/art.js': 'public/art.js',
  '/app.js': 'public/app.js',
  '/tek-cihaz': 'ravenwood-cinayeti.html',
};
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.png':'image/png', '.css':'text/css; charset=utf-8', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.m4a':'audio/mp4' };

function resolveStatic(urlPath) {
  if (STATIC[urlPath]) return path.join(ROOT, STATIC[urlPath]);
  // yalnızca images/ ve audio/ altındaki dosyalar, klasör dışına çıkmadan
  for (const dir of ['images', 'audio']) {
    if (!urlPath.startsWith(`/${dir}/`)) continue;
    const file = path.normalize(path.join(ROOT, decodeURIComponent(urlPath)));
    if (file.startsWith(path.join(ROOT, dir) + path.sep)) return file;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/saglik') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok'); return; }
  let file;
  try { file = resolveStatic(urlPath); } catch { file = null; }
  if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Bulunamadı'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Bulunamadı'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': /^\/(images|audio)\//.test(urlPath) ? 'public, max-age=86400' : 'no-cache',
    });
    res.end(data);
  });
});

// ---------------- odalar ----------------
const games = new Map();

function newCode() {
  for (let tries = 0; tries < 1000; tries++) {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_LETTERS[crypto.randomInt(CODE_LETTERS.length)];
    if (!games.has(code)) return code;
  }
  throw new GameError('Şu anda yeni oda açılamıyor, biraz sonra tekrar deneyin.');
}

function cleanName(name) {
  const s = String(name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20);
  if (!s) throw new GameError('Lütfen bir oyuncu adı yazın.');
  return s;
}

const sockets = new Map(); // ws -> { game, player }

function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }

function broadcast(game) {
  for (const [ws, s] of sockets) if (s.game === game) send(ws, { t: 'state', state: game.viewFor(s.player) });
}

function attach(ws, game, player) {
  // aynı oyuncunun eski bağlantısını kapat
  for (const [other, s] of sockets) if (other !== ws && s.player === player) { sockets.delete(other); other.close(4000, 'başka sekmede açıldı'); }
  sockets.set(ws, { game, player });
  if (player.leaveTimer) { clearTimeout(player.leaveTimer); player.leaveTimer = null; }
  game.setConnected(player, true);
  send(ws, { t: 'joined', code: game.code, token: player.token, playerId: player.id });
}

function handle(ws, msg) {
  const s = sockets.get(ws);
  switch (msg.t) {
    case 'create': {
      const code = newCode();
      const game = new Game(code);
      games.set(code, game);
      const p = game.addPlayer(cleanName(msg.name));
      attach(ws, game, p);
      return game;
    }
    case 'join': {
      const game = games.get(String(msg.code || '').toUpperCase().trim());
      if (!game) throw new GameError('Bu kodla bir oda bulunamadı.');
      const p = game.addPlayer(cleanName(msg.name));
      attach(ws, game, p);
      return game;
    }
    case 'resume': {
      const game = games.get(String(msg.code || '').toUpperCase());
      const p = game && game.byToken(String(msg.token || ''));
      if (!p) { send(ws, { t: 'resumeFailed' }); return null; }
      attach(ws, game, p);
      return game;
    }
    case 'leave': {
      if (!s) return null;
      sockets.delete(ws);
      if (s.game.phase === 'lobby') s.game.removePlayer(s.player);
      else s.game.setConnected(s.player, false);
      if (!s.game.players.length) games.delete(s.game.code);
      send(ws, { t: 'left' });
      return s.game;
    }
    case 'act': {
      if (!s) throw new GameError('Önce bir odaya katılın.');
      const { game, player: p } = s;
      const a = msg;
      switch (a.action) {
        case 'character': game.chooseCharacter(p, a.character); break;
        case 'start': game.start(p); break;
        case 'roll': game.roll(p); break;
        case 'move': game.move(p, String(a.target)); break;
        case 'stay': game.stay(p); break;
        case 'secret': game.secret(p); break;
        case 'suggest': game.suggest(p, a.suspect, a.weapon); break;
        case 'refute': game.refute(p, a.type, a.id); break;
        case 'accuse': game.accuse(p, a.suspect, a.weapon, a.room); break;
        case 'endTurn': game.endTurn(p); break;
        case 'skip': game.skip(p); break;
        default: throw new GameError('Bilinmeyen hamle.');
      }
      return game;
    }
    default:
      throw new GameError('Bilinmeyen mesaj.');
  }
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    try {
      const game = handle(ws, msg);
      if (game) { game.touch(); broadcast(game); }
    } catch (e) {
      if (e instanceof GameError) send(ws, { t: 'error', msg: e.message });
      else { console.error(e); send(ws, { t: 'error', msg: 'Beklenmeyen bir hata oluştu.' }); }
    }
  });
  ws.on('close', () => {
    const s = sockets.get(ws);
    if (!s) return;
    sockets.delete(ws);
    const { game, player } = s;
    if ([...sockets.values()].some(x => x.player === player)) return;
    game.setConnected(player, false);
    if (game.phase === 'lobby') {
      player.leaveTimer = setTimeout(() => {
        if (player.connected) return;
        game.removePlayer(player);
        if (!game.players.length) games.delete(game.code);
        else broadcast(game);
      }, LOBBY_LEAVE_MS);
    }
    broadcast(game);
  });
});

// Kopuk bağlantıları temizle, eski odaları sil
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000).unref();

setInterval(() => {
  const now = Date.now();
  for (const [code, game] of games) if (now - game.lastActive > GAME_TTL_MS) games.delete(code);
}, 10 * 60 * 1000).unref();

server.listen(PORT, () => console.log(`Oyun sunucusu http://localhost:${PORT} adresinde çalışıyor`));
