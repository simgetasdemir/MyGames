// Oyunun tüm içeriği ve tahta kuralları tek yerde: hem sunucu (Node) hem tarayıcı bu dosyayı kullanır.
// Marka, karakter, silah ve oda adlarını değiştirmek için yalnızca bu dosyayı düzenlemek yeterli.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const TITLE = 'CLUEDO';
  const VICTIM = 'Dr. Black';

  // Arka plan müziği: bu dosya depoda varsa döngüde çalar, yoksa oyunun kendi bestelenmiş müziği çalar.
  // credit: lisansın istediği atıf metni (oyunun altında gösterilir). Dosya yoksa boş bırakılabilir.
  const MUSIC = {
    file: 'audio/arka-plan.mp3',
    credit: '"Sneaky Snitch" Kevin MacLeod (incompetech.com) · Creative Commons: By Attribution 4.0 · creativecommons.org/licenses/by/4.0/',
  };

  // Oyun sırası bu listedeki sıradır (orijinaldeki gibi Scarlett başlar)
  const CHARACTERS = [
    { id:'scarlett', name:'Bayan Scarlett', start:'24,7',  color:'#dc2626' },
    { id:'mustard',  name:'Albay Mustard',  start:'17,0',  color:'#eab308' },
    { id:'white',    name:'Bayan White',    start:'0,9',   color:'#f5f5f4' },
    { id:'green',    name:'Bay Green',      start:'0,14',  color:'#16a34a' },
    { id:'peacock',  name:'Bayan Peacock',  start:'6,23',  color:'#2563eb' },
    { id:'plum',     name:'Profesör Plum',  start:'19,23', color:'#9333ea' },
  ];

  const WEAPONS = [
    { id:'samdan',  name:'Şamdan' },
    { id:'bicak',   name:'Bıçak' },
    { id:'boru',    name:'Kurşun Boru' },
    { id:'tabanca', name:'Tabanca' },
    { id:'ip',      name:'İp' },
    { id:'anahtar', name:'İngiliz Anahtarı' },
  ];

  // Tahta 24 sütun x 25 satır. rects = [ilkSatır, ilkSütun, sonSatır, sonSütun]; doors = odaya açılan koridor kareleri.
  const ROOMS = [
    { id:'R_mutfak',    name:'Mutfak',         to:'Mutfağa',          at:'Mutfakta',          img:'images/odalar/mutfak.jpg',    rects:[[1,0,6,5]],     doors:[[7,4]],                   secretTo:'R_calisma' },
    { id:'R_balo',      name:'Balo Salonu',    to:'Balo Salonuna',    at:'Balo Salonunda',    img:'images/odalar/balo.jpg',      rects:[[2,8,7,15]],    doors:[[5,7],[5,16],[8,9],[8,14]], secretTo:null },
    { id:'R_kis',       name:'Kış Bahçesi',    to:'Kış Bahçesine',    at:'Kış Bahçesinde',    img:'images/odalar/kis.jpg',       rects:[[1,18,5,23]],   doors:[[6,18]],                  secretTo:'R_salon' },
    { id:'R_bilardo',   name:'Bilardo Salonu', to:'Bilardo Salonuna', at:'Bilardo Salonunda', img:'images/odalar/bilardo.jpg',   rects:[[8,18,12,23]],  doors:[[9,17],[13,22]],          secretTo:null },
    { id:'R_kutuphane', name:'Kütüphane',      to:'Kütüphaneye',      at:'Kütüphanede',       img:'images/odalar/kutuphane.jpg', rects:[[14,17,18,23]], doors:[[13,20],[16,16]],         secretTo:null },
    { id:'R_calisma',   name:'Çalışma Odası',  to:'Çalışma Odasına',  at:'Çalışma Odasında',  img:'images/odalar/calisma.jpg',   rects:[[21,17,24,23]], doors:[[20,17]],                 secretTo:'R_mutfak' },
    { id:'R_hol',       name:'Hol',            to:"Hol'e",            at:"Hol'de",            img:'images/odalar/hol.jpg',       rects:[[18,9,24,14]],  doors:[[17,11],[17,12],[20,15]], secretTo:null },
    { id:'R_salon',     name:'Salon',          to:'Salona',           at:'Salonda',           img:'images/odalar/salon.jpg',     rects:[[19,0,24,6]],   doors:[[18,6]],                  secretTo:'R_kis' },
    { id:'R_yemek',     name:'Yemek Odası',    to:'Yemek Odasına',    at:'Yemek Odasında',    img:'images/odalar/yemek.jpg',     rects:[[10,0,15,7]],   doors:[[12,8],[16,6]],           secretTo:null },
  ];

  const CENTER = [10,10,16,14];
  const ROWS = 25, COLS = 24;
  const WALLS = [
    ...Array.from({length:COLS}, (_,c) => [0,c]).filter(([,c]) => c!==9 && c!==14),
    [1,10],[1,11],[1,12],[1,13],
    [7,0],[8,0],[9,0],[9,1],[9,2],[9,3],[9,4],[16,0],[18,0],
    [7,23],[13,23],[20,23],
    [24,8],[24,15],[24,16],
  ];

  const ROOM_BY_ID = Object.fromEntries(ROOMS.map(r => [r.id, r]));
  const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
  const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
  const posKey = (r,c) => r + ',' + c;
  const isRoom = pos => !!ROOM_BY_ID[pos];

  // Kare haritası: 'corr' (koridor), 'start', 'wall', 'center' veya oda id'si
  const CELL = Array.from({length:ROWS}, () => Array(COLS).fill('corr'));
  ROOMS.forEach(rm => rm.rects.forEach(([r0,c0,r1,c1]) => {
    for (let r=r0;r<=r1;r++) for (let c=c0;c<=c1;c++) CELL[r][c] = rm.id;
  }));
  for (let r=CENTER[0];r<=CENTER[2];r++) for (let c=CENTER[1];c<=CENTER[3];c++) CELL[r][c] = 'center';
  WALLS.forEach(([r,c]) => { CELL[r][c] = 'wall'; });
  CHARACTERS.forEach(ch => { const [r,c] = ch.start.split(',').map(Number); CELL[r][c] = 'start'; });

  // kapı karesi -> { oda, odanın hangi yönde olduğu }
  const DOORS = {};
  ROOMS.forEach(rm => rm.doors.forEach(([r,c]) => {
    const dir = CELL[r-1]?.[c]===rm.id ? 't' : CELL[r+1]?.[c]===rm.id ? 'b' : CELL[r][c-1]===rm.id ? 'l' : 'r';
    DOORS[posKey(r,c)] = { room: rm.id, dir };
  }));

  function neighbors(pos) {
    const [r,c] = pos.split(',').map(Number);
    return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
      .filter(([y,x]) => y>=0 && y<ROWS && x>=0 && x<COLS && CELL[y][x]==='corr')
      .map(([y,x]) => posKey(y,x));
  }

  // Zar kadar (en fazla) kare: dolu karelerden geçilmez, odaya kapıdan girilir ve hareket biter,
  // az önce çıkılan odaya aynı turda geri girilmez.
  function computeMoves(from, steps, occupiedList) {
    const occupied = new Set(occupiedList.filter(n => !isRoom(n)));
    const dist = new Map(); const queue = [];
    const fromRoom = isRoom(from) ? from : null;
    if (fromRoom) {
      ROOM_BY_ID[fromRoom].doors.forEach(([r,c]) => { const k=posKey(r,c); if (!occupied.has(k)) { dist.set(k,1); queue.push(k); } });
    } else { dist.set(from,0); queue.push(from); }
    while (queue.length) {
      const k = queue.shift(); const d = dist.get(k);
      if (d >= steps) continue;
      neighbors(k).forEach(n => { if (!dist.has(n) && !occupied.has(n)) { dist.set(n,d+1); queue.push(n); } });
    }
    const squares = [...dist.entries()].filter(([,d]) => d>0 && d<=steps).map(([k]) => k);
    const rooms = ROOMS.filter(rm => rm.id !== fromRoom &&
      rm.doors.some(([r,c]) => { const d = dist.get(posKey(r,c)); return d!==undefined && d < steps; })).map(rm => rm.id);
    return { squares, rooms };
  }

  return { TITLE, VICTIM, MUSIC, CHARACTERS, WEAPONS, ROOMS, CENTER, ROWS, COLS, CELL, DOORS,
           ROOM_BY_ID, CHAR_BY_ID, WEAPON_BY_ID, posKey, isRoom, neighbors, computeMoves };
});
