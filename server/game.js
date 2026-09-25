// Sunucu tarafı oyun mantığı: tüm gizli bilgi (zarf, eller) yalnızca burada durur.
// Her oyuncuya viewFor() ile sadece görmesine izin verilen bilgi gönderilir.
const crypto = require('crypto');
const D = require('../shared/data');

const MIN_PLAYERS = 3;
const MAX_PLAYERS = D.CHARACTERS.length;
const LOG_LIMIT = 80;

const cardMatches = (c, s) =>
  (c.type === 'suspect' && c.id === s.suspect) ||
  (c.type === 'weapon' && c.id === s.weapon) ||
  (c.type === 'room' && c.id === s.room);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class GameError extends Error {}

class Game {
  constructor(code) {
    this.code = code;
    this.phase = 'lobby'; // lobby | playing | over
    this.players = [];
    this.log = [];
    this.lastActive = Date.now();
    this.nextId = 1;
  }

  touch() { this.lastActive = Date.now(); }
  addLog(text, important = false) {
    this.log.unshift({ text, important });
    if (this.log.length > LOG_LIMIT) this.log.length = LOG_LIMIT;
  }
  player(id) { return this.players.find(p => p.id === id); }
  byToken(token) { return this.players.find(p => p.token === token); }
  charName(id) { return D.CHAR_BY_ID[id]?.name || id; }
  current() { return this.players[this.turn.index]; }

  // ---------------- lobi ----------------
  addPlayer(name) {
    if (this.phase !== 'lobby') throw new GameError('Oyun başladı, artık katılınamaz.');
    if (this.players.length >= MAX_PLAYERS) throw new GameError('Oda dolu (en fazla 6 oyuncu).');
    const taken = new Set(this.players.map(p => p.character));
    const free = D.CHARACTERS.find(c => !taken.has(c.id));
    const p = {
      id: 'p' + this.nextId++,
      token: crypto.randomBytes(16).toString('hex'),
      name,
      character: free.id,
      isHost: this.players.length === 0,
      connected: true,
      hand: [], node: null, eliminated: false, pulledIn: false,
      reveal: null, seenSolution: false,
    };
    this.players.push(p);
    this.addLog(`${name} odaya katıldı.`);
    return p;
  }

  removePlayer(p) {
    if (this.phase !== 'lobby') return;
    this.players = this.players.filter(x => x !== p);
    if (p.isHost && this.players.length) this.players[0].isHost = true;
    this.addLog(`${p.name} odadan ayrıldı.`);
  }

  chooseCharacter(p, charId) {
    if (this.phase !== 'lobby') throw new GameError('Karakter yalnızca lobide seçilebilir.');
    if (!D.CHAR_BY_ID[charId]) throw new GameError('Geçersiz karakter.');
    if (this.players.some(x => x !== p && x.character === charId)) throw new GameError('Bu karakteri başka bir oyuncu seçti.');
    p.character = charId;
  }

  start(p) {
    if (this.phase !== 'lobby') throw new GameError('Oyun zaten başladı.');
    if (!p.isHost) throw new GameError('Oyunu yalnızca odayı kuran başlatabilir.');
    if (this.players.length < MIN_PLAYERS) throw new GameError(`Oyunu başlatmak için en az ${MIN_PLAYERS} oyuncu gerekir.`);

    // Oyun sırası karakter sırasına göre (Scarlett ilk)
    const order = D.CHARACTERS.map(c => c.id);
    this.players.sort((a, b) => order.indexOf(a.character) - order.indexOf(b.character));

    const suspects = shuffle(D.CHARACTERS.map(c => ({ type: 'suspect', id: c.id })));
    const weapons = shuffle(D.WEAPONS.map(w => ({ type: 'weapon', id: w.id })));
    const rooms = shuffle(D.ROOMS.map(r => ({ type: 'room', id: r.id })));
    this.solution = { suspect: suspects.pop().id, weapon: weapons.pop().id, room: rooms.pop().id };
    const deck = shuffle([...suspects, ...weapons, ...rooms]);
    this.players.forEach(pl => { pl.hand = []; pl.node = D.CHAR_BY_ID[pl.character].start; });
    deck.forEach((card, i) => this.players[i % this.players.length].hand.push(card));

    const roomOrder = shuffle(D.ROOMS.map(r => r.id));
    this.weaponLoc = {};
    D.WEAPONS.forEach((w, i) => { this.weaponLoc[w.id] = roomOrder[i]; });

    this.phase = 'playing';
    this.pending = null;
    this.winnerId = null;
    this.newTurn(0);
    this.log = [];
    this.addLog('Malikanede karanlık bir gece başlıyor... Zarf mühürlendi.', true);
    this.addLog(`Sıra ${this.current().name} (${this.charName(this.current().character)}) oyuncusunda.`);
  }

