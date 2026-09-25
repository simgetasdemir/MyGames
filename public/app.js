// Çevrimiçi istemci: her oyuncu kendi cihazından bağlanır, oyun durumu sunucudan gelir.
const D = window.GameData;
const app = document.getElementById('app');
const modalRoot = document.getElementById('modalRoot');

let ws = null;
let S = null;               // sunucudan gelen, bu oyuncuya özel oyun durumu
let prev = null;            // bir önceki durum (ses ve bildirimler için)
let ui = { modal: null };   // açık pencere: 'suggest' | 'accuse' | null
let retry = 0;

const makeStore = area => ({
  get(k) { try { return JSON.parse(window[area].getItem(k)); } catch { return null; } },
  set(k, v) { try { window[area].setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { window[area].removeItem(k); } catch {} },
});
const store = makeStore('localStorage');   // bu tarayıcıda kalıcı: ad, notlar, kayıtlı oyunlar
const tabStore = makeStore('sessionStorage'); // yalnızca bu sekme: hangi oyuncu olduğu
// Her sekme ayrı bir oyuncudur (aynı tarayıcıda birkaç sekmeyle de oynanabilir).
// Sekme yenilenince sessionStorage'dan otomatik devam eder; kapatılıp açılırsa "Oyuna geri dön" çıkar.
let session = tabStore.get('cluedo.session'); // { code, token }
let takenOver = false; // bu oyuncu başka bir sekmede açıldı

const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
const charName = id => D.CHAR_BY_ID[id]?.name || id;
const charColor = id => D.CHAR_BY_ID[id]?.color || '#999';
const weaponName = id => D.WEAPON_BY_ID[id]?.name || id;
const roomName = id => D.ROOM_BY_ID[id]?.name || id;
const playerById = id => S?.players.find(p => p.id === id);
const me = () => playerById(S?.you.id);

document.getElementById('gameTitle').textContent = `🕯️ ${D.TITLE} 🕯️`;

// ---------------- bağlantı ----------------
function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onopen = () => {
    retry = 0;
    document.getElementById('conn').hidden = true;
    if (session) send({ t: 'resume', code: session.code, token: session.token });
    else render();
  };
  ws.onmessage = ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    onMessage(msg);
  };
  ws.onclose = ev => {
    if (ev.code === 4000) { takenOver = true; S = null; render(); return; }
    if (S) document.getElementById('conn').hidden = false;
    retry = Math.min(retry + 1, 6);
    setTimeout(connect, 500 * retry);
  };
}

function send(obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  else toast('Sunucuya bağlı değilsiniz, birazdan tekrar deneyin.');
}
const act = (action, extra = {}) => { ensureAudio(); send({ t: 'act', action, ...extra }); };

function onMessage(msg) {
  if (msg.t === 'joined') {
    session = { code: msg.code, token: msg.token };
    tabStore.set('cluedo.session', session);
    const saved = store.get('cluedo.saved') || {};
    saved[msg.code] = { token: msg.token, at: Date.now() };
    store.set('cluedo.saved', saved);
    const url = new URL(location.href); url.searchParams.set('oda', msg.code);
    history.replaceState(null, '', url);
  } else if (msg.t === 'state') {
    prev = S; S = msg.state;
    cues();
    render();
  } else if (msg.t === 'error') {
    toast(msg.msg);
  } else if (msg.t === 'resumeFailed' || msg.t === 'left') {
    if (session) forgetSaved(session.code);
    clearSession();
    render();
  }
}

function forgetSaved(code) {
  const saved = store.get('cluedo.saved') || {};
  delete saved[code];
  store.set('cluedo.saved', saved);
}

function resumeSaved(code, token) {
  takenOver = false;
  session = { code, token };
  tabStore.set('cluedo.session', session);
  if (!ws || ws.readyState > 1) connect(); else send({ t: 'resume', code, token });
}

