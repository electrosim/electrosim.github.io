/* Проверка кнопочного мультиметра в общей стилистике аппаратов:
   щупы стоят в гнёздах и ездят вместе с прибором, показания выводятся
   семисегментными знаками.
   Запуск: node tools/test-multimeter.js */
const assert = require('assert');
const { load } = require('./sandbox');

const W = 236, H = 396;                       // корпус прибора
const LCD = { x: 26, y: 46, w: 184, h: 116 };// стекло индикатора

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}
/* Средняя ширина знака Segoe UI — для проверки, что подпись влезает в клавишу. */
function textWidth(text, size) { return text.replace(/&[a-z]+;/g, 'x').length * size * 0.52; }
function ptr(init) { return Object.assign({ pointerType: 'mouse', pointerId: 1, button: 0, clientX: 0, clientY: 0 }, init); }

/* ---------- 1. Разметка прибора ---------- */
function markup(mode) {
  const s = load({ interactive: true });
  s.api.state.special.multimeter = true;
  if (mode === 'probe') { s.api.state.mm.a = { devId: 'IN', key: 'L1' }; s.api.state.mm.b = { devId: 'IN', key: 'N' }; }
  if (mode === 'off') s.api.state.mm.power = false;
  s.api.renderAll();
  return { s: s, svg: s.els.mmLayer.innerHTML };
}

const check = { fails: 0 };
function ok(name, cond, extra) {
  if (cond) console.log('  ok   ' + name);
  else { check.fails++; console.log('  FAIL ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

console.log('— корпус и органы управления —');
const live = markup('live');
const svg = live.svg;
ok('мультиметр отрисован', svg.length > 1000, svg.length);
ok('жёлтый корпус с тёмной окантовкой', /fill="#f5ce34"/.test(svg)&&/fill="#41484f" stroke="#252c32"/.test(svg));
ok('кнопка питания удалена', !/class="mm-power"/.test(svg));
ok('нижний шильдик удалён', !/V~ · V⎓ · Ω · ПРОЗВОНКА/.test(svg));
ok('прозвонка обозначена звуковой волной', /class="mm-sound-icon"/.test(svg));
ok('только работающие органы управления', !/mm-hold|NCV|АВТООТКЛЮЧЕНИЕ/.test(svg));
ok('нет марки производителя и старого корпуса', !/ZOYI|ZT-X|mmBumper|mmStand/.test(svg));
ok('цифры занимают индикатор без нижней шкалы', !/fill="#20272d"/.test(svg));

const keys = [];
const keyRe = /<g class="mm-mode"[^>]*><rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g;
let m;
while ((m = keyRe.exec(svg))) keys.push({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] });
ok('четыре клавиши режимов', keys.length === 4, keys.length);
keys.forEach(function (k, i) {
  ok('клавиша ' + (i + 1) + ' внутри корпуса', k.x >= 0 && k.y >= 0 && k.x + k.w <= W && k.y + k.h <= H);
});
for (let i = 0; i < keys.length; i++) {
  for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j];
    ok('клавиши ' + (i + 1) + ' и ' + (j + 1) + ' не пересекаются',
      !(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h));
  }
}

/* Подписи клавиш должны помещаться внутри своей клавиши. */
const modeGroupRe = /<g class="mm-mode"[^>]*>([\s\S]*?)<\/g>/g;
let mi = 0;
while ((m = modeGroupRe.exec(svg))) {
  const k = keys[mi++];
  (m[1].match(/<text x="([\d.]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g) || []).forEach(function (t) {
    const label = t.replace(/<[^>]*>/g, '');
    const size = parseFloat(attr(t, 'font-size'));
    const cx = parseFloat(attr(t, 'x'));
    ok('подпись «' + label + '» влезает в клавишу ' + mi, textWidth(label, size) <= k.w - 6,
      textWidth(label, size).toFixed(1) + ' при ' + (k.w - 6));
    ok('подпись «' + label + '» по центру клавиши ' + mi, Math.abs(cx - (k.x + k.w / 2)) < 0.6);
  });
}

