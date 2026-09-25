// İkonlar ve müzik motoru (tek cihazlık sürümden alındı)
/* ======================= SVG İKON KÜTÜPHANESİ ======================= */

function roomIconInner(id) {
  const paths = {
    R_kutuphane: `<rect x="9" y="46" width="46" height="4" rx="1" fill="currentColor"/>
      <rect x="13" y="20" width="7" height="26" rx="1" fill="currentColor"/>
      <rect x="22" y="26" width="7" height="20" rx="1" fill="currentColor"/>
      <rect x="31" y="14" width="7" height="32" rx="1" fill="currentColor"/>
      <rect x="40" y="22" width="7" height="24" rx="1" fill="currentColor"/>
      <rect x="49" y="18" width="6" height="28" rx="1" fill="currentColor"/>`,
    R_hol: `<rect x="9" y="11" width="46" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
      <rect x="16" y="18" width="32" height="22" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="25" cy="27" r="3" fill="currentColor"/>
      <path d="M19 36 L29 25 L37 33 L45 26 L45 36 Z" fill="currentColor"/>
      <path d="M9 11 L4 6 M55 11 L60 6" stroke="currentColor" stroke-width="2"/>`,
    R_kis: `<path d="M32 52 V27" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M32 31 C19 27 16 14 16 14 C16 14 27 15 32 28" fill="currentColor"/>
      <path d="M32 27 C45 22 48 9 48 9 C48 9 37 11 32 25" fill="currentColor"/>
      <path d="M32 40 C24 37 21 30 21 30 C21 30 28 30 32 37" fill="currentColor"/>
      <rect x="22" y="52" width="20" height="9" rx="2" fill="currentColor"/>`,
    R_calisma: `<path d="M13 51 L39 15 L44 19 L18 55 Z" fill="currentColor"/>
      <path d="M39 15 C42 11 47 10 50 13 C50 13 47 16 44 19 Z" fill="currentColor"/>
      <circle cx="15" cy="52" r="3" fill="currentColor"/>`,
    R_balo: `<path d="M32 8 V16" stroke="currentColor" stroke-width="2"/>
      <path d="M12 16 H52 L45 30 H19 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <path d="M19 30 L16 50 M32 30 L32 50 M45 30 L48 50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="16" cy="11" r="3" fill="currentColor"/><circle cx="32" cy="8" r="3" fill="currentColor"/><circle cx="48" cy="11" r="3" fill="currentColor"/>`,
    R_mutfak: `<path d="M17 10 L17 26 C17 31 24 31 24 26 L24 10" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <line x1="20.5" y1="10" x2="20.5" y2="32" stroke="currentColor" stroke-width="2.4"/>
      <path d="M38 32 C38 18 49 18 49 10" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="12" y="34" width="38" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M18 34 C18 30 22 30 22 34 M28 34 C28 30 32 30 32 34" stroke="currentColor" stroke-width="1.6" fill="none"/>`,
    R_salon: `<path d="M10 30 C10 22 18 22 18 30 L46 30 C46 22 54 22 54 30 L54 44 L10 44 Z" fill="currentColor"/>
      <rect x="18" y="24" width="28" height="10" rx="3" fill="currentColor"/>
      <rect x="12" y="44" width="4" height="7" fill="currentColor"/><rect x="48" y="44" width="4" height="7" fill="currentColor"/>`,
    R_bilardo: `<circle cx="22" cy="40" r="8" fill="currentColor"/><circle cx="40" cy="40" r="8" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="31" cy="26" r="8" fill="currentColor"/><path d="M8 8 L26 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
    R_yemek: `<circle cx="32" cy="34" r="16" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="34" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M8 14 V30 M5 14 V22 C5 26 11 26 11 22 V14" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M56 14 C51 18 51 26 56 28 V52" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
  };
  return paths[id] || '';
}
function roomIconSVG(id, size=22) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}">${roomIconInner(id)}</svg>`;
}

function weaponIconInner(id) {
  const paths = {
    samdan: `<path d="M32 6 C28 12 30 16 32 16 C34 16 36 12 32 6 Z" fill="currentColor"/><rect x="28" y="17" width="8" height="14" rx="1" fill="currentColor"/><path d="M22 31 H42 L38 36 H26 Z" fill="currentColor"/><rect x="30" y="36" width="4" height="14" fill="currentColor"/><path d="M20 58 C20 50 44 50 44 58 Z" fill="currentColor"/>`,
    bicak: `<path d="M32 6 L36 30 L28 30 Z" fill="currentColor"/><rect x="29" y="30" width="6" height="18" fill="currentColor"/><rect x="22" y="46" width="20" height="4" rx="1" fill="currentColor"/><rect x="30" y="48" width="4" height="10" rx="1" fill="currentColor"/>`,
    ip: `<path d="M10 20 C10 44 54 20 54 44" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="10" cy="20" r="4" fill="currentColor"/><circle cx="54" cy="44" r="4" fill="currentColor"/>`,
    boru: `<rect x="8" y="27" width="48" height="10" rx="2" fill="currentColor"/><rect x="6" y="24" width="7" height="16" rx="1" fill="currentColor"/><rect x="51" y="24" width="7" height="16" rx="1" fill="currentColor"/>`,
    tabanca: `<path d="M8 20 H52 V30 H26 L22 50 H12 L16 30 H8 Z" fill="currentColor"/><path d="M26 30 C26 38 34 38 34 30" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="46" y="16" width="4" height="4" fill="currentColor"/>`,
    anahtar: `<path d="M14 50 L40 24" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M40 24 C36 14 44 6 52 8 L46 14 L50 18 L56 12 C58 20 50 28 40 24 Z" fill="currentColor"/><path d="M14 50 C8 44 16 36 20 44" fill="currentColor"/>`
  };
  return paths[id] || '';
}
function weaponIconSVG(id, size=22) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}">${weaponIconInner(id)}</svg>`;
}