function clearSession() {
  session = null; S = null; prev = null; ui.modal = null;
  tabStore.del('cluedo.session');
  const url = new URL(location.href); url.searchParams.delete('oda');
  history.replaceState(null, '', url);
}

let toastTimer = null;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

// Ses ve sekme başlığı bildirimleri
function cues() {
  if (!S || S.phase !== 'playing') { document.title = `${D.TITLE} Çevrimiçi`; return; }
  const myTurn = S.turn.playerId === S.you.id;
  const mustRefute = !!S.you.refuteOptions;
  document.title = (myTurn || mustRefute ? '● ' : '') + `${D.TITLE} Çevrimiçi`;
  if (!prev || prev.phase !== 'playing') return;
  if (S.turn.dice && JSON.stringify(S.turn.dice) !== JSON.stringify(prev.turn.dice)) sfxDice();
  if (myTurn && prev.turn.playerId !== S.you.id) { beep(660, 0.12); setTimeout(() => beep(880, 0.16), 140); }
  if (mustRefute && !prev.you.refuteOptions) beep(520, 0.2, 'triangle');
  if (S.you.reveal && !prev.you.reveal) sfxCard();
}

// ---------------- çizim ----------------
function render() {
  if (!S) renderHome();
  else if (S.phase === 'lobby') renderLobby();
  else renderGame();
  renderModal();
}

function avatar(charId, size) {
  return `<div class="avatarWrap" style="width:${size}px;height:${size}px">${suspectAvatarSVG(charId, charColor(charId), size)}</div>`;
}

// ---- giriş ----
function renderHome() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('oda') || '').toUpperCase().slice(0, 4);
  const name = store.get('cluedo.name') || '';
  if (takenOver && session) {
    app.innerHTML = `<div class="panel center" style="display:flex; flex-direction:column; gap:12px; align-items:center">
      <h2 style="color:var(--gold)">Bu oyuncu başka bir sekmede açıldı</h2>
      <p class="muted">Aynı oyuncu yalnızca bir sekmede oynayabilir. Oyunu bu sekmede sürdürmek isterseniz aşağıdaki düğmeye basın.</p>
      <button type="button" id="takeBackBtn">Bu Sekmede Devam Et</button>
    </div>`;
    document.getElementById('takeBackBtn').onclick = () => resumeSaved(session.code, session.token);
    return;
  }
  const saved = store.get('cluedo.saved') || {};
  const back = code && saved[code] ? code : null;
  app.innerHTML = `
    ${back ? `<div class="panel center" style="display:flex; flex-direction:column; gap:10px; align-items:center">
      <p>Bu tarayıcıda <strong style="color:var(--gold)">${esc(back)}</strong> odasında daha önce oynadınız.</p>
      <button type="button" id="rejoinBtn">Oyuna Geri Dön</button>
      <p class="muted">Yeni bir oyuncu olarak katılmak için aşağıdaki "Oyuna Katıl" bölümünü kullanın.</p>
    </div>` : ''}
    <div class="panel startScreen">
      <h2 style="color:var(--gold); margin-bottom:8px;">Gizem Başlıyor</h2>
      <p class="lead">Malikanenin sahibi ${esc(D.VICTIM)} ölü bulundu. Altı şüpheliden biri, altı suç aletinden biriyle, dokuz odadan birinde bu cinayeti işledi. Her oyuncu kendi cihazından katılır; kartlarınızı yalnızca siz görürsünüz.</p>
      <ul class="rules">
        <li>Bir oyuncu oyunu kurar ve 4 harfli oda kodunu ya da linki arkadaşlarıyla paylaşır.</li>
        <li>3 ile 6 kişi arası oynanır. Bayan Scarlett her zaman ilk başlar.</li>
        <li>Odaya girince bir şüpheli ve bir silah önerirsiniz; elinde eşleşen kart olan ilk oyuncu size gizlice gösterir.</li>
        <li>Emin olduğunuzda "Suçlama Yap" ile şüpheli, silah ve odayı tahmin edin. Yanlışsa oyundan düşersiniz.</li>
      </ul>
    </div>
    <div class="homeGrid">
      <form class="panel" id="createForm">
        <h3 style="color:var(--gold)">Yeni Oyun Kur</h3>
        <div><label for="createName">Adınız</label><input type="text" id="createName" maxlength="20" autocomplete="nickname" value="${esc(name)}" placeholder="Örn. Simge"></div>
        <button type="submit">Oda Kur</button>
      </form>
      <form class="panel" id="joinForm">
        <h3 style="color:var(--gold)">Oyuna Katıl</h3>
        <div><label for="joinCode">Oda kodu</label><input type="text" id="joinCode" class="codeInput" maxlength="4" autocomplete="off" value="${esc(code)}" placeholder="ABCD"></div>
        <div><label for="joinName">Adınız</label><input type="text" id="joinName" maxlength="20" autocomplete="nickname" value="${esc(name)}" placeholder="Örn. Ali"></div>
        <button type="submit">Katıl</button>
      </form>
    </div>
    <p class="muted center" style="margin-top:16px">Herkes aynı cihazda mı? <a class="altLink" href="tek-cihaz">Tek cihazda sırayla oynayın</a>.</p>
  `;
  document.getElementById('createForm').onsubmit = e => {
    e.preventDefault(); ensureAudio();
    const n = document.getElementById('createName').value.trim();
    if (!n) return toast('Lütfen adınızı yazın.');
    store.set('cluedo.name', n);
    send({ t: 'create', name: n });
  };
  document.getElementById('joinForm').onsubmit = e => {
    e.preventDefault(); ensureAudio();
    const c = document.getElementById('joinCode').value.trim().toUpperCase();
    const n = document.getElementById('joinName').value.trim();
    if (c.length !== 4) return toast('Oda kodu 4 harften oluşur.');
    if (!n) return toast('Lütfen adınızı yazın.');
    store.set('cluedo.name', n);
    send({ t: 'join', code: c, name: n });
  };
  if (back) document.getElementById('rejoinBtn').onclick = () => resumeSaved(back, saved[back].token);
  if (code) document.getElementById('joinName').focus();
}