/* Оба гнезда совпадают с точками выхода кабелей. */
const jacks = [];
const jackRe = /<circle cx="(-?[\d.]+)" cy="(-?[\d.]+)" r="14\.5"/g;
while ((m = jackRe.exec(svg))) jacks.push({ x: +m[1], y: +m[2] });
ok('два действующих гнезда для щупов', jacks.length === 2, jacks.length);
jacks.forEach(function (j, i) {
  ok('гнездо ' + (i + 1) + ' не выходит за ширину корпуса', j.x > 14 && j.x < W - 14);
  ok('гнездо ' + (i + 1) + ' крепится сверху корпуса', j.y < 0, j.y);
});
jacks.forEach(function(j,i){
  const expected=live.s.api.METER_JACKS[i===0?'black':'red'];
  ok('гнездо '+(i+1)+' совпадает с координатой кабеля',j.x===expected.dx&&j.y===expected.dy);
});
const preview=live.s.api.specialTrayPreview('multimeter');
ok('миниатюра в лотке повторяет кнопочную панель',
  (preview.match(/class="mm-mode"/g)||[]).length===4&&preview.includes('fill="#f5ce34"'));

console.log('— показания на индикаторе —');
[['live', 'щупы свободны'], ['probe', 'щупы на L1 и N'], ['off', 'старое сохранение с выключенным прибором']].forEach(function (c) {
  const s = markup(c[0]);
  const digit = s.svg.match(/<text class="mm-reading"[^>]*>[^<]*<\/text>/);
  ok('показание обычным шрифтом (' + c[1] + ')', !!digit);
  if (!digit) return;
  const size=Number(attr(digit[0],'font-size'));
  const label=digit[0].replace(/<[^>]*>/g,'');
  const x=Number(attr(digit[0],'x')),y=Number(attr(digit[0],'y'));
  ok('показание помещается в стекло (' + c[1] + ')',
    x-size*label.length*.65/2>=LCD.x && x+size*label.length*.65/2<=LCD.x+LCD.w
    && y-size>=LCD.y && y<=146);
});
const zero = markup('probe');
ok('фазное напряжение показано точно и с единицами', Math.abs(parseFloat(zero.s.api.measureNow().display)-380/Math.sqrt(3))<.1 && /В<\/text>/.test(zero.svg));
ok('на индикаторе есть режим AC', />AC<\/text>/.test(zero.svg));

console.log('— щупы в гнёздах —');
const probeRe = /class="mm-probe"[^>]*data-probe="(\w)"[^>]*transform="translate\((-?[\d.]+),(-?[\d.]+)\)(?: rotate\((-?[\d.]+)\))?"/g;
const probes = [];
while ((m = probeRe.exec(live.svg))) probes.push({ key: m[1], x: +m[2], y: +m[3], tilt: +m[4] });
ok('оба щупа отрисованы', probes.length === 2, probes.length);
probes.forEach(function (p) {
  const jack = live.s.api.meterJack(p.key === 'a' ? 'red' : 'black');
  ok('щуп ' + p.key + ' рукояткой в гнезде, иглой вверх',
    Math.abs(p.x - jack.x) < 0.01 && Math.abs(p.y + 40 - jack.y) < 0.01,
    p.x + ',' + p.y + ' против ' + jack.x + ',' + jack.y);
  ok('щуп ' + p.key + ' прямой', p.tilt === 0, p.tilt);
  const grip = live.s.api.meterProbeGrip(p.key, { x: p.x, y: p.y });
  ok('рукоятка щупа ' + p.key + ' не закрывает панель',
    grip.y < live.s.api.METER.y + 5 || grip.y > live.s.api.METER.y + live.s.api.METER.h - 6
    || grip.x < live.s.api.METER.x + 16 || grip.x > live.s.api.METER.x + live.s.api.METER.w - 16,
    grip.x.toFixed(0) + ',' + grip.y.toFixed(0));
});
const cables = live.svg.match(/<path\b[^>]*stroke-width="8\.4"[^>]*>/g) || [];
ok('кабели выходят из гнёзд', cables.length === 2, cables.length);
cables.forEach(function (c, i) {
  const d = (c.match(/d="([^"]*)"/) || [])[1] || '';
  const mm = d.match(/^M (-?[\d.]+),(-?[\d.]+) C/);
  ok('кабель ' + (i + 1) + ' начинается в гнезде',
    mm && Math.abs(+mm[2] - live.s.api.meterJack(i === 0 ? 'black' : 'red').y) < 0.01, mm ? mm[2] : d);
});

/* Пересчёт координат указателя в координаты сцены: сцена смещена на 200 вниз
   (группа world), поэтому матрица — единичная с этим сдвигом. */
function identityCtm(s) {
  const m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 200, inverse() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: -200 }; } };
  s.els.world.getScreenCTM = function () { return m; };
}