  // ---------------- tur ----------------
  newTurn(index) {
    this.turn = { index, dice: null, remaining: 0, moved: false, entered: false, suggested: false };
  }

  requireTurn(p) {
    if (this.phase !== 'playing') throw new GameError('Oyun devam etmiyor.');
    if (this.current() !== p) throw new GameError('Sıra sizde değil.');
    if (p.eliminated) throw new GameError('Yanlış suçlama yaptığınız için artık hamle yapamazsınız.');
    if (this.pending) throw new GameError('Önce öneri çürütmesinin bitmesi gerekiyor.');
  }

  occupiedExcept(p) { return this.players.filter(x => x !== p).map(x => x.node); }

  roll(p) {
    this.requireTurn(p);
    if (this.turn.dice || this.turn.moved) throw new GameError('Bu tur zar zaten atıldı.');
    const d1 = crypto.randomInt(1, 7), d2 = crypto.randomInt(1, 7);
    this.turn.dice = [d1, d2];
    this.turn.remaining = d1 + d2;
    this.addLog(`${p.name} zar attı: ${d1} + ${d2}.`);
  }

  movesFor(p) {
    if (this.turn.remaining <= 0) return { squares: [], rooms: [] };
    return D.computeMoves(p.node, this.turn.remaining, this.occupiedExcept(p));
  }

  move(p, target) {
    this.requireTurn(p);
    if (this.turn.remaining <= 0) throw new GameError('Hareket hakkınız yok.');
    const moves = this.movesFor(p);
    if (!moves.squares.includes(target) && !moves.rooms.includes(target)) throw new GameError('Oraya gidemezsiniz.');
    p.node = target;
    this.turn.remaining = 0;
    this.turn.moved = true;
    if (D.isRoom(target)) {
      this.turn.entered = true;
      this.addLog(`${p.name} ${D.ROOM_BY_ID[target].to} girdi.`);
    } else {
      this.addLog(`${p.name} koridorda ilerledi.`);
    }
  }

  stay(p) {
    this.requireTurn(p);
    this.turn.remaining = 0;
    this.turn.moved = true;
  }

  secret(p) {
    this.requireTurn(p);
    const room = D.ROOM_BY_ID[p.node];
    if (!room || !room.secretTo) throw new GameError('Burada gizli geçit yok.');
    if (this.turn.dice || this.turn.moved) throw new GameError('Gizli geçit zar atmadan önce kullanılabilir.');
    p.node = room.secretTo;
    this.turn.moved = true;
    this.turn.entered = true;
    this.addLog(`${p.name} gizli geçidi kullanarak ${D.ROOM_BY_ID[room.secretTo].to} geçti!`, true);
  }

  canSuggest(p) {
    return this.phase === 'playing' && this.current() === p && !p.eliminated && !this.pending &&
      D.isRoom(p.node) && !this.turn.suggested && (this.turn.entered || p.pulledIn);
  }

  suggest(p, suspect, weapon) {
    this.requireTurn(p);
    if (!this.canSuggest(p)) throw new GameError('Şu anda öneride bulunamazsınız.');
    if (!D.CHAR_BY_ID[suspect] || !D.WEAPON_BY_ID[weapon]) throw new GameError('Geçersiz öneri.');
    const room = p.node;
    const pulled = this.players.find(x => x.character === suspect);
    if (pulled && pulled !== p) { pulled.node = room; pulled.pulledIn = true; }
    this.weaponLoc[weapon] = room;
    this.turn.suggested = true;
    p.reveal = null;
    this.addLog(`${p.name}, ${D.ROOM_BY_ID[room].at} "${this.charName(suspect)}, ${D.WEAPON_BY_ID[weapon].name} ile" önerisinde bulundu.`, true);

    const n = this.players.length, start = this.turn.index;
    const queue = [];
    for (let i = 1; i < n; i++) queue.push(this.players[(start + i) % n].id);
    this.pending = { askerId: p.id, suspect, weapon, room, queue, pos: 0, responderId: null };
    this.advanceRefute();
  }

  advanceRefute() {
    const s = this.pending;
    while (s.pos < s.queue.length) {
      const pl = this.player(s.queue[s.pos]);
      if (pl && pl.hand.some(c => cardMatches(c, s))) {
        s.responderId = pl.id;
        if (!pl.connected) this.autoRefute(pl);
        return;
      }
      if (pl) this.addLog(`${pl.name} bu öneriyi çürütemedi.`);
      s.pos++;
    }
    this.addLog('Hiç kimse bu öneriyi çürütemedi! Bu önemli bir ipucu olabilir...', true);
    this.pending = null;
  }

  refuteOptions(p) {
    const s = this.pending;
    if (!s || s.responderId !== p.id) return null;
    return p.hand.filter(c => cardMatches(c, s));
  }