// ---- lobi ----
function renderLobby() {
  const link = `${location.origin}${location.pathname}?oda=${S.code}`;
  const my = me();
  const takenBy = Object.fromEntries(S.players.map(p => [p.character, p]));
  const enough = S.players.length >= S.minPlayers;
  app.innerHTML = `
    <div class="panel lobbyCode">
      <div class="muted">Oda kodu</div>
      <div class="code">${esc(S.code)}</div>
      <div class="shareRow">
        <input type="text" id="shareLink" readonly value="${esc(link)}" aria-label="Davet linki">
        <button type="button" class="secondary" id="copyBtn">Linki Kopyala</button>
      </div>
      <p class="muted center">Arkadaşlarınız bu linki açarak ya da kodu girerek katılabilir.</p>
    </div>
    <div class="panel">
      <h3 style="color:var(--gold); margin-bottom:10px">Oyuncular (${S.players.length}/6)</h3>
      <div class="playerList">
        ${S.players.map(p => `
          <div class="playerRow">
            ${avatar(p.character, 36)}
            <div><div class="pname">${esc(p.name)}${p.id === S.you.id ? ' <span class="muted">(siz)</span>' : ''}</div><div class="muted">${esc(charName(p.character))}</div></div>
            <div class="pmeta">
              ${p.isHost ? '<span class="chip">Oda sahibi</span>' : ''}
              ${p.connected ? '' : '<span class="chip off">Bağlı değil</span>'}
              <span class="dot ${p.connected ? '' : 'off'}" title="${p.connected ? 'Bağlı' : 'Bağlı değil'}"></span>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="panel">
      <h3 style="color:var(--gold); margin-bottom:10px">Karakterinizi seçin</h3>
      <div class="charGrid">
        ${D.CHARACTERS.map(c => {
          const owner = takenBy[c.id];
          const mine = owner && owner.id === S.you.id;
          return `<button type="button" class="charBtn ${mine ? 'sel' : ''}" data-char="${c.id}" ${owner && !mine ? 'disabled' : ''} aria-pressed="${mine}">
            ${avatar(c.id, 44)}<span>${esc(c.name)}</span><span class="who">${owner ? (mine ? 'Siz' : esc(owner.name)) : ''}</span></button>`;
        }).join('')}
      </div>
    </div>
    <div class="panel center" style="display:flex; flex-direction:column; gap:10px; align-items:center">
      ${my?.isHost
        ? `<button type="button" id="startBtn" ${enough ? '' : 'disabled'}>Oyunu Başlat</button>
           <p class="muted">${enough ? 'Herkes hazırsa oyunu başlatın.' : `Başlatmak için en az ${S.minPlayers} oyuncu gerekir.`}</p>`
        : '<p class="muted">Oda sahibinin oyunu başlatması bekleniyor…</p>'}
      <button type="button" class="secondary" id="leaveBtn">Odadan Ayrıl</button>
    </div>
  `;
  document.getElementById('copyBtn').onclick = async () => {
    const input = document.getElementById('shareLink');
    try { await navigator.clipboard.writeText(link); toast('Davet linki kopyalandı.'); }
    catch { input.select(); toast('Linki seçtim; kopyalamak için Ctrl+C kullanın.'); }
  };
  app.querySelectorAll('.charBtn').forEach(b => { b.onclick = () => act('character', { character: b.dataset.char }); });
  const startBtn = document.getElementById('startBtn'); if (startBtn) startBtn.onclick = () => act('start');
  document.getElementById('leaveBtn').onclick = () => send({ t: 'leave' });
}

// ---- oyun ----
function cardHTML(c) {
  let label, kind, icon = '';
  if (c.type === 'suspect') { label = charName(c.id); kind = 'Şüpheli'; icon = `<div class="avatarWrap" style="width:40px;height:40px;margin:0 auto 4px">${suspectAvatarSVG(c.id, charColor(c.id), 40)}</div>`; }
  else if (c.type === 'weapon') { label = weaponName(c.id); kind = 'Silah'; icon = weaponIconSVG(c.id, 26); }
  else { label = roomName(c.id); kind = 'Oda'; icon = `<img class="cardPhoto" src="${D.ROOM_BY_ID[c.id].img}" alt="">`; }
  return `<div class="card">${icon}<div class="kind">${kind}</div>${esc(label)}</div>`;
}

function renderBoardGrid(moves) {
  const my = me();
  const reachSq = new Set(moves.squares), reachRm = new Set(moves.rooms);
  const token = o => `<div class="token ${o.id === S.you.id ? 'me' : ''}" style="background:${charColor(o.character)}" title="${esc(o.name)} (${esc(charName(o.character))})"></div>`;
  let html = '';
  for (let r = 0; r < D.ROWS; r++) for (let c = 0; c < D.COLS; c++) {
    const kind = D.CELL[r][c];
    if (kind !== 'corr' && kind !== 'start') continue;
    const k = D.posKey(r, c);
    const door = D.DOORS[k];
    const occ = S.players.filter(o => o.node === k);
    html += `<div class="sq ${kind === 'start' ? 'start' : ''} ${door ? 'door-' + door.dir : ''} ${reachSq.has(k) ? 'reach' : ''}" style="grid-row:${r + 1};grid-column:${c + 1}" data-pos="${k}"${door ? ` title="${esc(roomName(door.room))} kapısı"` : ''}>${occ.map(token).join('')}</div>`;
  }
  D.ROOMS.forEach(rm => {
    const [r0, c0, r1, c1] = rm.rects[0];
    const occ = S.players.filter(o => o.node === rm.id);
    const weapons = D.WEAPONS.filter(w => S.weaponLoc[w.id] === rm.id);
    const corner = rm.secretTo ? `<div class="secretIcon" style="${r0 < 5 ? 'bottom' : 'top'}:2px;${c0 < 5 ? 'right' : 'left'}:3px" title="Gizli geçit: ${esc(roomName(rm.secretTo))}">🌀</div>` : '';
    html += `<div class="room photo ${reachRm.has(rm.id) ? 'reach' : ''} ${my.node === rm.id ? 'here' : ''}" style="grid-row:${r0 + 1}/${r1 + 2};grid-column:${c0 + 1}/${c1 + 2};background-image:url('${rm.img}')" data-pos="${rm.id}" title="${esc(rm.name)}" aria-label="${esc(rm.name)}">
      ${corner}
      <div class="roomOverlay">
        ${weapons.length ? `<div class="weaponRow">${weapons.map(w => `<span title="${esc(w.name)}">${weaponIconSVG(w.id, 14)}</span>`).join('')}</div>` : ''}
        ${occ.length ? `<div class="tokenRow">${occ.map(token).join('')}</div>` : ''}
      </div>
    </div>`;
  });
  const [cr0, cc0, cr1, cc1] = D.CENTER;
  html += `<div class="centerBlock" style="grid-row:${cr0 + 1}/${cr1 + 2};grid-column:${cc0 + 1}/${cc1 + 2}"><div class="ctitle">${esc(D.TITLE)}</div><div class="cenv">✉️</div></div>`;
  return html;
}

function notesKey() { return `cluedo.notes.${session?.code}.${session?.token}`; }
function renderNotes() {
  const notes = store.get(notesKey()) || {};
  const item = (key, label) => `<div class="noteItem"><span class="niLabel">${label}</span><button type="button" class="noteBox" data-key="${key}" aria-label="${esc(key)} notu">${notes[key] || ''}</button></div>`;
  return `<div class="notesPad"><div class="notesColumns">
    <div class="notesCol"><div class="notesCatTitle">Şüpheli</div>${D.CHARACTERS.map(c => item(c.id, esc(c.name))).join('')}</div>
    <div class="notesCol"><div class="notesCatTitle">Oda</div>${D.ROOMS.map(r => item(r.id, esc(r.name))).join('')}</div>
    <div class="notesCol"><div class="notesCatTitle">Silah</div>${D.WEAPONS.map(w => item(w.id, `${weaponIconSVG(w.id, 15)} ${esc(w.name)}`)).join('')}</div>
  </div></div>`;
}

function pendingText() {
  const s = S.pending; if (!s) return '';
  const asker = playerById(s.askerId), resp = playerById(s.responderId);
  const what = `"${esc(charName(s.suspect))}, ${esc(weaponName(s.weapon))} ile, ${esc(D.ROOM_BY_ID[s.room].at)}"`;
  if (resp && resp.id === S.you.id) return `${esc(asker.name)} önerdi: ${what}. Elinizde eşleşen kart var, birini göstermeniz gerekiyor.`;
  return `${esc(asker.name)} önerdi: ${what}. ${resp ? `${esc(resp.name)} bir kart seçiyor…` : ''}`;
}

function renderGame() {
  const my = me();
  const cur = playerById(S.turn.playerId);
  const myTurn = S.phase === 'playing' && cur.id === my.id && !S.you.eliminated;
  const moves = (myTurn && S.you.moves) || { squares: [], rooms: [] };
  const inRoom = D.isRoom(my.node);
  const room = D.ROOM_BY_ID[my.node];
  const free = myTurn && !S.pending;
  const canRoll = free && !S.turn.dice && !S.turn.moved;
  const canSecret = canRoll && inRoom && room.secretTo;
  const canStay = free && S.turn.remaining > 0;
  const canSuggest = free && S.you.canSuggest;
  const reveal = S.you.reveal;

  let hint = '';
  if (S.phase === 'over') hint = 'Oyun bitti.';
  else if (S.you.eliminated) hint = 'Yanlış suçlama yaptınız; artık yalnızca kart gösterirsiniz.';
  else if (!myTurn) hint = `${esc(cur.name)} oynuyor…`;
  else if (S.pending) hint = 'Önerinizin çürütülmesi bekleniyor…';
  else if (!S.turn.dice && !S.turn.moved) hint = 'Zar atarak turunuza başlayın.';
  else if (S.turn.remaining > 0) hint = (moves.squares.length || moves.rooms.length) ? `✨ En fazla ${S.turn.remaining} kare ilerleyin: parlayan bir kareye ya da odaya dokunun.` : 'Yol kapalı, bu tur hareket edemezsiniz.';
  else if (canSuggest) hint = 'Bu odada öneride bulunabilirsiniz.';
  else hint = 'Hareketiniz tamamlandı.';

  const hostSkip = S.phase === 'playing' && S.you.isHost && !cur.connected && !S.pending;

  app.innerHTML = `
    <div class="panel">
      <div class="turnBanner">
        ${avatar(cur.character, 32)}<strong style="color:${charColor(cur.character)}">Sıra: ${esc(cur.name)}</strong><span class="muted">(${esc(charName(cur.character))})</span>
        ${!cur.connected ? '<span class="chip off">Bağlı değil</span>' : ''}
        <span class="you muted">Siz: ${esc(my.name)} · ${esc(charName(my.character))} · ${inRoom ? esc(room.name) : 'Koridorda'}</span>
      </div>
      ${S.pending ? `<div class="pendingBanner" style="margin-top:10px">${pendingText()}</div>` : ''}
      <div class="boardArea" style="margin-top:10px">
        <div class="boardWrap">
          <div class="moveHint">${hint}</div>
          <div class="cboard" id="boardGrid">${renderBoardGrid(moves)}</div>
          <div class="boardLegend">
            <span><i class="lg" style="background:#d9c38a"></i>Koridor</span>
            <span><i class="lg" style="background:#d9c38a;box-shadow:inset 0 3px 0 #7a1f1f"></i>Kapı</span>
            <span><i class="lg" style="background:#8b6b3a"></i>Başlangıç</span>
            <span>🌀 Gizli geçit</span>
          </div>
        </div>
        <div class="sidePanel">
          ${S.turn.dice ? `<div class="diceDisplay">🎲${S.turn.dice[0]} 🎲${S.turn.dice[1]}</div>` : ''}
          ${S.phase === 'playing' && !myTurn && !S.you.eliminated ? `<div class="pendingBanner">Şu an sıra <strong>${esc(cur.name)}</strong> oyuncusunda. Sıra size gelince <strong>Zar At</strong> düğmesi burada çıkar.</div>` : ''}
          <div class="actionBtns">
            ${canRoll ? '<button type="button" id="rollBtn">🎲 Zar At</button>' : ''}
            ${canSecret ? `<button type="button" id="secretBtn" class="secondary">🌀 Gizli Geçit: ${esc(roomName(room.secretTo))}</button>` : ''}
            ${canStay ? '<button type="button" id="stayBtn" class="secondary">Yerinde Kal</button>' : ''}
            ${canSuggest ? '<button type="button" id="suggestBtn">🔍 Öneride Bulun</button>' : ''}
            ${free ? '<button type="button" id="accuseBtn" class="secondary">⚖️ Suçlama Yap</button>' : ''}
            ${free ? '<button type="button" id="endTurnBtn" class="secondary">Turu Bitir →</button>' : ''}
            ${hostSkip ? `<button type="button" id="skipBtn" class="secondary">${esc(cur.name)} bağlı değil: sırasını geç</button>` : ''}
          </div>
          ${reveal ? `<div class="revealBox"><strong>${esc(playerById(reveal.byId)?.name)}</strong> size gizlice şu kartı gösterdi:<br>${cardHTML(reveal.card)}</div>` : ''}
          ${S.solution && S.phase === 'playing' ? `<div class="solutionBox">Zarftaki çözüm (yalnızca siz görüyorsunuz): <strong>${esc(charName(S.solution.suspect))}</strong>, <strong>${esc(weaponName(S.solution.weapon))}</strong>, <strong>${esc(roomName(S.solution.room))}</strong></div>` : ''}
          <div class="sideSection"><h3>Kartlarınız</h3><div class="cardsRow">${S.you.hand.map(cardHTML).join('')}</div></div>
          <div class="sideSection"><h3>Oyuncular</h3><div class="playerList">
            ${S.players.map(p => `<div class="playerRow">${avatar(p.character, 28)}<div><div class="pname" style="font-size:15px">${esc(p.name)}${p.id === S.you.id ? ' <span class="muted">(siz)</span>' : ''}</div><div class="muted" style="font-size:13px">${esc(charName(p.character))} · ${p.cardCount} kart</div></div>
              <div class="pmeta">${p.id === cur.id && S.phase === 'playing' ? '<span class="chip turn">Sırada</span>' : ''}${p.eliminated ? '<span class="chip out">Elendi</span>' : ''}<span class="dot ${p.connected ? '' : 'off'}" title="${p.connected ? 'Bağlı' : 'Bağlı değil'}"></span></div></div>`).join('')}
          </div></div>
          <details class="sideSection" open><summary style="cursor:pointer; color:var(--gold);">Not Defterim</summary>${renderNotes()}</details>
        </div>
      </div>
    </div>
    <div class="panel">
      <h3 style="color:var(--gold); margin-bottom:8px;">Olay Günlüğü</h3>
      <div class="log">${S.log.map(l => `<div class="${l.important ? 'important' : ''}">${esc(l.text)}</div>`).join('')}</div>
    </div>
  `;

  app.querySelectorAll('.sq.reach, .room.reach').forEach(el => { el.onclick = () => act('move', { target: el.dataset.pos }); });
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  on('rollBtn', () => act('roll'));
  on('secretBtn', () => act('secret'));
  on('stayBtn', () => act('stay'));
  on('suggestBtn', () => { ui.modal = 'suggest'; renderModal(); });
  on('accuseBtn', () => { ui.modal = 'accuse'; renderModal(); });
  on('endTurnBtn', () => { sfxClick(); act('endTurn'); });
  on('skipBtn', () => act('skip'));
  app.querySelectorAll('.noteBox').forEach(box => {
    box.onclick = () => {
      const notes = store.get(notesKey()) || {};
      const cur = notes[box.dataset.key] || '';
      notes[box.dataset.key] = cur === '' ? '✗' : cur === '✗' ? '✓' : '';
      store.set(notesKey(), notes);
      box.textContent = notes[box.dataset.key];
    };
  });
}

// ---- pencereler ----
function renderModal() {
  modalRoot.innerHTML = '';
  if (!S || S.phase === 'lobby') return;

  if (S.phase === 'over') {
    const w = playerById(S.winnerId);
    const sol = S.solution;
    modalRoot.innerHTML = `<div class="modalOverlay"><div class="modalBox gameOverBox" role="dialog" aria-modal="true" aria-labelledby="goTitle">
      <h2 id="goTitle">${w ? `${esc(w.name)} gizemi çözdü!` : 'Katil kaçtı!'}</h2>
      <p>Cinayeti <strong>${esc(charName(sol.suspect))}</strong>, <strong>${esc(weaponName(sol.weapon))}</strong> ile, <strong>${esc(D.ROOM_BY_ID[sol.room].at)}</strong> işledi.</p>
      <div class="cardsRow" style="justify-content:center">${cardHTML({ type: 'suspect', id: sol.suspect })}${cardHTML({ type: 'weapon', id: sol.weapon })}${cardHTML({ type: 'room', id: sol.room })}</div>
      <button type="button" id="newGameBtn">Ana Ekrana Dön</button>
    </div></div>`;
    document.getElementById('newGameBtn').onclick = () => send({ t: 'leave' });
    return;
  }

  const opts = S.you.refuteOptions;
  if (opts) {
    const asker = playerById(S.pending.askerId);
    modalRoot.innerHTML = `<div class="modalOverlay"><div class="modalBox" role="dialog" aria-modal="true" aria-labelledby="refTitle">
      <h2 id="refTitle">Bir kart gösterin</h2>
      <p class="muted center">${esc(asker.name)} önerdi: "${esc(charName(S.pending.suspect))}, ${esc(weaponName(S.pending.weapon))} ile, ${esc(D.ROOM_BY_ID[S.pending.room].at)}". Kartı yalnızca ${esc(asker.name)} görecek.</p>
      <div class="choiceGrid">${opts.map((c, i) => `<button type="button" data-i="${i}">${c.type === 'room' ? esc(roomName(c.id)) : c.type === 'weapon' ? weaponIconSVG(c.id, 18) + ' ' + esc(weaponName(c.id)) : esc(charName(c.id))}</button>`).join('')}</div>
    </div></div>`;
    modalRoot.querySelectorAll('.choiceGrid button').forEach(b => { b.onclick = () => { const c = opts[+b.dataset.i]; sfxCard(); act('refute', { type: c.type, id: c.id }); }; });
    return;
  }

  const my = me();
  const myTurn = S.turn.playerId === my.id && !S.you.eliminated && !S.pending;
  if (!myTurn) { ui.modal = null; return; }
  if (ui.modal === 'suggest' && S.you.canSuggest) {
    modalRoot.innerHTML = `<div class="modalOverlay"><form class="modalBox" id="sugForm" role="dialog" aria-modal="true" aria-labelledby="sugTitle">
      <h2 id="sugTitle">Öneride Bulun</h2>
      <p class="muted center" style="margin-bottom:14px;">Oda: <strong style="color:var(--gold)">${esc(roomName(my.node))}</strong></p>
      <div class="fieldGroup"><label for="sugSuspect">Şüpheli</label><select id="sugSuspect">${D.CHARACTERS.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div class="fieldGroup"><label for="sugWeapon">Silah</label><select id="sugWeapon">${D.WEAPONS.map(w => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select></div>
      <div style="display:flex; gap:8px;"><button type="button" class="secondary" id="cancelBtn" style="flex:1">Vazgeç</button><button type="submit" style="flex:1">Öner</button></div>
    </form></div>`;
    document.getElementById('cancelBtn').onclick = () => { ui.modal = null; renderModal(); };
    document.getElementById('sugForm').onsubmit = e => {
      e.preventDefault(); ui.modal = null;
      act('suggest', { suspect: document.getElementById('sugSuspect').value, weapon: document.getElementById('sugWeapon').value });
    };
  } else if (ui.modal === 'accuse') {
    modalRoot.innerHTML = `<div class="modalOverlay"><form class="modalBox" id="accForm" role="dialog" aria-modal="true" aria-labelledby="accTitle">
      <h2 id="accTitle">Suçlama Yap</h2>
      <p class="muted center" style="margin-bottom:14px;">Dikkat: yanlış suçlama yaparsanız oyundan düşersiniz.</p>
      <div class="fieldGroup"><label for="accSuspect">Şüpheli</label><select id="accSuspect">${D.CHARACTERS.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div class="fieldGroup"><label for="accWeapon">Silah</label><select id="accWeapon">${D.WEAPONS.map(w => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select></div>
      <div class="fieldGroup"><label for="accRoom">Oda</label><select id="accRoom">${D.ROOMS.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div>
      <div style="display:flex; gap:8px;"><button type="button" class="secondary" id="cancelBtn" style="flex:1">Vazgeç</button><button type="submit" style="flex:1">Suçla</button></div>
    </form></div>`;
    document.getElementById('cancelBtn').onclick = () => { ui.modal = null; renderModal(); };
    document.getElementById('accForm').onsubmit = e => {
      e.preventDefault(); ui.modal = null;
      act('accuse', { suspect: document.getElementById('accSuspect').value, weapon: document.getElementById('accWeapon').value, room: document.getElementById('accRoom').value });
    };
  } else {
    ui.modal = null;
  }
}

connect();