console.log('— щупы ездят вместе с прибором —');
(function () {
  const s = load({ interactive: true });
  identityCtm(s);
  s.api.state.special.multimeter = true;
  s.api.renderAll();
  const layer = s.els.mmLayer;
  const body = s.makeEl('g');
  body.classList.add('multimeter-body');
  body.parentNode = layer;
  const startX = s.api.METER.x, startY = s.api.METER.y;
  const redBefore = s.api.meterProbeFallback('a');
  body.dispatchEvent(new s.window.PointerEvent('pointerdown', ptr({ clientX: 0, clientY: 0 })));
  ok('корпус взят для переноса', !!s.api.meterDrag(), s.api.meterDrag());
  s.window.document.dispatchEvent(new s.window.PointerEvent('pointermove', ptr({ clientX: 120, clientY: 60 })));
  s.window.document.dispatchEvent(new s.window.PointerEvent('pointerup', ptr({ clientX: 120, clientY: 60 })));
  const dx = s.api.METER.x - startX, dy = s.api.METER.y - startY;
  const redAfter = s.api.meterProbeFallback('a');
  ok('прибор сдвинулся на смещение указателя', dx === 120 && dy === 60, dx + ',' + dy);
  ok('щуп в гнезде сдвинулся вместе с прибором',
    Math.abs(redAfter.x - (redBefore.x + dx)) < 0.01 && Math.abs(redAfter.y - (redBefore.y + dy)) < 0.01,
    JSON.stringify(redAfter) + ' против ' + JSON.stringify(redBefore));
  const jack = s.api.meterJack('red');
  ok('щуп остался в гнезде после переноса',
    Math.abs(redAfter.x - jack.x) < 0.01 && Math.abs(redAfter.y + 40 - jack.y) < 0.01,
    JSON.stringify(redAfter) + ' против ' + JSON.stringify(jack));
  ok('кабель по-прежнему начинается в гнезде',
    s.els.mmLayer.innerHTML.indexOf('M ' + s.api.meterJack('black').x + ',' + s.api.meterJack('black').y + ' C') > 0);
})();

console.log('— свободные щупы возвращаются в гнёзда —');
for(const key of ['a','b']){
  const s=load({interactive:true});
  identityCtm(s);s.api.state.special.multimeter=true;s.api.renderAll();
  const probe=s.makeEl('g');probe.classList.add('mm-probe');
  probe.setAttribute('data-probe',key);probe.parentNode=s.els.mmLayer;
  const tip=s.api.meterProbeFallback(key),grip=s.api.meterProbeGrip(key,tip);
  probe.dispatchEvent(new s.window.PointerEvent('pointerdown',ptr({clientX:grip.x,clientY:grip.y+200})));
  s.window.document.dispatchEvent(new s.window.PointerEvent('pointermove',ptr({clientX:2000,clientY:2200})));
  ok('щуп '+key+' свободно перемещается за рукоятку',s.api.state.mm[key+'Docked']===false);
  s.window.document.dispatchEvent(new s.window.PointerEvent('pointerup',ptr({clientX:2000,clientY:2200})));
  const home=s.api.meterJack(key==='a'?'red':'black'),p=s.api.meterProbeFallback(key);
  ok('щуп '+key+' вернулся рукояткой в своё гнездо',s.api.state.mm[key+'Docked']===true&&p.x===home.x&&p.y+40===home.y&&!s.api.state.mm[key]);
  // Повторный перенос к клемме: указатель держит рукоятку, подключается остриё.
  const probe2=s.makeEl('g');probe2.classList.add('mm-probe');probe2.setAttribute('data-probe',key);probe2.parentNode=s.els.mmLayer;
  const t=s.api.terminal('IN','L1'),g=s.api.meterProbeGrip(key,p);
  const term=s.makeEl('circle');term.dataset.dev='IN';term.dataset.key='L1';
  term.setAttribute('cx',t.x);term.setAttribute('cy',t.y);
  s.els.termLayer.querySelectorAll=function(selector){return selector==='.term'?[term]:[];};
  probe2.dispatchEvent(new s.window.PointerEvent('pointerdown',ptr({clientX:g.x,clientY:g.y+200})));
  s.window.document.dispatchEvent(new s.window.PointerEvent('pointermove',ptr({clientX:t.x,clientY:t.y+40+200})));
  s.window.document.dispatchEvent(new s.window.PointerEvent('pointerup',ptr({clientX:t.x,clientY:t.y+40+200})));
  ok('щуп '+key+' подключается остриём к клемме',s.api.state.mm[key]?.devId==='IN'&&s.api.state.mm[key]?.key==='L1');
}
(function(){
  const s=markup('live');
  s.s.api.state.mm.aDocked=false;s.s.api.METER.redX=2000;s.s.api.METER.redY=2000;
  s.s.api.renderMM();
  ok('свободный щуп из старого состояния возвращается в гнездо',s.s.api.state.mm.aDocked===true);
  ok('иглы увеличены и выделены контуром',/class="mm-probe-needle"[^>]*L -2.6,22[^>]*stroke="#46515c"/.test(s.s.els.mmLayer.innerHTML));
})();