function suspectAvatarSVG(id, color, size=56) {
  const base = `<circle cx="32" cy="24" r="13" fill="#3a2a1a" stroke="${color}" stroke-width="2.5"/>
    <path d="M11 58 C11 41 19 35 32 35 C45 35 53 41 53 58 Z" fill="#3a2a1a" stroke="${color}" stroke-width="2.5"/>`;
  const acc = {
    scarlett: `<path d="M9 19 C9 6 55 6 55 19 C55 12 44 8 32 8 C20 8 9 12 9 19 Z" fill="${color}"/><ellipse cx="46" cy="9" rx="4" ry="7" fill="${color}" transform="rotate(30 46 9)"/>`,
    mustard: `<path d="M13 17 Q32 2 51 17 L51 22 L13 22 Z" fill="${color}"/><rect x="13" y="20" width="38" height="5" rx="1" fill="${color}"/><path d="M24 33 Q32 36 40 33" stroke="${color}" stroke-width="2" fill="none"/>`,
    plum: `<circle cx="26" cy="24" r="5.5" fill="none" stroke="${color}" stroke-width="2"/><circle cx="38" cy="24" r="5.5" fill="none" stroke="${color}" stroke-width="2"/><line x1="31.5" y1="24" x2="32.5" y2="24" stroke="${color}" stroke-width="2"/><line x1="20.5" y1="22" x2="16" y2="20" stroke="${color}" stroke-width="2"/>`,
    white: `<path d="M9 21 C9 4 55 4 55 21 C55 30 46 21 32 21 C18 21 9 30 9 21 Z" fill="${color}"/><path d="M17 25 C15 36 15 48 17 58 M47 25 C49 36 49 48 47 58" stroke="${color}" stroke-width="1.4" fill="none" opacity="0.55"/>`,
    green: `<rect x="15" y="1" width="34" height="13" rx="1" fill="${color}"/><rect x="10" y="13" width="44" height="6" rx="1" fill="${color}"/><circle cx="39" cy="25" r="4.5" fill="none" stroke="${color}" stroke-width="2"/><line x1="43" y1="28" x2="46" y2="32" stroke="${color}" stroke-width="1.5"/>`,
    peacock: `<path d="M9 19 C9 8 18 2 32 2 C46 2 55 8 55 19 L50 31 L47 17 L17 17 L14 31 Z" fill="${color}"/><line x1="41" y1="9" x2="48" y2="4" stroke="${color}" stroke-width="2" stroke-linecap="round"/><circle cx="48" cy="4" r="1.8" fill="${color}"/>`
  };
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}">${base}${acc[id]||''}</svg>`;
}

/* ======================= SES / MÜZİK MOTORU ======================= */