  refute(p, type, id) {
    const options = this.refuteOptions(p);
    if (!options) throw new GameError('Şu anda kart göstermeniz beklenmiyor.');
    const card = options.find(c => c.type === type && c.id === id);
    if (!card) throw new GameError('Bu kartı gösteremezsiniz.');
    const asker = this.player(this.pending.askerId);
    asker.reveal = { byId: p.id, card };
    this.addLog(`${p.name}, ${asker.name} oyuncusuna gizlice bir kart gösterdi.`);
    this.pending = null;
  }

  // Bağlantısı kopan oyuncu çürütme sırasında oyunu kilitlemesin
  autoRefute(p) {
    const options = this.refuteOptions(p);
    if (options && options.length) this.refute(p, options[0].type, options[0].id);
  }

  accuse(p, suspect, weapon, room) {
    this.requireTurn(p);
    if (!D.CHAR_BY_ID[suspect] || !D.WEAPON_BY_ID[weapon] || !D.ROOM_BY_ID[room]) throw new GameError('Geçersiz suçlama.');
    const sol = this.solution;
    const text = `"${this.charName(suspect)}, ${D.WEAPON_BY_ID[weapon].name} ile, ${D.ROOM_BY_ID[room].at}"`;
    if (suspect === sol.suspect && weapon === sol.weapon && room === sol.room) {
      this.phase = 'over';
      this.winnerId = p.id;
      this.addLog(`${p.name} suçladı: ${text}. DOĞRU! Gizem çözüldü.`, true);
      return;
    }
    p.eliminated = true;
    p.seenSolution = true;
    this.addLog(`${p.name} suçladı: ${text}. YANLIŞ! Artık hamle yapamaz ama kart göstermeye devam eder.`, true);
    if (this.players.every(x => x.eliminated)) {
      this.phase = 'over';
      this.winnerId = null;
      this.addLog('Herkes yanlış suçlamada bulundu. Katil kaçtı!', true);
      return;
    }
    this.advanceTurn();
  }

  endTurn(p) {
    this.requireTurn(p);
    this.advanceTurn();
  }

  // Oda sahibi, bağlantısı kopmuş oyuncunun sırasını geçebilir
  skip(p) {
    if (this.phase !== 'playing') throw new GameError('Oyun devam etmiyor.');
    if (!p.isHost) throw new GameError('Sırayı yalnızca odayı kuran geçebilir.');
    const cur = this.current();
    if (cur.connected) throw new GameError('Sıradaki oyuncu bağlı; sırası geçilemez.');
    if (this.pending) throw new GameError('Önce öneri çürütmesinin bitmesi gerekiyor.');
    this.addLog(`${cur.name} bağlı olmadığı için sırası geçildi.`);
    this.advanceTurn();
  }

  advanceTurn() {
    const cur = this.current();
    cur.pulledIn = false;
    cur.reveal = null;
    let next = this.turn.index;
    do { next = (next + 1) % this.players.length; } while (this.players[next].eliminated);
    this.newTurn(next);
    this.addLog(`Sıra ${this.current().name} (${this.charName(this.current().character)}) oyuncusunda.`);
  }

  setConnected(p, connected) {
    p.connected = connected;
    if (!connected && this.phase === 'playing' && this.pending && this.pending.responderId === p.id) this.autoRefute(p);
  }

  // ---------------- oyuncuya özel görünüm ----------------
  viewFor(me) {
    const playing = this.phase !== 'lobby';
    const view = {
      code: this.code,
      phase: this.phase,
      minPlayers: MIN_PLAYERS,
      players: this.players.map(p => ({
        id: p.id, name: p.name, character: p.character, isHost: p.isHost, connected: p.connected,
        eliminated: p.eliminated, node: p.node, cardCount: p.hand.length,
      })),
      log: this.log,
      you: { id: me.id, isHost: me.isHost },
    };
    if (!playing) return view;
    view.you.hand = me.hand;
    view.you.eliminated = me.eliminated;
    view.you.reveal = me.reveal;
    view.weaponLoc = this.weaponLoc;
    const t = this.turn;
    view.turn = { playerId: this.current().id, dice: t.dice, remaining: t.remaining, moved: t.moved, entered: t.entered, suggested: t.suggested };
    view.pending = this.pending && {
      askerId: this.pending.askerId, suspect: this.pending.suspect, weapon: this.pending.weapon,
      room: this.pending.room, responderId: this.pending.responderId,
    };
    view.you.refuteOptions = this.refuteOptions(me);
    if (this.current() === me && this.phase === 'playing') {
      view.you.moves = this.movesFor(me);
      view.you.canSuggest = this.canSuggest(me);
    }
    if (this.phase === 'over' || me.seenSolution) view.solution = this.solution;
    view.winnerId = this.winnerId;
    return view;
  }
}

module.exports = { Game, GameError, MIN_PLAYERS };