console.log('— прибор всегда готов к измерению —');
(function () {
  const s = markup('off');
  ok('старое выключенное состояние включается автоматически', s.s.api.state.mm.power === true);
  const screen=s.s.api.mmScreen(true,{display:'220 В'},'voltage');
  ok('220 отображается текстом без сегментов',
    /class="mm-reading"[^>]*>220<\/text>/.test(screen) && !/<path/.test(screen));
  for(const display of ['-09.63 В','0.5 Ω','123456.7 Ω']){
    const reading=s.s.api.mmScreen(true,{display},'resistance').match(/<text class="mm-reading"[^>]*>[^<]*<\/text>/);
    const label=reading[0].replace(/<[^>]*>/g,'');
    ok('длинное показание помещается: '+display,Number(attr(reading[0],'font-size'))*label.length*.65<=161);
  }
})();

console.log('— кнопки действительно переключают режимы —');
(function(){
  const s=load({interactive:true});
  s.api.state.special.multimeter=true;
  for(const fn of ['voltage','dcvoltage','resistance','continuity']){
    const button=s.makeEl('g');button.classList.add('mm-mode');
    button.setAttribute('data-mm-fn',fn);button.parentNode=s.els.mmLayer;
    button.dispatchEvent(new s.window.PointerEvent('pointerdown',ptr({})));
    ok('кнопка выбирает '+fn,s.api.state.mm.fn===fn);
    ok('выбор режима не начинает перенос корпуса',!s.api.meterDrag());
  }
  const open=s.api.mmScreen(true,{display:'>1 MΩ'},'resistance');
  ok('разрыв показывает полный знак >1 MΩ',open.includes('&gt;1 MΩ'));
  ok('килоомы сохраняют приставку',s.api.mmScreen(true,{display:'2.2 kΩ'},'resistance').includes('kΩ</text>'));
})();

console.log('— сохранение и загрузка пресета —');
(function () {
  const s = load({ interactive: true });
  s.api.state.special.multimeter = true;
  s.api.state.mm.a = { devId: 'IN', key: 'L1' };
  s.api.state.mm.b = { devId: 'IN', key: 'N' };
  s.api.state.mm.fn = 'dcvoltage';
  s.api.state.mm.power = false;
  s.api.renderAll();
  const snap = s.api.schemeSnapshot();
  const pm = snap.positions.multimeter;
  ok('в пресет попал режим измерения', pm.fn === 'dcvoltage', pm.fn);
  ok('в пресете прибор готов к измерению', pm.power === true);
  ok('в пресет попали точки подключения щупов', !!pm.a && !!pm.b, JSON.stringify({ a: pm.a, b: pm.b }));
  assert.ok(pm.x === s.api.METER.x && pm.y === s.api.METER.y);

  // Обратная загрузка: прибор выключен, режим DC, щупы на клеммах.
  const s2 = load({ interactive: true });
  s2.api.state.special.multimeter = true;
  snap.name = 'Проверка мультиметра';
  ok('схема загружена из снимка', s2.api.applyPreset(snap) === true);
  ok('после загрузки режим сохранён', s2.api.state.mm.fn === 'dcvoltage', s2.api.state.mm.fn);
  ok('после загрузки прибор готов к измерению', s2.api.state.mm.power === true);
  ok('после загрузки щупы вернулись на клеммы',
    !!s2.api.state.mm.a && !!s2.api.state.mm.b && s2.api.state.mm.a.key === 'L1',
    JSON.stringify(s2.api.state.mm.a));
  ok('прибор занял сохранённое место',
    s2.api.METER.x === pm.x && s2.api.METER.y === pm.y, s2.api.METER.x + ',' + s2.api.METER.y);
})();

console.log(check.fails ? '\nОШИБОК: ' + check.fails : '\nМультиметр: разметка, щупы, питание и сохранение — все проверки пройдены');
process.exit(check.fails ? 1 : 0);