let audioStarted = false;
// Özgün beste: re minör, 116 BPM; pizzicato bas, santur benzeri arpej, keman benzeri melodi, hafif perküsyon
const midi = n => 440 * Math.pow(2, (n-69)/12);
const SONG = {
  bpm: 116,
  // 8 ölçü: kök (bas) ve akor notaları
  chords: [
    { root:50, tones:[62,65,69] },    // Dm
    { root:45, tones:[61,64,67] },    // A7
    { root:50, tones:[62,65,69] },    // Dm
    { root:46, tones:[62,65,70] },    // Bb
    { root:43, tones:[62,67,70] },    // Gm
    { root:50, tones:[62,65,69] },    // Dm
    { root:51, tones:[63,67,70] },    // Eb
    { root:45, tones:[61,64,69] },    // A7
  ],
  // melodi: ölçü başına 8 sekizlik, null = sus
  lead: [
    [69,null,74,76,77,76,74,null],
    [73,null,76,79,76,73,69,null],
    [74,77,81,77,74,null,69,null],
    [70,74,77,74,73,76,73,null],
    [79,null,77,79,82,79,77,74],
    [77,null,74,77,81,null,77,74],
    [75,79,82,79,75,null,74,75],
    [73,76,79,76,73,null,null,null],
  ],
};
const Music = {
  ctx:null, master:null, synthBus:null, on:true, running:false, timer:null, step:0, cycle:0, nextTime:0, noise:null, userAudio:null,
  init(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(ctx.destination);
    this.synthBus = ctx.createGain(); this.synthBus.gain.value = 0.55; this.synthBus.connect(this.master);
    const len = ctx.sampleRate * 0.3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    this.noise = buf;
  },
  voice(freq, t, dur, { type='triangle', vol=0.1, attack=0.005, cutoff=4000, vibrato=0 } = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (vibrato) {
      const l = ctx.createOscillator(); l.frequency.value = 5.5;
      const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(freq*vibrato, t + dur*0.6);
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    o.connect(f); f.connect(g); g.connect(this.synthBus);
    o.start(t); o.stop(t + dur + 0.05);
  },
  hit(t, vol, cutoff, dur) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = cutoff; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.synthBus); src.start(t); src.stop(t + dur + 0.02);
  },
  playStep(step, t) {
    const s16 = 60 / SONG.bpm / 4;
    const bar = Math.floor(step / 16), pos = step % 16;
    const ch = SONG.chords[bar];
    // pizzicato bas: oom-pa oom-pa
    if (pos===0 || pos===8) this.voice(midi(ch.root), t, 0.32, { type:'triangle', vol:0.22, cutoff:900 });
    if (pos===4 || pos===12) this.voice(midi(ch.root+7), t, 0.22, { type:'triangle', vol:0.14, cutoff:900 });
    if (pos===14 && bar%2===1) this.voice(midi(ch.root+12), t, 0.18, { type:'triangle', vol:0.12, cutoff:900 });
    // santur benzeri arpej (her onaltılık)
    const arp = [0,1,2,1, 2,0,1,2, 0,1,2,1, 2,1,0,1];
    const tone = ch.tones[arp[pos]] + (pos>=8 && bar%2 ? 12 : 0);
    this.voice(midi(tone), t, 0.18, { type:'sawtooth', vol: pos%4===0 ? 0.035 : 0.022, cutoff:2600 });
    this.voice(midi(tone)*1.004, t, 0.14, { type:'square', vol:0.008, cutoff:3200 });
    // perküsyon
    if (pos===4 || pos===12) this.hit(t, 0.12, 1800, 0.09);
    if (pos%2===1) this.hit(t, 0.025, 7000, 0.03);
    if (pos===0 && bar%4===0) this.voice(midi(38), t, 0.4, { type:'sine', vol:0.25, cutoff:400 });
    // melodi: ilk turdan sonra girer
    if (this.cycle > 0 && pos%2===0) {
      const n = SONG.lead[bar][pos/2];
      if (n) this.voice(midi(n), t, s16*1.8, { type:'sawtooth', vol:0.055, attack:0.02, cutoff:2200, vibrato:0.006 });
    }
  },
  schedule() {
    const s16 = 60 / SONG.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      if (this.on && !this.userAudio) this.playStep(this.step, this.nextTime);
      this.nextTime += s16;
      this.step = (this.step + 1) % (SONG.chords.length * 16);
      if (this.step === 0) this.cycle++;
    }
  },
  start() {
    if (this.running || !this.ctx) return;
    this.running = true;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 40);
  },
  toggle() {
    this.on = !this.on;
    if (this.userAudio) { if (this.on) this.userAudio.play().catch(()=>{}); else this.userAudio.pause(); }
    if (this.synthBus) this.synthBus.gain.linearRampToValueAtTime(this.on?0.55:0, this.ctx.currentTime+0.3);
    return this.on;
  },
  useFile(file) {
    if (this.userAudio) { this.userAudio.pause(); URL.revokeObjectURL(this.userAudio.src); }
    const a = new Audio(URL.createObjectURL(file));
    a.loop = true; a.volume = 0.6;
    this.userAudio = a;
    if (this.on) a.play().catch(()=>{});
  }
};
let sfxOn = true;
function beep(freq,dur,type='sine',vol=0.12) {
  if (!sfxOn || !Music.ctx) return;
  const ctx = Music.ctx;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
  o.connect(g); g.connect(Music.master); o.start(); o.stop(ctx.currentTime+dur);
}
const sfxDice = () => [0,80,160].forEach((d,i)=>setTimeout(()=>beep(190+i*50,0.08,'square',0.07),d));
const sfxCard = () => beep(520,0.12,'triangle',0.08);
const sfxClick = () => beep(760,0.05,'sine',0.05);

function ensureAudio() {
  if (audioStarted) return;
  audioStarted = true;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    Music.init(ctx); Music.start();
  } catch(e) {}
}
document.addEventListener('click', ensureAudio, {once:true});
document.addEventListener('touchstart', ensureAudio, {once:true});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('musicToggle').onclick = () => {
    const on = Music.toggle();
    document.getElementById('musicToggle').textContent = on ? '🎵' : '🔇';
  };
  document.getElementById('musicFile').onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    ensureAudio();
    Music.useFile(file);
    document.getElementById('musicToggle').textContent = Music.on ? '🎵' : '🔇';
  };
  document.getElementById('sfxToggle').onclick = () => {
    sfxOn = !sfxOn;
    document.getElementById('sfxToggle').textContent = sfxOn ? '🔊' : '🔈';
  };
});

