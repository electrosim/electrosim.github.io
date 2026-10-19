(function(){
'use strict';

/* ============================================================
   1. ГЕОМЕТРИЯ СЦЕНЫ
   ============================================================ */
const MM        = 3;                 // пикселей на 1 мм
const RAIL_H    = 35 * MM;           // высота рейки (35 мм)
const RAILS     = [235, 635];        // оси верхней и опущенной нижней DIN-рейки
const MODULE    = 17.5 * MM;         // один модуль 17,5 мм
const RAIL_X0   = 90;
const SLOTS     = 16;                 // щит на 16 модулей: на 20% уже прежних 20 модулей
const RAIL_X1   = RAIL_X0 + SLOTS * MODULE;
const VW        = 1240, VH = 1550;   // начальное окно: привычный размер объектов
const HOUSEHOLD_ROOM_SCALE=1.3;
const HOUSEHOLD_W=9000*HOUSEHOLD_ROOM_SCALE,HOUSEHOLD_H=3000*HOUSEHOLD_ROOM_SCALE; // увеличиваем комнаты, размер аппаратов прежний
const WORKSPACE_W = VW*2, WORKSPACE_H = VH*2; // рабочее поле вдвое шире и выше
const RELAY_DROP = 0;                // реле стыкуется снизу вплотную (надписи клемм пускателя видны)
const PIN_TOP    = 22;               // вылет щупов теплового реле над корпусом
const PAD_W      = 34;               // ширина приставной колодки A1–A2 справа от пускателя
// Компактная колодка 98–95 оставляет место для изгиба над T1–T3.
const THERMAL_AUX={top:74,height:30,terminalY:85,labelY:102,pairLabelY:88};
const THERMAL_POWER={top:130,terminalY:150,labelY:170};
const THERMAL_WIRE_BEND_RADIUS=6;
/* цвета проводов аппаратов: L1 — коричневый, L2 — чёрный, L3 — серый, N — синий, PE — жёлто-зелёный */
const WC = { L1:'#8b5a2b', L2:'#1c1c1c', L3:'#8d939a', N:'#2a6fd6', PE:'#e8d800', C:'#d64545', C2:'#2f8fd6' };
/* цвета проводов ввода: фазы — красный, жёлтый, зелёный */
const WCF = { L1:'#d32f2f', L2:'#e0b800', L3:'#1f9d3a', N:'#2a6fd6', PE:'#e8d800' };
const WIRE_SECTIONS_MM2=[0.5,0.75,1,1.5,2.5,4,6,10,16,25,35];
const wireDefaults = { shape:'smooth', color:'#1c1c1c', sectionMm2:2.5 };
function normalizeWireSection(value){
  const section=Number(value);
  return WIRE_SECTIONS_MM2.includes(section)?section:2.5;
}
function wireSectionOf(wire){return normalizeWireSection(wire&&wire.sectionMm2);}
function wireVisualWidth(wire){
  // Условный масштаб: 2,5 мм² сохраняет прежнюю толщину 4 px.
  return Number((4*Math.pow(wireSectionOf(wire)/2.5,0.35)).toFixed(2));
}
function wireSectionLabel(value){return String(normalizeWireSection(value)).replace('.',',')+' мм²';}
function wireSectionButtons(attribute,selected){
  return WIRE_SECTIONS_MM2.map(function(section){
    const active=section===normalizeWireSection(selected);
    return '<button type="button" '+attribute+'="'+section+'"'+(active?' class="selected"':'')+' aria-pressed="'+active+'"><i aria-hidden="true">○</i>'+wireSectionLabel(section)+'</button>';
  }).join('');
}
const RCD_CURRENTS=[16,25,32,40,50,63,80,100];
const RCD_LEAKAGE_CURRENTS=[10,30,100,300];
function syncRcdRatings(obj){
  const current=Number(obj.ratedCurrent),leakage=Number(obj.ratedLeakageMa);
  obj.ratedCurrent=RCD_CURRENTS.includes(current)?current:25;
  obj.ratedLeakageMa=RCD_LEAKAGE_CURRENTS.includes(leakage)?leakage:30;
  obj.ratedVoltage=220;
  obj.customName=protectiveDeviceName(obj);
}
function protectiveDeviceName(obj){
  if(obj.type==='rcd')return 'УЗО 2P, '+(Number(obj.ratedCurrent)||25)+' А, '+(Number(obj.ratedLeakageMa)||30)+' мА';
  return 'Автомат '+(TYPES[obj.type].poles+'P, ')+(obj.breakerType||(obj.type==='mcb3'?'C25':'C10'));
}

/* Повторные чтения в одной отрисовке используют общий расчёт. Контекст
   сбрасывается сразу после неё: коммутация всегда видит актуальную схему. */
let electricalReadContext=null;
function withElectricalRead(read){
  if(electricalReadContext)return read();
  electricalReadContext={potential:null,currents:null};
  try{return read();}finally{electricalReadContext=null;}
}
/* обозначения аппаратов на стенде */
const TAGS = { comb:'GS1', klemma:'XN', pebus:'XPE', mcb3:'QF1', mcb1:'QF2', mcb2:'QF', rcd:'QD1', meter:'PI1', sensor:'PVA1', lamp:'HL1', bulb:'EL1', outlet:'XS1', wallSwitch:'SA1', twoWaySwitch:'SA1', junction:'XR1', fridge:'E1', washer:'E1', boiler:'E1', stove:'E1', split:'E1', vfd:'UZ1', tp:'UZT1', km1:'KM1', kk1:'KK1', timer:'KT1', M1:'M1', IN:'XT1', PB:'SB1–SB3' };
const TAG_PREFIX = { comb:'GS', klemma:'XN', pebus:'XPE', mcb3:'QF', mcb1:'QF', mcb2:'QF', rcd:'QD', meter:'PI', sensor:'PVA', lamp:'HL', bulb:'EL', outlet:'XS', wallSwitch:'SA', twoWaySwitch:'SA', junction:'XR', fridge:'E', washer:'E', boiler:'E', stove:'E', split:'E', vfd:'UZ', tp:'UZT', km1:'KM', kk1:'KK', timer:'KT' };
Object.assign(TAGS,{crossN:'XN',crossPE:'XPE'});
Object.assign(TAG_PREFIX,{crossN:'XN',crossPE:'XPE'});
/* клеммная коробка ввода (в исходном щите, слева сверху): болты окрашены
   в цвета подходящих проводов — L1 красный, L2 жёлтый, L3 зелёный, N синий, PE жёлто-зелёный */
const INBOX = { x:90, y:-194, w:240, h:120 };
const INBOX_TERMS = [
  { key:'L1', label:'L1', dx:40,  dy:100, color:WCF.L1, tc:'#c62828' },
  { key:'L2', label:'L2', dx:80,  dy:100, color:WCF.L2, tc:'#9c7800' },
  { key:'L3', label:'L3', dx:120, dy:100, color:WCF.L3, tc:'#1b7f31' },
  { key:'N',  label:'N',  dx:160, dy:100, color:WCF.N,  tc:'#2a6fd6' },
  { key:'PE', label:'PE', dx:200, dy:100, color:WCF.PE, tc:'#5f7a00' }
];
const INBOX_SINGLE_TERMS = [
  // Ключ L1 сохраняет подключение первой фазы при переключении типа ввода.
  { key:'L1', label:'L', dx:50, dy:100, color:WC.L1, tc:WC.L1 },
  { key:'N', label:'N', dx:90, dy:100, color:WCF.N, tc:'#2a6fd6' },
  { key:'PE', label:'PE', dx:130, dy:100, color:WCF.PE, tc:'#5f7a00' }
];

/* ============================================================
   2. МОДЕЛЬ АППАРАТОВ
   ============================================================ */
const TYPES = {
  klemma: { title:'Нулевая колодка XN (шина N)',   modules:1, h:58*MM, kind:'terminal' },
  pebus:  { title:'Защитная колодка XPE (шина PE)', modules:1, h:58*MM, kind:'terminal' },
  crossN: { title:'Кросс-модуль нулевой N (2×4)', modules:2, h:48*MM, kind:'terminal', crossModule:true },
  crossPE:{ title:'Кросс-модуль заземляющий PE (2×4)', modules:2, h:48*MM, kind:'terminal', crossModule:true },
  mcb3:   { title:'Вводной автомат 3P, C25',        modules:3, h:82*MM, kind:'mcb', poles:3, rating:'C25' },
  mcb1:   { title:'Автомат 1P, C10',                modules:1, h:82*MM, kind:'mcb', poles:1, rating:'C10' },
  mcb2:   { title:'Автомат 2P, C10', modules:2, h:82*MM, kind:'mcb', poles:2, rating:'C10' },
  comb:   { title:'Монтажная гребёнка PIN', modules:3, h:48, kind:'comb', freeOnly:true },
  rcd:    { title:'УЗО 2P, 25 А / 30 мА',           modules:2, h:82*MM, kind:'rcd', poles:2, rating:'25 А' },
  meter:  { title:'Счётчик энергии 1Ф, 230 В',       modules:4, h:82*MM, kind:'meter' },
  sensor: { title:'Датчик напряжения и тока PVA1',   modules:2, h:82*MM, kind:'sensor' },
  lamp:   { title:'Сигнальная лампа HL1, зелёная, 220 В', modules:1, h:82*MM, kind:'lamp' },
  bulb:   { title:'Лампа накаливания EL1, 220 В / 100 Вт', modules:2, h:60*MM, kind:'bulb', freeOnly:true },
  outlet: { title:'Двойная розетка XS1, 220 В', modules:4, h:60*MM, kind:'outlet', freeOnly:true },
  junction:{ title:'Разветвительная коробка', modules:4, h:70*MM, kind:'junction', freeOnly:true },
  wallSwitch:{ title:'Выключатель освещения SA1', modules:3, h:60*MM, kind:'wallSwitch', freeOnly:true },
  twoWaySwitch:{ title:'Проходной выключатель SA', modules:3, h:60*MM, kind:'twoWaySwitch', freeOnly:true },
  fridge: { title:'Холодильник', modules:10, h:1100, kind:'appliance', freeOnly:true, defaultPower:300 },
  washer: { title:'Стиральная машина', modules:10, h:650, kind:'appliance', freeOnly:true, defaultPower:2200 },
  boiler: { title:'Бойлер', modules:8, h:800, kind:'appliance', freeOnly:true, defaultPower:2000 },
  stove:  { title:'Электрическая плита', modules:10, h:650, kind:'appliance', freeOnly:true, defaultPower:7000 },
  split:  { title:'Сплит-система кондиционера', modules:16, h:360, kind:'appliance', freeOnly:true, defaultPower:1500 },
  vfd:    { title:'Частотный преобразователь UZ, 3×380 В', modules:4, h:110*MM, kind:'vfd' },
  tp:     { title:'Тиристорный преобразователь, 3×380 В', modules:4, h:82*MM, kind:'converter' },
  timer:  { title:'Реле времени KT1, 220 В', modules:1, h:82*MM, kind:'timer' },
  km1:    { title:'Магнитный пускатель KM1', modules:3, h:82*MM, kind:'contactor', overR:PAD_W },
  kk1:    { title:'Тепловое реле KK1',    modules:3, h:62*MM-10, kind:'relay', over:PIN_TOP }
};
const STOCK = { comb:1, klemma:1, pebus:1, mcb3:1, mcb1:1, mcb2:1, rcd:1, meter:1, sensor:1, lamp:3, bulb:1, outlet:1, wallSwitch:1, twoWaySwitch:1, junction:1, fridge:1, washer:1, boiler:1, stove:1, split:1, vfd:1, tp:1, timer:1, km1:2, kk1:2 };
Object.assign(STOCK,{crossN:1,crossPE:1});

const KIND_RU = { comb:'соединительная шина верхних клемм автоматов', mcb:'автоматический выключатель', terminal:'клеммная шина: все зажимы соединены внутри',
                  junction:'открытая коробка: 4 независимые колодки по 3 клеммы',
                  rcd:'УЗО: двухполюсное отключение фазы и нуля, TEST 30 мА',
                  meter:'однофазный счётчик: 1–2 фаза, 3–4 нейтраль, учёт кВт·ч',
                  sensor:'измеритель напряжения и тока с проходными L и N',
                  lamp:'сигнальная лампа 220 В', timer:'реле времени: A1–A2 питание, S пуск, 15–16–18 контакт',
                  bulb:'лампа накаливания 220 В · свободное размещение',
                  outlet:'двойная розетка 220 В с общими L, N и PE',
                  wallSwitch:'настенный выключатель: одна или две независимые клавиши',
                  twoWaySwitch:'проходной выключатель: перекидной контакт L–1/L–2',
                  appliance:'бытовой электроприёмник 220 В с клеммами L, N и PE',
                  vfd:'преобразователь частоты: вход 3×380 В, регулируемый трёхфазный выход',
                  converter:'тиристорный преобразователь: вход 3×380 В, выходы якоря Я+/Я− и возбуждения Ш+/Ш−',
                  contactor:'электромагнитный аппарат', relay:'насадка на зажимы пускателя' };
/* Машина постоянного тока независимого возбуждения (ДПТ НВ).
   Якорь Я1–Я2 питается регулируемым напряжением преобразователя, обмотка
   возбуждения Ш1–Ш2 — от его же выпрямителя. Паспортные данные по умолчанию
   выбраны так, чтобы машина была сопоставима с асинхронным двигателем стенда. */
const DC_MOTOR_TERMS = [
  { key:'ya1', label:'Я1', dx:84,  dy:4,  color:WC.C },
  { key:'ya2', label:'Я2', dx:148, dy:4,  color:WC.C2 },
  { key:'sh1', label:'Ш1', dx:84,  dy:28, color:WC.L1 },
  { key:'sh2', label:'Ш2', dx:148, dy:28, color:WC.L3 },
  { key:'PE',  label:'PE', dx:208, dy:206, color:WC.PE, caseGround:true }
];
const DCM = { ratedArmatureVoltage:220, ratedFieldVoltage:220, ratedArmatureCurrent:5,
              ratedSpeed:1500, armatureResistance:1.6, fieldResistance:220,
              ratedPower:1.2, inertiaFactor:.6 };
/* Корпус машины постоянного тока выкрашен в зелёный, чтобы её нельзя было
   спутать с синим асинхронным двигателем стенда. Металл вала, коллектор
   и щётки остаются неокрашенными. */
const DC_GREEN = {
  edge:'#123c22', feet:'#2f7f47', base:'#1f5c33', bolt:'#0b2e18',
  bodyOuter:'#25703c', bodyMid:'#2f8a4c', bodyMidStroke:'#7fd39a', bodyInner:'#2a7f45',
  rib:'#1a5c30', cover:'#1b5c33', coverStroke:'#c9ecd6',
  box:'#2f8a4c', boxInner:'#2a7f45', boxLine:'#1f5c33',
  plate:'#def7e6', plateName:'#1c5c33', termLabel:'#eefaf1'
};

/* Ход рукоятки: вверх — «I» (включено), вниз — «0» (отключено),
   при срабатывании защиты — среднее положение */
const TRACK_TOP = 132;      // начало направляющей рукоятки
const TRACK_H   = 62;       // высота направляющей
const HANDLE_W  = 24;       // ширина рукоятки
const HANDLE_H  = 26;       // высота рукоятки
const HANDLE_TRAVEL = 32;   // полный ход, px
function handleY(tripped, on){
  return TRACK_TOP + 2 + (tripped ? HANDLE_TRAVEL/2 : (on ? 0 : HANDLE_TRAVEL));
}

/* Паспортное напряжение теперь участвует в расчётах, а не служит только подписью.
   Рабочий диапазон оставляем примерно таким же, каким раньше был диапазон
   180–260 В для аппарата на 220 В. */
function ratedVoltageOf(obj,fallback){
  if(obj&&TYPES[obj.type])return ['mcb3','vfd','tp'].includes(obj.type)?380:220;
  if(obj&&(obj===MOTOR||/^M\d+$/.test(String(obj.id))))return 380;
  const value=Number(obj&&obj.ratedVoltage);
  return isFinite(value)&&value>0?value:(fallback||220);
}
/* Бытовые нагрузки в текущей модели имеют cos φ = 1: P = U·I, R = U²/P.
   Храним согласованные номиналы без округления тока до десятых. */
function applianceRatings(obj,changedKey){
  const type=TYPES[obj.type],voltage=ratedVoltageOf(obj,220);
  const savedPower=Number(obj.ratedPower),savedCurrent=Number(obj.ratedCurrent);
  const hasPower=isFinite(savedPower)&&savedPower>0,hasCurrent=isFinite(savedCurrent)&&savedCurrent>0;
  const power=(changedKey==='ratedCurrent'&&hasCurrent)||(!hasPower&&hasCurrent)
    ?voltage*savedCurrent:(hasPower?savedPower:type.defaultPower);
  return {ratedVoltage:voltage,ratedPower:power,ratedCurrent:power/voltage};
}
function syncApplianceRatings(obj,changedKey){Object.assign(obj,applianceRatings(obj,changedKey));}
function voltageRatio(voltage,obj,fallback){return Math.max(0,Number(voltage)||0)/ratedVoltageOf(obj,fallback);}
function voltageIsOperating(voltage,obj,fallback){const ratio=voltageRatio(voltage,obj,fallback);return ratio>=.8&&ratio<=1.18;}
function voltageIsDestructive(voltage,obj,fallback){return voltageRatio(voltage,obj,fallback)>1.27;}
function voltageBrightness(voltage,obj,fallback){
  const ratio=voltageRatio(voltage,obj,fallback);
  return ratio<.15?0:Math.max(.08,Math.min(1,ratio*ratio));
}

const state = { power:false, devices:[], relays:[], wires:[], conduits:[], alignmentGuides:[], alignmentSnapEnabled:true, nextId:1,
                pb:{ up:false, stop:false, down:false },
                 motors:[], pushbuttons:[], clamps:[], panels:[], standaloneRails:false, workbench:null, roomScene:null,
                mm:{ mode:false, power:true, fn:'voltage', a:null, b:null },
                specialProps:{inbox:{tag:'XT1',customName:'Ввод 3×380 В',ratedVoltage:380,frequency:50},multimeter:{tag:'PV1',customName:'Цифровой мультиметр'}},
                special:{ inbox:true, pushbutton:false, motor:false, multimeter:true } };
let terminalGuidesEnabled = false;
let alignmentDraft=null,alignmentSelected=null,alignmentGrab=null;
let conduitDraft=null,conduitEdit=null,conduitGrab=null,conduitMagnet=null;
const conduitGeometryCache=new Map();
/* Цифровой мультиметр. Габариты и разводка повторяют ZOYI ZT-X:
   тёмный корпус с красным бампером, крупный ЖК-индикатор со шкалой,
   круглые гнёзда для щупов в нижней части прибора. */
const METER = { x:875, y:1080, w:236, h:396 };
const METER_JACKS = { black:{dx:60,dy:-6}, red:{dx:176,dy:-6} };
function meterJack(which){
  const j=METER_JACKS[which];
  return { x:METER.x+j.dx, y:METER.y+j.dy };
}
/* В гнезде сидит нижняя часть рукоятки; игла выступает над прибором. */
function meterDockedTip(key){
  const p=meterJack(key==='a'?'red':'black');
  return {x:p.x,y:p.y-40};
}
/* Прямые щупы: игла занимает 0 … 22, рукоятка — 26 … 43 от острия. */
const METER_PROBE_TILT = 0;
function meterProbeTilt(key){ return (key==='a'?1:-1)*METER_PROBE_TILT; }
/* Точка рукоятки в координатах сцены: p — остриё на гнезде. */
function meterProbeGrip(key,p){
  const a=meterProbeTilt(key)*Math.PI/180, s=40;
  return { x:p.x+Math.sin(a)*s, y:p.y+Math.cos(a)*s };
}
/* Свободные щупы стоят рукоятками в своих гнёздах, иглами вверх. */
function meterResetProbes(){
  const black=meterDockedTip('b'), red=meterDockedTip('a');
  METER.blackX=black.x; METER.blackY=black.y;
  METER.redX=red.x;     METER.redY=red.y;
  if(state.mm){state.mm.aDocked=true;state.mm.bDocked=true;}
}
function meterDockProbe(key){
  const p=meterDockedTip(key);
  state.mm[key]=null;
  if(key==='a'){METER.redX=p.x;METER.redY=p.y;state.mm.aDocked=true;}
  else{METER.blackX=p.x;METER.blackY=p.y;state.mm.bDocked=true;}
}
/* Щуп, вставленный в гнездо прибора, ездит вместе с корпусом. */
function meterProbeFallback(key){
  const docked=(key==='a')?state.mm.aDocked!==false:state.mm.bDocked!==false;
  if(docked)return meterDockedTip(key);
  return (key==='a')?{x:METER.redX,y:METER.redY}:{x:METER.blackX,y:METER.blackY};
}

/* Начальная сцена: ДПТ слева, асинхронный двигатель справа и общий пустой щит. */
function initialState(){
  resetActionHistory();
  state.roomScene=null;
  state.standId='motor-empty';
  state.power=true;
  state.devices=[];state.relays=[];state.wires=[];state.conduits=[];cancelConduit();
  state.alignmentGuides=[];state.alignmentSnapEnabled=true;cancelAlignmentGuide();
  state.workbench={x:60,y:1350,width:2700,height:520,panelId:'PN1',motorId:'M1',dcMotorId:'MD1'};
  state.mm={mode:false,power:true,fn:'voltage',a:null,b:null,aDocked:true,bDocked:true};
  state.pb={up:false,stop:false,down:false};
  state.motors=[{id:'M1',tag:'M1',kind:'ac',x:2130,y:960,w:MOTOR.w,h:MOTOR.h,scale:1.5,
    load:0,rpmActual:0,angle:0,polePairs:2,ratedSlipPercent:10,ratedFrequency:50,
    ratedVoltage:380,ratedCurrent:9,ratedPower:4},newDcMotor('MD1',346,960)];
  state.pushbuttons=[];state.clamps=[];
  state.panels=[{id:'PN1',tag:'ЩР1',railCount:2,x:960,y:-140,inbox:true,inletVoltage:380,fixed:true}];
  state.standaloneRails=false;
  clampState=null;
  state.specialProps={inbox:{tag:'XT1',customName:'Ввод 3×380 В',ratedVoltage:380,frequency:50},multimeter:{tag:'PV1',customName:'Цифровой мультиметр'}};
  state.special={inbox:true,pushbutton:false,motor:false,multimeter:false};
  syncPanelInbox();state.nextId=1;wireSeq=1;
  METER.x=875;METER.y=1080;meterResetProbes();MOTOR.rpmActual=0;MOTOR.angle=0;
}

/* ============================================================
   3. ОТРИСОВКА АППАРАТОВ (локальные координаты 0,0 … w,h)
   ============================================================ */
/* Винт под крестовую отвёртку (Phillips) */
function screw(cx, cy, r){
  const arm = r - 1.5;
  return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#c9a227" stroke="#8d6f14"/>'
       + '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*0.74).toFixed(1)+'" fill="#d9b83f" stroke="#a98517"/>'
       + '<line x1="'+(cx-arm)+'" y1="'+cy+'" x2="'+(cx+arm)+'" y2="'+cy+'" stroke="#6b5410" stroke-width="1.7" stroke-linecap="round"/>'
       + '<line x1="'+cx+'" y1="'+(cy-arm)+'" x2="'+cx+'" y2="'+(cy+arm)+'" stroke="#6b5410" stroke-width="1.7" stroke-linecap="round"/>';
}
function caseScrew(cx, cy, r){
  return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#b7bcc2" stroke="#8d9299"/>'
       + '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*0.66).toFixed(1)+'" fill="#cbd0d5" stroke="#a4aab1"/>';
}

/* Автоматический выключатель */

/* Front view of a three-pole breaker, keeping the trainer terminal geometry. */
function mcbInner(type, o){
  const t = TYPES[type], w = t.modules*MODULE, h = t.h, poles = t.poles, poleW = w/poles;
  const on = !!o.on, tripped = !!o.tripped;
  const displayedRating = (['mcb1','mcb2','mcb3'].includes(type)) ? (o.breakerType || t.rating) : t.rating;
  let s = '';

  // корпус
  s += '<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="7" fill="#f3f4f1" stroke="#9aa0a8" stroke-width="1.5"/>';
  s += '<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="5" fill="none" stroke="rgba(255,255,255,.85)"/>';
  s += '<rect x="'+(w-8)+'" y="6" width="4" height="'+(h-12)+'" fill="rgba(0,0,0,.05)"/>';

  // верхние и нижние зажимы
  s += '<rect x="3" y="3" width="'+(w-6)+'" height="30" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  s += '<rect x="3" y="'+(h-33)+'" width="'+(w-6)+'" height="30" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  for (let i=0;i<poles;i++){
    const cx = (i+0.5)*poleW, r = Math.min(9, poleW*0.26);
    s += screw(cx, 18, r);
    s += screw(cx, h-18, r);
  }

  // наклейка с характеристиками
  const st = 38, sh = 74;
  s += '<rect x="6" y="'+st+'" width="'+(w-12)+'" height="'+sh+'" rx="3" fill="#fcfcfa" stroke="#d8dbdf"/>';
  s += '<text x="'+(w/2)+'" y="'+(st+22)+'" text-anchor="middle" font-size="12" font-weight="700" fill="#1b3a6b" font-family="Segoe UI,Arial">'+(o.tag||'QF')+'</text>';
  s += '<text x="'+(w/2)+'" y="'+(st+52)+'" text-anchor="middle" font-size="15" font-weight="700" fill="#c62828" font-family="Segoe UI,Arial">'+displayedRating+'</text>';
  s += '<text x="'+(w/2)+'" y="'+(st+66)+'" text-anchor="middle" font-size="8" fill="#5b6470" font-family="Segoe UI,Arial">'
     + (poles+'P  '+(poles===3?'380':'230')+'В~') + '</text>';

  // окно индикатора состояния (красный — вкл., зелёный — откл., оранжевый — сработал)
  const winColor = tripped ? '#ff8a00' : (on ? '#e01b1b' : '#1e6b3a');
  for (let i=0;i<poles;i++){
    const cx = (i+0.5)*poleW;
    s += '<rect x="'+(cx-15)+'" y="118" width="30" height="12" rx="3" fill="#2b2f34" stroke="#9aa0a8"/>';
    s += '<rect class="win" x="'+(cx-12)+'" y="120.5" width="24" height="7" rx="2" fill="'+winColor+'"/>';
  }

  // направляющие рукояток
  const hy = handleY(tripped, on);
  for (let i=0;i<poles;i++){
    const cx = (i+0.5)*poleW;
    s += '<g transform="translate('+cx+',0)">'
       +   '<rect x="-14" y="'+TRACK_TOP+'" width="28" height="'+TRACK_H+'" rx="4" fill="#e4e7ea" stroke="#c2c7cd"/>'
       +   '<rect x="-14" y="'+TRACK_TOP+'" width="28" height="7" rx="3" fill="rgba(0,0,0,.08)"/>'
       +   '<rect x="-14" y="'+(TRACK_TOP+TRACK_H-6)+'" width="28" height="6" rx="3" fill="rgba(0,0,0,.05)"/>'
       + '</g>';
  }
  // рукоятки ходят вверх («I») / вниз («0»); у 2P и 3P они соединены общей жёлтой перемычкой
  s += '<g class="hdl" style="cursor:pointer" transform="translate(0,'+hy+')">';
  if (poles > 1){
    const bx0 = 0.5*poleW - HANDLE_W/2 - 5, bx1 = (poles-0.5)*poleW + HANDLE_W/2 + 5;
    s += '<rect x="'+bx0+'" y="10.5" width="'+(bx1-bx0)+'" height="9.5" rx="4.75" fill="#f2c218" stroke="#b98d0a" stroke-width="1.1"/>';
    s += '<rect x="'+(bx0+3)+'" y="12.5" width="'+(bx1-bx0-6)+'" height="3" rx="1.5" fill="rgba(255,255,255,.5)"/>';
  }
  for (let i=0;i<poles;i++){
    const cx = (i+0.5)*poleW;
    s += '<g transform="translate('+cx+',0)">'
       +   '<rect x="'+(-HANDLE_W/2)+'" y="0" width="'+HANDLE_W+'" height="'+HANDLE_H+'" rx="4" fill="#f2c218" stroke="#b98d0a" stroke-width="1.2"/>'
       +   '<rect x="'+(-HANDLE_W/2)+'" y="0" width="'+HANDLE_W+'" height="8" rx="4" fill="rgba(255,255,255,.5)"/>'
       +   '<line x1="-6" y1="16" x2="6" y2="16" stroke="rgba(120,90,0,.4)" stroke-width="2"/>'
       + '</g>';
  }
  s += '</g>';

  // надпись состояния
  const stTxt = tripped ? 'СРАБОТАЛ' : (on ? 'ВКЛ' : 'ОТКЛ');
  const stCol = tripped ? '#ff8a00' : (on ? '#c62828' : '#4b5563');
  s += '<text class="stateTxt" x="'+(w/2)+'" y="206" text-anchor="middle" font-size="11" font-weight="700" fill="'+stCol+'" font-family="Segoe UI,Arial">'+stTxt+'</text>';

  return s;
}

/* Двухполюсное УЗО: общий механизм одновременно размыкает фазу и нейтраль.
   Внешний вид повторяет язык автоматов стенда, а кнопка TEST имитирует ток утечки. */
function rcdInner(o){
  const w = TYPES.rcd.modules*MODULE, h = TYPES.rcd.h;
  const on = !!o.on, tripped = !!o.tripped;
  const xL = w*0.25, xN = w*0.75;
  let s = '';

  s += '<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="7" fill="#f3f4f1" stroke="#9aa0a8" stroke-width="1.5"/>';
  s += '<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="5" fill="none" stroke="rgba(255,255,255,.85)"/>';
  s += '<rect x="'+(w-8)+'" y="6" width="4" height="'+(h-12)+'" fill="rgba(0,0,0,.05)"/>';
  s += '<rect x="3" y="3" width="'+(w-6)+'" height="30" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  s += '<rect x="3" y="'+(h-33)+'" width="'+(w-6)+'" height="30" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  s += screw(xL,18,9)+screw(xN,18,9)+screw(xL,h-18,9)+screw(xN,h-18,9);
  // Маркировка стоит сбоку от винтов и не перекрывает кресты клемм.
  s += '<text x="'+(xL+14)+'" y="22" text-anchor="start" font-size="8" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">1</text>';
  s += '<text x="'+(xN-14)+'" y="22" text-anchor="end" font-size="8" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">N</text>';
  s += '<text x="'+(xL+14)+'" y="'+(h-15)+'" text-anchor="start" font-size="8" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">2</text>';
  s += '<text x="'+(xN-14)+'" y="'+(h-15)+'" text-anchor="end" font-size="8" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">N</text>';

  // Наклейка построена теми же размерами, шрифтами и отступами, что у автомата C10.
  s += '<rect x="6" y="38" width="'+(w-12)+'" height="76" rx="3" fill="#fcfcfa" stroke="#d8dbdf"/>';
  s += '<rect x="'+(w/2-23)+'" y="61" width="46" height="9" rx="1.5" fill="#f2c218"/>';
  s += '<text x="'+(w/2)+'" y="55" text-anchor="middle" font-size="12" font-weight="700" fill="#1b3a6b" font-family="Segoe UI,Arial">'+(o.tag||'QD')+'</text>';
  s += '<text x="'+(w/2)+'" y="87" text-anchor="middle" font-size="15" font-weight="700" fill="#c62828" font-family="Segoe UI,Arial">'+(Number(o.ratedCurrent)||25)+' А</text>';
  s += '<text x="'+(w/2)+'" y="101" text-anchor="middle" font-size="8" fill="#5b6470" font-family="Segoe UI,Arial">230 В~ · 50 Гц</text>';
  s += '<text x="'+(w/2)+'" y="111" text-anchor="middle" font-size="8" font-weight="700" fill="#5b6470" font-family="Segoe UI,Arial">IΔn '+(Number(o.ratedLeakageMa)||30)+' мА</text>';

  const winColor = tripped ? '#ff8a00' : (on ? '#e01b1b' : '#1e6b3a');
  s += '<rect x="14" y="119" width="28" height="12" rx="3" fill="#2b2f34" stroke="#9aa0a8"/>';
  s += '<rect class="win" x="17" y="121.5" width="22" height="7" rx="2" fill="'+winColor+'"/>';

  s += '<rect x="57" y="'+TRACK_TOP+'" width="34" height="'+TRACK_H+'" rx="5" fill="#e4e7ea" stroke="#c2c7cd"/>';
  s += '<rect x="57" y="'+TRACK_TOP+'" width="34" height="7" rx="3" fill="rgba(0,0,0,.08)"/>';
  s += '<g class="hdl" style="cursor:pointer" transform="translate(0,'+handleY(tripped,on)+')">'
     + '<rect x="56" y="0" width="36" height="26" rx="4" fill="#f2c218" stroke="#b98d0a" stroke-width="1.2"/>'
     + '<rect x="56" y="0" width="36" height="8" rx="4" fill="rgba(255,255,255,.5)"/>'
     + '<line x1="66" y1="17" x2="82" y2="17" stroke="#9a7300" stroke-width="2.4" stroke-linecap="round"/></g>';

  s += '<g class="rcd-test" data-rcd-test="1" style="cursor:pointer;touch-action:none">'
     + '<ellipse cx="29" cy="166" rx="18" ry="13" fill="rgba(0,0,0,.18)"/>'
     + '<rect x="11" y="150" width="36" height="25" rx="9" fill="#8d949a" stroke="#5f666c" stroke-width="1.2"/>'
     + '<rect x="14" y="152" width="30" height="8" rx="5" fill="rgba(255,255,255,.45)"/>'
     + '<text x="29" y="168" text-anchor="middle" font-size="14" font-weight="800" fill="#343a40">T</text>'
     + '<title>TEST — проверка срабатывания УЗО</title></g>';

  const stTxt = tripped ? 'СРАБОТАЛО' : (on ? 'ВКЛ' : 'ОТКЛ');
  const stCol = tripped ? '#ff8a00' : (on ? '#c62828' : '#4b5563');
  s += '<text class="stateTxt" x="'+(w/2)+'" y="206" text-anchor="middle" font-size="10" font-weight="700" fill="'+stCol+'" font-family="Segoe UI,Arial">'+stTxt+'</text>';
  return s;
}

/* Однофазный электронный счётчик. Главные цепи: 1→2 (L) и 3→4 (N).
   Дисплей показывает накопленную энергию, нижняя строка — текущую мощность. */
function meterEnergyText(value){return Math.max(0,Number(value)||0).toFixed(6).padStart(10,'0').replace('.',',');}
function meterPowerText(value){return Math.round(Math.max(0,Number(value)||0))+' Вт';}
function meterInner(o){
  const w=TYPES.meter.modules*MODULE,h=TYPES.meter.h;
  const tx=[.125,.375,.625,.875].map(function(k){return w*k;});
  const energy=Math.max(0,Number(o.energyKwh)||0);
  const power=Math.max(0,Number(o.meterPowerW)||0);
  const digits=meterEnergyText(energy);
  const pulse=!!o.meterPulse;
  const powered=o.id!=null&&meterVoltage(o)>=50;
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="8" fill="#f3f4f1" stroke="#9aa0a8" stroke-width="1.5"/>';
  s+='<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="6" fill="none" stroke="rgba(255,255,255,.9)"/>';
  s+='<rect x="'+(w-9)+'" y="7" width="5" height="'+(h-14)+'" fill="rgba(0,0,0,.05)"/>';
  s+='<rect x="3" y="3" width="'+(w-6)+'" height="27" rx="6" fill="#e8eaed" stroke="#c0c5cb"/>';
  s+='<path d="M12 22 H '+(w-12)+'" stroke="rgba(255,255,255,.9)" stroke-width="2"/>';
  s+='<rect x="3" y="'+(h-50)+'" width="'+(w-6)+'" height="47" rx="6" fill="#e2e5e9" stroke="#b3b8be"/>';
  tx.forEach(function(cx){s+=screw(cx,h-18,10);});
  const terminalLabels=['1 · L ВХ','2 · L ВЫХ','3 · N ВХ','4 · N ВЫХ'];
  tx.forEach(function(cx,i){
    s+='<text x="'+cx+'" y="'+(h-35)+'" text-anchor="middle" font-size="7" font-weight="700" fill="'+(i<2?'#8b5a2b':'#2a6fd6')+'" font-family="Segoe UI,Arial">'+terminalLabels[i]+'</text>';
  });

  s+='<rect x="8" y="34" width="'+(w-16)+'" height="154" rx="5" fill="#fcfcfa" stroke="#d8dbdf"/>';
  s+='<text x="'+(w/2)+'" y="52" text-anchor="middle" font-size="12" font-weight="800" fill="#1b3a6b" font-family="Segoe UI,Arial">'+(o.tag||'PI')+'</text>';
  s+='<text x="'+(w/2)+'" y="66" text-anchor="middle" font-size="8" fill="#5b6470" font-family="Segoe UI,Arial">1 ФАЗА · 2 ПРОВОДА · 230 В</text>';
  s+='<rect x="17" y="74" width="'+(w-34)+'" height="62" rx="4" fill="#3a3327" stroke="#25211a" stroke-width="2"/>';
  s+='<rect x="21" y="78" width="'+(w-42)+'" height="54" rx="2" fill="#d58a35" stroke="#efb15d"/>';
  s+='<text class="meter-energy" x="'+(w/2)+'" y="112" text-anchor="middle" font-size="25" font-weight="700" fill="#151515" font-family="Consolas,monospace">'+digits+'</text>';
  s+='<text x="'+(w-25)+'" y="128" text-anchor="end" font-size="9" font-weight="800" fill="#382612" font-family="Segoe UI,Arial">кВт·ч</text>';
  s+='<circle class="meter-supply-led'+(powered?' lit':'')+'" cx="31" cy="149" r="6" fill="'+(powered?'#35e47d':'#245d39')+'" stroke="#384047"/><text x="42" y="152" font-size="7" fill="#4b5563" font-family="Segoe UI,Arial">ПИТАНИЕ</text>';
  s+='<circle class="meter-pulse" cx="88" cy="149" r="6" fill="'+(pulse?'#ff3b30':'#657079')+'" stroke="#384047"/><text x="99" y="152" font-size="7" fill="#4b5563" font-family="Segoe UI,Arial">ИМПУЛЬС</text>';
  s+='<text class="meter-power" x="'+(w/2)+'" y="173" text-anchor="middle" font-size="13" font-weight="800" fill="#26333c" font-family="Segoe UI,Arial">'+meterPowerText(power)+'</text>';
  s+='<text x="'+(w/2)+'" y="184" text-anchor="middle" font-size="7.5" fill="#5b6470" font-family="Segoe UI,Arial">5(60) А · 50 Гц · 1000 имп/кВт·ч</text>';
  return s;
}

/* Комбинированный DIN-индикатор напряжения и тока. Фаза и нейтраль проходят
   через прибор, поэтому измеряется именно нагрузка, подключённая к выходам. */
function sensorInner(o){
  const w=TYPES.sensor.modules*MODULE,h=TYPES.sensor.h;
  const xs=[w*.25,w*.75];
  const voltage=Math.max(0,Number(o.sensorVoltage)||0);
  const current=Math.max(0,Number(o.sensorCurrentA)||0);
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="7" fill="#f3f4f1" stroke="#9aa0a8" stroke-width="1.5"/>';
  s+='<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="5" fill="none" stroke="#ffffff" opacity=".85"/>';
  s+='<rect x="3" y="3" width="'+(w-6)+'" height="41" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  s+='<rect x="3" y="'+(h-44)+'" width="'+(w-6)+'" height="41" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  xs.forEach(function(cx){s+=screw(cx,19,10)+screw(cx,h-19,10);});
  s+='<text x="'+xs[0]+'" y="41" text-anchor="middle" font-size="6" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">L · ВХ</text>';
  s+='<text x="'+xs[1]+'" y="41" text-anchor="middle" font-size="6" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">N · ВХ</text>';
  s+='<text x="'+xs[0]+'" y="'+(h-35)+'" text-anchor="middle" font-size="6" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">L · ВЫХ</text>';
  s+='<text x="'+xs[1]+'" y="'+(h-35)+'" text-anchor="middle" font-size="6" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">N · ВЫХ</text>';
  s+='<rect x="8" y="49" width="'+(w-16)+'" height="150" rx="4" fill="#fcfcfa" stroke="#d8dbdf"/>';
  s+='<text x="'+(w/2)+'" y="65" text-anchor="middle" font-size="11" font-weight="800" fill="#1b3a6b" font-family="Segoe UI,Arial">'+(o.tag||'PVA')+'</text>';
  s+='<text x="'+(w/2)+'" y="78" text-anchor="middle" font-size="7.5" fill="#5b6470" font-family="Segoe UI,Arial">AC 50 Гц</text>';
  s+='<rect x="15" y="87" width="'+(w-30)+'" height="43" rx="3" fill="#252a2d" stroke="#777e84" stroke-width="1.5"/>';
  s+='<text class="sensor-v" x="'+(w/2-5)+'" y="120" text-anchor="middle" font-size="29" font-weight="700" fill="#ef2828" font-family="Consolas,monospace">'+Math.round(voltage)+'</text>';
  s+='<text x="'+(w-20)+'" y="121" text-anchor="end" font-size="14" font-weight="800" fill="#ef2828" font-family="Segoe UI,Arial">V</text>';
  s+='<rect x="15" y="139" width="'+(w-30)+'" height="43" rx="3" fill="#252a2d" stroke="#777e84" stroke-width="1.5"/>';
  s+='<text class="sensor-a" x="'+(w/2-5)+'" y="172" text-anchor="middle" font-size="27" font-weight="700" fill="#1fc3a2" font-family="Consolas,monospace">'+current.toFixed(1)+'</text>';
  s+='<text x="'+(w-20)+'" y="173" text-anchor="end" font-size="14" font-weight="800" fill="#1fc3a2" font-family="Segoe UI,Arial">A</text>';
  s+='<text x="'+(w/2)+'" y="196" text-anchor="middle" font-size="7" fill="#6a7178" font-family="Segoe UI,Arial">0–400 В · 0–100 А</text>';
  return s;
}

/* Нулевая колодка: один модуль, шесть зажимов в столбик.
   Все зажимы соединены внутри общей шиной — это один узел «ноль». */
const TERMINAL_COLORS={
  N:{body:'#1d6fb8',edge:'#12507f',cell:'#2a80cc',text:'#cfe4f5'},
  PE:{body:'#2f9d48',edge:'#176b2c',cell:'#43b85d',text:'#efff68'}
};
function terminalInner(type,o){
  type = type || 'klemma';
  o = o || {};
  const w = TYPES.klemma.modules*MODULE, h = TYPES.klemma.h;
  const N = 6;
  const pe = type === 'pebus';
  const colors=TERMINAL_COLORS[pe?'PE':'N'];
  let s = '';
  // корпус
  s += '<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="5" fill="'+colors.body+'" stroke="'+colors.edge+'" stroke-width="1.5"/>';
  s += '<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="4" fill="none" stroke="rgba(255,255,255,.35)"/>';
  const cell = h/N;
  // внутренняя шина, связывающая все зажимы
  s += '<rect x="'+(w/2-5)+'" y="'+(cell/2)+'" width="10" height="'+(h-cell)+'" rx="3" fill="#b87333" stroke="#8a5522"/>';
  s += '<rect x="'+(w/2-3)+'" y="'+(cell/2+2)+'" width="4" height="'+(h-cell-4)+'" rx="2" fill="#d99a5b" opacity=".7"/>';
  for (let i=0;i<N;i++){
    const cy = (i+0.5)*cell;
    s += '<rect x="6" y="'+(cy-cell/2+3)+'" width="'+(w-12)+'" height="'+(cell-6)+'" rx="3" fill="'+colors.cell+'"/>';
    s += screw(w/2, cy, 8.5);
  }
  // обозначение нулевой шины
  s += '<text x="5" y="12" font-size="7" font-weight="700" fill="'+colors.text+'" font-family="Segoe UI,Arial">'+(o.tag||(pe?'XPE':'XN'))+'</text>';
  s += '<text x="'+(w-5)+'" y="'+(h-7)+'" text-anchor="end" font-size="9" font-weight="700" fill="'+colors.text+'" font-family="Segoe UI,Arial">'+(pe?'PE':'N')+'</text>';
  // защёлка на рейку
  s += '<rect x="'+(w-11)+'" y="'+(h/2-12)+'" width="8" height="24" rx="2" fill="'+colors.edge+'"/>';
  return s;
}

/* Однопотенциальный кросс-модуль: два ряда по четыре зажима общей шины.
   Синий и зелёный варианты различаются основанием и назначением N/PE. */
const CROSS_MODULE_GEOMETRY={margin:16.5,inset:32,cellHeight:24};
function crossModuleTerms(type){
  const t=TYPES[type],w=t.modules*MODULE,h=t.h,color=type==='crossPE'?WC.PE:WC.N,out=[];
  const g=CROSS_MODULE_GEOMETRY;
  // Ключи нижнего ряда k7–k10 сохраняют подключения прежнего варианта 2×7.
  for(let row=0;row<2;row++)for(let i=0;i<4;i++)out.push({
    key:'k'+(row*7+i),label:String(row*4+i+1),dx:g.margin+i*(w-2*g.margin)/3,
    dy:row?h-g.inset:g.inset,color:color,hitR:12,entrySide:row?'bottom':'top',entryInset:g.inset-.25
  });
  return out;
}
function compactCrossModuleRef(ref){
  if(!ref)return ref;
  const dev=devById(+ref.devId),match=String(ref.key).match(/^k(\d+)$/);
  if(!dev||!TYPES[dev.type].crossModule||!match)return ref;
  const index=Number(match[1]);if(index>13)return ref;
  const key='k'+(index<7?Math.min(index,3):7+Math.min(index-7,3));
  return key===ref.key?ref:Object.assign({},ref,{key:key});
}
function crossModuleScrew(x,y){
  return '<g class="cross-module-screw">'+screw(x,y,8.5)+'</g>';
}
function crossModuleInner(type,o){
  o=o||{};
  const t=TYPES[type],w=t.modules*MODULE,h=t.h,pe=type==='crossPE';
  const g=CROSS_MODULE_GEOMETRY,colors=TERMINAL_COLORS[pe?'PE':'N'],pitch=(w-2*g.margin)/3;
  let s='<g class="cross-module-body" data-cross-potential="'+(pe?'PE':'N')+'">';
  // Те же пластик, внутренняя обводка и медная шина, что у колодок N/PE.
  s+='<rect class="cross-module-back" x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="5" fill="'+colors.body+'" stroke="'+colors.edge+'" stroke-width="1.5"/>'
    +'<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="4" fill="none" stroke="rgba(255,255,255,.35)"/>'
    +'<rect x="'+(w/2-5)+'" y="'+g.inset+'" width="10" height="'+(h-2*g.inset)+'" rx="3" fill="#b87333" stroke="#8a5522"/>'
    +'<rect x="'+(w/2-3)+'" y="'+(g.inset+2)+'" width="4" height="'+(h-2*g.inset-4)+'" rx="2" fill="#d99a5b" opacity=".7"/>';
  [g.inset,h-g.inset].forEach(function(y){
    s+='<rect x="'+g.margin+'" y="'+(y-5)+'" width="'+(w-2*g.margin)+'" height="10" rx="3" fill="#b87333" stroke="#8a5522"/>'
      +'<rect x="'+(g.margin+2)+'" y="'+(y-3)+'" width="'+(w-2*g.margin-4)+'" height="4" rx="2" fill="#d99a5b" opacity=".7"/>';
  });
  crossModuleTerms(type).forEach(function(td,i){
    const row=i>=4,portY=row?h-12:1;
    s+='<rect x="'+(td.dx-4)+'" y="'+portY+'" width="8" height="11" rx="3" fill="'+colors.edge+'"/>'
      +'<path d="M '+td.dx+' '+(row?td.dy+g.cellHeight/2:12)+' V '+(row?h-12:td.dy-g.cellHeight/2)+'" stroke="'+colors.edge+'" stroke-width="3" opacity=".6"/>'
      +'<rect x="'+(td.dx-pitch/2+1.5)+'" y="'+(td.dy-g.cellHeight/2)+'" width="'+(pitch-3)+'" height="'+g.cellHeight+'" rx="3" fill="'+colors.cell+'"/>';
    s+=crossModuleScrew(td.dx,td.dy);
    s+='<text x="'+td.dx+'" y="'+(td.dy+(row?-16:22))+'" text-anchor="middle" font-size="8" font-weight="700" fill="'+colors.text+'" font-family="Segoe UI,Arial">'+(i+1)+'</text>';
  });
  s+='<rect x="9" y="'+(h/2-12)+'" width="'+(w-18)+'" height="24" rx="3" fill="'+colors.cell+'"/>'
    +'<text x="13" y="'+(h/2+4)+'" font-size="10" font-weight="700" fill="'+colors.text+'" font-family="Segoe UI,Arial">'+escapeHtml(o.tag||(pe?'XPE':'XN'))+'</text>'
    +'<text x="'+(w-13)+'" y="'+(h/2+4)+'" text-anchor="end" font-size="12" font-weight="700" fill="'+colors.text+'" font-family="Segoe UI,Arial">'+(pe?'PE':'N')+'</text>'
    +'<rect x="'+(w/2-14)+'" y="'+(h-6)+'" width="28" height="5" rx="1" fill="'+colors.edge+'"/>';
  return s+'</g>';
}

/* Зажим пускателя/реле: тёмное гнездо с латунным винтом под крестовую отвёртку */
function contactHole(cx, cy, r){
  const arm = r*0.62;
  return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#23262a" stroke="#a9aeb5" stroke-width="1"/>'
       + '<circle cx="'+cx+'" cy="'+cy+'" r="'+arm+'" fill="#c9a227" stroke="#8d6f14"/>'
       + '<line x1="'+(cx-arm*0.9)+'" y1="'+cy+'" x2="'+(cx+arm*0.9)+'" y2="'+cy+'" stroke="#6b5410" stroke-width="1.6" stroke-linecap="round"/>'
       + '<line x1="'+cx+'" y1="'+(cy-arm*0.9)+'" x2="'+cx+'" y2="'+(cy+arm*0.9)+'" stroke="#6b5410" stroke-width="1.6" stroke-linecap="round"/>';
}

/* Магнитный пускатель KMI-22510:
   сверху 1 L1 / 3 L2 / 5 L3 / 13 НО, снизу 2 T1 / 4 T2 / 6 T3 / 14 НО,
   на лицевой стороне — выводы катушки A1 и A2 (питание 380 В),
   жёлтая траверса (якорь) втягивается при подаче питания на катушку */
function kmInner(o){
  const w = TYPES.km1.modules*MODULE, h = TYPES.km1.h;   // 157,5 × 246
  const on = !!o.coil;
  const animatePress = !!(on && o.coilAnim);
  o.coilAnim = false;
  const n = 4, cell = w/n;
  const topLab = ['1 L1','3 L2','5 L3','13 НО'];
  const botLab = ['2 T1','4 T2','6 T3','14 НО'];
  let s = '';

  // корпус
  s += '<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="8" fill="#3a4046" stroke="#22262a" stroke-width="1.5"/>';
  s += '<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="6" fill="none" stroke="rgba(255,255,255,.08)"/>';

  // наклейка катушки
  s += '<rect x="'+(w*0.16)+'" y="1" width="'+(w*0.68)+'" height="13" rx="3" fill="'+(o.coilBurned?'#b32622':'#1f6fb8')+'"/>';
  s += '<text x="'+(w/2)+'" y="10.5" text-anchor="middle" font-size="7" font-weight="'+(o.coilBurned?'800':'400')+'" fill="#dbeaff" font-family="Segoe UI,Arial">'+(o.coilBurned?'КАТУШКА СГОРЕЛА':'Uc '+Math.round(ratedVoltageOf(o,220))+'В · 50 Гц')+'</text>';

  // верхняя колодка зажимов
  s += '<rect x="4" y="16" width="'+(w-8)+'" height="62" rx="4" fill="#e3e6ea" stroke="#b6bbc2"/>';
  for (let i=0;i<n;i++){
    const cx = (i+0.5)*cell;
    s += contactHole(cx, 34, 11);
    s += '<text x="'+cx+'" y="54" text-anchor="middle" font-size="9" fill="#2b3138" font-family="Segoe UI,Arial">'+topLab[i]+'</text>';
  }

  // маркировка корпуса
  s += '<text x="'+(w/2)+'" y="105" text-anchor="middle" font-size="12" font-weight="700" fill="#cfd6dc" font-family="Segoe UI,Arial">'+(o.tag||'KM')+'</text>';

  // Углубление под траверсой и жёлтые пластины, вид сверху.
  // При срабатывании пластины уменьшаются и темнеют, создавая эффект вдавливания в корпус.
  const py = 104;
  s += '<rect x="13" y="93" width="'+(w-26)+'" height="62" rx="8" fill="#252a2f" stroke="#171a1d" stroke-width="2"/>';
  s += '<g class="plg" data-zone="manual-contactor" transform="translate(0,'+py+')" style="cursor:pointer;touch-action:none"><g class="plg-depth '
     + (on ? 'pressed'+(animatePress ? ' pressing' : '') : 'released')+'">';
  for (let i=0;i<n;i++){
    s += '<rect class="plg-plate" x="'+(16+i*(w-32)/n+2)+'" y="0" width="'+((w-32)/n-4)+'" height="40" rx="4" fill="#f2c218" stroke="#b98d0a"/>';
    s += '<rect class="plg-shine" x="'+(16+i*(w-32)/n+2)+'" y="0" width="'+((w-32)/n-4)+'" height="10" rx="4" fill="rgba(255,255,255,.45)"/>';
  }
  s += '<rect class="plg-plate" x="'+(w/2-17)+'" y="-9" width="34" height="58" rx="5" fill="#f2c218" stroke="#b98d0a"/>';
  s += '<rect class="plg-shine" x="'+(w/2-17)+'" y="-9" width="34" height="11" rx="5" fill="rgba(255,255,255,.45)"/>';
  s += '</g></g>';

  // Дополнительная контактная колодка ПКИ-11 закреплена на лицевой стороне.
  // Она находится между основными верхними и нижними клеммами и не закрывает их.
  s += '<g class="aux-block">';
  s += '<rect x="36.75" y="82" width="84" height="84" rx="6" fill="#eef0f2" stroke="#9da3a9" stroke-width="1.5"/>';
  s += '<rect x="39.75" y="85" width="78" height="78" rx="5" fill="none" stroke="#ffffff" opacity=".75"/>';
  s += '<text x="59.75" y="94" text-anchor="middle" font-size="8" font-weight="700" fill="#33383d" font-family="Segoe UI,Arial">53</text>';
  s += '<text x="97.75" y="94" text-anchor="middle" font-size="8" font-weight="700" fill="#33383d" font-family="Segoe UI,Arial">61</text>';
  s += contactHole(59.75, 104, 8);
  s += contactHole(97.75, 104, 8);
  const auxX = on ? 71.75 : 69.75, auxY = on ? 117 : 115;
  const auxW = on ? 14 : 18, auxH = on ? 14 : 18;
  s += '<g class="aux-actuator plg-depth'+(on ? ' pressed'+(animatePress ? ' pressing' : '') : '')+'">'
     + '<rect x="'+auxX+'" y="'+auxY+'" width="'+auxW+'" height="'+auxH+'" rx="3" fill="#f2c218" stroke="#b98d0a" stroke-width="1.2"/>'
     + '<rect x="'+(auxX+2)+'" y="'+(auxY+2)+'" width="'+(auxW-4)+'" height="4" rx="2" fill="#fff3a5" opacity="'+(on ? '.18' : '.62')+'"/>'
     + '</g>';
  s += contactHole(59.75, 144, 8);
  s += contactHole(97.75, 144, 8);
  s += '<text x="59.75" y="160" text-anchor="middle" font-size="8" font-weight="700" fill="#33383d" font-family="Segoe UI,Arial">54</text>';
  s += '<text x="97.75" y="160" text-anchor="middle" font-size="8" font-weight="700" fill="#33383d" font-family="Segoe UI,Arial">62</text>';
  s += '<text x="57.75" y="126" text-anchor="end" font-size="6.5" fill="#687078" font-family="Segoe UI,Arial">НО</text>';
  s += '<text x="100.75" y="126" font-size="6.5" fill="#687078" font-family="Segoe UI,Arial">НЗ</text>';
  s += '</g>';

  // нижняя колодка зажимов
  s += '<rect x="4" y="'+(h-78)+'" width="'+(w-8)+'" height="62" rx="4" fill="#e3e6ea" stroke="#b6bbc2"/>';
  for (let i=0;i<n;i++){
    const cx = (i+0.5)*cell;
    s += contactHole(cx, h-34, 11);
    s += '<text x="'+cx+'" y="'+(h-54)+'" text-anchor="middle" font-size="9" fill="#2b3138" font-family="Segoe UI,Arial">'+botLab[i]+'</text>';
  }

  // приставная колодка катушки A1–A2: приставлена справа вплотную к корпусу (заподлицо),
  // выводы вертикально, цвет — как у клеммных колодок
  const px0 = w-1.5, pw = PAD_W, px1 = px0+pw, padH = 150,
        py0 = (h-padH)/2, py1 = py0+padH, rr = 5, pcx = px0 + pw/2;
  s += '<path d="M '+px0+' '+py0+' H '+(px1-rr)+' A '+rr+' '+rr+' 0 0 1 '+px1+' '+(py0+rr)
     + ' V '+(py1-rr)+' A '+rr+' '+rr+' 0 0 1 '+(px1-rr)+' '+py1+' H '+px0+' Z" fill="#e3e6ea" stroke="#b6bbc2"/>';
  s += '<line x1="'+px0+'" y1="'+(py0+2)+'" x2="'+px0+'" y2="'+(py1-2)+'" stroke="#9aa0a8"/>';
  s += '<text x="'+pcx+'" y="'+(py0+40)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#2b3138" font-family="Segoe UI,Arial">A1</text>';
  s += screw(pcx, py0+18, 9);
  s += '<text x="'+pcx+'" y="'+(py1-40)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#2b3138" font-family="Segoe UI,Arial">A2</text>';
  s += screw(pcx, py1-18, 9);
  s += '<rect class="zone" data-zone="coil" x="'+(px0-2)+'" y="'+(py0-2)+'" width="'+(pw+4)+'" height="'+(py1-py0+4)+'" fill="transparent" pointer-events="all"/>';
  return s;
}

/* Тепловое реле KEA3-25: три щупа сверху вставляются прямо в зажимы 2 T1 / 4 T2 / 6 T3
   магнитного пускателя — своя DIN-рейка реле не нужна. Контакты: 95-96 NC, 97-98 NO. */
function relayInner(o){
  const w = TYPES.kk1.modules*MODULE, h = TYPES.kk1.h;      // компактный корпус под ширину пускателя
  const tripped = !!o.tripped, range=thermalRange(o), set=Math.max(range.min,Math.min(range.max,Number(o.set)||25));
  /* шаг щупов — точно такой же, как шаг зажимов трёхфазного пускателя
     (ширина пускателя / 4 зажима): щупы встают строго под зажимы 2 T1 / 4 T2 / 6 T3 */
  const cell = TYPES.km1.modules*MODULE/4;
  const pinX = [0,1,2].map(function(i){ return (i+0.5)*cell; });
  let s = '';

  // медные щупы, уходящие вверх в зажимы пускателя.
  // После крепления на пускатель щупы не рисуются — они «ушли» внутрь его зажимов.
  if (!o.attached){
    pinX.forEach(function(cx){
      s += '<rect x="'+(cx-4)+'" y="'+(-PIN_TOP)+'" width="8" height="'+(PIN_TOP+18)+'" rx="2.5" fill="#b5722f" stroke="#5e3a13" stroke-width="1"/>';
      s += '<rect x="'+(cx-2.4)+'" y="'+(-PIN_TOP+1.5)+'" width="3" height="'+(PIN_TOP+13)+'" rx="1.5" fill="#e0a464"/>';
      s += '<circle cx="'+cx+'" cy="'+(-PIN_TOP)+'" r="4" fill="#b5722f" stroke="#5e3a13" stroke-width="1"/>';
    });
  }

  // корпус
  s += '<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="6" fill="#1f5f9e" stroke="#12406e" stroke-width="1.5"/>';
  s += '<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="4" fill="none" stroke="rgba(255,255,255,.25)"/>';

  // Поворотный регулятор тока в выбранном диапазоне.
  s += '<circle cx="34" cy="34" r="26" fill="#123c66" stroke="#0d2d4d"/>';
  s += '<circle cx="34" cy="34" r="20" fill="#1b5a92" stroke="#0d2d4d"/>';
  const wholeAmpDial=range.id==='7-10',dialSteps=wholeAmpDial?6:8;
  for(let i=0;i<=dialSteps;i++){
    const angle=(-120+i*240/dialSteps)*Math.PI/180;
    const x=34+Math.sin(angle)*16,y=34-Math.cos(angle)*16;
    const minor=wholeAmpDial&&i%2!==0,innerRadius=minor?22.5:21.5;
    s += '<line x1="'+(34+Math.sin(angle)*innerRadius)+'" y1="'+(34-Math.cos(angle)*innerRadius)+'" x2="'+(34+Math.sin(angle)*24.5)+'" y2="'+(34-Math.cos(angle)*24.5)+'" stroke="#8fc0e6" stroke-width="'+(minor?0.9:1.2)+'"/>';
    if(i%2===0)s += '<text x="'+x+'" y="'+(y+2.5)+'" text-anchor="middle" font-size="'+(wholeAmpDial?7:5.3)+'" fill="#cfe4f5" font-family="Segoe UI,Arial">'+thermalNumber(range.min+(range.max-range.min)*i/dialSteps)+'</text>';
  }
  const angle=(-120+240*(set-range.min)/(range.max-range.min))*Math.PI/180;
  s += '<line x1="34" y1="34" x2="'+(34+Math.sin(angle)*18)+'" y2="'+(34-Math.cos(angle)*18)+'" stroke="#ffd230" stroke-width="2.6" stroke-linecap="round"/>';
  s += '<circle cx="34" cy="34" r="4.2" fill="#0d2d4d" stroke="#8fc0e6"/>';

  s += '<text x="42" y="70" text-anchor="middle" font-size="7.5" fill="#9dc6e8" font-family="Segoe UI,Arial">уставка '+thermalNumber(set)+' А</text>';

  // индикатор срабатывания
  s += '<circle cx="70" cy="12" r="6" fill="'+(tripped ? '#ff3b30' : '#1f8f52')+'" stroke="#0d2d4d"/>';
  s += '<text x="'+(w-10)+'" y="70" text-anchor="end" font-size="8" font-weight="700" fill="#cfe4f5" font-family="Segoe UI,Arial">'+(o.tag||'KK')+'</text>';

  // кнопки TEST и RESET подняты к верхней части компактного корпуса.
  s += '<text x="91" y="21" text-anchor="middle" font-size="9" font-weight="700" fill="#cfe4f5" font-family="Segoe UI,Arial">TEST</text>';
  s += '<text x="128" y="21" text-anchor="middle" font-size="9" font-weight="700" fill="#cfe4f5" font-family="Segoe UI,Arial">RESET</text>';
  s += '<ellipse cx="91" cy="46" rx="15" ry="13" fill="rgba(5,20,34,.5)"/>';
  s += '<g class="relay-btn relay-test">'
     + '<circle cx="91" cy="42" r="14" fill="#e0242b" stroke="#9c1418" stroke-width="1.2"/>'
     + '<circle cx="91" cy="38" r="9" fill="#ff8a8e" opacity=".62"/>'
     + '</g>';
  s += '<rect x="114" y="30" width="29" height="31" rx="6" fill="rgba(5,20,34,.5)"/>';
  s += '<g class="relay-btn relay-reset">'
     + '<rect x="115" y="26" width="27" height="32" rx="5" fill="#2a80cc" stroke="#12406e"/>'
     + '<rect x="117" y="28" width="23" height="9" rx="4" fill="#71b8ef" opacity=".52"/>'
     + '<path d="M128.5 32 v20 M118.5 42 h20" stroke="#dbeaff" stroke-width="3" stroke-linecap="round"/>'
     + '</g>';

  // Зоны нажатия совпадают с положением регулятора и кнопок.
  s += '<rect class="zone" data-zone="dial" x="7" y="7" width="54" height="54" fill="transparent" pointer-events="all"/>';
  s += '<rect class="zone" data-zone="test" x="75" y="24" width="32" height="38" fill="transparent" pointer-events="all"/>';
  s += '<rect class="zone" data-zone="reset" x="113" y="24" width="32" height="38" fill="transparent" pointer-events="all"/>';

  // колодка вспомогательных контактов: 98 NO, 97 — 96 NC, 95
  s += '<rect x="3" y="'+THERMAL_AUX.top+'" width="'+(w-6)+'" height="'+THERMAL_AUX.height+'" rx="4" fill="#1a558c" stroke="#12406e"/>';
  const lab = ['98','97','96','95'];
  for (let i=0;i<4;i++){
    const cx = (i+0.5)*cell;
    s += contactHole(cx, THERMAL_AUX.terminalY, 9.5);
    s += '<text x="'+cx+'" y="'+THERMAL_AUX.labelY+'" text-anchor="middle" font-size="9" fill="#dbeaff" font-family="Segoe UI,Arial">'+lab[i]+'</text>';
  }
  s += '<text x="'+cell+'" y="'+THERMAL_AUX.pairLabelY+'" text-anchor="middle" font-size="8" fill="#9dc6e8" font-family="Segoe UI,Arial">NO</text>';
  s += '<text x="'+(3*cell)+'" y="'+THERMAL_AUX.pairLabelY+'" text-anchor="middle" font-size="8" fill="#9dc6e8" font-family="Segoe UI,Arial">NC</text>';

  // три силовых вывода к двигателю: 2 T1, 4 T2, 6 T3
  s += '<rect x="3" y="'+THERMAL_POWER.top+'" width="'+(w-6)+'" height="'+(h-THERMAL_POWER.top-4)+'" rx="4" fill="#1b5e9e" stroke="#12406e"/>';
  const pLab = ['2 T1','4 T2','6 T3'];
  for (let i=0;i<3;i++){
    const cx = (i+0.5)*cell;
    s += contactHole(cx, THERMAL_POWER.terminalY, 10);
    s += '<text x="'+cx+'" y="'+THERMAL_POWER.labelY+'" text-anchor="middle" font-size="9" fill="#dbeaff" font-family="Segoe UI,Arial">'+pLab[i]+'</text>';
  }
  return s;
}

/* Одномодульные сигнальные лампы HL1-HL3 на DIN-рейку, питание 220 В. */
function lampInner(o){
  const w = TYPES.lamp.modules*MODULE, h = TYPES.lamp.h;
  const voltage = lampVoltage(o);
  const burned = !!o.burned;
  const nominal= ratedVoltageOf(o,220), brightness=!burned?voltageBrightness(voltage,o,220):0;
  const lit = !burned && brightness>0;
  const indicator = o.indicator || 'green';
  const palettes = {
    green:  { on:'#35e47d', off:'#286b47', strokeOn:'#baffd4', strokeOff:'#17442d', text:'#148d49' },
    yellow: { on:'#ffd928', off:'#7a6820', strokeOn:'#fff4a3', strokeOff:'#514613', text:'#9a7900' },
    red:    { on:'#f34a45', off:'#71302e', strokeOn:'#ffc0bc', strokeOff:'#4a1d1b', text:'#b32622' }
  };
  const pal = palettes[indicator] || palettes.green;
  const lampTag = o.tag || 'HL';
  let s = '';
  s += '<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="5" fill="#eceff1" stroke="#aeb4ba" stroke-width="1.5"/>';
  s += '<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="4" fill="none" stroke="#ffffff" opacity=".8"/>';
  s += screw(w/2, 18, 10);
  s += screw(w/2, h-18, 10);
  s += '<rect x="7" y="61" width="'+(w-14)+'" height="17" rx="2" fill="#f2c218"/>';
  s += '<text x="'+(w/2)+'" y="73" text-anchor="middle" font-size="8" font-weight="700" fill="#4d5155" font-family="Segoe UI,Arial">'+lampTag+'</text>';
  s += '<text x="'+(w/2)+'" y="89" text-anchor="middle" font-size="8" fill="#454b50" font-family="Segoe UI,Arial">'+Math.round(nominal)+' В~</text>';
  s += '<rect x="7" y="98" width="'+(w-14)+'" height="66" rx="5" fill="#263b31" stroke="#68756f" stroke-width="2"/>';
  s += '<rect class="lamp-window lamp-'+indicator+(lit ? ' lit' : '')+'" x="11" y="102" width="'+(w-22)+'" height="58" rx="3" fill="'+(burned?'#24282b':(lit ? pal.on : pal.off))+'" fill-opacity="'+(lit?(0.28+0.72*brightness).toFixed(2):'1')+'" stroke="'+(burned?'#d94a45':(lit ? pal.strokeOn : pal.strokeOff))+'" stroke-width="'+(burned?'2.5':'1.5')+'"/>';
  s += '<path d="M14 106 H'+(w-14)+' V113 H14 Z" fill="#ffffff" opacity="'+(lit?(0.12+0.30*brightness).toFixed(2):'.12')+'"/>';
  if(burned) s += '<path d="M16 111 L'+(w-16)+' 151 M'+(w-16)+' 111 L16 151" stroke="#f15b55" stroke-width="4" stroke-linecap="round"/>';
  s += '<text x="'+(w/2)+'" y="184" text-anchor="middle" font-size="9" font-weight="700" fill="#495057" font-family="Segoe UI,Arial">'+lampTag+'</text>';
  s += '<text x="'+(w/2)+'" y="196" text-anchor="middle" font-size="7.5" font-weight="'+(burned?'800':'400')+'" fill="'+(burned?'#c62828':(lit ? pal.text : '#6c737a'))+'" font-family="Segoe UI,Arial">'+(burned ? 'ПЕРЕГОРЕЛА' : (lit ? (brightness<.65?'СВЕТИТСЯ ТУСКЛО':'СВЕТИТСЯ') : Math.round(voltage)+' В'))+'</text>';
  return s;
}

/* Обычная лампа накаливания в патроне. Объект располагается свободно,
   а наружные винтовые клеммы L и N доступны для монтажа учебной схемы. */
function bulbInner(o){
  const w=TYPES.bulb.modules*MODULE,h=TYPES.bulb.h;
  const voltage=bulbVoltage(o),burned=!!o.burned;
  const brightness=!burned?voltageBrightness(voltage,o,220):0,lit=!burned&&brightness>0;
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="10" fill="#eef0f2" stroke="#9da3a9" stroke-width="1.5"/>';
  s+='<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="8" fill="none" stroke="#ffffff" opacity=".85"/>';
  s+='<text x="'+(w-10)+'" y="'+(h-6)+'" text-anchor="end" font-size="8" font-weight="700" fill="#5b6470" font-family="Segoe UI,Arial">'+(o.tag||'EL')+'</text>';
  // Колба направлена вниз, верхняя колодка остаётся над ней. Надписи не отражаем.
  s+='<g transform="translate(0,'+h+') scale(1,-1)">';
  // Стеклянная колба и нить накала.
  s+='<ellipse class="bulb-glass'+(lit?' lit':'')+'" cx="'+(w/2)+'" cy="62" rx="38" ry="42" fill="'+(burned?'#62676b':(lit?'#ffd861':'#dbe7ec'))+'" fill-opacity="'+(lit?(0.30+0.62*brightness).toFixed(2):'.58')+'" stroke="'+(burned?'#3d4246':(lit?'#fff2a4':'#94a6af'))+'" stroke-width="2"/>';
  s+='<path d="M'+(w/2-27)+' 43 Q '+(w/2)+' 24 '+(w/2+27)+' 43" fill="none" stroke="#fff" stroke-width="4" opacity="'+(lit?(0.16+0.32*brightness).toFixed(2):'.72')+'"/>';
  s+='<path d="M'+(w/2-13)+' 76 L '+(w/2-7)+' 61 L '+(w/2)+' 77 L '+(w/2+7)+' 61 L '+(w/2+13)+' 76" fill="none" stroke="#6f7478" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
  if(burned)s+='<path d="M'+(w/2-7)+' 66 L '+(w/2+9)+' 73" stroke="#e0443e" stroke-width="3"/>';
  // Цоколь и патрон выполнены теми же серыми материалами, что корпуса аппаратов.
  s+='<path d="M'+(w/2-24)+' 94 H '+(w/2+24)+' L '+(w/2+20)+' 119 H '+(w/2-20)+' Z" fill="#aeb4ba" stroke="#747b82"/>';
  for(let y=99;y<=114;y+=5)s+='<line x1="'+(w/2-20)+'" y1="'+y+'" x2="'+(w/2+20)+'" y2="'+y+'" stroke="#747b82"/>';
  s+='<rect x="10" y="124" width="'+(w-20)+'" height="46" rx="6" fill="#e2e5e9" stroke="#b3b8be"/>';
  s+=screw(w*.28,147,10)+screw(w*.72,147,10);
  s+='</g>';
  s+='<text x="'+(w/2)+'" y="20" text-anchor="middle" font-size="8.5" font-weight="700" fill="'+(burned?'#c62828':'#606870')+'" font-family="Segoe UI,Arial">'+(Number(o.ratedPower)||100)+' Вт</text>';
  return s;
}

/* Двойная розетка в общем корпусе. Нижние винтовые клеммы питают обе чашки,
   а отверстия розеток остаются доступными для щупов мультиметра. */
function outletInner(o){
  const w=TYPES.outlet.modules*MODULE,h=TYPES.outlet.h;
  const voltage=outletVoltage(o),energized=voltageIsOperating(voltage,o,220);
  const centers=[w*.28,w*.72];
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="14" fill="#eceff1" stroke="#9da3a9" stroke-width="1.7"/>';
  s+='<rect x="5" y="5" width="'+(w-10)+'" height="'+(h-10)+'" rx="11" fill="none" stroke="#ffffff" opacity=".85"/>';
  // Общая вводная колодка находится сверху корпуса.
  s+='<rect x="31" y="7" width="'+(w-62)+'" height="36" rx="6" fill="#e2e5e9" stroke="#b3b8be"/>';
  const tx=[w*.32,w*.50,w*.68],labs=['L','N','PE'],cols=['#4b5563','#4b5563','#5f7a00'];
  tx.forEach(function(cx,i){s+=screw(cx,21,8)+'<text x="'+cx+'" y="39" text-anchor="middle" font-size="7" font-weight="800" fill="'+cols[i]+'" font-family="Segoe UI,Arial">'+labs[i]+'</text>';});
  s+='<text x="'+(w-10)+'" y="59" text-anchor="end" font-size="7.5" font-weight="700" fill="#5b6470" font-family="Segoe UI,Arial">'+(o.tag||'XS')+' · 2×16 А</text>';
  centers.forEach(function(cx,index){
    s+='<circle cx="'+cx+'" cy="108" r="43" fill="#dfe3e6" stroke="#a3a9af" stroke-width="2"/>';
    s+='<circle cx="'+cx+'" cy="108" r="36" fill="'+(energized?'#f5f6f4':'#eaeced')+'" stroke="#c2c7cc" stroke-width="1.5"/>';
    s+='<circle cx="'+(cx-14)+'" cy="108" r="7" fill="#34393e" stroke="#171a1d" stroke-width="1.5"/>';
    s+='<circle cx="'+(cx+14)+'" cy="108" r="7" fill="#34393e" stroke="#171a1d" stroke-width="1.5"/>';
    // Видимые защитные контакты, как у розетки Schuko: сверху и снизу чашки.
    s+='<rect x="'+(cx-7)+'" y="69" width="14" height="15" rx="2" fill="#c2a13a" stroke="#806819"/>';
    s+='<rect x="'+(cx-4)+'" y="75" width="8" height="12" rx="2" fill="#e1c363"/>';
    s+='<rect x="'+(cx-7)+'" y="132" width="14" height="15" rx="2" fill="#c2a13a" stroke="#806819"/>';
    s+='<rect x="'+(cx-4)+'" y="129" width="8" height="12" rx="2" fill="#e1c363"/>';
    s+='<text x="'+cx+'" y="161" text-anchor="middle" font-size="7.5" font-weight="700" fill="#6a7076" font-family="Segoe UI,Arial">РОЗЕТКА '+(index+1)+'</text>';
  });
  return s;
}

/* Настенный выключатель освещения. Общая клемма L подаёт фазу на один
   либо два независимых выхода; число клавиш выбирается в характеристиках. */
function wallSwitchInner(o){
  const w=TYPES.wallSwitch.modules*MODULE,h=TYPES.wallSwitch.h;
  const gangs=Number(o.gangs)===2?2:1;
  const on1=!!o.switchOn1,on2=gangs===2&&!!o.switchOn2;
  const terminals=gangs===2
    ? [{x:w*.22,label:'L'},{x:w*.50,label:'1'},{x:w*.78,label:'2'}]
    : [{x:w*.32,label:'L'},{x:w*.68,label:'1'}];
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="14" fill="#eceff1" stroke="#9da3a9" stroke-width="1.7"/>';
  s+='<rect x="5" y="5" width="'+(w-10)+'" height="'+(h-10)+'" rx="11" fill="none" stroke="#ffffff" opacity=".85"/>';
  s+='<rect x="12" y="8" width="'+(w-24)+'" height="39" rx="6" fill="#e2e5e9" stroke="#b3b8be"/>';
  terminals.forEach(function(t){
    s+=screw(t.x,23,8);
    s+='<text x="'+t.x+'" y="43" text-anchor="middle" font-size="7" font-weight="800" fill="#4b5563" font-family="Segoe UI,Arial">'+t.label+'</text>';
  });
  s+='<text x="'+(w/2)+'" y="61" text-anchor="middle" font-size="9" font-weight="800" fill="#596168" font-family="Segoe UI,Arial">'+(o.tag||'SA')+'</text>';
  function rocker(x,width,index,on){
    const faceY=on?73:78,faceH=75;
    let q='<g data-switch-key="'+index+'" style="cursor:pointer;touch-action:none">';
    q+='<rect x="'+x+'" y="70" width="'+width+'" height="86" rx="8" fill="#cdd2d6" stroke="#979ea5" stroke-width="1.5"/>';
    q+='<rect x="'+(x+5)+'" y="'+faceY+'" width="'+(width-10)+'" height="'+faceH+'" rx="6" fill="'+(on?'#f7f8f6':'#e8eaeb')+'" stroke="#aab0b5" stroke-width="1.3"/>';
    q+='<path d="M '+(x+10)+' '+(faceY+11)+' H '+(x+width-10)+'" stroke="#ffffff" stroke-width="3" opacity=".8"/>';
    q+='<text x="'+(x+width/2)+'" y="'+(faceY+35)+'" text-anchor="middle" font-size="13" font-weight="700" fill="#6a7178" font-family="Segoe UI,Arial">'+(on?'I':'0')+'</text>';
    q+='<rect x="'+x+'" y="70" width="'+width+'" height="86" rx="8" fill="transparent" pointer-events="all"/>';
    return q+'</g>';
  }
  if(gangs===1)s+=rocker(18,w-36,1,on1);
  else{
    const gap=6,keyW=(w-42-gap)/2;
    s+=rocker(18,keyW,1,on1)+rocker(18+keyW+gap,keyW,2,on2);
  }
  s+='<text x="'+(w/2)+'" y="169" text-anchor="middle" font-size="7.5" fill="#697078" font-family="Segoe UI,Arial">'+gangs+' кл. · '+Math.round(ratedVoltageOf(o,220))+' В~ · '+(Number(o.ratedCurrent)||10)+' А</text>';
  return s;
}

/* Проходной выключатель: общий контакт L постоянно соединён с одним из
   двух выходов. Нажатие клавиши перекидывает контакт L–1 / L–2. */
function twoWaySwitchInner(o){
  const w=TYPES.twoWaySwitch.modules*MODULE,h=TYPES.twoWaySwitch.h;
  const position=Number(o.switchPosition)===2?2:1;
  const tx=[w*.22,w*.50,w*.78],labels=['L','1','2'];
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="14" fill="#eceff1" stroke="#9da3a9" stroke-width="1.7"/>';
  s+='<rect x="5" y="5" width="'+(w-10)+'" height="'+(h-10)+'" rx="11" fill="none" stroke="#ffffff" opacity=".85"/>';
  s+='<rect x="12" y="8" width="'+(w-24)+'" height="39" rx="6" fill="#e2e5e9" stroke="#b3b8be"/>';
  tx.forEach(function(x,i){
    s+=screw(x,23,8);
    s+='<text x="'+x+'" y="43" text-anchor="middle" font-size="7" font-weight="800" fill="#4b5563" font-family="Segoe UI,Arial">'+labels[i]+'</text>';
  });
  s+='<text x="'+(w/2)+'" y="61" text-anchor="middle" font-size="9" font-weight="800" fill="#596168" font-family="Segoe UI,Arial">'+(o.tag||'SA')+'</text>';
  const x=18,width=w-36,faceY=position===1?73:78;
  s+='<g data-two-way-switch="1" style="cursor:pointer;touch-action:none">';
  s+='<rect x="'+x+'" y="70" width="'+width+'" height="86" rx="8" fill="#cdd2d6" stroke="#979ea5" stroke-width="1.5"/>';
  s+='<rect x="'+(x+5)+'" y="'+faceY+'" width="'+(width-10)+'" height="75" rx="6" fill="#f2f4f3" stroke="#aab0b5" stroke-width="1.3"/>';
  s+='<path d="M '+(x+10)+' '+(faceY+11)+' H '+(x+width-10)+'" stroke="#ffffff" stroke-width="3" opacity=".8"/>';
  s+='<path d="M '+(w/2-18)+' '+(faceY+46)+' H '+(w/2-5)+' M '+(w/2-5)+' '+(faceY+46)+' L '+(w/2+16)+' '+(faceY+(position===1?34:58))+'" fill="none" stroke="#657079" stroke-width="3" stroke-linecap="round"/>';
  s+='<circle cx="'+(w/2-18)+'" cy="'+(faceY+46)+'" r="3.5" fill="#657079"/>';
  s+='<circle cx="'+(w/2+16)+'" cy="'+(faceY+34)+'" r="3.5" fill="#657079"/>';
  s+='<circle cx="'+(w/2+16)+'" cy="'+(faceY+58)+'" r="3.5" fill="#657079"/>';
  s+='<text x="'+(w/2-29)+'" y="'+(faceY+49)+'" text-anchor="middle" font-size="8" font-weight="800" fill="#4f5961" font-family="Segoe UI,Arial">L</text>';
  s+='<text x="'+(w/2+29)+'" y="'+(faceY+37)+'" text-anchor="middle" font-size="8" font-weight="800" fill="#4f5961" font-family="Segoe UI,Arial">1</text>';
  s+='<text x="'+(w/2+29)+'" y="'+(faceY+61)+'" text-anchor="middle" font-size="8" font-weight="800" fill="#4f5961" font-family="Segoe UI,Arial">2</text>';
  s+='<rect x="'+x+'" y="70" width="'+width+'" height="86" rx="8" fill="transparent" pointer-events="all"/>';
  s+='</g>';
  s+='<text x="'+(w/2)+'" y="169" text-anchor="middle" font-size="7.5" fill="#697078" font-family="Segoe UI,Arial">ПРОХОДНОЙ · '+Math.round(ratedVoltageOf(o,220))+' В~ · '+(Number(o.ratedCurrent)||10)+' А</text>';
  return s;
}

/* Карточки квартирных электроприёмников. Это полноценные однофазные нагрузки:
   L/N питают прибор, PE подключается к корпусу, мощность задаётся в свойствах. */

/* Полноразмерные бытовые приборы: геометрия и клеммы общие для сцены и лотка. */
function householdApplianceTerms(type){
  const w=TYPES[type].modules*MODULE;
  return ['L','N','PE'].map(function(key,i){
    return {key:key,label:key+(i===0?' · питание':i===1?' · нейтраль':' · корпус'),
      dx:w/2+(i-1)*44,dy:23,color:[WC.L1,WC.N,WC.PE][i],hitR:11};
  });
}
function householdApplianceInner(type,o){
  const t=TYPES[type],w=t.modules*MODULE,h=t.h;
  const powered=voltageIsOperating(applianceVoltage(o),o,220);
  const active=!!(o.applianceOn&&powered&&!o.applianceBurned);
  const statusColor=o.applianceBurned?'#d93630':active?'#219653':o.applianceOn?'#d39a17':'#818e97';
  const buttonColor=o.applianceBurned?'#e5a09a':active?'#9db5aa':o.applianceOn?'#f2c94c':'#c6ccd1';
  let s='<g class="household-appliance appliance-'+type+'">';
  function rect(x,y,rw,rh,fill,stroke,rx){
    s+='<rect x="'+x+'" y="'+y+'" width="'+rw+'" height="'+rh+'" rx="'+(rx||0)+'" fill="'+fill+'" stroke="'+(stroke||'#8f979f')+'" stroke-width="3"/>';
  }
  function path(d,stroke,sw,fill){
    s+='<path d="'+d+'" fill="'+(fill||'none')+'" stroke="'+(stroke||'#949ca4')+'" stroke-width="'+(sw||3)+'" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function circle(cx,cy,r,fill,stroke,sw){
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+fill+'" stroke="'+(stroke||'#8f979f')+'" stroke-width="'+(sw||3)+'"/>';
  }
  function label(x,y,text,size,fill,anchor){
    s+='<text x="'+x+'" y="'+y+'" font-family="Segoe UI,Arial" font-size="'+(size||13)+'" fill="'+(fill||'#596168')+'" text-anchor="'+(anchor||'middle')+'">'+escapeHtml(text)+'</text>';
  }
  function control(x,y){
    rect(x,y,128,42,'#dce1e5','#949ca4',5);
    circle(x+18,y+21,5,statusColor,'#697886',2);
    s+='<g data-appliance-toggle="1" style="cursor:pointer;touch-action:none">';
    s+='<title>'+escapeHtml(o.applianceBurned?'Прибор повреждён':o.applianceOn?(powered?'Включён · питание подано':'Включён · нет рабочего напряжения'):'Включить прибор')+'</title>';
    rect(x+36,y+6,82,30,buttonColor,'#8f979f',4);
    label(x+77,y+26,o.applianceOn?'I · ВКЛ':'0 · ВЫКЛ',11);
    s+='<rect x="'+(x+36)+'" y="'+(y+6)+'" width="82" height="30" rx="4" fill="transparent" pointer-events="all"/></g>';
  }
  // Приборы имеют узнаваемый корпус, без общей рамки карточки.
  if(type==='fridge'){
    rect(25,76,w-50,h-98,'#c6ccd1','#8f979f',12);
    rect(31,82,w-62,h-111,'none','#edf0f2',9);
    rect(36,88,w-72,284,'#e4e8eb','#949ca4',8);
    rect(36,384,w-72,h-423,'#e4e8eb','#949ca4',8);
    path('M45 97 H'+(w-45)+' M45 393 H'+(w-45),'#ffffff',4);
    [180,447].forEach(function(y){rect(w-78,y,18,114,'#bcc6cf','#697886',7);path('M'+(w-72)+' '+(y+8)+' V'+(y+104),'#edf0f2',4);});
    rect(48,h-22,42,17,'#818e97','#66727e',3);rect(w-90,h-22,42,17,'#818e97','#66727e',3);
    control(w/2-64,294);
  }else if(type==='washer'){
    rect(23,82,w-46,h-104,'#c6ccd1','#8f979f',9);
    rect(30,90,w-60,h-120,'#e4e8eb','#949ca4',7);
    rect(17,72,w-34,23,'#dce1e5','#949ca4',4);
    path('M24 78 H'+(w-24),'#edf0f2',4);
    rect(42,112,145,55,'#dce1e5','#a4afb8',4);
    path('M57 128 H172','#edf0f2',3);
    circle(222,140,22,'#bcc6cf','#697886');path('M222 125 V136','#edf0f2',4);
    control(w-192,119);
    path('M32 187 H'+(w-32),'#a4afb8',3);
    circle(w/2,375,158,'#bcc6cf','#8f979f',4);
    circle(w/2,375,140,'#dce1e5','#edf0f2',4);
    circle(w/2,375,122,'#657d8d','#697886',4);
    circle(w/2,375,107,'#a9c1cf','#526b7b',3);
    path('M'+(w/2-78)+' 414 Q'+w/2+' 381 '+(w/2+80)+' 420 Q'+w/2+' 485 '+(w/2-78)+' 414','#8da8ba',3,'#8da8ba');
    path('M'+(w/2-76)+' 349 Q'+(w/2-60)+' 300 '+(w/2-5)+' 286','#dce8ee',9);
    rect(w/2+117,349,16,53,'#a4afb8','#697886',7);
    path('M42 '+(h-91)+' H'+(w-42),'#bcc4ca',3);
    rect(w-112,h-81,58,31,'#dce1e5','#a4afb8',3);
    [48,w-91].forEach(function(x){rect(x,h-22,43,17,'#818e97','#66727e',3);});
  }else if(type==='boiler'){
    rect(45,76,w-90,h-151,'#c6ccd1','#8f979f',65);
    rect(53,84,w-106,h-169,'#e4e8eb','#949ca4',60);
    path('M75 155 Q75 104 125 104 H'+(w-125),'#ffffff',4);
    path('M64 '+(h-145)+' Q'+(w/2)+' '+(h-115)+' '+(w-64)+' '+(h-145),'#bcc4ca',3);
    circle(w/2,231,31,'#dce1e5','#8f979f');
    path('M'+(w/2)+' 231 l13 -14','#697886',4);
    control(w/2-64,h-235);
    [w/2-60,w/2+60].forEach(function(x,i){
      rect(x-10,h-76,20,44,'#bcc6cf','#697886',3);
      rect(x-14,h-46,28,17,i===0?'#87b1d5':'#d49b94','#697886',3);
      path('M'+(x-8)+' '+(h-38)+' H'+(x+8),'#edf0f2',3);
    });
    label(w/2-60,h-8,'ХОЛ.',11,'#527c9e');label(w/2+60,h-8,'ГОР.',11,'#a45d56');
  }else if(type==='stove'){
    rect(23,126,w-46,h-148,'#c6ccd1','#8f979f',7);
    rect(30,134,w-60,h-164,'#e4e8eb','#949ca4',5);
    path('M18 167 L57 80 H'+(w-57)+' L'+(w-18)+' 167 Z','#8f979f',3,'#bcc6cf');
    path('M26 161 L62 87 H'+(w-62)+' L'+(w-26)+' 161','#edf0f2',3);
    [[145,107,43,16],[w-145,107,43,16],[130,143,51,19],[w-130,143,51,19]].forEach(function(b){
      s+='<ellipse cx="'+b[0]+'" cy="'+b[1]+'" rx="'+b[2]+'" ry="'+b[3]+'" fill="#596771" stroke="#435460" stroke-width="3"/>';
      s+='<ellipse cx="'+b[0]+'" cy="'+b[1]+'" rx="'+(b[2]-10)+'" ry="'+(b[3]-5)+'" fill="none" stroke="#8b98a3" stroke-width="2"/>';
    });
    rect(18,167,w-36,23,'#aab7c1','#8f979f',3);
    path('M25 173 H'+(w-25),'#edf0f2',3);
    rect(34,199,w-68,83,'#dce1e5','#a4afb8',5);
    [68,129,190,251].forEach(function(x){
      circle(x,239,18,'#bcc6cf','#697886');
      path('M'+x+' 226 V234','#edf0f2',4);
    });
    control(w-184,218);
    rect(42,302,w-84,266,'#aab7c1','#697886',9);
    rect(54,314,w-108,242,'#596771','#435460',7);
    rect(72,337,w-144,201,'#7f96a5','#697886',4);
    path('M82 354 H'+(w-82)+' M82 506 H'+(w-82),'#aabdc9',3);
    path('M85 396 H'+(w-85)+' M85 441 H'+(w-85),'#526b7b',4);
    for(let x=99;x<w-86;x+=26)path('M'+x+' 392 V447','#aabdc9',2);
    path('M88 347 L147 347 L88 467 Z','none',0,'#a9c1cf');
    rect(75,294,w-150,25,'#bcc6cf','#697886',8);
    path('M84 300 H'+(w-84),'#edf0f2',4);
    path('M42 '+(h-62)+' H'+(w-42),'#bcc4ca',3);
    [48,w-91].forEach(function(x){rect(x,h-22,43,17,'#818e97','#66727e',3);});
  }else if(type==='split'){
    rect(16,76,w-32,h-92,'#c6ccd1','#8f979f',28);
    rect(23,83,w-46,h-110,'#e4e8eb','#949ca4',24);
    path('M38 93 H'+(w-38),'#ffffff',4);
    path('M38 '+(h-105)+' H'+(w-38),'#a4afb8',4);
    path('M44 '+(h-96)+' H'+(w-44)+' L'+(w-61)+' '+(h-47)+' H61 Z','#8f979f',3,'#bcc6cf');
    for(let y=h-84;y<h-47;y+=12)path('M65 '+y+' H'+(w-65),'#697886',3);
    path('M61 '+(h-43)+' H'+(w-61),'#edf0f2',4);
    control(w-185,113);
    label(90,143,'INVERTER',12,'#818e97','start');
  }
  // Открытые винтовые клеммы доступны над корпусом при любом состоянии прибора.
  rect(w/2-77,3,154,55,'#dce1e5','#949ca4',5);
  householdApplianceTerms(type).forEach(function(td,i){
    rect(td.dx-16,10,32,26,i===0?'#c7b8a6':i===1?'#a9c7df':'#d9d78c','#949ca4',3);
    if(i===2)path('M'+(td.dx-14)+' 34 L'+(td.dx+13)+' 12','#74934a',7);
    s+=screw(td.dx,td.dy,8);
    label(td.dx,50,td.key,11,i===1?'#2a6fd6':i===2?'#607b00':'#76502d');
  });
  const power=Math.max(1,Number(o.ratedPower)||t.defaultPower);
  label(w/2,69,(o.tag||'E')+' · 220 В · '+power+' Вт',10);
  return s+'</g>';
}

function applianceInner(type,o){
  return householdApplianceInner(type,o);
}

/* Реле времени KT1: A1–A2 — питание 220 В, S — пуск от той же фазы,
   15–16 — НЗ, 15–18 — НО. Три красных регулятора действуют независимо. */
const TIMER_RANGES = [1, 10, 60];
const TIMER_LEVELS = [0.25, 0.5, 0.75, 1];
const TIMER_MODES = ['on', 'off', 'pulse'];
function timerDelayMs(d){
  return (TIMER_RANGES.includes(d.timerRange) ? d.timerRange : 10)
       * (TIMER_LEVELS.includes(d.timerLevel) ? d.timerLevel : 0.5) * 1000;
}
function timerStatus(d, now){
  if (d.timerBurned) return 'СГОРЕЛО';
  if (!d.timerSupply) return 'НЕТ ПИТ.';
  if (d.timerActive && d.timerMode !== 'pulse' && !(d.timerMode === 'off' && d.timerSince != null)) return '15–18 ЗАМК.';
  if (d.timerSince != null){
    const left = Math.max(0, (timerDelayMs(d) - (now - d.timerSince))/1000);
    return left.toFixed(1)+' с';
  }
  return 'ОЖИД. S';
}
function timerInner(o){
  const w=TYPES.timer.modules*MODULE,h=TYPES.timer.h, cx=w/2;
  const range=TIMER_RANGES.includes(o.timerRange)?o.timerRange:10;
  const level=TIMER_LEVELS.includes(o.timerLevel)?o.timerLevel:0.5;
  const mode=TIMER_MODES.includes(o.timerMode)?o.timerMode:'on';
  let s='';
  // Корпус, клеммные колодки и этикетка повторяют оформление автоматов.
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="7" fill="#f3f4f1" stroke="#9aa0a8" stroke-width="1.5"/>';
  s+='<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="5" fill="none" stroke="rgba(255,255,255,.85)"/>';
  s+='<rect x="3" y="3" width="'+(w-6)+'" height="35" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  s+='<rect x="3" y="'+(h-38)+'" width="'+(w-6)+'" height="35" rx="5" fill="#e2e5e9" stroke="#b3b8be"/>';
  ['A1','S','A2'].forEach(function(label,i){
    const x=10+i*(w-20)/2;
    s+='<text x="'+x+'" y="11" text-anchor="middle" font-size="7" font-weight="700" fill="#2b3138" font-family="Segoe UI,Arial">'+label+'</text>';
    s+=screw(x,22,6.5);
  });
  ['15','16','18'].forEach(function(label,i){
    const x=10+i*(w-20)/2;
    s+=screw(x,h-22,6.5);
    s+='<text x="'+x+'" y="'+(h-7)+'" text-anchor="middle" font-size="7" font-weight="700" fill="#2b3138" font-family="Segoe UI,Arial">'+label+'</text>';
  });
  s+='<rect x="6" y="41" width="'+(w-12)+'" height="167" rx="3" fill="#fcfcfa" stroke="#d8dbdf"/>';
  s+='<text x="'+cx+'" y="68" text-anchor="middle" font-size="7" fill="#5b6470" font-family="Segoe UI,Arial">'+(o.tag||'KT')+' · '+Math.round(ratedVoltageOf(o,220))+' В~</text>';
  s+='<circle cx="16" cy="74" r="3" fill="'+(o.timerSupply&&!o.timerBurned?'#32c86e':'#386047')+'" stroke="#56646a"/>';
  s+='<circle cx="'+(w-16)+'" cy="74" r="3" fill="'+(o.timerActive?'#e6463d':'#6c3431')+'" stroke="#56646a"/>';
  s+='<text x="'+cx+'" y="85" text-anchor="middle" font-size="5.4" font-weight="700" fill="'+(o.timerBurned?'#c62828':'#4b5563')+'" font-family="Segoe UI,Arial" class="timer-state">'+timerStatus(o,performance.now())+'</text>';
  function dial(name,y,label,value,angle){
    let q='<g data-timer-control="'+name+'" style="cursor:pointer;touch-action:none">';
    q+='<text x="'+cx+'" y="'+(y-15)+'" text-anchor="middle" font-size="5.2" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">'+label+'</text>';
    q+='<circle cx="'+cx+'" cy="'+y+'" r="11" fill="#d9dde0" stroke="#a2a9ae"/>';
    q+='<circle cx="'+cx+'" cy="'+y+'" r="9" fill="#d93931" stroke="#8f2724" stroke-width="1.5"/>';
    q+='<g transform="rotate('+angle+' '+cx+' '+y+')"><path d="M'+(cx-6)+' '+y+' H'+(cx+6)+' M'+cx+' '+(y-6)+' V'+(y+6)+'" stroke="#54201f" stroke-width="2.2" stroke-linecap="round"/></g>';
    q+='<circle cx="'+cx+'" cy="'+y+'" r="13" fill="transparent" pointer-events="all"/>';
    q+='<text x="'+cx+'" y="'+(y+17)+'" text-anchor="middle" font-size="5.2" font-weight="700" fill="#4b5563" font-family="Segoe UI,Arial">'+value+'</text>';
    return q+'</g>';
  }
  s+=dial('range',107,'ДИАПАЗОН',range===60?'60 с':range+' с',TIMER_RANGES.indexOf(range)*30);
  s+=dial('level',146,'УСТАВКА',Math.round(level*100)+' %',TIMER_LEVELS.indexOf(level)*25);
  s+=dial('mode',185,'РЕЖИМ',mode==='on'?'ВКЛ':mode==='off'?'ВЫКЛ':'ИМП.',TIMER_MODES.indexOf(mode)*35);
  return s;
}

/* Кнопочный пост: две зелёные кнопки НО и красная кнопка НЗ.
   Клеммы каждой кнопки вынесены слева парой по вертикали. */
const PB = { x:930, y:720, w:170, h:320 };
const PB_TERMS = [
  { key:'upL',   label:'SB1:1', dx:-18, dy:57,  color:WC.C },
  { key:'upR',   label:'SB1:2', dx:-18, dy:93,  color:WC.C },
  { key:'stopL', label:'SB2:1', dx:-18, dy:142, color:WC.C },
  { key:'stopR', label:'SB2:2', dx:-18, dy:178, color:WC.C },
  { key:'downL', label:'SB3:1', dx:-18, dy:227, color:WC.C },
  { key:'downR', label:'SB3:2', dx:-18, dy:263, color:WC.C }
];
function pushbuttonInner(pb){
  const buttons=(pb&&pb.buttons)||state.pb;
  let s = '';
  // Плоский фронтальный корпус в той же стилистике, что автоматы, лампы и реле.
  s += '<rect x="1" y="1" width="168" height="318" rx="8" fill="#eceff1" stroke="#9aa0a8" stroke-width="1.8"/>';
  s += '<rect x="5" y="5" width="160" height="310" rx="6" fill="none" stroke="#ffffff" opacity=".85"/>';
  s += '<rect x="25" y="8" width="120" height="31" rx="4" fill="#f7f8f6" stroke="#c2c7cc"/>';
  s += '<rect x="25" y="34" width="120" height="5" fill="#f2c218"/>';
  s += '<text x="136" y="27" text-anchor="end" font-size="8" font-weight="800" fill="#596168" font-family="Segoe UI,Arial">'+((pb&&pb.tag)||'SB1–SB3')+'</text>';
  [[14,14],[156,14],[14,306],[156,306]].forEach(function(p){ s += caseScrew(p[0],p[1],6); });

  function button(y, color, light, name, mark, down, normallyClosed){
    let q = '';
    // Маркировка исходного состояния контакта, как на лицевой панели поста.
    q += '<g class="pb-contact-symbol" transform="translate(0,'+y+')" pointer-events="none">';
    q += '<title>'+(normallyClosed?'Нормально закрытый контакт (НЗ)':'Нормально открытый контакт (НО)')+'</title>';
    q += '<text x="30" y="-13" text-anchor="middle" font-size="8" font-weight="700" fill="#656d74" font-family="Segoe UI,Arial">'+(normallyClosed?'НЗ':'НО')+'</text>';
    q += '<text x="9" y="3" text-anchor="middle" font-size="7" fill="#656d74" font-family="Segoe UI,Arial">1</text>';
    q += '<text x="51" y="3" text-anchor="middle" font-size="7" fill="#656d74" font-family="Segoe UI,Arial">2</text>';
    q += '<path d="'+(normallyClosed?'M15 0 H26 L36 6 M35 7 V0 H45':'M15 0 H26 L35 -6 M37 0 H45')+'" fill="none" stroke="#656d74" stroke-width="1.2" stroke-linecap="butt" stroke-linejoin="miter"/>';
    q += '</g>';
    q += '<circle cx="85" cy="'+y+'" r="29" fill="#d5d9dd" stroke="#8e959c" stroke-width="1.8"/>';
    q += '<circle cx="85" cy="'+y+'" r="24" fill="#747c84" stroke="#5c636a" stroke-width="1.2"/>';
    q += '<g class="pb-button'+(down ? ' is-down' : '')+'">';
    q += '<circle cx="85" cy="'+y+'" r="20" fill="'+color+'" stroke="#4e555b" stroke-width="1.5"/>';
    q += '</g>';
    q += '<circle cx="132" cy="'+y+'" r="14" fill="#f7f8f6" stroke="#b3b8bd"/>';
    q += '<text x="132" y="'+(y+5)+'" text-anchor="middle" font-size="18" font-weight="700" fill="#545b62" font-family="Segoe UI Symbol,Segoe UI,Arial">'+mark+'</text>';
    q += '<rect x="51" y="'+(y+35)+'" width="68" height="15" rx="3" fill="#f7f8f6" stroke="#c5c9cd"/>';
    q += '<text x="85" y="'+(y+46)+'" text-anchor="middle" font-size="8" font-weight="700" fill="#596168" font-family="Segoe UI,Arial">'+name+'</text>';
    return q;
  }
  s += button(75,  '#72b861', '#c8efbe', 'ВПЕРЁД', '↗', buttons.up, false);
  s += button(160, '#c94f50', '#ffb0aa', 'СТОП',   '○', buttons.stop, true);
  s += button(245, '#72b861', '#c8efbe', 'НАЗАД',  '↙', buttons.down, false);

  PB_TERMS.forEach(function(t, i){
    const first = i%2 === 0;
    s += '<line x1="'+1+'" y1="'+t.dy+'" x2="'+t.dx+'" y2="'+t.dy+'" stroke="#8f969d" stroke-width="5"/>';
    s += '<rect x="'+(t.dx-12)+'" y="'+(t.dy-12)+'" width="24" height="24" rx="4" fill="#e3e6ea" stroke="#aeb4ba"/>';
    s += screw(t.dx, t.dy, 8);
    s += '<text x="'+t.dx+'" y="'+(t.dy-16)+'" text-anchor="middle" font-size="8" font-weight="700" fill="#596168" font-family="Segoe UI,Arial">'+(first ? '1' : '2')+'</text>';
  });
  s += '<rect class="zone" data-pb="up" x="55" y="45" width="60" height="60" rx="30" fill="transparent" pointer-events="all"/>';
  s += '<rect class="zone" data-pb="stop" x="55" y="130" width="60" height="60" rx="30" fill="transparent" pointer-events="all"/>';
  s += '<rect class="zone" data-pb="down" x="55" y="215" width="60" height="60" rx="30" fill="transparent" pointer-events="all"/>';
  return s;
}

/* Частотный преобразователь: силовой вход R/S/T и регулируемый выход U/V/W.
   Органы управления выполнены теми же простыми SVG-формами, что и остальные аппараты. */
function vfdInner(o){
  o=o||{};
  const w=TYPES.vfd.modules*MODULE,h=TYPES.vfd.h;
  const set=Math.max(0,Math.min(Number(o.maxFrequency)||100,Number(o.setFrequency===undefined?50:o.setFrequency)||0));
  const supplied=!!o.vfdInputReady,running=supplied&&!!o.running&&set>.05&&!o.fault;
  const status=o.fault?'АВАРИЯ':(running?'РАБОТА':(supplied?'ГОТОВ':'НЕТ СЕТИ'));
  const statusColor=o.fault?'#d9342b':(running?'#22a95f':(supplied?'#d69b14':'#65717d'));
  const tag=o.tag||'UZ';
  const topTermX=[w/6,w/2,w*5/6],bottomTermX=[.125,.375,.625,.875].map(function(k){return w*k;});
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="12" fill="#343a40" stroke="#151a1f" stroke-width="2"/>';
  s+='<rect x="6" y="6" width="'+(w-12)+'" height="'+(h-12)+'" rx="9" fill="none" stroke="#69727b" stroke-width="1.5" opacity=".95"/>';
  s+='<rect x="3" y="3" width="'+(w-6)+'" height="47" rx="6" fill="#4a525a" stroke="#747e87"/>';
  ['R · L1','S · L2','T · L3'].forEach(function(label,index){
    const cx=topTermX[index];
    s+=screw(cx,18,10)+'<text x="'+cx+'" y="43" text-anchor="middle" font-size="7" font-weight="700" fill="#eef2f5" font-family="Segoe UI,Arial">'+label+'</text>';
  });
  s+='<text x="'+(w-14)+'" y="64" text-anchor="end" font-size="9" font-weight="800" fill="#e8edf2" font-family="Segoe UI,Arial">ПЧ · '+tag+'</text>';
  s+='<rect x="23" y="76" width="'+(w-46)+'" height="82" rx="7" fill="#19242b" stroke="#59656d" stroke-width="3"/>';
  s+='<rect x="31" y="84" width="'+(w-62)+'" height="66" rx="3" fill="#102d27" stroke="#25483f"/>';
  s+='<text class="vfd-frequency" x="'+(w/2-12)+'" y="119" text-anchor="middle" font-size="32" font-weight="800" fill="'+(running?'#55ee98':'#8da79a')+'" font-family="Consolas,monospace">'+set.toFixed(1)+'</text>';
  s+='<text x="'+(w-50)+'" y="118" text-anchor="middle" font-size="10" font-weight="800" fill="#b8c8c0" font-family="Segoe UI,Arial">Hz</text>';
  s+='<text class="vfd-sequence" x="'+(w/2)+'" y="143" text-anchor="middle" font-size="10" font-weight="800" letter-spacing="1" fill="#86d9b1" font-family="Segoe UI,Arial">'+(o.reverse?'U–W–V':'U–V–W')+'</text>';
  s+='<circle cx="31" cy="169" r="5" fill="'+statusColor+'" stroke="#59636c"/>';
  s+='<text class="vfd-status" x="41" y="172" font-size="8.5" font-weight="500" fill="'+statusColor+'" font-family="Segoe UI,Arial">'+status+'</text>';
  function button(cx,cy,r,fill,label,control,textColor){
    const pressed=o.vfdPressed===control,faceR=pressed?r-1.4:r;
    return '<g class="vfd-button'+(pressed?' pressed':'')+'" data-vfd-control="'+control+'" style="cursor:pointer">'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+(r+2)+'" fill="#596168" stroke="#737c84"/>'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+faceR+'" fill="'+fill+'" fill-opacity="'+(pressed?'.78':'1')+'" stroke="'+(pressed?'#30383e':'#4f5961')+'" stroke-width="'+(pressed?'2.2':'1.5')+'"/>'
      +'<text x="'+cx+'" y="'+(cy+3)+'" text-anchor="middle" font-size="8" font-weight="900" fill="'+(textColor||'#fff')+'" opacity="'+(pressed?'.88':'1')+'" font-family="Segoe UI,Arial">'+label+'</text></g>';
  }
  s+=button(46,202,17,'#2ba967','RUN','run');
  s+=button(w/2,202,17,'#d94841','STOP','stop');
  s+=button(w-46,202,17,'#3979ba','REV','reverse');
  s+=button(76,242,15,'#d8dde1','▲','up','#35404a');
  s+=button(w-76,242,15,'#d8dde1','▼','down','#35404a');
  s+='<text x="'+(w/2)+'" y="271" text-anchor="middle" font-size="8" font-weight="700" fill="#c4cbd1" font-family="Segoe UI,Arial">3×380 В · 0…'+Math.round(Number(o.maxFrequency)||100)+' Гц</text>';
  s+='<rect x="3" y="'+(h-50)+'" width="'+(w-6)+'" height="47" rx="6" fill="#4a525a" stroke="#747e87"/>';
  ['U','V','W','PE'].forEach(function(label,index){
    const cx=bottomTermX[index];
    s+='<text x="'+cx+'" y="'+(h-35)+'" text-anchor="middle" font-size="7" font-weight="700" fill="'+(label==='PE'?'#e8d800':'#eef2f5')+'" font-family="Segoe UI,Arial">'+label+'</text>'+screw(cx,h-18,10);
  });
  return s;
}

/* Тиристорный преобразователь: силовой вход R/S/T, регулируемый выход якоря
   Я+/Я− и нерегулируемый выход возбуждения Ш+/Ш−. Питание обмотки возбуждения
   появляется вместе с сетью, а якорь — только после кнопки «СЕТЬ». */
function tpInner(o){
  o=o||{};
  const w=TYPES.tp.modules*MODULE,h=TYPES.tp.h;
  const set=tpSetArmatureVoltage(o);
  const fieldVoltage=tpFieldVoltage(o);
  const supplied=!!o.tpInputReady, live=supplied&&!!o.tpOn&&set>.5;
  const status=!supplied?'НЕТ СЕТИ':(live?'ВЫХОД ВКЛ':'ВЫХОД ОТКЛ');
  const statusColor=live?'#22a95f':(supplied?'#d69b14':'#65717d');
  const tag=o.tag||'UZT';
  const topTermX=[w/6,w/2,w*5/6],botX=[.1,.3,.5,.7,.9].map(function(k){return w*k;});
  let s='';
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="12" fill="#343a40" stroke="#151a1f" stroke-width="2"/>';
  s+='<rect x="6" y="6" width="'+(w-12)+'" height="'+(h-12)+'" rx="9" fill="none" stroke="#69727b" stroke-width="1.5" opacity=".95"/>';
  s+='<rect x="3" y="3" width="'+(w-6)+'" height="47" rx="6" fill="#4a525a" stroke="#747e87"/>';
  ['R · L1','S · L2','T · L3'].forEach(function(label,index){
    const cx=topTermX[index];
    s+=screw(cx,18,10)+'<text x="'+cx+'" y="43" text-anchor="middle" font-size="7" font-weight="700" fill="#eef2f5" font-family="Segoe UI,Arial">'+label+'</text>';
  });
  s+='<text x="'+(w-14)+'" y="63" text-anchor="end" font-size="9" font-weight="800" fill="#e8edf2" font-family="Segoe UI,Arial">ТП · '+escapeHtml(tag)+'</text>';
  // Лицевая панель рассчитана на корпус высотой 82 мм — как у автоматов.
  s+='<rect x="23" y="68" width="'+(w-46)+'" height="54" rx="7" fill="#19242b" stroke="#59656d" stroke-width="3"/>';
  s+='<rect x="31" y="74" width="'+(w-62)+'" height="42" rx="3" fill="#102d27" stroke="#25483f"/>';
  s+='<text class="tp-voltage" x="'+(w/2-12)+'" y="100" text-anchor="middle" font-size="26" font-weight="800" fill="'+(live?'#55ee98':'#8da79a')+'" font-family="Consolas,monospace">'+Math.round(set)+'</text>';
  s+='<text x="'+(w-48)+'" y="97" text-anchor="middle" font-size="9" font-weight="800" fill="#b8c8c0" font-family="Segoe UI,Arial">V</text>';
  s+='<text class="tp-mode" x="'+(w/2)+'" y="113" text-anchor="middle" font-size="8" font-weight="800" letter-spacing=".5" fill="#86d9b1" font-family="Segoe UI,Arial">ЯКОРЬ · Ш '+Math.round(fieldVoltage)+' В</text>';
  s+='<circle cx="31" cy="136" r="4.5" fill="'+statusColor+'" stroke="#59636c"/>';
  s+='<text class="tp-status" x="40" y="139" font-size="8" font-weight="500" fill="'+statusColor+'" font-family="Segoe UI,Arial">'+status+'</text>';
  function button(cx,cy,r,fill,label,control,textColor,pressed){
    const faceR=pressed?r-1.4:r;
    return '<g class="tp-button'+(pressed?' pressed':'')+'" data-tp-control="'+control+'" style="cursor:pointer">'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+(r+2)+'" fill="#596168" stroke="#737c84"/>'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+faceR+'" fill="'+fill+'" fill-opacity="'+(pressed?'.78':'1')+'" stroke="'+(pressed?'#30383e':'#4f5961')+'" stroke-width="'+(pressed?'2.2':'1.5')+'"/>'
      +'<text x="'+cx+'" y="'+(cy+3)+'" text-anchor="middle" font-size="8" font-weight="900" fill="'+(textColor||'#fff')+'" opacity="'+(pressed?'.88':'1')+'" font-family="Segoe UI,Arial">'+label+'</text></g>';
  }
  // Все органы управления в один ряд: при высоте 82 мм второй ряд не помещается.
  s+=button(38,162,15.5,o.tpOn?'#2ba967':'#7d868e','СЕТЬ','mains','#fff',!!o.tpOn);
  s+=button(w-62,162,13.5,'#d8dde1','▲','up','#35404a',o.tpPressed==='up');
  s+=button(w-24,162,13.5,'#d8dde1','▼','down','#35404a',o.tpPressed==='down');
  s+='<text x="'+(w/2)+'" y="190" text-anchor="middle" font-size="7" font-weight="700" fill="#c4cbd1" font-family="Segoe UI,Arial">3×380 В · якорь 0…'+Math.round(tpMaxArmatureVoltage(o))+' В</text>';
  s+='<rect x="3" y="'+(h-50)+'" width="'+(w-6)+'" height="47" rx="6" fill="#4a525a" stroke="#747e87"/>';
  ['Я+','Я−','Ш+','Ш−','PE'].forEach(function(label,index){
    const cx=botX[index];
    s+='<text x="'+cx+'" y="'+(h-35)+'" text-anchor="middle" font-size="7" font-weight="700" fill="'+(label==='PE'?'#e8d800':'#eef2f5')+'" font-family="Segoe UI,Arial">'+label+'</text>'+screw(cx,h-18,10);
  });
  return s;
}

/* Открытая коробка: четыре кабельных ввода и четыре отдельные шины. */
function junctionTerms(){
  const w=TYPES.junction.modules*MODULE,h=TYPES.junction.h,out=[];
  const rows=[['top',[.35,.5,.65].map(function(p){return {x:w*p,y:38};})],
    ['right',[.35,.5,.65].map(function(p){return {x:w-38,y:h*p};})],
    ['bottom',[.35,.5,.65].map(function(p){return {x:w*p,y:h-38};})],
    ['left',[.35,.5,.65].map(function(p){return {x:38,y:h*p};})]];
  rows.forEach(function(row,side){row[1].forEach(function(p,i){
    const number=side*3+i+1;
    out.push({key:row[0]+i,label:String(number)+' · колодка '+(side+1),dx:p.x,dy:p.y,color:WC.C,hitR:10,side:row[0],number:number});
  });});
  return out;
}
function junctionInner(o){
  const w=TYPES.junction.modules*MODULE,h=TYPES.junction.h;
  let s='';
  // Ступенчатые серые вводы остаются в пределах габаритов объекта.
  function entry(x,y,angle){
    return '<g transform="translate('+x+','+y+') rotate('+angle+')">'
      +'<rect x="-17" y="-14" width="34" height="14" rx="4" fill="#c5cbd0" stroke="#929aa2"/>'
      +'<rect x="-14" y="-16" width="28" height="4" rx="2" fill="#dde1e4" stroke="#a5adb4"/>'
      +'<path d="M -15 -9 H 15 M -15 -5 H 15" stroke="#a5adb4" stroke-width="1"/></g>';
  }
  s+=entry(w/2,17,0)+entry(w-17,h/2,90)+entry(w/2,h-17,180)+entry(17,h/2,-90);
  s+='<rect x="14" y="14" width="'+(w-28)+'" height="'+(h-28)+'" rx="16" fill="#eceff1" stroke="#979fa7" stroke-width="2"/>';
  s+='<rect x="19" y="19" width="'+(w-38)+'" height="'+(h-38)+'" rx="12" fill="#cbd1d5" stroke="#ffffff" stroke-width="2"/>';
  s+='<rect x="24" y="24" width="'+(w-48)+'" height="'+(h-48)+'" rx="9" fill="#e1e5e7" stroke="#aab2b9"/>';
  [[30,30],[w-30,30],[30,h-30],[w-30,h-30]].forEach(function(p){
    s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#f1f3f4" stroke="#a5adb4" stroke-width="1.5"/>';
  });
  function strip(x,y,width,height,vertical){
    let q='<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" rx="4" fill="#c5cbd0" stroke="#989fa7" stroke-width="1.3"/>';
    q+='<rect x="'+(x+3)+'" y="'+(y+3)+'" width="'+(width-6)+'" height="'+(height-6)+'" rx="3" fill="#d9b64b" stroke="#abb2b9"/>';
    if(vertical)q+='<rect x="'+(x+width/2-4)+'" y="'+(y+6)+'" width="8" height="'+(height-12)+'" rx="2" fill="#b48a26"/>';
    else q+='<rect x="'+(x+6)+'" y="'+(y+height/2-4)+'" width="'+(width-12)+'" height="8" rx="2" fill="#b48a26"/>';
    return q;
  }
  s+=strip(w*.275,25,w*.45,26,false)+strip(w*.275,h-51,w*.45,26,false);
  s+=strip(25,h*.275,26,h*.45,true)+strip(w-51,h*.275,26,h*.45,true);
  junctionTerms().forEach(function(t){
    s+=screw(t.dx,t.dy,8.5);
    let x=t.dx,y=t.dy,anchor='middle';
    // Номера сбоку от оси ввода читаются при подключении с любой стороны.
    if(t.side==='top'){x+=8;y+=22;anchor='start';}
    if(t.side==='bottom'){x+=8;y-=16;anchor='start';}
    if(t.side==='left'){x+=19;y-=8;anchor='start';}
    if(t.side==='right'){x-=19;y-=8;anchor='end';}
    s+='<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-size="7" fill="#596168" font-family="Segoe UI,Arial">'+t.number+'</text>';
  });
  s+='<text x="'+(w/2)+'" y="'+(h/2+4)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#596168" font-family="Segoe UI,Arial">'+escapeHtml(o.tag||'XR')+'</text>';
  s+='<circle cx="'+(w/2)+'" cy="'+(h/2+26)+'" r="9" fill="none" stroke="#c3cbd1" stroke-width="2"/>';
  return s;
}
/* Гребёнка PIN: у 3P три изолированные шины L1/L2/L3, у 1P одна общая шина. */
const combTraySettings={combPoles:1,combCount:3};
const COMB_INSERT_OFFSET=30;
function combPoles(o){const n=Number(o&&o.combPoles);return n===2||n===3?n:1;}
function combCount(o){return Math.max(1,Math.min(Math.floor(SLOTS/combPoles(o)),Math.round(Number(o&&o.combCount)||3)));}
function combWidth(o){return combCount(o)*combPoles(o)*MODULE;}
function combOrigin(o){
  const anchor=devById(o.combAnchorId);
  if(anchor&&anchor.type===('mcb'+combPoles(o))){const p=originOf(anchor);return {x:p.x,y:p.y-COMB_INSERT_OFFSET};}
  return {x:Number(o.x)||0,y:Number(o.y)||0};
}
function combMembers(o){
  const anchor=devById(o.combAnchorId),poles=combPoles(o),type='mcb'+poles;
  if(!anchor||anchor.type!==type)return [];
  const p=combOrigin(o);
  return Array.from({length:combCount(o)},function(_,i){
    return state.devices.find(function(d){if(d.type!==type)return false;const q=originOf(d);return Math.abs(q.x-p.x-i*poles*MODULE)<1&&Math.abs(q.y-p.y-COMB_INSERT_OFFSET)<1;})||null;
  });
}
function combPlacement(left,top,o){
  o=o||{};let best=null,distance=Infinity;
  state.devices.forEach(function(d){
    if(d.type!==('mcb'+combPoles(o)))return;
    const p=originOf(d),dx=Math.abs(left-p.x),dy=Math.abs(top-(p.y-COMB_INSERT_OFFSET));
    if(dx>MODULE*.5||dy>30||dx+dy>=distance)return;
    const draft=Object.assign({},o,{combAnchorId:d.id,x:p.x,y:p.y-COMB_INSERT_OFFSET});
    const members=combMembers(draft);
    if(members.some(function(m){return !m;}))return;
    const occupied=state.devices.some(function(other){return other.type==='comb'&&other.id!==o.id&&combMembers(other).some(function(m){return m&&members.includes(m);});});
    if(occupied)return;
    best={free:true,comb:true,combAnchorId:d.id,x:p.x,y:p.y-COMB_INSERT_OFFSET,ok:true};distance=dx+dy;
  });
  return best;
}
function newCombPlacement(left,top){
  let best=null,distance=Infinity;
  for(const poles of [1,2,3])for(let count=3;count>=1;count--){
    const c=combPlacement(left,top,{combPoles:poles,combCount:count});if(!c)continue;
    const d=Math.abs(left-c.x)+Math.abs(top-c.y);
    if(d<distance){best=Object.assign({},c,{combPoles:poles,combCount:count});distance=d;}
  }
  return best;
}
function combInner(o){
  const w=combWidth(o),poles=combPoles(o),teeth=combCount(o)*poles;
  let s='<g class="comb-body"><title>Гребёнка PIN '+poles+'P на '+combCount(o)+' автоматов</title>';
  for(let i=0;i<teeth;i++){
    const x=(i+.5)*MODULE;
    s+='<path d="M'+(x-3)+' 18 V46 L'+(x-1)+' 48 H'+(x+1)+' L'+(x+3)+' 46 V18 Z" fill="#c28b4b" stroke="#8c6030" stroke-width=".8"/>';
    s+='<path d="M'+(x-1)+' 24 V44" stroke="#ebbf79" stroke-width="1"/>';
  }
  s+='<rect x="1" y="1" width="'+(w-2)+'" height="21" rx="2" fill="#e4e8eb" stroke="#939da6" stroke-width="1.2"/>';
  s+='<path d="M4 4 H'+(w-4)+'" stroke="#ffffff" stroke-width="1"/>';
  s+='<path d="M4 19 H'+(w-4)+'" stroke="#d7b444" stroke-width="2"/>';
  s+='<text x="'+(w/2)+'" y="12" text-anchor="middle" font-size="'+(w<MODULE*2?7:8)+'" font-weight="700" fill="#626c74" font-family="Segoe UI,Arial">PIN · '+poles+'P · '+combCount(o)+'</text>';
  return s+'</g>';
}
function deviceInner(type, o){
  o = o || {};
  const kind = TYPES[type].kind;
  if (TYPES[type].crossModule) return crossModuleInner(type,o);
  if (kind === 'comb') return combInner(o);
  if (kind === 'mcb') return mcbInner(type, o);
  if (kind === 'rcd') return rcdInner(o);
  if (kind === 'meter') return meterInner(o);
  if (kind === 'sensor') return sensorInner(o);
  if (kind === 'lamp') return lampInner(o);
  if (kind === 'bulb') return bulbInner(o);
  if (kind === 'outlet') return outletInner(o);
  if (kind === 'junction') return junctionInner(o);
  if (kind === 'wallSwitch') return wallSwitchInner(o);
  if (kind === 'twoWaySwitch') return twoWaySwitchInner(o);
  if (kind === 'appliance') return applianceInner(type,o);
  if (kind === 'vfd') return vfdInner(o);
  if (kind === 'converter') return tpInner(o);
  if (kind === 'timer') return timerInner(o);
  if (kind === 'contactor') return kmInner(o);
  if (kind === 'relay') return relayInner(o);
  return terminalInner(type, o);
}

/* ============================================================
   Трёхфазный асинхронный двигатель М1 — вид сбоку
   ============================================================ */
const MOTOR = {x:463,y:875,w:313,h:351,scale:1.5,load:0,rpmActual:0,angle:0,polePairs:2,ratedSlipPercent:10,ratedFrequency:50};
const MOTOR_TERMS = [
  { key:'U1', label:'U1', dx:84,  dy:4,  color:WC.L1 },
  { key:'V1', label:'V1', dx:116, dy:4,  color:WC.L2 },
  { key:'W1', label:'W1', dx:148, dy:4,  color:WC.L3 },
  { key:'W2', label:'W2', dx:84,  dy:28, color:WC.L3 },
  { key:'U2', label:'U2', dx:116, dy:28, color:WC.L1 },
  { key:'V2', label:'V2', dx:148, dy:28, color:WC.L2 },
  { key:'PE', label:'PE', dx:208, dy:206, color:WC.PE, caseGround:true }
];
const AC_WINDING_PAIRS=[['U1','U2'],['V1','V2'],['W1','W2']];
/* nс = 60·f/p — скорость вращения магнитного поля;
   n = nс·(1-s) — скорость ротора асинхронного двигателя. */
function motorSpeedByFormula(motor,frequency,load){
  motor=motor||MOTOR;
  const f=Math.max(0,Number(frequency)||0);
  const p=Math.max(1,Math.round(Number(motor.polePairs)||2));
  const loadPercent=Math.max(0,Math.min(100,Number(load)||0));
  const configuredSlip=Number(motor.ratedSlipPercent);
  const baseSlip=Math.max(0,Math.min(.95,(isFinite(configuredSlip)?configuredSlip:10)/100));
  // Паспортное скольжение относится к номинальной нагрузке (100 %).
  // На холостом ходу остаётся малая составляющая механических потерь.
  const slip=baseSlip*(.1+.9*loadPercent/100);
  const synchronousRpm=60*f/p;
  const rpm=Math.max(0,Math.round(synchronousRpm*(1-slip)));
  return {polePairs:p,frequencyHz:f,synchronousRpm:synchronousRpm,slip:slip,slipPercent:slip*100,rpm:rpm};
}
function motorOperatingPoint(motor,direction){
  motor=motor||MOTOR;
  const load = Math.max(0, Math.min(100, Number(motor.load) || 0));
  const map=potentialMap(),phaseCurrents=acMotorWindingBranches(map.pot,motor).map(function(e){return branchCurrent(e,map.pot);});
  const current=Math.max.apply(null,phaseCurrents.map(function(v){return Math.hypot(v.r,v.i);}).concat([0]));
  const supplyFrequency=direction?motorSupplyFrequency(motor,map):0;
  if (!direction||supplyFrequency<=0) return {load:load,rpm:0,current:current,phaseCurrents:phaseCurrents,frequencyHz:0,synchronousRpm:0,slipPercent:0,visualDur:1};
  const speed=motorSpeedByFormula(motor,supplyFrequency,load);
  return {load:load,rpm:speed.rpm,current:current,phaseCurrents:phaseCurrents,frequencyHz:supplyFrequency,
    synchronousRpm:speed.synchronousRpm,slipPercent:speed.slipPercent,polePairs:speed.polePairs,
    visualDur:Math.max(0.12,240/Math.max(1,speed.rpm))};
}
function motorVisualOperating(motor,electricalDirection){
  motor=motor||MOTOR;
  const target=motorOperatingPoint(motor,electricalDirection);
  const rpm=Math.max(0,Math.round(Math.abs(motor.rpmActual||0)));
  return {load:target.load,rpm:rpm,current:target.current,frequencyHz:target.frequencyHz,
          synchronousRpm:target.synchronousRpm,slipPercent:target.slipPercent,polePairs:target.polePairs,
          visualDur:Math.max(0.12,240/Math.max(1,rpm))};
}
function motorIsDc(motor){ return !!motor && motor.kind === 'dc'; }

/* ---------- машина постоянного тока независимого возбуждения ----------
   E = c·Φ·ω, Iя = (Uя − E)/Rя, M = c·Φ·Iя, J·dω/dt = M − Mс.
   Постоянная машины c·Φ и номинальный момент выводятся из паспортных данных:
   при номинальных напряжении якоря, потоке и нагрузке машина даёт номинальные
   обороты, ток и момент. Никаких повреждений на этом этапе не моделируется. */
function dcMotorData(motor){
  motor=motor||{};
  const Ua=DCM.ratedArmatureVoltage;
  const Ia=Math.max(.1,Number(motor.ratedArmatureCurrent)||DCM.ratedArmatureCurrent);
  const Uf=DCM.ratedFieldVoltage;
  const Ra=Math.max(.01,Number(motor.armatureResistance)||DCM.armatureResistance);
  const Rf=Math.max(1,Number(motor.fieldResistance)||DCM.fieldResistance);
  const nNom=Math.max(1,Number(motor.ratedSpeed)||DCM.ratedSpeed);
  const omegaNom=nNom*Math.PI/30;
  const emfNom=Math.max(1,Ua-Ia*Ra);
  const cPhi=emfNom/omegaNom;
  const torqueNom=cPhi*Ia;
  const accelTime=Math.max(.05,Number(motor.inertiaFactor)||DCM.inertiaFactor);
  const inertia=Math.max(1e-4,torqueNom*accelTime/omegaNom);
  return {Ua:Ua,Ia:Ia,Uf:Uf,Ra:Ra,Rf:Rf,nNom:nNom,omegaNom:omegaNom,
          emfNom:emfNom,cPhi:cPhi,torqueNom:torqueNom,inertia:inertia};
}
/* Карта потенциалов принимается и целиком, и как таблица pot: так функцию
   нельзя вызвать с «почти правильным» аргументом и получить молчаливый ноль. */
function dcPotentialTable(map){
  if(!map)return potentialMap().pot;
  return map.pot?map.pot:map;
}
/* Напряжение между двумя зажимами машины. Для постоянного тока это разность
   действительных частей; если на зажимы попало переменное напряжение, оно
   возвращается по модулю с признаком dc:false — режим работы машины неверный. */
function dcTerminalVoltage(motor,plusKey,minusKey,map){
  const pot=dcPotentialTable(map);
  const a=pot[nodeKey({devId:motor.id,key:plusKey})];
  const b=pot[nodeKey({devId:motor.id,key:minusKey})];
  if(!a||!b)return {volts:0,dc:true,present:false};
  const ac=(!a.dc&&Number(a.frequencyHz)>0)||(!b.dc&&Number(b.frequencyHz)>0);
  if(ac)return {volts:Math.hypot(a.r-b.r,a.i-b.i),dc:false,present:true};
  return {volts:a.r-b.r,dc:true,present:true};
}
function dcMotorOperatingPoint(motor,map){
  motor=motor||{};
  const pot=dcPotentialTable(map);
  const d=dcMotorData(motor);
  const armature=dcTerminalVoltage(motor,'ya1','ya2',pot);
  const field=dcTerminalVoltage(motor,'sh1','sh2',pot);
  const load=Math.max(0,Math.min(100,Number(motor.load)||0));
  const fieldVolts=field.dc?field.volts:Math.abs(field.volts);
  const flux=fieldVolts/d.Uf;
  const omega=(Number(motor.rpmActual)||0)*Math.PI/30;
  const cPhiFlux=d.cPhi*flux;
  const emf=cPhiFlux*omega;
  const armatureCurrent=armature.present&&armature.dc?(armature.volts-emf)/d.Ra:0;
  const torque=cPhiFlux*armatureCurrent;
  const loadTorque=d.torqueNom*(load/100);
  return {data:d,load:load,
    armatureVoltage:armature.volts,armatureDc:armature.dc,armaturePresent:armature.present,
    armatureCurrent:armatureCurrent,emf:emf,cPhiFlux:cPhiFlux,
    fieldVoltage:field.volts,fieldDc:field.dc,fieldCurrent:fieldVolts/d.Rf,
    flux:flux,torque:torque,loadTorque:loadTorque,
    rpm:Math.round(Math.abs(omega)*30/Math.PI),
    direction:Math.abs(omega)>.5?(omega>0?1:-1):0,
    supplied:armature.present&&Math.abs(armature.volts)>1,
    acSupply:!armature.dc||!field.dc};
}
/* Один шаг механики: явный Эйлер с подшагами. Чаг подшага много меньше
   механической постоянной J·Rя/(c·Φ)², поэтому интегрирование устойчиво. */
function dcMotorInertiaStep(motor,dt){
  const d=dcMotorData(motor);
  const point=dcMotorOperatingPoint(motor);
  let omega=(Number(motor.rpmActual)||0)*Math.PI/30;
  const steps=10,h=Math.max(0,dt)/steps;
  for(let i=0;i<steps;i++){
    const emf=point.cPhiFlux*omega;
    const armatureCurrent=point.armaturePresent&&point.armatureDc?(point.armatureVoltage-emf)/d.Ra:0;
    const torque=point.cPhiFlux*armatureCurrent;
    const resisting=point.loadTorque*Math.tanh(omega/4);
    omega+=(torque-resisting)/d.inertia*h;
  }
  // Страховка прототипа: без ослабления потока разнос недостижим, но
  // ограничение не даёт численно «взорваться» при неверном монтаже.
  const limit=3*d.omegaNom;
  if(Math.abs(omega)>limit)omega=Math.sign(omega)*limit;
  motor.rpmActual=omega*30/Math.PI;
}
function newDcMotor(id,x,y){
  return {id:id,tag:id,kind:'dc',x:x,y:y,w:MOTOR.w,h:MOTOR.h,scale:MOTOR.scale,
    load:0,rpmActual:0,angle:0,
    ratedArmatureVoltage:DCM.ratedArmatureVoltage,ratedFieldVoltage:DCM.ratedFieldVoltage,
    ratedArmatureCurrent:DCM.ratedArmatureCurrent,ratedSpeed:DCM.ratedSpeed,
    armatureResistance:DCM.armatureResistance,fieldResistance:DCM.fieldResistance,
    ratedPower:DCM.ratedPower,inertiaFactor:DCM.inertiaFactor};
}
function motorInner(direction, operating, motor){
  motor=motor||MOTOR;
  const running = direction !== 0;
  operating = operating || motorOperatingPoint(motor,direction);
  let s = '';
  // Корпус увеличен вдвое вокруг верхней центральной точки; внешний масштаб увеличивает весь двигатель вместе с клеммной коробкой.
  s += '<g transform="translate(116 46) scale(2) translate(-116 -46)">';
  // Корпус и лапы двигателя при взгляде спереди.
  s += '<path d="M72 126 L83 135 L78 144 L58 144 L62 134 Z M160 126 L171 134 L174 144 L154 144 L149 135 Z" fill="#2266a8" stroke="#123c66" stroke-width="1.5"/>';
  s += '<rect x="55" y="142" width="122" height="7" rx="2" fill="#1b5490" stroke="#123c66"/>';
  s += '<circle cx="66" cy="145" r="2.4" fill="#0e3358"/><circle cx="166" cy="145" r="2.4" fill="#0e3358"/>';
  // Круглый торцевой щит и неподвижные рёбра корпуса.
  s += '<circle cx="116" cy="99" r="53" fill="#1f5fa8" stroke="#123c66" stroke-width="2"/>';
  s += '<circle cx="116" cy="99" r="46" fill="#2a6fbf" stroke="#69a6e0" stroke-width="2"/>';
  s += '<circle cx="116" cy="99" r="39" fill="#2868ad" stroke="#123c66" stroke-width="2"/>';
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6, x1=116+29*Math.cos(a), y1=99+29*Math.sin(a), x2=116+36*Math.cos(a), y2=99+36*Math.sin(a);
    s += '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="#174c83" stroke-width="2.2" stroke-linecap="round"/>';
  }
  // Крышка подшипника и торец вала: шпонка и центральный кружок вращаются вместе с валом.
  s += '<circle cx="116" cy="99" r="22" fill="#184d83" stroke="#b7d2eb" stroke-width="2"/>';
  // Вал, шпонка и центральная точка остаются одной неизменной деталью.
  s += '<g class="motor-rotor" transform="rotate('+(motor.angle||0).toFixed(3)+' 116 99)">';
  s += '<circle cx="116" cy="99" r="15" fill="#c4cbd1" stroke="#707983" stroke-width="1.5"/>';
  s += '<rect x="112" y="84" width="8" height="7" rx="1.5" fill="#747d86" stroke="#525b64" stroke-width="1"/>';
  s += '<circle cx="116" cy="99" r="4" fill="#7b848d" stroke="#e7eaed" stroke-width="1.2"/>';
  s += '</g>';
  s += '</g>';
  // PE-винт отрисовывается тем же компонентом и в том же масштабе, что винты клеммной коробки.
  s += contactHole(208,206,6);
  s += '<text x="208" y="226" text-anchor="middle" font-size="9" font-weight="800" fill="#e8d800" stroke="#176b2c" stroke-width=".3" font-family="Segoe UI,Arial">PE</text>';
  // Клеммная коробка сверху корпуса с перемычкой звезды.
  s += '<rect x="61" y="-8" width="110" height="60" rx="6" fill="#2a6fbf" stroke="#123c66" stroke-width="1.5"/>';
  s += '<rect x="65" y="-4" width="102" height="52" rx="4" fill="#2a6fbf" stroke="#1b5490"/>';
  s += '<circle cx="69" cy="1" r="2.6" fill="#c8ccd0" stroke="#8d9299"/><circle cx="163" cy="1" r="2.6" fill="#c8ccd0" stroke="#8d9299"/>';
  s += '<circle cx="69" cy="43" r="2.6" fill="#c8ccd0" stroke="#8d9299"/><circle cx="163" cy="43" r="2.6" fill="#c8ccd0" stroke="#8d9299"/>';
  s += '<rect class="motor-star-bridge" x="78" y="23" width="76" height="10" rx="5" fill="#d4af37" stroke="#8d6f14" stroke-width="1.2"/>';
  s += '<path d="M84 25 H148" stroke="#f4d978" stroke-width="1.5" pointer-events="none"/>';
  MOTOR_TERMS.filter(function(t){ return !t.caseGround; }).forEach(function(t){
    s += contactHole(t.dx,t.dy,6);
    const labelY = t.dy > 15 ? 45 : t.dy + 15;
    s += '<text x="'+t.dx+'" y="'+labelY+'" text-anchor="middle" font-size="6.5" fill="#eaf3ff" font-family="Segoe UI,Arial">'+t.label+'</text>';
  });
  return s;
}

/* ============================================================
   Машина постоянного тока независимого возбуждения (ДПТ НВ)
   Корпус тот же, что у асинхронного двигателя, но выкрашен в зелёный,
   чтобы машины нельзя было спутать. На валу виден коллектор со щётками,
   а в клеммной коробке вместо перемычки звезды — четыре зажима:
   якорь Я1–Я2 и обмотка возбуждения Ш1–Ш2.
   ============================================================ */
function dcMotorInner(direction, operating, motor){
  motor=motor||{};
  const C=DC_GREEN;
  let s = '';
  s += '<g transform="translate(116 46) scale(2) translate(-116 -46)">';
  s += '<path d="M72 126 L83 135 L78 144 L58 144 L62 134 Z M160 126 L171 134 L174 144 L154 144 L149 135 Z" fill="'+C.feet+'" stroke="'+C.edge+'" stroke-width="1.5"/>';
  s += '<rect x="55" y="142" width="122" height="7" rx="2" fill="'+C.base+'" stroke="'+C.edge+'"/>';
  s += '<circle cx="66" cy="145" r="2.4" fill="'+C.bolt+'"/><circle cx="166" cy="145" r="2.4" fill="'+C.bolt+'"/>';
  s += '<circle cx="116" cy="99" r="53" fill="'+C.bodyOuter+'" stroke="'+C.edge+'" stroke-width="2"/>';
  s += '<circle cx="116" cy="99" r="46" fill="'+C.bodyMid+'" stroke="'+C.bodyMidStroke+'" stroke-width="2"/>';
  s += '<circle cx="116" cy="99" r="39" fill="'+C.bodyInner+'" stroke="'+C.edge+'" stroke-width="2"/>';
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6, x1=116+29*Math.cos(a), y1=99+29*Math.sin(a), x2=116+36*Math.cos(a), y2=99+36*Math.sin(a);
    s += '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="'+C.rib+'" stroke-width="2.2" stroke-linecap="round"/>';
  }
  // Коллектор на валу и неподвижные щётки над ним.
  s += '<circle cx="116" cy="99" r="23" fill="'+C.cover+'" stroke="'+C.coverStroke+'" stroke-width="2"/>';
  s += '<circle cx="116" cy="99" r="19" fill="none" stroke="#b8794a" stroke-width="4"/>';
  s += '<rect x="86" y="93" width="11" height="13" rx="2" fill="#2b3138" stroke="#5d666f"/>';
  s += '<rect x="135" y="93" width="11" height="13" rx="2" fill="#2b3138" stroke="#5d666f"/>';
  s += '<g class="motor-rotor" transform="rotate('+(motor.angle||0).toFixed(3)+' 116 99)">';
  s += '<circle cx="116" cy="99" r="15" fill="#c4cbd1" stroke="#707983" stroke-width="1.5"/>';
  s += '<rect x="112" y="84" width="8" height="7" rx="1.5" fill="#747d86" stroke="#525b64" stroke-width="1"/>';
  s += '<circle cx="116" cy="99" r="4" fill="#7b848d" stroke="#e7eaed" stroke-width="1.2"/>';
  s += '</g>';
  s += '</g>';
  s += contactHole(208,206,6);
  s += '<text x="208" y="226" text-anchor="middle" font-size="9" font-weight="800" fill="#e8d800" stroke="#176b2c" stroke-width=".3" font-family="Segoe UI,Arial">PE</text>';
  // Клеммная коробка: якорь в верхнем ряду, обмотка возбуждения — в нижнем.
  // Разделитель только вертикальный: горизонтальный перечёркивал бы подписи.
  s += '<rect x="61" y="-8" width="110" height="60" rx="6" fill="'+C.box+'" stroke="'+C.edge+'" stroke-width="1.5"/>';
  s += '<rect x="65" y="-4" width="102" height="52" rx="4" fill="'+C.boxInner+'" stroke="'+C.boxLine+'"/>';
  s += '<line x1="116" y1="-4" x2="116" y2="48" stroke="'+C.boxLine+'" stroke-width="1.4"/>';
  DC_MOTOR_TERMS.filter(function(t){ return !t.caseGround; }).forEach(function(t){
    s += contactHole(t.dx,t.dy,6);
    // Отступ такой же, как у асинхронного двигателя: иначе подпись верхнего
    // ряда уходит под шляпку винта.
    const labelY = t.dy > 15 ? 45 : t.dy + 15;
    s += '<text x="'+t.dx+'" y="'+labelY+'" text-anchor="middle" font-size="6.5" fill="'+C.termLabel+'" font-family="Segoe UI,Arial">'+t.label+'</text>';
  });
  return s;
}

/* ============================================================
   4. СЛОИ СЦЕНЫ
   ============================================================ */
const scene       = document.getElementById('scene');
const railLayer   = document.getElementById('railLayer');
const guideLayer  = document.getElementById('guideLayer');
const motorLayer  = document.getElementById('motorLayer');
const motorInstrumentsToggle=document.getElementById('motorInstrumentsToggle');
const motorInstrumentsModal=document.getElementById('motorInstrumentsModal');
const motorInstrumentsClose=document.getElementById('motorInstrumentsClose');
const motorInstrumentTabs=document.getElementById('motorInstrumentTabs');
const motorInstrumentBody=document.getElementById('motorInstrumentBody');
let motorInstrumentReaderId=null;
const boxLayer    = document.getElementById('boxLayer');
const relayLayer  = document.getElementById('relayLayer');
const deviceLayer = document.getElementById('deviceLayer');
const mmLayer     = document.getElementById('mmLayer');

// Равные отступы от верхней и нижней грани до осей крайних реек.
const PANEL={width:SLOTS*MODULE+64,firstRail:360,pitch:400,baseHeight:720,inboxX:26,inboxY:36};
function panelRailCount(panel){return Math.max(1,Math.min(5,Math.round(Number(panel.railCount)||2)));}
function panelIsFixed(panel){return panel.fixed!==false;}
function panelHeight(panel){return PANEL.baseHeight+(panelRailCount(panel)-1)*PANEL.pitch;}
function panelById(id){return state.panels.find(function(p){return p.id===id;})||null;}
function inboxPanel(){return state.panels.find(function(p){return p.inbox;})||null;}
function panelInletVoltage(panel){return Number(panel&&panel.inletVoltage)===220?220:380;}
function inboxSinglePhase(){const panel=inboxPanel();return !!panel&&panelInletVoltage(panel)===220;}
function inboxWidth(){return inboxSinglePhase()?180:INBOX.w;}
function inboxTerms(){return inboxSinglePhase()?INBOX_SINGLE_TERMS:INBOX_TERMS;}
function pruneInboxConnections(){
  const keys=inboxTerms().map(function(t){return t.key;});
  function missing(t){return t&&String(t.devId)==='IN'&&!keys.includes(t.key);}
  state.wires=state.wires.filter(function(w){return !missing(w.a)&&!missing(w.b);});
  ['a','b'].forEach(function(key){if(missing(state.mm[key]))state.mm[key]=null;});
  state.clamps.forEach(function(c){if(!state.wires.some(function(w){return w.id===c.wireId;}))c.wireId=null;});
  if(pending&&missing(pending.from))cancelWire();
}
function setPanelInlet(panel,value){
  const voltage=Number(value)===220?220:380;
  if(panel.inbox&&voltage===220){
    // Снятые щупы остаются на прежнем месте после исчезновения L2 и L3.
    ['a','b'].forEach(function(key){
      const sel=state.mm[key];if(!sel||String(sel.devId)!=='IN'||!['L2','L3'].includes(sel.key))return;
      const p=terminal(sel.devId,sel.key);
      if(p){if(key==='a'){METER.redX=p.x;METER.redY=p.y;}else{METER.blackX=p.x;METER.blackY=p.y;}}
    });
  }
  panel.inletVoltage=voltage;
  if(panel.inbox){
    state.specialProps.inbox.ratedVoltage=voltage;
    state.specialProps.inbox.customName=voltage===220?'Ввод 220 В':'Ввод 3×380 В';
    pruneInboxConnections();
  }
}
function syncPanelInbox(){
  const panel=inboxPanel();if(!panel)return;
  INBOX.x=panel.x+PANEL.inboxX;INBOX.y=panel.y+PANEL.inboxY;
}
function mountingRails(){
  const rails=state.standaloneRails!==false?RAILS.map(function(y,i){return {id:i,x:RAIL_X0,y:y,slots:SLOTS};}):[];
  state.panels.forEach(function(p){for(let row=0;row<panelRailCount(p);row++)rails.push({id:p.id+':'+row,x:p.x+32,y:p.y+PANEL.firstRail+row*PANEL.pitch,slots:SLOTS,panelId:p.id,row:row});});
  return rails;
}
function mountingRail(id){return mountingRails().find(function(r){return r.id===id;})||null;}
function mountingRailTitle(id){
  const rail=mountingRail(id);
  return rail&&rail.panelId?(panelById(rail.panelId).tag+' · рейка '+(rail.row+1)):String(Number(id)+1);
}
/* Проверяем реальные габариты DIN-аппаратов, включая колодку катушки и тепловое реле. */
function dinPlacementFits(type,rail,slot,exceptId,withRelay){
  const mounting=mountingRail(rail),t=TYPES[type];
  if(!mounting||!t)return false;
  function boxes(dev,x,y,relayAttached){
    const spec=TYPES[dev.type],w=spec.modules*MODULE;
    const result=[{x:x,y:y,w:w+(spec.overR||0),h:spec.h}];
    if(dev.type==='km1'&&relayAttached){
      result.push({x:x,y:y+spec.h-RELAY_DROP-PIN_TOP,w:w,h:TYPES.kk1.h+PIN_TOP});
    }
    return result;
  }
  const candidate=boxes({type:type},mounting.x+slot*MODULE,mounting.y-t.h/2,withRelay);
  return !state.devices.some(function(dev){
    if(dev.id===exceptId||!TYPES[dev.type]||TYPES[dev.type].freeOnly||TYPES[dev.type].kind==='relay')return false;
    const o=originOf(dev);if(!o)return false;
    const other=boxes(dev,o.x,o.y,!!relayFor(dev.id));
    return candidate.some(function(a){return other.some(function(b){
      return a.x<b.x+b.w-1e-6&&b.x<a.x+a.w-1e-6&&a.y<b.y+b.h-1e-6&&b.y<a.y+a.h-1e-6;
    });});
  });
}

function railPlacement(left,centerY,modules,exceptId,type,withRelay){
  let chosen=null,best=Infinity;
  mountingRails().forEach(function(r){
    if(left+modules*MODULE<r.x-30||left>r.x+r.slots*MODULE+30)return;
    const gap=Math.abs(centerY-r.y);
    if(gap<best||(gap===best&&r.panelId)){best=gap;chosen=r;}
  });
  if(!chosen||best>150)return null;
  const slot=Math.max(0,Math.min(chosen.slots-modules,Math.round((left-chosen.x)/MODULE)));
  return {rail:chosen.id,slot:slot,ok:isFree(chosen.id,slot,modules,exceptId)&&dinPlacementFits(type,chosen.id,slot,exceptId,withRelay)};
}
function panelInner(panel){
  const w=PANEL.width,h=panelHeight(panel);
  let s='<rect x="1" y="1" width="'+(w-2)+'" height="'+(h-2)+'" rx="13" fill="#c6ccd1" stroke="#8f979f" stroke-width="3"/>';
  s+='<rect x="8" y="8" width="'+(w-16)+'" height="'+(h-16)+'" rx="9" fill="none" stroke="#edf0f2" stroke-width="3"/>';
  s+='<rect x="23" y="23" width="'+(w-46)+'" height="'+(h-46)+'" rx="6" fill="#dce1e5" stroke="#949ca4" stroke-width="2"/>';
  s+='<rect x="34" y="34" width="'+(w-68)+'" height="'+(h-68)+'" rx="4" fill="#e4e8eb" stroke="#bcc4ca"/>';
  [[16,16],[w-16,16],[16,h-16],[w-16,h-16]].forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#dfe3e6" stroke="#9ca4ab"/>';});
  for(let i=0;i<5;i++)s+='<ellipse cx="'+(w/2+(i-2)*44)+'" cy="'+(h-15)+'" rx="13" ry="5" fill="#b3bbc2" stroke="#919aa2"/>';
  s+='<text x="'+(w/2)+'" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="#5b646c" font-family="Segoe UI,Arial">'+escapeHtml(panel.tag||'ЩР')+'</text>';
  return s;
}
function normalizeWorkbench(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  function number(key,fallback,min,max){
    const n=Number(value[key]);return isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
  }
  return {x:number('x',60,0,WORKSPACE_W),y:number('y',1350,0,WORKSPACE_H),
    width:number('width',1900,800,WORKSPACE_W*2),height:number('height',520,320,800),
    panelId:typeof value.panelId==='string'?value.panelId:'PN1',
    motorId:typeof value.motorId==='string'?value.motorId:'M1',
    ...(typeof value.dcMotorId==='string'?{dcMotorId:value.dcMotorId}:{})};
}
function workbenchMotors(b){
  return b?[b.motorId,b.dcMotorId].filter(function(id,index,ids){return id&&ids.indexOf(id)===index;})
    .map(motorById).filter(Boolean):[];
}
/* Окружение учебного стенда. Гофра является оболочкой, а не электрическим соединением. */
let workbenchVisualKey='';
function workshopBackdrop(b){
  const floor=b.y+b.height-96,feet=b.y+b.height;
  // Фон выходит за рабочее поле, закрывая боковые поля SVG при любом формате экрана.
  const roomLeft=-100000,roomWidth=200000,roomBottom=100000;
  let s='<g class="workshop-room" pointer-events="none">';
  s+='<rect x="'+roomLeft+'" y="-100000" width="'+roomWidth+'" height="'+(floor+100000)+'" fill="#e7ebee"/>';
  s+='<rect x="'+roomLeft+'" y="'+floor+'" width="'+roomWidth+'" height="'+(roomBottom-floor)+'" fill="#d5dde3"/>';
  s+='<rect x="'+roomLeft+'" y="'+(floor-14)+'" width="'+roomWidth+'" height="14" fill="#cbd4db"/>';
  s+='<path d="M'+roomLeft+' '+(floor-14)+' H'+(roomLeft+roomWidth)+'" stroke="#f0f3f5" stroke-width="2"/>';
  s+='<path d="M'+roomLeft+' '+floor+' H'+(roomLeft+roomWidth)+'" stroke="#aebbc5" stroke-width="2"/>';
  const vanish=b.x+b.width*.5;
  [0,WORKSPACE_W*.33,WORKSPACE_W*.66,WORKSPACE_W].forEach(function(end){
    const start=vanish+(end-vanish)*.4;
    s+='<path d="M'+start+' '+floor+' L'+end+' '+WORKSPACE_H+'" fill="none" stroke="#bfccd5" stroke-width="1.5" stroke-opacity=".5"/>';
  });
  s+='<path d="M'+roomLeft+' '+(floor+330)+' H'+(roomLeft+roomWidth)+'" stroke="#c2cdd5" stroke-width="1.5" stroke-opacity=".45"/>';
  s+='<ellipse cx="'+(b.x+b.width*.5)+'" cy="'+feet+'" rx="'+(b.width*.45)+'" ry="19" fill="#697985" opacity=".09"/>';
  [b.x+60,b.x+b.width-60].forEach(function(x){
    s+='<ellipse cx="'+x+'" cy="'+(feet+2)+'" rx="43" ry="9" fill="#566875" opacity=".18"/>';
  });
  return s+'</g>';
}
function workbenchInner(b,motors){
  const x=b.x,y=b.y,w=b.width,h=b.height;
  let s='<g class="workbench" pointer-events="none">'+workshopBackdrop(b);
  s+='<rect x="'+(x+36)+'" y="'+(y+38)+'" width="48" height="'+(h-38)+'" rx="3" fill="#9da7b0" stroke="#66727e" stroke-width="3"/>';
  s+='<rect x="'+(x+w-84)+'" y="'+(y+38)+'" width="48" height="'+(h-38)+'" rx="3" fill="#9da7b0" stroke="#66727e" stroke-width="3"/>';
  s+='<path d="M'+(x+44)+' '+(y+44)+' V'+(y+h-8)+' M'+(x+w-76)+' '+(y+44)+' V'+(y+h-8)+'" stroke="#dbe1e5" stroke-width="4"/>';
  s+='<rect x="'+(x+82)+'" y="'+(y+80)+'" width="'+(w-164)+'" height="46" fill="#929ea8" stroke="#697581" stroke-width="3"/>';
  s+='<rect x="'+(x+84)+'" y="'+(y+81)+'" width="'+(w-168)+'" height="6" fill="#d5dde3"/>';
  s+='<rect x="'+(x+82)+'" y="'+(y+h-86)+'" width="'+(w-164)+'" height="25" fill="#9ca8b2" stroke="#6e7b88" stroke-width="2"/>';
  const cx=x+w-540,cy=y+50,cw=430,ch=h-64;
  s+='<rect x="'+cx+'" y="'+cy+'" width="'+cw+'" height="'+ch+'" rx="4" fill="#164a78" stroke="#173b5c" stroke-width="4"/>';
  s+='<rect x="'+(cx+10)+'" y="'+(cy+ch)+'" width="'+(cw-20)+'" height="14" rx="2" fill="#294959" stroke="#173746" stroke-width="2"/>';
  for(let i=0;i<3;i++){
    const dy=cy+18+i*(ch-34)/3,dh=(ch-34)/3-10;
    s+='<rect x="'+(cx+16)+'" y="'+dy+'" width="'+(cw-32)+'" height="'+dh+'" rx="2" fill="#2166a4" stroke="#103d64" stroke-width="3"/>';
    s+='<rect x="'+(cx+24)+'" y="'+(dy+8)+'" width="'+(cw-48)+'" height="8" fill="#3985c7"/>';
    s+='<rect x="'+(cx+110)+'" y="'+(dy+25)+'" width="210" height="20" rx="2" fill="#bbc6cf" stroke="#586c7a" stroke-width="2"/>';
    s+='<path d="M'+(cx+116)+' '+(dy+30)+' H'+(cx+314)+'" stroke="#f0f4f7" stroke-width="3"/>';
  }
  s+='<path d="M'+x+' '+y+' L'+(x+140)+' '+(y-60)+' H'+(x+w-140)+' L'+(x+w)+' '+y+' Z" fill="#bcc6cf" stroke="#768390" stroke-width="3"/>';
  s+='<path d="M'+(x+20)+' '+(y-3)+' L'+(x+144)+' '+(y-55)+' H'+(x+w-144)+' L'+(x+w-20)+' '+(y-3)+'" fill="none" stroke="#e4eaf0" stroke-width="3"/>';
  s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="43" rx="3" fill="#9eabb6" stroke="#697886" stroke-width="3"/>';
  s+='<path d="M'+(x+4)+' '+(y+4)+' H'+(x+w-4)+'" stroke="#eff3f6" stroke-width="3"/>';
  [x+60,x+w-60].forEach(function(bx){
    s+='<circle cx="'+bx+'" cy="'+(y+64)+'" r="10" fill="#cbd4dc" stroke="#697781" stroke-width="2"/>';
    s+='<path d="M'+(bx-5)+' '+(y+64)+' H'+(bx+5)+' M'+bx+' '+(y+59)+' V'+(y+69)+'" stroke="#65737e" stroke-width="2"/>';
  });
  motors.forEach(function(motor){
    const scale=motor.scale||1.5,px=motor.x-24*scale,py=motor.y+252*scale-12,pw=280*scale;
    s+='<rect class="motor-mounting-plate" x="'+px+'" y="'+py+'" width="'+pw+'" height="24" rx="3" fill="#aab7c1" stroke="#617381" stroke-width="2"/>';
    s+='<path d="M'+(px+3)+' '+(py+3)+' H'+(px+pw-3)+'" stroke="#e4ebf0" stroke-width="3"/>';
  });
  return s+'</g>';
}
function motorInstrumentConduitInner(motor){
  if(!motor)return '';
  const panel=motorInstrumentPosition(motor);
  const dc=motorIsDc(motor);
  const sx=motor.x+(dc?10:222)*motor.scale,sy=motor.y+152*motor.scale;
  const ex=panel.x+(dc?100:640),ey=panel.y+704;
  const turn=ey<sy?-1:1,horizontal=ex<sx?-1:1;
  const r=Math.min(24,Math.abs(ex-sx)/2,Math.abs(ey-sy)/2);
  const path='M'+sx+' '+sy+' H'+(ex-horizontal*r)+' Q'+ex+' '+sy+' '+ex+' '+(sy+turn*r)+' V'+ey;
  let s='<g class="motor-instrument-conduit" pointer-events="none"><title>Гофра от двигателя к приборной панели стенда</title>';
  s+='<path d="'+path+'" fill="none" stroke="#202a32" stroke-width="32" stroke-linejoin="round" stroke-linecap="round"/>';
  s+='<path d="'+path+'" fill="none" stroke="#596671" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>';
  s+='<path d="'+path+'" fill="none" stroke="#29343e" stroke-width="29" stroke-dasharray="2 5" stroke-linecap="butt"/>';
  s+='<path d="'+path+'" fill="none" stroke="#aab7c0" stroke-width="5" stroke-opacity=".35"/>';
  // Хомут на каждом прямом участке, ввод двигателя развёрнут горизонтально.
  const hx=(sx+ex-horizontal*r)/2,vy=(sy+turn*r+ey)/2;
  s+='<rect x="'+(hx-9)+'" y="'+(sy-19)+'" width="18" height="38" rx="2" fill="#bcc7ce" stroke="#657581" stroke-width="2"/>';
  s+='<path d="M'+(hx-4)+' '+(sy-14)+' V'+(sy+14)+'" stroke="#f1f4f6" stroke-width="2"/>';
  s+='<rect x="'+(ex-19)+'" y="'+(vy-9)+'" width="38" height="18" rx="2" fill="#bcc7ce" stroke="#657581" stroke-width="2"/>';
  s+='<path d="M'+(ex-14)+' '+(vy-4)+' H'+(ex+14)+'" stroke="#f1f4f6" stroke-width="2"/>';
  [{x:sx,y:sy,angle:90},{x:ex,y:ey,angle:0}].forEach(function(p){
    s+='<g transform="translate('+p.x+','+p.y+') rotate('+p.angle+')"><rect x="-19" y="-9" width="38" height="24" rx="4" fill="#818e97" stroke="#435460" stroke-width="2"/>';
    for(let i=0;i<3;i++)s+='<path d="M-16 '+(-4+i*6)+' H16" stroke="#c4cdd3" stroke-width="2"/>';
    s+='</g>';
  });
  return s+'</g>';
}
function workbenchConduitInner(panel,motor,b){
  if(!panel||!motor)return '';
  const dc=motorIsDc(motor),sign=dc?-1:1;
  const outletFraction=dc ? .4 : b.dcMotorId ? .6 : .4;
  const sx=panel.x+PANEL.width*outletFraction,sy=panel.y+panelHeight(panel);
  const ex=motor.x+116*motor.scale,ey=motor.y-12*motor.scale;
  const bottom=Math.max(sy+64,ey+80,b.y-150);
  const path='M'+sx+' '+sy+' V'+(bottom-40)+' Q'+sx+' '+bottom+' '+(sx+sign*40)+' '+bottom+' H'+(ex-sign*60)+' Q'+ex+' '+bottom+' '+ex+' '+(bottom-60)+' V'+ey;
  let s='<g class="motor-conduit" pointer-events="none"><title>Гофра для проводов к двигателю — электрические соединения собираются отдельно</title>';
  s+='<path d="'+path+'" fill="none" stroke="#202a32" stroke-width="32" stroke-linejoin="round" stroke-linecap="round"/>';
  s+='<path d="'+path+'" fill="none" stroke="#596671" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>';
  s+='<path d="'+path+'" fill="none" stroke="#29343e" stroke-width="29" stroke-dasharray="2 5" stroke-linecap="butt"/>';
  s+='<path d="'+path+'" fill="none" stroke="#aab7c0" stroke-width="5" stroke-opacity=".35"/>';
  [sx+sign*80,ex-sign*90].forEach(function(cx){
    s+='<rect x="'+(cx-9)+'" y="'+(bottom-19)+'" width="18" height="38" rx="2" fill="#bcc7ce" stroke="#657581" stroke-width="2"/>';
    s+='<path d="M'+(cx-4)+' '+(bottom-14)+' V'+(bottom+14)+'" stroke="#f1f4f6" stroke-width="2"/>';
  });
  // Такой же хомут, как остальные крепления гофры.
  const holderX=dc?Math.min(sx-120,Math.max(ex+120,motor.x+287*motor.scale))
    :Math.max(sx+120,Math.min(ex-120,motor.x-55*motor.scale));
  s+='<g class="motor-conduit-holder" pointer-events="none"><title>Держатель гофры рядом с двигателем</title>';
  s+='<rect x="'+(holderX-9)+'" y="'+(bottom-19)+'" width="18" height="38" rx="2" fill="#bcc7ce" stroke="#657581" stroke-width="2"/>';
  s+='<path d="M'+(holderX-4)+' '+(bottom-14)+' V'+(bottom+14)+'" stroke="#f1f4f6" stroke-width="2"/>';
  s+='</g>';
  [ {x:sx,y:sy},{x:ex,y:ey} ].forEach(function(p){
    s+='<rect x="'+(p.x-19)+'" y="'+(p.y-9)+'" width="38" height="24" rx="4" fill="#818e97" stroke="#435460" stroke-width="2"/>';
    for(let i=0;i<3;i++)s+='<path d="M'+(p.x-16)+' '+(p.y-4+i*6)+' H'+(p.x+16)+'" stroke="#c4cdd3" stroke-width="2"/>';
  });
  return s+'</g>'+motorInstrumentConduitInner(motor);
}
function renderWorkbench(){
  const layer=document.getElementById('workbenchLayer'),conduit=document.getElementById('conduitLayer');
  if(!layer||!conduit)return;
  const b=state.workbench;
  const motors=workbenchMotors(b),panel=b&&panelById(b.panelId);
  const key=JSON.stringify([state.roomScene,b,motors.map(function(m){return [m.id,m.x,m.y,m.scale,m.kind,motorInstrumentPosition(m)];}),panel&&[panel.x,panel.y,panel.railCount]]);
  if(key===workbenchVisualKey)return;
  workbenchVisualKey=key;
  layer.innerHTML=state.roomScene==='household'
    ? '<g class="household-room" pointer-events="none"><rect x="-100000" y="-100000" width="200000" height="200000" fill="#e7ebee"/><image href="assets/household-rooms.svg" x="0" y="-200" width="'+HOUSEHOLD_W+'" height="'+HOUSEHOLD_H+'" preserveAspectRatio="xMidYMid meet"><title>Бытовой монтаж: коридор, спальня, кухня, ванная и хозяйственное помещение</title></image></g>'
    : b?workbenchInner(b,motors):'';
  conduit.innerHTML=b?motors.map(function(m){return workbenchConduitInner(panel,m,b);}).join(''):'';
}

function renderPanels(){
  renderWorkbench();
  const layer=document.getElementById('panelLayer');
  if(layer)layer.innerHTML=state.panels.map(function(p){
    return '<g data-panel-id="'+p.id+'" transform="translate('+p.x+','+p.y+')" style="cursor:'+(panelIsFixed(p)?'default':'grab')+';touch-action:none">'+panelInner(p)+'</g>';
  }).join('');
}
function detachPanelDevices(panel,fromRow){
  state.devices.forEach(function(d){
    if(typeof d.rail!=='string'||!d.rail.startsWith(panel.id+':'))return;
    const row=Number(d.rail.split(':')[1]);if(row<fromRow)return;
    d.x=panel.x+32+d.slot*MODULE;d.y=panel.y+PANEL.firstRail+row*PANEL.pitch-TYPES[d.type].h/2;
    delete d.rail;delete d.slot;
  });
}
function railSvg(rail){
  const W=rail.slots*MODULE,RAIL_X0=rail.x,RAIL_X1=rail.x+W,SLOTS=rail.slots,cy=rail.y;
  let s = '';
    const top = cy - RAIL_H/2, bot = cy + RAIL_H/2;
    s += '<rect x="'+(RAIL_X0-3)+'" y="'+(top-4)+'" width="'+(W+6)+'" height="'+(RAIL_H+9)+'" rx="4" fill="rgba(0,0,0,.13)"/>';
    s += '<rect x="'+RAIL_X0+'" y="'+top+'" width="'+W+'" height="'+RAIL_H+'" fill="#c9ced4" stroke="#9aa0a8"/>';
    s += '<rect x="'+RAIL_X0+'" y="'+(top+2)+'" width="'+W+'" height="4" fill="rgba(255,255,255,.6)"/>';
    s += '<rect x="'+RAIL_X0+'" y="'+(bot-6)+'" width="'+W+'" height="4" fill="rgba(0,0,0,.12)"/>';
    s += '<line x1="'+RAIL_X0+'" y1="'+(top+10)+'" x2="'+RAIL_X1+'" y2="'+(top+10)+'" stroke="#a2a8af"/>';
    s += '<line x1="'+RAIL_X0+'" y1="'+(bot-10)+'" x2="'+RAIL_X1+'" y2="'+(bot-10)+'" stroke="#a2a8af"/>';
    for (let i=0;i<SLOTS;i++){
      const cx = RAIL_X0 + (i+0.5)*MODULE;
      s += '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(MODULE*0.30)+'" ry="11" fill="#a4a9b0" stroke="#8c9299"/>';
      s += '<ellipse cx="'+cx+'" cy="'+(cy-2)+'" rx="'+(MODULE*0.27)+'" ry="8.5" fill="#9aa0a8" opacity=".55"/>';
    }
  return s;
}
function renderRail(){
  railLayer.innerHTML=mountingRails().map(railSvg).join('');
}

function renderDevices(){
  let s = '';
  // подсветка места установки при перетаскивании
  const placementDrag = (drag && drag.candidate) ? drag
                      : (freeDeviceDrag && freeDeviceDrag.candidate ? freeDeviceDrag : null);
  if (placementDrag && placementDrag.candidate && !placementDrag.candidate.relay && !placementDrag.candidate.free){
    const c = placementDrag.candidate;
    const col = c.ok ? 'rgba(47,191,113,.35)' : 'rgba(255,91,91,.35)';
    const brd = c.ok ? '#2fbf71' : '#ff5b5b';
    const t = TYPES[placementDrag.type], rail=mountingRail(c.rail),cy=rail.y,top=cy-RAIL_H/2;
    const x = rail.x + c.slot*MODULE, w = t.modules*MODULE;
    s += '<rect x="'+x+'" y="'+(top-6)+'" width="'+w+'" height="'+(RAIL_H+12)+'" rx="4" fill="'+col+'" stroke="'+brd+'" stroke-dasharray="6 4"/>';
    s += '<text x="'+(x+w/2)+'" y="'+(top-14)+'" text-anchor="middle" font-size="12" font-weight="700" fill="'+brd+'" font-family="Segoe UI,Arial">'
       + (c.ok ? ('поз. '+(c.slot+1)) : 'занято') + '</text>';
  }
  if(placementDrag&&placementDrag.type==='comb'&&placementDrag.candidate&&placementDrag.candidate.comb){
    const c=placementDrag.candidate,w=combWidth(devById(placementDrag.devId)||placementDrag);
    s+='<rect x="'+c.x+'" y="'+c.y+'" width="'+w+'" height="22" rx="2" fill="rgba(47,191,113,.25)" stroke="#2fbf71" stroke-width="2" pointer-events="none"/>';
  }
  state.devices.slice().sort(function(a,b){return (b.type==='comb')-(a.type==='comb');}).forEach(function(d){
    const t = TYPES[d.type], h = t.h, w = t.modules*MODULE;
    const o = originOf(d);
    const x = o.x, y = o.y;
    s += '<g class="dev" data-id="'+d.id+'" transform="translate('+x+','+y+')" style="cursor:grab">'
       +   deviceInner(d.type, d)
       + '</g>';
  });
  state.pushbuttons.forEach(function(pb){
    s += '<g class="push-station" data-dev="'+pb.id+'" transform="translate('+pb.x+','+pb.y+')" style="cursor:grab;touch-action:none">'
       + pushbuttonInner(pb) + '</g>';
  });
  deviceLayer.innerHTML = s;
}

/* тепловое реле — поверх аппаратов: щупы видно входящими в зажимы пускателя,
   а своя колодка 98/97/96/95 занимает место его нижних зажимов */
function renderRelays(){
  let s = '';
  state.relays.forEach(function(r){
    const km = devById(r.kmId);
    if (!km) return;
    const t = TYPES.km1, ko = originOf(km);
    const x = ko.x;
    const y = ko.y + t.h - RELAY_DROP;
    s += '<g class="relay" data-rid="'+r.id+'" transform="translate('+x+','+y+')" style="cursor:pointer">'
       +   relayInner(Object.assign({},r,{attached:true}))
       + '</g>';
  });
  // наведение реле на зажимы пускателя: подсветка места установки
  const c = drag && drag.candidate;
  if (c && c.relay){
    const km = devById(c.kmId);
    if (km){
      const t = TYPES.km1,ko=originOf(km);
      const x = ko.x, w = t.modules*MODULE;
      const y = ko.y + t.h - RELAY_DROP;
      const ok = c.ok, col = ok ? '#2fbf71' : '#ff5b5b';
      s += '<rect x="'+x+'" y="'+(y-PIN_TOP)+'" width="'+w+'" height="'+(TYPES.kk1.h+PIN_TOP)+'" rx="5" fill="'+(ok?'rgba(47,191,113,.18)':'rgba(255,91,91,.18)')+'" stroke="'+col+'" stroke-dasharray="6 4"/>';
      s += '<text x="'+(x+w/2)+'" y="'+(y+TYPES.kk1.h+16)+'" text-anchor="middle" font-size="12" font-weight="700" fill="'+col+'" font-family="Segoe UI,Arial">'
         + (ok ? 'щупы → зажимы 2 T1 · 4 T2 · 6 T3' : (relayFor(km.id)?'пускатель уже занят':'место для реле занято')) + '</text>';
    }
  }
  relayLayer.innerHTML = s;
}

/* клеммная коробка ввода XT1: болты выкрашены в цвета проводов ввода */
function inboxInner(){
  const w = inboxWidth(), h = INBOX.h;
  const single=inboxSinglePhase(),voltage=networkLineVoltageRms(),frequency=networkFrequencyHz();
  let s = '';
  // Компактный вводной корпус; выводы вынесены ниже нижней грани коробки.
  s += '<rect x="0" y="0" width="'+w+'" height="72" rx="11" fill="#cfd4da" stroke="#858d96" stroke-width="2"/>';
  s += '<rect x="5" y="5" width="'+(w-10)+'" height="62" rx="8" fill="#e4e7ea" stroke="#f9fafb" stroke-width="1.5"/>';
  s += '<rect x="10" y="9" width="'+(w-20)+'" height="10" rx="5" fill="#c5cbd1" stroke="#a0a7ae"/>';
  s += '<text x="'+(w/2)+'" y="39" text-anchor="middle" font-size="18" font-weight="900" fill="#343a40" font-family="Segoe UI,Arial">ВВОД '+(single?'':'3×')+voltage+' В</text>';
  s += '<text x="'+(w/2)+'" y="57" text-anchor="middle" font-size="9" font-weight="600" fill="#68717a" font-family="Segoe UI,Arial">'+(single?'ОДНОФАЗНАЯ':'ТРЁХФАЗНАЯ')+' СЕТЬ · '+frequency+' Гц</text>';
  // Один предупреждающий знак из предоставленного образца.
  s += single
    ? '<image href="assets/high-voltage-warning.png" x="8" y="24" width="24" height="24" preserveAspectRatio="xMidYMid meet"/>'
    : '<image href="assets/high-voltage-warning.png" x="10" y="23" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>';
  inboxTerms().forEach(function(t){
    s += '<rect x="'+(t.dx-18)+'" y="67" width="36" height="48" rx="7" fill="#d7dbe0" stroke="#9299a1" stroke-width="1.5"/>';
    s += '<text x="'+t.dx+'" y="83" text-anchor="middle" font-size="10.5" font-weight="800" fill="'+(t.tc||'#2b3138')+'" font-family="Segoe UI,Arial">'+t.label+'</text>';
    s += '<circle cx="'+t.dx+'" cy="'+t.dy+'" r="14" fill="rgba(0,0,0,.11)"/>';
    s += '<circle cx="'+t.dx+'" cy="'+t.dy+'" r="11" fill="'+t.color+'" stroke="rgba(0,0,0,.45)" stroke-width="1.4"/>';
    s += '<circle cx="'+t.dx+'" cy="'+t.dy+'" r="7.5" fill="none" stroke="rgba(255,255,255,.45)"/>';
    if (t.color === WCF.PE){                       // жёлто-зелёный: зелёные штрихи
      s += '<circle cx="'+t.dx+'" cy="'+t.dy+'" r="7.5" fill="none" stroke="#1f9d3a" stroke-width="3.6" stroke-dasharray="4.4 4.4"/>';
    }
    s += '<circle cx="'+t.dx+'" cy="'+t.dy+'" r="5.8" fill="#c9a227" stroke="#8d6f14" stroke-width="1"/>';
    const arm = 4.6;
    s += '<line x1="'+(t.dx-arm)+'" y1="'+t.dy+'" x2="'+(t.dx+arm)+'" y2="'+t.dy+'" stroke="#6b5410" stroke-width="2" stroke-linecap="round"/>';
    s += '<line x1="'+t.dx+'" y1="'+(t.dy-arm)+'" x2="'+t.dx+'" y2="'+(t.dy+arm)+'" stroke="#6b5410" stroke-width="2" stroke-linecap="round"/>';
  });
  return s;
}

/* обводки провода: цвет, для PE — жёлтый с зелёными штрихами */
function wireStrokeGeom(d, color, cls, dashed, width){
  width=Number(width)||4;
  const c = cls ? ' class="'+cls+'"' : '';
  const ds = dashed ? ' stroke-dasharray="10 6"' : '';
  if (color === WC.PE){
    return '<path'+c+' d="'+d+'" fill="none" stroke="#e8d800" stroke-width="'+width+'" stroke-linecap="round"'+ds+'/>'
         + '<path class="wire-stripe" d="'+d+'" fill="none" stroke="#1f9d3a" stroke-width="'+width+'" stroke-linecap="round" stroke-dasharray="7 7"/>';
  }
  return '<path'+c+' d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"'+ds+'/>';
}
function renderInbox(){
  if(!state.special.inbox){boxLayer.innerHTML='';return;}
  syncPanelInbox();
  let s = '<g class="inbox-draggable" data-dev="IN" transform="translate('+INBOX.x+','+INBOX.y+')" style="cursor:grab;touch-action:none">' + inboxInner(!inboxPanel()) + '</g>';
  boxLayer.innerHTML = s;
}

/* Направление вращения определяется порядком фаз на U1, V1 и W1.
   L1-L2-L3 и циклические перестановки — прямое вращение; перестановка любых двух фаз — обратное. */
function motorById(id){return state.motors.find(function(m){return String(m.id)===String(id);})||null;}
function pushbuttonById(id){return state.pushbuttons.find(function(p){return String(p.id)===String(id);})||null;}
function nextSpecialNumber(list,prefix){let max=0;list.forEach(function(o){const m=String(o.id||'').match(new RegExp('^'+prefix+'(\\d+)$'));if(m)max=Math.max(max,+m[1]);});return max+1;}
function motorSupplyFrequency(motor,map){
  motor=motor||state.motors[0];if(!motor)return 0;
  map=map||potentialMap();
  const phases=['U1','V1','W1'].map(function(key){return map.pot[nodeKey({devId:motor.id,key:key})];});
  if(phases.some(function(v){return !v||v.dc||!(Number(v.frequencyHz)>0);} ))return 0;
  const frequencies=phases.map(function(v){return Number(v.frequencyHz);});
  return Math.max.apply(null,frequencies)-Math.min.apply(null,frequencies)<=.05
    ?frequencies.reduce(function(sum,v){return sum+v;},0)/frequencies.length:0;
}
function motorPhaseDirection(motor,map){
  motor=motor||state.motors[0];
  if(!motor)return 0;
  if(motorIsDc(motor))return 0;            // у машины постоянного тока нет порядка фаз
  map=map||potentialMap();
  if (map.conflict) return 0;
  const phases = AC_WINDING_PAIRS.map(function(pair){
    const a=map.pot[nodeKey({devId:motor.id,key:pair[0]})],b=map.pot[nodeKey({devId:motor.id,key:pair[1]})];
    return a&&b?phasorDifference(a,b):null;
  });
  if (phases.some(function(v){ return !v; })) return 0;
  const supplyFrequency=motorSupplyFrequency(motor,map);
  if(supplyFrequency<=0)return 0;
  // До базовой частоты ПЧ поддерживает постоянное отношение U/f.
  const nominalLineVoltage=ratedVoltageOf(motor,380);
  const baseFrequency=Math.max(1,Number(motor.ratedFrequency)||50);
  const expectedLineVoltage=nominalLineVoltage*Math.min(1,supplyFrequency/baseFrequency);
  const expectedPhaseVoltage=expectedLineVoltage/Math.sqrt(3);
  for (let i=0;i<3;i++){
    const phaseMagnitude=Math.hypot(phases[i].r,phases[i].i);
    if(phaseMagnitude<expectedPhaseVoltage*.8||phaseMagnitude>expectedPhaseVoltage*1.18)return 0;
    for (let j=i+1;j<3;j++){
      const lineVoltage=Math.hypot(phases[i].r-phases[j].r,phases[i].i-phases[j].i);
      if(lineVoltage<expectedLineVoltage*.8||lineVoltage>expectedLineVoltage*1.18)return 0;
    }
  }
  const refs = [vecPhase(0,expectedPhaseVoltage),vecPhase(120,expectedPhaseVoltage),vecPhase(240,expectedPhaseVoltage)];
  const order = phases.map(function(v){
    let best = 0, dist = Infinity;
    refs.forEach(function(ref, i){
      const d = Math.hypot(v.r-ref.r, v.i-ref.i);
      if (d < dist){ dist = d; best = i; }
    });
    return best;
  });
  if (new Set(order).size !== 3) return 0;
  let inversions = 0;
  for (let i=0;i<3;i++) for (let j=i+1;j<3;j++) if (order[i] > order[j]) inversions++;
  return inversions % 2 ? -1 : 1;
}
/* Приборная панель использует действительную скорость ротора и питание модели. */
function motorInstrumentValues(motor,operating){
  const ns=operating.synchronousRpm;
  const direction=Math.abs(motor.rpmActual||0)>1?Math.sign(motor.rpmActual):0;
  const slip=ns>0?(1-direction*operating.rpm/(motorPhaseDirection(motor)||1)/ns)*100:null;
  // Нагрузка задаёт долю номинального момента, одинаковую в обоих направлениях.
  const nominalSpeed=motorSpeedByFormula(motor,Number(motor.ratedFrequency)||50,100).rpm;
  const nominalPower=Math.max(0,Number(motor.ratedPower)||4)*1000;
  const nominalTorque=nominalSpeed>0?nominalPower/(2*Math.PI*nominalSpeed/60):0;
  const torque=direction?nominalTorque*operating.load/100:0;
  return {sync:ns>0?Math.round(ns)+' об/мин':'—',
    slip:slip===null?'—':slip.toFixed(1)+' %',torque:torque.toFixed(1)+' Н·м'};
}
function motorInstrumentPosition(motor){
  if(motorIsDc(motor)&&!(state.workbench&&state.workbench.dcMotorId===motor.id)){
    return {x:motor.x+116*motor.scale-370,y:motor.y-840};
  }
  const panel=state.workbench&&panelById(state.workbench.panelId)||state.panels[0];
  if(panel){
    const dc=motorIsDc(motor);
    const index=state.motors.filter(function(m){return motorIsDc(m)===dc;}).indexOf(motor);
    return {x:dc?panel.x-810:panel.x+PANEL.width+70,y:panel.y+Math.max(0,index)*740};
  }
  return {x:motor.x+232*motor.scale+30,y:motor.y-520};
}
function dcMotorInstrumentValues(motor,operating){
  // Момент внешней нагрузки на валу, как на стенде АД; ЭДС видна и при выбеге.
  const rpm=Math.abs(Number(motor.rpmActual)||0);
  const torque=rpm>1?operating.loadTorque:0;
  const power=torque*rpm*Math.PI/30/1000;
  return {armatureVoltage:operating.armatureVoltage.toFixed(0)+' В',
    armatureCurrent:operating.armatureCurrent.toFixed(1)+' А',
    fieldVoltage:operating.fieldVoltage.toFixed(0)+' В',
    fieldCurrent:operating.fieldCurrent.toFixed(2)+' А',
    rpm:Math.round(rpm)+' об/мин',torque:torque.toFixed(1)+' Н·м',
    emf:operating.emf.toFixed(0)+' В',power:power.toFixed(2)+' кВт'};
}
function motorInstrumentInner(motor,operating){
  const dc=motorIsDc(motor);
  const values=dc?dcMotorInstrumentValues(motor,operating):motorInstrumentValues(motor,operating);
  function meter(label,cls,value,symbol){
    return '<div class="motor-instrument-meter"><div class="motor-instrument-label">'+label+'<span>'+symbol+'</span></div><b class="'+cls+'">'+value+'</b></div>';
  }
  const meters=dc
    ?meter('Напряжение якоря','motor-armature-voltage',values.armatureVoltage,'Uя')
      +meter('Скорость якоря','motor-rpm-value',values.rpm,'n')
      +meter('Ток якоря','motor-armature-current',values.armatureCurrent,'Iя')
      +meter('Напряжение возбуждения','motor-field-voltage',values.fieldVoltage,'Uв')
      +meter('Ток возбуждения','motor-field-current',values.fieldCurrent,'Iв')
      +meter('Момент на валу','motor-shaft-torque-value',values.torque,'M')
    :meter('Частота питания','motor-frequency-value',operating.frequencyHz.toFixed(1)+' Гц','f')
      +meter('Скорость ротора','motor-rpm-value',operating.rpm+' об/мин','n')
      +meter('Ток двигателя','motor-current-value',operating.current.toFixed(1)+' А','I')
      +meter('Синхронная скорость','motor-sync-value',values.sync,'n₀')
      +meter('Скольжение','motor-slip-value',values.slip,'s')
      +meter('Момент на валу','motor-shaft-torque-value',values.torque,'M');
  return '<div xmlns="http://www.w3.org/1999/xhtml" class="motor-load-control motor-instrument-panel'+(dc?' dc-motor-instrument':'')+'">'
    +'<i class="instrument-screw tl"></i><i class="instrument-screw tr"></i><i class="instrument-screw bl"></i><i class="instrument-screw br"></i>'
    +'<div class="motor-instrument-heading">СТЕНД ИСПЫТАНИЙ</div><div class="motor-tag">'+(dc?'ДВИГАТЕЛЬ ПОСТОЯННОГО ТОКА':'АСИНХРОННЫЙ ДВИГАТЕЛЬ')+' · '+escapeHtml(motor.tag||motor.id)+'</div>'
    +'<div class="motor-instrument-grid">'+meters+'</div>'
    +(dc?'<div class="motor-instrument-extra"><span>ЭДС якоря <b class="motor-emf-value">'+values.emf+'</b></span><span>Мощность на валу <b class="motor-power-value">'+values.power+'</b></span></div>':'')
    +'<div class="motor-instrument-load"><div class="motor-load-title">Нагрузка на валу</div>'
    +'<input aria-label="Нагрузка на валу '+escapeHtml(motor.tag||motor.id)+'" class="motor-load" data-mid="'+motor.id+'" type="range" min="0" max="100" step="1" value="'+operating.load+'" />'
    +'<div class="motor-load-value">'+operating.load.toFixed(0)+' %</div></div>'
    +(dc?'<div class="motor-alert"'+(operating.acSupply?'':' hidden')+'>На зажимы машины подано переменное напряжение.</div>':'')
    +'</div>';
}
/* Настоящий SVG сохраняет единый масштаб корпуса, текста и двигателя и в
   WebKit. HTML используется только в отдельном окне показаний вне сцены. */
function motorInstrumentSvg(motor,operating,position){
  const dc=motorIsDc(motor),values=dc?dcMotorInstrumentValues(motor,operating):motorInstrumentValues(motor,operating);
  const color=dc?'#275e3d':'#264b63',screen=dc?'#e0ebe3':'#e1e8ec';
  const load=Math.max(0,Math.min(100,Number(operating.load)||0)),thumbX=58+624*load/100;
  const meters=dc?[
    [['Напряжение якоря'],'Uя','motor-armature-voltage',values.armatureVoltage],
    [['Скорость якоря'],'n','motor-rpm-value',values.rpm],
    [['Ток якоря'],'Iя','motor-armature-current',values.armatureCurrent],
    [['Напряжение','возбуждения'],'Uв','motor-field-voltage',values.fieldVoltage],
    [['Ток возбуждения'],'Iв','motor-field-current',values.fieldCurrent],
    [['Момент на валу'],'M','motor-shaft-torque-value',values.torque]
  ]:[
    [['Частота питания'],'f','motor-frequency-value',operating.frequencyHz.toFixed(1)+' Гц'],
    [['Скорость ротора'],'n','motor-rpm-value',operating.rpm+' об/мин'],
    [['Ток двигателя'],'I','motor-current-value',operating.current.toFixed(1)+' А'],
    [['Синхронная','скорость'],'n₀','motor-sync-value',values.sync],
    [['Скольжение'],'s','motor-slip-value',values.slip],
    [['Момент на валу'],'M','motor-shaft-torque-value',values.torque]
  ];
  function text(x,y,value,cls,extra){
    return '<text x="'+x+'" y="'+y+'"'+(cls?' class="'+cls+'"':'')+(extra?' '+extra:'')+'>'+escapeHtml(value)+'</text>';
  }
  let s='<g class="motor-instrument motor-load-control motor-instrument-panel motor-instrument-svg'+(dc?' dc-motor-instrument':'')+'" data-motor="'+escapeHtml(motor.id)+'" transform="translate('+position.x+','+position.y+')" font-family="Segoe UI,Arial,sans-serif">'
    +'<rect class="instrument-svg-frame" x="0" y="0" width="740" height="704" rx="12" fill="#dce2e6" stroke="#9aa5ad" stroke-width="5"/>'
    +'<rect x="7" y="7" width="726" height="690" rx="8" fill="#edf0f2" stroke="#f8fafb" stroke-width="5"/>';
  [[22,22],[718,22],[22,682],[718,682]].forEach(function(p){
    s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="7.5" fill="#c6cdd2" stroke="#98a3ac" stroke-width="2"/><path d="M '+(p[0]-4)+' '+(p[1]+3)+' l 8 -6" stroke="#7a8790" stroke-width="1.5"/>';
  });
  s+=text(370,72,'СТЕНД ИСПЫТАНИЙ','instrument-svg-heading','text-anchor="middle" font-size="28" font-weight="800" letter-spacing="2" fill="#596168"')
    +'<path d="M 58 97 H 682" stroke="'+(dc?'#73a989':'#e1bb39')+'" stroke-width="6"/>'
    +text(370,137,(dc?'ДВИГАТЕЛЬ ПОСТОЯННОГО ТОКА':'АСИНХРОННЫЙ ДВИГАТЕЛЬ')+' · '+(motor.tag||motor.id),'instrument-svg-tag','text-anchor="middle" font-size="19" font-weight="800" fill="'+(dc?'#356348':'#626c75')+'"');
  meters.forEach(function(m,index){
    const x=34+(index%3)*229.333,y=170+Math.floor(index/3)*156;
    s+='<g class="instrument-svg-meter"><rect x="'+x+'" y="'+y+'" width="213.333" height="140" rx="6" fill="#f6f8f9" stroke="#a7b0b7" stroke-width="2"/>';
    m[0].forEach(function(label,i){s+=text(x+12,y+29+i*20,label,'instrument-svg-label','font-size="16" fill="#616d77"');});
    s+=text(x+201,y+39,m[1],'instrument-svg-symbol','text-anchor="end" font-size="23" font-style="italic" fill="#89959d"')
      +'<rect x="'+(x+12)+'" y="'+(y+72)+'" width="189.333" height="46" rx="3" fill="'+screen+'" stroke="#c3cdd4"/>'
      +text(x+196,y+103,m[3],m[2]+' instrument-svg-value','text-anchor="end" font-size="24" font-weight="700" font-family="Consolas,monospace" fill="'+color+'"')+'</g>';
  });
  if(dc){
    s+=text(36,500,'ЭДС якоря','instrument-svg-extra','font-size="17" fill="#616d77"')
      +text(155,500,values.emf,'motor-emf-value','font-size="17" font-weight="700" fill="'+color+'"')
      +text(380,500,'Мощность на валу','instrument-svg-extra','font-size="17" fill="#616d77"')
      +text(682,500,values.power,'motor-power-value','text-anchor="end" font-size="17" font-weight="700" fill="'+color+'"');
  }
  const loadTop=dc?520:496;
  s+='<rect x="34" y="'+loadTop+'" width="672" height="'+(674-loadTop)+'" rx="6" fill="#e9edf0" stroke="#b5bdc4" stroke-width="2"/>'
    +text(370,loadTop+36,'Нагрузка на валу','motor-load-title','text-anchor="middle" font-size="23" font-weight="800" fill="#596168"')
    +'<g class="motor-load motor-load-slider" data-mid="'+escapeHtml(motor.id)+'" data-load-x="'+(position.x+58)+'" data-load-width="624" tabindex="0" role="slider" aria-label="Нагрузка на валу '+escapeHtml(motor.tag||motor.id)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+load+'" aria-valuetext="'+load.toFixed(0)+' %" aria-orientation="horizontal">'
    +'<rect class="motor-load-hit" x="46" y="566" width="648" height="48" rx="8" fill="transparent" stroke="none"/>'
    +'<path class="motor-load-track" d="M 58 590 H 682" fill="none" stroke="#b5c0c7" stroke-width="8" stroke-linecap="round" pointer-events="none"/>'
    +'<line class="motor-load-progress" x1="58" y1="590" x2="'+thumbX+'" y2="590" stroke="'+(dc?'#4c8863':'#657f91')+'" stroke-width="8" stroke-linecap="round" pointer-events="none"/>'
    +'<circle class="motor-load-thumb" cx="'+thumbX+'" cy="590" r="13" fill="#fff" stroke="#9aa8b1" stroke-width="2" pointer-events="none"/></g>'
    +text(370,648,load.toFixed(0)+' %','motor-load-value','text-anchor="middle" font-size="26" font-weight="700" font-family="Consolas,monospace" fill="'+color+'"');
  if(dc)s+='<g class="motor-alert"'+(operating.acSupply?'':' display="none"')+'><rect x="38" y="651" width="664" height="26" rx="5" fill="#ffe9c9"/>'+text(370,670,'На зажимы машины подано переменное напряжение.','','text-anchor="middle" font-size="15" fill="#8a4b0c"')+'</g>';
  return s+'</g>';
}
let motorLoadDrag=null,motorLoadRenderPending=false;
function closeMotorInstruments(){
  const wasOpen=motorInstrumentsModal.classList.contains('open');
  motorInstrumentsModal.classList.remove('open');
  motorInstrumentsModal.setAttribute('aria-hidden','true');
  motorInstrumentsToggle.setAttribute('aria-expanded','false');
  if(wasOpen&&!motorInstrumentsToggle.hidden)motorInstrumentsToggle.focus();
}
function renderMotorInstrumentReader(){
  motorInstrumentsToggle.hidden=!state.motors.length;
  if(!state.motors.length){closeMotorInstruments();motorInstrumentBody.innerHTML='';motorInstrumentBody.dataset.motorSet='';return;}
  if(!motorInstrumentsModal.classList.contains('open'))return;
  const motor=motorById(motorInstrumentReaderId)||state.motors[0];
  motorInstrumentReaderId=motor.id;
  const signature=JSON.stringify([motor.id,state.motors.map(function(m){return [m.id,m.kind,m.tag];})]);
  // Показания обновляются без пересоздания регулятора под пальцем.
  if(motorInstrumentBody.dataset.motorSet!==signature){
    motorInstrumentTabs.innerHTML=state.motors.map(function(m){
      return '<button type="button" data-instrument-motor="'+escapeHtml(m.id)+'" aria-pressed="'+(m.id===motor.id)+'">'+(motorIsDc(m)?'ДПТ':'АД')+' · '+escapeHtml(m.tag||m.id)+'</button>';
    }).join('');
    const operating=motorIsDc(motor)?dcMotorOperatingPoint(motor):motorVisualOperating(motor,motorPhaseDirection(motor));
    motorInstrumentBody.innerHTML=motorInstrumentInner(motor,operating);
    motorInstrumentBody.dataset.motorSet=signature;
  }
  updateMotorReadout();
}
function openMotorInstruments(){
  if(!state.motors.length)return;
  const tools=document.querySelector('.wire-defaults');
  if(tools)tools.classList.remove('expanded');
  document.getElementById('wireToolsToggle').setAttribute('aria-expanded','false');
  hideWireMenu();hideObjectMenu();
  motorInstrumentsModal.classList.add('open');
  motorInstrumentsModal.setAttribute('aria-hidden','false');
  motorInstrumentsToggle.setAttribute('aria-expanded','true');
  renderMotorInstrumentReader();motorInstrumentsClose.focus();
}
motorInstrumentsToggle.addEventListener('click',openMotorInstruments);
motorInstrumentsClose.addEventListener('click',closeMotorInstruments);
motorInstrumentsModal.addEventListener('pointerdown',function(evt){if(evt.target===motorInstrumentsModal)closeMotorInstruments();});
motorInstrumentTabs.addEventListener('click',function(evt){
  const button=evt.target.closest('[data-instrument-motor]');
  if(!button)return;
  const motor=motorById(button.dataset.instrumentMotor);if(!motor)return;
  motorInstrumentReaderId=motor.id;renderMotorInstrumentReader();
  const selected=motorInstrumentTabs.querySelector('[aria-pressed="true"]');if(selected)selected.focus();
});
document.addEventListener('keydown',function(evt){
  if(!motorInstrumentsModal.classList.contains('open'))return;
  if(evt.key==='Escape'){evt.preventDefault();closeMotorInstruments();return;}
  if(evt.key!=='Tab')return;
  const controls=Array.from(motorInstrumentsModal.querySelectorAll('button:not([disabled]),input:not([disabled])'));
  if(!controls.length)return;
  const first=controls[0],last=controls[controls.length-1];
  if(evt.shiftKey&&document.activeElement===first){evt.preventDefault();last.focus();}
  else if(!evt.shiftKey&&document.activeElement===last){evt.preventDefault();first.focus();}
});
function renderMotor(){
  // Пересоздание SVG во время захвата указателя оборвало бы перетаскивание.
  if(motorLoadDrag){motorLoadRenderPending=true;updateMotorReadout();return;}
  const focusedControl=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.motor-load-slider');
  const focusedMotorId=focusedControl&&focusedControl.dataset.mid;
  renderWorkbench();
  return withElectricalRead(function(){
    if(!state.motors.length){motorLayer.innerHTML='';renderMotorInstrumentReader();updateMotorSound(0);return;}
    let s='',soundRpm=0,soundDir=0;
    state.motors.forEach(function(motor){
      const visualDirection = Math.abs(motor.rpmActual||0)>1 ? Math.sign(motor.rpmActual) : 0;
      if(motorIsDc(motor)){
        const operating=dcMotorOperatingPoint(motor);
        const rpm=Math.round(Math.abs(motor.rpmActual||0));
        if(rpm>soundRpm){soundRpm=rpm;soundDir=visualDirection;}
        s += '<g class="motor-draggable" data-dev="'+motor.id+'" transform="translate('+motor.x+','+motor.y+') scale('+motor.scale+')" style="cursor:grab;touch-action:none">' + dcMotorInner(visualDirection, operating, motor) + '</g>';
        const position=motorInstrumentPosition(motor);
        s += motorInstrumentSvg(motor,operating,position);
        return;
      }
      const electricalDirection = motorPhaseDirection(motor);
      const operating = motorVisualOperating(motor,electricalDirection);
      if(operating.rpm>soundRpm){soundRpm=operating.rpm;soundDir=visualDirection;}
      s += '<g class="motor-draggable" data-dev="'+motor.id+'" transform="translate('+motor.x+','+motor.y+') scale('+motor.scale+')" style="cursor:grab;touch-action:none">' + motorInner(visualDirection, operating, motor) + '</g>';
      const position=motorInstrumentPosition(motor);
      s += motorInstrumentSvg(motor,operating,position);
    });
    motorLayer.innerHTML = s;
    if(focusedMotorId){const control=motorLayer.querySelector('.motor-load-slider[data-mid="'+focusedMotorId+'"]');if(control&&typeof control.focus==='function')control.focus({preventScroll:true});}
    renderMotorInstrumentReader();
    updateMotorSound(soundDir,soundRpm);
  });
}

/* ============================================================
   5. ЛОГИКА РАЗМЕЩЕНИЯ
   ============================================================ */
function occupancy(rail,exceptId){
  const map = {};
  state.devices.forEach(function(d){
    // Свободно стоящий аппарат уже не занимает прежнее место на рейке.
    if (d.id === exceptId || d.rail !== rail || (isFinite(d.x) && isFinite(d.y))) return;
    for (let i=0;i<TYPES[d.type].modules;i++) map[d.slot+i] = d;
  });
  return map;
}
function isFree(rail, slot, modules, exceptId){
  const mounting=mountingRail(rail);
  if (!mounting || !isFinite(slot) || slot < 0 || slot + modules > mounting.slots) return false;
  const map = occupancy(rail,exceptId);
  for (let i=0;i<modules;i++){
    const o = map[slot+i];
    if (o && o.id !== exceptId) return false;
  }
  return true;
}
function nextLampIndicator(){
  const order = ['green','yellow','red'];
  const used = state.devices.filter(function(d){ return d.type === 'lamp'; }).map(function(d){ return d.indicator || 'green'; });
  return order.find(function(color){ return used.indexOf(color) < 0; }) || 'green';
}
function usedTagNumbers(prefix){
  const nums=[];
  state.devices.forEach(function(d){const m=String(d.tag||'').match(new RegExp('^'+prefix+'(\\d+)$'));if(m)nums.push(+m[1]);});
  state.relays.forEach(function(r){const m=String(r.tag||'').match(new RegExp('^'+prefix+'(\\d+)$'));if(m)nums.push(+m[1]);});
  return nums;
}
function nextTag(prefix){
  const used=usedTagNumbers(prefix);return prefix+((used.length?Math.max.apply(null,used):0)+1);
}
function nextDeviceTag(type){return nextTag(TAG_PREFIX[type]||String(TAGS[type]||type).replace(/\d+$/,''));}
function ensureInstanceTags(){
  state.devices.slice().sort(function(a,b){return a.id-b.id;}).forEach(function(d){if(!d.tag)d.tag=nextDeviceTag(d.type);});
  state.relays.slice().sort(function(a,b){return a.id-b.id;}).forEach(function(r){if(!r.tag)r.tag=nextTag('KK');});
}
function devById(id){
  return state.devices.find(function(d){ return d.id === id; }) || null;
}
function relayFor(kmId){
  return state.relays.find(function(r){ return r.kmId === kmId; }) || null;
}
function anyRelayById(id){
  return state.relays.find(function(r){ return r.id === id; }) || null;
}
/* аппарат под нагрузкой: автомат включён либо катушка пускателя под напряжением */
function isLive(dev){
  const kind = TYPES[dev.type].kind;
  if (kind === 'mcb' || kind === 'rcd') return !!(dev.on && !dev.tripped);
  if (kind === 'meter') return meterVoltage(dev) >= 50;
  if (kind === 'sensor') return meterVoltage(dev) >= 50;
  if (kind === 'contactor') return !!dev.coil;
  if (kind === 'lamp') return lampVoltage(dev) >= 50;
  if (kind === 'bulb') return bulbVoltage(dev) >= 50;
  if (kind === 'outlet') return outletVoltage(dev) >= 50;
  if (kind === 'appliance') return applianceVoltage(dev) >= 50;
  if (kind === 'junction'){
    const map=potentialMap();
    return junctionTerms().some(function(t){const v=map.pot[nodeKey({devId:dev.id,key:t.key})];return !!(v&&Math.hypot(v.r,v.i)>=50);});
  }
  if (kind === 'wallSwitch' || kind === 'twoWaySwitch'){
    const map=potentialMap();
    if(map.conflict)return false;
    return ['L','O1','O2'].some(function(key){const v=map.pot[nodeKey({devId:dev.id,key:key})];return !!(v&&Math.hypot(v.r,v.i)>=50);});
  }
  if (kind === 'vfd') return !!(dev.vfdInputReady || dev.running);
  if (kind === 'converter') return !!(dev.tpOn && tpInputState(dev,potentialMap().pot).ready);
  if (kind === 'timer') return !!dev.timerSupply;
  return false;
}

/* ============================================================
   6. ПЕРЕТАСКИВАНИЕ
   ============================================================ */
let drag = null;

/* Касания перехватываются до обработчиков мыши. Короткое касание выполняет
   обычное действие, движение — перенос, удержание корпуса — контекстное меню.
   Второй палец переводит жест в масштабирование, сохраняя черновик провода. */

/* Пять законченных действий; движения одного переноса объединяются. */
let actionUndo=[],actionRedo=[],actionBefore=null,actionTimer=0,actionReady=false;
const actionPointers=new Set();
function actionSnapshot(){return JSON.parse(schemeSignature(schemeSnapshot('')));}
function paintActionHistory(){
  [['actionUndo',actionUndo,'Отменить'],['actionRedo',actionRedo,'Повторить']].forEach(function(item){
    const el=document.getElementById(item[0]);if(!el)return;
    el.disabled=!item[1].length||!!actionPointers.size;
    el.title=item[2]+' ('+item[1].length+' из 5)';
    el.setAttribute('aria-label',el.title);
  });
}
function resetActionHistory(){
  if(actionTimer)clearTimeout(actionTimer);actionTimer=0;
  actionUndo=[];actionRedo=[];actionBefore=null;actionPointers.clear();actionReady=true;paintActionHistory();
}
function beginActionHistory(){
  if(actionReady&&!actionBefore)actionBefore=actionSnapshot();
}
function finishActionHistory(){
  if(actionTimer)clearTimeout(actionTimer);actionTimer=0;
  if(!actionReady||!actionBefore||actionPointers.size)return;
  const before=actionBefore,after=actionSnapshot();actionBefore=null;
  if(JSON.stringify(before)!==JSON.stringify(after)){
    actionUndo.push({before:before,after:after});if(actionUndo.length>5)actionUndo.shift();
    actionRedo=[];paintActionHistory();
  }
}
function queueActionHistory(){
  if(!actionTimer)actionTimer=setTimeout(function(){actionTimer=0;finishActionHistory();},0);
}

function restoreActionHistory(entry,redo){
  const target=redo?entry.after:entry.before,other=redo?entry.before:entry.after;
  const clone=function(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));};
  const same=function(a,b){return JSON.stringify(a)===JSON.stringify(b);};
  cancelWire();cancelConduit();cancelAlignmentGuide();hideWireMenu();hideObjectMenu();hideTouchLoupe();touchPlacement=null;
  const next=clone(target.state);
  ['devices','relays','motors','pushbuttons','panels','clamps','wires','conduits','alignmentGuides'].forEach(function(list){
    (next[list]||[]).forEach(function(obj){
      const live=(state[list]||[]).find(function(o){return o.id===obj.id;});
      const previous=(other.state[list]||[]).find(function(o){return o.id===obj.id;});
      if(!live||!previous||live.type!==obj.type)return;
      // Не откатываем показания, нагрев и другие поля, которых это действие
      // не меняло: симуляция продолжает работать между нажатиями отмены.
      Object.keys(live).forEach(function(key){
        if(same(obj[key],previous[key]))obj[key]=clone(live[key]);
      });
    });
  });
  Object.keys(next).forEach(function(key){
    if(!Array.isArray(next[key])&&same(target.state[key],other.state[key]))next[key]=state[key];
  });
  Object.assign(state,next);
  const pos=target.positions,old=other.positions;
  [['inbox',INBOX],['pushbutton',PB],['motor',MOTOR],['multimeter',METER]].forEach(function(item){
    const saved=pos[item[0]]||{},prior=old[item[0]]||{},live=item[1];
    Object.keys(saved).forEach(function(key){if(!same(saved[key],prior[key]))live[key]=clone(saved[key]);});
  });
  const pm=pos.multimeter||{},prior=old.multimeter||{};
  ['fn','power','a','b','aDocked','bDocked'].forEach(function(key){
    if(!same(pm[key],prior[key]))state.mm[key]=clone(pm[key]);
  });
  state.pb={up:false,stop:false,down:false};
  state.pushbuttons.forEach(function(pb){pb.buttons={up:false,stop:false,down:false};});
  state.clamps.forEach(function(c){c.drag=false;});clampState=null;
  wireSeq=Math.max(1,state.wires.reduce(function(n,w){return Math.max(n,Number(w.id)||0);},0)+1);
  thermalLastTick=Date.now();renderAll();renderMM();touchStatus('');
  paintActionHistory();saveSchemeDraft();
}
function undoAction(){
  if(actionPointers.size)return false;finishActionHistory();
  const entry=actionUndo.pop();if(!entry)return false;
  restoreActionHistory(entry,false);actionRedo.push(entry);paintActionHistory();return true;
}
function redoAction(){
  if(actionPointers.size)return false;finishActionHistory();
  const entry=actionRedo.pop();if(!entry)return false;
  restoreActionHistory(entry,true);actionUndo.push(entry);paintActionHistory();return true;
}

function initActionHistory(){
  function ignored(evt){return evt.touchReplay||(evt.target.closest&&evt.target.closest('.history-controls'));}
  document.addEventListener('pointerdown',function(evt){
    if(ignored(evt)||evt.button>0)return;
    beginActionHistory();actionPointers.add(evt.pointerId);paintActionHistory();
  },true);
  ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,function(evt){
    if(evt.touchReplay)return;actionPointers.delete(evt.pointerId);paintActionHistory();queueActionHistory();
  },true);});
  ['click','input','change'].forEach(function(type){document.addEventListener(type,function(evt){
    if(ignored(evt))return;beginActionHistory();queueActionHistory();
  },true);});
  document.addEventListener('keydown',function(evt){
    if(evt.target.closest&&evt.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(!(evt.ctrlKey||evt.metaKey)||evt.altKey||evt.repeat)return;
    const key=evt.code==='KeyZ'?'z':(evt.code==='KeyY'?'y':String(evt.key).toLowerCase());
    if(key!=='z'&&key!=='y')return;
    evt.preventDefault();evt.stopImmediatePropagation();
    if(key==='y'||evt.shiftKey)redoAction();else undoAction();
  },true);
  if(typeof window.addEventListener==='function')window.addEventListener('blur',function(){actionPointers.clear();paintActionHistory();queueActionHistory();});
  document.getElementById('actionUndo').addEventListener('click',undoAction);
  document.getElementById('actionRedo').addEventListener('click',redoAction);
}

const touchPointers=new Map();
let touchGesture=null,touchPlacement=null,touchMoveFrame=0,touchMoveEvent=null,touchViewFrame=0;
function mobileTouchLayout(){
  return typeof window.matchMedia==='function'
    && window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}
function touchUI(){
  const compact=mobileTouchLayout()||window.innerWidth<=900;
  const root=document.documentElement||document.body;
  root.classList.toggle('touch-ui',compact);
  document.body.classList.toggle('touch-input',compact);
}

/* Лупа только для точного сенсорного подключения. SVG use показывает живую
   сцену без копирования её объектов и повторных электрических расчётов. */
function hideTouchLoupe(){
  const el=document.getElementById('touchLoupe');if(el)el.hidden=true;
}
function updateTouchLoupe(session,point){
  if(!session||touchGesture||touchPointers.size!==1||session.tray||touchPlacement){
    hideTouchLoupe();return;
  }
  const probe=session.target.closest('.mm-probe');
  if(!probe&&(!pending||!session.target.closest('.term,.wire-pending-end'))){hideTouchLoupe();return;}
  const el=document.getElementById('touchLoupe'),svg=document.getElementById('touchLoupeScene');
  if(!el||!svg)return;
  const key=probe&&probe.getAttribute('data-probe');
  const p=key?meterProbePoint(key):(session.mode==='waiting'?svgPoint(point):(pending.pt||svgPoint(point)));
  const wm=ctmNode().getScreenCTM(),sm=scene.getScreenCTM();
  if(!p||!wm||!sm||!sm.a){hideTouchLoupe();return;}
  const screen=new DOMPoint(p.x,p.y).matrixTransform(wm);
  const center=new DOMPoint(screen.x,screen.y).matrixTransform(sm.inverse());
  const size=132,span=(size-6)/(Math.abs(sm.a)*2.5);
  if(!isFinite(center.x)||!isFinite(center.y)||!isFinite(span)){hideTouchLoupe();return;}
  svg.setAttribute('viewBox',(center.x-span/2)+' '+(center.y-span/2)+' '+span+' '+span);
  const width=window.innerWidth,height=window.innerHeight;
  let left=point.clientX-size/2,top=point.clientY-size-66;
  if(top<8)top=point.clientY+54;
  left=Math.max(8,Math.min(width-size-8,left));
  top=Math.max(8,Math.min(height-size-40,top));
  el.style.left=left+'px';el.style.top=top+'px';
  const hit=key?meterProbeHover:null;
  const label=document.getElementById('touchLoupeLabel');
  if(label)label.textContent=hit?tagOf(hit.devId)+' · '+hit.key:(key?'Остриё щупа':'Конец провода');
  el.hidden=false;
}

function touchStatus(text){
  const status=document.getElementById('touchStatus');
  if(status)status.textContent=text||'';
  const cancel=document.getElementById('touchCancel');
  if(cancel)cancel.disabled=!pending&&!touchPlacement&&!conduitDraft;
}
function touchObjectTarget(el){
  let g=el.closest('[data-clamp-id]');if(g)return {kind:'special',key:'clamp',id:g.dataset.clampId};
  g=el.closest('.mm-probe,.multimeter-body');if(g)return {kind:'special',key:'multimeter'};
  g=el.closest('.motor-draggable');if(g)return {kind:'special',key:motorIsDc(motorById(g.dataset.dev))?'dcmotor':'motor',id:g.dataset.dev};
  g=el.closest('.push-station');if(g)return {kind:'special',key:'pushbutton',id:g.dataset.dev};
  g=el.closest('.relay');if(g)return {kind:'relay',id:+g.dataset.rid};
  g=el.closest('.dev');if(g)return {kind:'device',id:+g.dataset.id};
  g=el.closest('.inbox-draggable');if(g){const panel=inboxPanel();return panel?{kind:'special',key:'panel',id:panel.id}:{kind:'special',key:'inbox'};}
  g=el.closest('[data-panel-id]');if(g)return {kind:'special',key:'panel',id:g.dataset.panelId};
  return null;
}
function nearestTouchTerminal(evt){
  const matrix=ctmNode().getScreenCTM();if(!matrix)return null;
  let best=null,distance=22;
  termLayer.querySelectorAll('.term').forEach(function(el){
    const p=new DOMPoint(+el.getAttribute('cx'),+el.getAttribute('cy')).matrixTransform(matrix);
    const d=Math.hypot(p.x-evt.clientX,p.y-evt.clientY);
    if(d<distance){distance=d;best=el;}
  });
  return best;
}
function replayTouch(type,session,point,target){
  const event=new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:session.id,pointerType:'touch',
    isPrimary:true,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,
    clientX:point.clientX,clientY:point.clientY});
  Object.defineProperty(event,'touchReplay',{value:true});
  (target||document).dispatchEvent(event);
}
function touchLayoutSnapshot(session){
  // Только геометрия: отмена жеста не откатывает электрические процессы.
  const target=touchObjectTarget(session.target),wire=session.target.closest('[data-wid]');
  let obj=null;
  if(target){
    if(target.kind==='device')obj=devById(target.id);
    else if(target.kind==='relay'){const r=anyRelayById(target.id);obj=r&&devById(r.kmId);}
    else if(target.key==='panel')obj=panelById(target.id);
    else if(target.key==='motor'||target.key==='dcmotor')obj=motorById(target.id);
    else if(target.key==='pushbutton')obj=pushbuttonById(target.id);
    else if(target.key==='clamp')obj=state.clamps.find(function(c){return c.id===target.id;});
    else if(target.key==='inbox')obj=INBOX;
    else if(target.key==='multimeter')obj=METER;
  }
  const fields=['x','y','rail','slot','wireId','fraction','redX','redY','blackX','blackY','combAnchorId'];
  if(obj){const saved={};fields.forEach(function(k){saved[k]=obj[k];});session.restore=function(){fields.forEach(function(k){if(saved[k]===undefined)delete obj[k];else obj[k]=saved[k];});};}
  if(target&&target.key==='multimeter'){
    const restore=session.restore,a=state.mm.a,b=state.mm.b;
    session.restore=function(){if(restore)restore();state.mm.a=a;state.mm.b=b;};
  }
  const tube=session.target.closest('[data-conduit-id]');
  if(tube){const c=conduitById(tube.dataset.conduitId);if(c){const pts=c.pts.map(function(p){return {x:p.x,y:p.y};});session.restore=function(){c.pts=pts;};}}
  const guide=session.target.closest('[data-alignment-guide]');
  if(guide){const g=alignmentGuideById(guide.dataset.alignmentGuide);if(g){const position=g.position;session.restore=function(){g.position=position;};}}
  if(wire){const w=state.wires.find(function(w){return w.id===+wire.dataset.wid;});if(w){const pts=JSON.parse(JSON.stringify(w.pts||[])),id=w.conduitId,entry=w.conduitEntry,entryEnd=w.conduitEntryEnd,exit=w.conduitExit;session.restore=function(){w.pts=pts;w.conduitId=id;w.conduitEntry=entry;w.conduitEntryEnd=entryEnd;w.conduitExit=exit;delete w.previewConduitId;delete w.previewConduitEntry;delete w.previewConduitEntryEnd;};}}
}
function startTouchAction(session,point){
  clearTimeout(session.timer);session.timer=null;
  const actual=document.elementFromPoint(session.sx,session.sy);
  if(session.target.closest('.term'))session.target=nearestTouchTerminal({clientX:session.sx,clientY:session.sy})||session.target;
  else if(!session.target.closest('.wire-pending-end')&&actual&&actual.closest&&(actual.closest('#scene')||actual.closest('.tray-item')))session.target=actual;
  touchLayoutSnapshot(session);
  session.mode='action';
  const term=session.target.closest('.term');
  const continueWire=pending&&term&&sameTerm(pending.from,toDevId(term.dataset.dev),term.dataset.key)
    &&Math.hypot(point.clientX-session.sx,point.clientY-session.sy)>8;
  if(!continueWire)replayTouch('pointerdown',session,{clientX:session.sx,clientY:session.sy},session.target);
  if(session.tray)sideMenuItems.forEach(function(item){item.open=false;});
  updateTouchLoupe(session,point);
}
function flushTouchMove(){
  if(touchMoveFrame){cancelAnimationFrame(touchMoveFrame);touchMoveFrame=0;}
  const move=touchMoveEvent;touchMoveEvent=null;
  if(move){replayTouch('pointermove',move.session,move.point);updateTouchLoupe(move.session,move.point);}
}
function cancelTouchAction(session){
  hideTouchLoupe();
  clearTimeout(session.timer);
  if(touchMoveFrame){cancelAnimationFrame(touchMoveFrame);touchMoveFrame=0;}touchMoveEvent=null;
  if(session.mode!=='action')return;
  // Сбрасываем перенос до pointercancel, чтобы отпускание не включило аппарат
  // и не установило щуп/деталь при переходе к жесту двумя пальцами.
  if(drag){drag.ghost.remove();drag=null;}
  if(specialTrayDrag){specialTrayDrag.ghost.remove();specialTrayDrag=null;}
  freeDeviceDrag=null;motorDrag=null;inboxDrag=null;pushStationDrag=null;
  meterDrag=null;meterProbeDrag=null;meterProbeHover=null;wireGrab=null;
  if(panelDragFrame)cancelAnimationFrame(panelDragFrame);
  panelDragFrame=0;panelDrag=null;panelDragPointer=null;
  if(clampDragFrame)cancelAnimationFrame(clampDragFrame);
  clampDragFrame=0;clampDragPointer=null;if(clampState)clampState.drag=false;
  replayTouch('pointercancel',session,session);
  if(session.restore)session.restore();
  renderAll();
}
function touchPair(){
  const points=Array.from(touchPointers.values());
  return {x:(points[0].clientX+points[1].clientX)/2,y:(points[0].clientY+points[1].clientY)/2,
    distance:Math.max(1,Math.hypot(points[0].clientX-points[1].clientX,points[0].clientY-points[1].clientY))};
}
function moveTouchView(){
  if(!touchGesture)return;
  const g=touchGesture;
  if(!touchPointers.size||(g.pinch&&touchPointers.size<2))return;
  const pair=g.pinch?touchPair():Array.from(touchPointers.values())[0];
  const cx=g.pinch?pair.x:pair.clientX,cy=g.pinch?pair.y:pair.clientY;
  const width=Math.max(Z_MIN,Math.min(maxViewWidth(),g.width*(g.pinch?g.distance/pair.distance:1)));
  const rect=scene.getBoundingClientRect();
  // SVG xMidYMid meet может оставлять поля сбоку или сверху. Якорь жеста
  // должен оставаться под пальцами и в портретной, и в альбомной компоновке.
  const height=width*viewAspect(),scale=Math.min(rect.width/width,rect.height/height);
  if(!(scale>0))return;
  // Берём фактическое выравнивание SVG: стенд сдвинут влево, другие сцены могут быть по центру.
  const matrix=scene.getScreenCTM();
  const offsetX=matrix?matrix.e-rect.left+view.x*matrix.a:(rect.width-width*scale)/2;
  const offsetY=rect.height-height*scale;
  view.w=width;view.h=width*viewAspect();
  view.x=g.anchor.x-(cx-rect.left-offsetX)/scale;view.y=g.anchor.y-(cy-rect.top-offsetY)/scale;
  clampView();applyView();
}
function flushTouchView(){
  if(touchViewFrame){cancelAnimationFrame(touchViewFrame);touchViewFrame=0;moveTouchView();}
}
function queueTouchView(){
  if(!touchViewFrame)touchViewFrame=requestAnimationFrame(function(){touchViewFrame=0;moveTouchView();});
}
function startTouchView(pinch,session,continuing){
  hideTouchLoupe();
  flushTouchView();
  const pair=pinch?touchPair():{x:continuing?session.clientX:session.sx,y:continuing?session.clientY:session.sy};
  touchGesture={pinch:pinch,width:view.w,distance:pair.distance,anchor:screenToScene(pair.x,pair.y)};
  touchPointers.forEach(function(s){cancelTouchAction(s);s.mode='gesture';clearTimeout(s.timer);});
  hideWireMenu();hideObjectMenu();
}
function stopTouchEvent(evt){evt.preventDefault();evt.stopImmediatePropagation();}
function onTouchStart(evt){
  if(evt.pointerType!=='touch'||evt.touchReplay)return;
  const target=evt.target;
  if(!target.closest)return;
  const tray=target.closest('.tray-item');
  // Текст карточки прокручивает лоток; за превью деталь можно перетащить.
  if(tray&&!target.closest('.mini'))return;
  if(!tray&&!target.closest('#scene'))return;
  if(target.closest('input,select,textarea,button,.motor-load-slider'))return;
  touchUI();stopTouchEvent(evt);
  const s={id:evt.pointerId,target:target,tray:!!tray,sx:evt.clientX,sy:evt.clientY,
    clientX:evt.clientX,clientY:evt.clientY,mode:'waiting',timer:null};
  if(!tray&&!alignmentDraft&&!target.closest('.mm-probe,.hdl,[data-rcd-test],[data-pb],[data-zone],[data-vfd-control],[data-tp-control],[data-timer-control],.mm-mode,[data-switch-key],[data-two-way-switch],[data-appliance-toggle],[data-alignment-guide],.wire-pending-end')){
    const term=nearestTouchTerminal(evt);if(term)s.target=term;
  }
  touchPointers.set(s.id,s);
  if(typeof scene.setPointerCapture==='function')try{scene.setPointerCapture(s.id);}catch(e){}
  if(touchPointers.size===2){startTouchView(true,s);return;}
  if(touchPointers.size>2){s.mode='gesture';return;}
  if(touchPlacement)return;
  const hold=s.target.closest('[data-pb],[data-zone="manual-contactor"],[data-vfd-control],[data-tp-control]');
  if(hold){startTouchAction(s,evt);return;}
  if(!tray&&!pending&&!s.target.closest('.term')&&(touchObjectTarget(s.target)||s.target.closest('[data-wid]'))){
    s.timer=setTimeout(function(){
      if(s.mode!=='waiting'||touchPointers.size!==1)return;
      s.mode='menu';hideTouchLoupe();
      const wire=s.target.closest('[data-wid]');
      if(wire){hideObjectMenu();showWireMenu(+wire.dataset.wid,s.clientX,s.clientY,svgPoint(s));}
      else showObjectMenu({clientX:s.clientX,clientY:s.clientY,preventDefault:function(){},stopPropagation:function(){}},touchObjectTarget(s.target));
    },600);
  }
  if(pending||s.target.closest('.mm-probe'))updateTouchLoupe(s,evt);
}
function onTouchMove(evt){
  if(evt.pointerType!=='touch'||evt.touchReplay)return;
  const s=touchPointers.get(evt.pointerId);if(!s)return;
  stopTouchEvent(evt);s.clientX=evt.clientX;s.clientY=evt.clientY;
  if(touchGesture){if(touchPointers.size>=2||!touchGesture.pinch)queueTouchView();return;}
  if(s.mode==='gesture'||s.mode==='menu'||touchPlacement)return;
  if(s.mode==='waiting'&&Math.hypot(s.clientX-s.sx,s.clientY-s.sy)>8){
    clearTimeout(s.timer);
    const object=touchObjectTarget(s.target);
    const background=!object||(object.key==='panel'&&panelIsFixed(panelById(object.id)));
    // При выбранной клемме фон перемещает поле. Провод тянут только за его
    // свободный наконечник или непосредственно из начальной клеммы.
    if(!s.tray&&!s.target.closest('.term,.wire-pending-end')&&!conduitDraft&&!alignmentDraft
      &&(pending||background&&!s.target.closest('[data-wid],[data-conduit-id],[data-alignment-guide]'))){startTouchView(false,s);queueTouchView();return;}
    if((pending||conduitDraft||alignmentDraft)&&!s.target.closest('.term,.wire-pending-end'))s.mode='route';
    else startTouchAction(s,evt);
  }
  if(s.mode==='action'||s.mode==='route'){
    touchMoveEvent={session:s,point:{clientX:s.clientX,clientY:s.clientY}};
    if(!touchMoveFrame)touchMoveFrame=requestAnimationFrame(function(){touchMoveFrame=0;flushTouchMove();});
  }
}
function placeTouchItem(point){
  const spec=touchPlacement;touchPlacement=null;if(!spec)return;
  const evt={clientX:point.clientX,clientY:point.clientY,pointerId:point.id,preventDefault:function(){}};
  if(spec.special){startSpecialTrayDrag(evt,spec.special);specialTrayDrag.moved=true;finishSpecialTrayDrag(evt);}
  else{startDrag(evt,{type:spec.type});drag.moved=true;drag.candidate=computeCandidate(evt);onPointerUp(evt);}
  touchStatus('');
}
function onTouchEnd(evt){
  if(evt.pointerType!=='touch'||evt.touchReplay)return;
  const s=touchPointers.get(evt.pointerId);if(!s)return;
  stopTouchEvent(evt);clearTimeout(s.timer);
  s.clientX=evt.clientX;s.clientY=evt.clientY;
  flushTouchView();
  if(evt.type==='pointercancel')cancelTouchAction(s);
  else if(!touchGesture&&s.mode!=='menu'&&s.mode!=='gesture'){
    flushTouchMove();
    if(touchPlacement&&!s.tray)placeTouchItem(s);
    else if(s.mode==='waiting'){
      if(s.tray){const item=s.target.closest('.tray-item');chooseTouchPlacement(item);}
      else{startTouchAction(s,s);replayTouch('pointerup',s,s);}
    }else{
      if(s.mode==='route'&&(alignmentDraft||!nearestTouchTerminal(s)))replayTouch('pointerdown',s,s,scene);
      replayTouch('pointerup',s,s);
    }
  }
  hideTouchLoupe();
  touchPointers.delete(s.id);
  if(typeof scene.releasePointerCapture==='function')try{scene.releasePointerCapture(s.id);}catch(e){}
  // Перебазируем якорь при изменении числа пальцев: без скачка масштаба
  // и без ложного клика оставшийся палец продолжает перенос рабочего поля.
  if(touchGesture&&touchGesture.pinch&&touchPointers.size){
    startTouchView(touchPointers.size>=2,Array.from(touchPointers.values())[0],true);
  }
  if(!touchPointers.size)touchGesture=null;
  touchStatus(touchPlacement?'Коснитесь места установки.':(pending?'Выберите вторую клемму. Поле можно перемещать, конец провода — тянуть за наконечник.':''));
}
function chooseTouchPlacement(item){
  if(item.dataset.special==='conduit'){startConduit();return;}
  cancelConduit();
  touchPlacement=item.dataset.special?{special:item.dataset.special}:{type:item.dataset.type};
  cancelWire();sideMenuItems.forEach(function(menu){menu.open=false;});
  touchStatus('Коснитесь места установки.');
}
function initTouchControls(){
  // Крупные кнопки нужны узкому окну и экрану с основным сенсорным вводом.
  // Дополнительный тачскрин широкого рабочего ПК не меняет desktop UI.
  touchUI();
  document.addEventListener('pointerdown',onTouchStart,{capture:true,passive:false});
  document.addEventListener('pointermove',onTouchMove,{capture:true,passive:false});
  document.addEventListener('pointerup',onTouchEnd,{capture:true,passive:false});
  document.addEventListener('pointercancel',onTouchEnd,{capture:true,passive:false});
  scene.addEventListener('contextmenu',function(e){if(e.pointerType==='touch'||touchPointers.size){e.preventDefault();e.stopImmediatePropagation();}},true);
  const cancel=document.getElementById('touchCancel');
  if(cancel)cancel.addEventListener('click',function(){touchPlacement=null;cancelWire();cancelConduit();hideWireMenu();hideObjectMenu();touchStatus('');});
  document.getElementById('tray').addEventListener('click',function(e){const button=e.target.closest('.tray-add');if(button)chooseTouchPlacement(button.closest('.tray-item'));});
  if(typeof window.addEventListener==='function')window.addEventListener('blur',function(){
    hideTouchLoupe();
    if(touchViewFrame)cancelAnimationFrame(touchViewFrame);touchViewFrame=0;
    touchPointers.forEach(cancelTouchAction);touchPointers.clear();touchGesture=null;
  });
}
initActionHistory();
initTouchControls();

/* координаты считаем в системе группы world (в ней лежат все слои) —
   иначе после сдвига сцены курсор «промахивается» мимо аппаратов и клемм */
const worldGroup = document.getElementById('world');
function ctmNode(){
  return (worldGroup && typeof worldGroup.getScreenCTM === 'function') ? worldGroup : scene;
}
function svgPoint(evt){
  const m = ctmNode().getScreenCTM();
  if (!m) return { x:NaN, y:NaN };
  return new DOMPoint(evt.clientX, evt.clientY).matrixTransform(m.inverse());
}
function sceneScale(){
  return ctmNode().getScreenCTM().a;
}
function buildGhost(type,object){
  object=object||{};
  const t = TYPES[type], w = type==='comb'?combWidth(object):t.modules*MODULE, h = t.h, k = sceneScale();
  const over = t.over || 0, overR = t.overR || 0;
  const vw = w + overR, vh = h + over;
  const div = document.createElement('div');
  div.className = 'ghost';
  div.innerHTML = '<svg width="'+(vw*k)+'" height="'+(vh*k)+'" viewBox="0 '+(-over)+' '+vw+' '+vh+'">'
                + deviceInner(type, object) + '</svg>';
  return div;
}
function placeGhost(evt){
  const k = sceneScale();
  const c=drag.candidate,m=ctmNode().getScreenCTM();
  const pos=c&&c.free&&m?new DOMPoint(c.x,c.y).matrixTransform(m):null;
  drag.ghost.style.left = (pos?pos.x:evt.clientX - drag.offX*k) + 'px';
  drag.ghost.style.top  = (pos?pos.y:evt.clientY - drag.offY*k) + 'px';
}
function computeCandidate(evt){
  const p = svgPoint(evt), t = TYPES[drag.type];
  if (!isFinite(p.x) || !isFinite(p.y)) return null;
  const box=snapAlignmentBox(p.x-drag.offX,p.y-drag.offY,t.modules*MODULE,t.h,evt),left=box.x,top=box.y;

  // Светильники и другие монтажные объекты размещаются свободно на поле.
  if(drag.type==='comb')return drag.id?combPlacement(left,top,drag):newCombPlacement(left,top);
  if(t.freeOnly)return {free:true,x:left,y:top,ok:true};

  // тепловое реле ставится не на рейку, а на нижние зажимы пускателя
  if (t.kind === 'relay'){
    const centerX = left + t.modules*MODULE/2;
    let best = null, bestD = Infinity;
    state.devices.forEach(function(d){
      if (d.type !== 'km1') return;
      const ko=originOf(d),kmX=ko.x;
      const kmCX = kmX + TYPES.km1.modules*MODULE/2;
      const attachY = ko.y + TYPES.km1.h - RELAY_DROP;
      const dx = Math.abs(centerX - kmCX), dy = Math.abs(top - attachY);
      const dist = dx*0.7 + dy;
      if (dx < 95 && dy < 130 && dist < bestD){ bestD = dist; best = d; }
    });
    if (!best) return null;
    return { relay:true, kmId:best.id, rail:best.rail, slot:best.slot,
             ok: (!relayFor(best.id) || (drag.relayId && relayFor(best.id) && relayFor(best.id).id === drag.relayId)) && dinPlacementFits(best.type,best.rail,best.slot,best.id,true) };
  }

  const centerY = top + t.h/2;
  return railPlacement(left,centerY,t.modules,drag.id,drag.type,!!drag.attachedRelay);
}

function canToggleDeviceByClick(dev,target){
  if(dev.type==='comb')return false;
  const kind=TYPES[dev.type].kind;
  return kind!=='mcb'&&kind!=='rcd'||!!(target&&target.closest&&target.closest('.hdl'));
}

function startDrag(evt, spec){
  evt.preventDefault();
  cancelAlignmentGuide();
  cancelWire();
  const t = TYPES[spec.type];
  if(spec.type==='comb')spec=Object.assign({},combTraySettings,spec);
  let offX = spec.offX, offY = spec.offY;
  if (offX === undefined){                 // из лотка берём аппарат «за середину»
    offX = spec.type==='comb'?combWidth(spec)/2:t.modules*MODULE/2;
    offY = t.h*0.5;
  }
  drag = {
    id: spec.id || null, relayId: spec.relayId || null, relaySet: spec.relaySet, relayState: spec.relayId?Object.assign({},anyRelayById(spec.relayId)):null,
    type: spec.type, combPoles:spec.combPoles,combCount:spec.combCount, offX: offX, offY: offY,
    sx: evt.clientX, sy: evt.clientY, moved:false, live:true,
    toggleOnClick:canToggleDeviceByClick(spec,evt.target),
    ghost: buildGhost(spec.type,spec), candidate:null, prev: spec.prev || null, attachedRelay:null
  };
  document.body.appendChild(drag.ghost);
  placeGhost(evt);
}

function onPointerMove(evt){
  if (!drag) return;
  if (!drag.moved && Math.hypot(evt.clientX-drag.sx, evt.clientY-drag.sy) > 4){
    drag.moved = true;
    if ((drag.id || drag.relayId) && drag.live){
      if (drag.relayId){                       // снимаем реле с пускателя
        state.relays = state.relays.filter(function(r){ return r.id !== drag.relayId; });
        removeWiresFor('kk'+drag.relayId);
        drag.live = false;
      } else {
        const kind = TYPES[drag.type].kind;
        if (kind === 'contactor'){             // реле снимается вместе с пускателем
          const r = relayFor(drag.id);
          if (r){
            drag.attachedRelay = Object.assign({},r);
            state.relays = state.relays.filter(function(x){ return x.id !== r.id; });
            removeWiresFor('kk'+r.id);
          }
        }
        removeWiresFor(drag.id);
        state.devices = state.devices.filter(function(d){ return d.id !== drag.id; });
        drag.live = false;
      }
    }
  }
  drag.candidate = computeCandidate(evt);
  placeGhost(evt);
  renderDevices();
  renderRelays();
}
function onPointerUp(evt){
  if (!drag) return;
  const d = drag, cand = d.moved ? computeCandidate(evt) : d.candidate;
  d.ghost.remove();
  drag = null;

  if (!d.moved){                           // короткий клик
    if (d.id && d.relayId){
      const r = anyRelayById(d.relayId);
      if (r) log('Тепловое реле '+tagOf('kk'+r.id)+': уставка '+r.set+' А, контакт 95-96 '+(r.tripped?'разомкнут (сработало)':'замкнут')+'.', 'info');
    } else if (d.id){
      const dev = devById(d.id);
      if (dev && d.toggleOnClick && evt.type!=='pointercancel') toggleDevice(dev);
    }
    return;
  }

  const underLoad = !!(d.prev && d.prev.live);

  if (cand && cand.ok){
    if (cand.relay){
      const r = { id: d.relayId || state.nextId++, kmId: cand.kmId, tripped:false, set:(d.relaySet || 25), tested:false,
                  tag:d.tag || nextTag('KK') };
      if(d.relayState)Object.assign(r,d.relayState,{kmId:cand.kmId});
      syncThermalSettings(r);
      state.relays.push(r);
      log('Тепловое реле '+tagOf('kk'+r.id)+' посажено щупами на зажимы 2 T1 / 4 T2 / 6 T3 пускателя '+tagOf(cand.kmId)+'. Своя DIN-рейка не нужна.', 'ok');
    } else {
      const dev = { id: d.id || state.nextId++, type:d.type, rail:cand.rail, slot:cand.slot,
                    on:false, tripped:false, coil:false, tag:d.tag || nextDeviceTag(d.type) };
      if(cand.free){dev.x=cand.x;dev.y=cand.y;delete dev.rail;delete dev.slot;}
      if(d.type==='comb'){dev.combPoles=combPoles(cand.combPoles?cand:d);dev.combCount=combCount(cand.combCount?cand:d);if(cand.comb)dev.combAnchorId=cand.combAnchorId;}
      if (d.type === 'lamp'){
        dev.indicator = d.indicator || nextLampIndicator();
      }
      if (d.type === 'timer'){
        dev.timerRange=10;dev.timerLevel=0.5;dev.timerMode='on';
        dev.timerActive=false;dev.timerSupply=false;dev.timerSince=null;dev.timerLastSignal=false;
      }
      if (d.type === 'meter'){
        dev.energyKwh=0;dev.meterPowerW=0;dev.meterPulse=false;
      }
      if (d.type === 'sensor'){
        dev.sensorVoltage=0;dev.sensorCurrentA=0;
      }
      if (d.type === 'wallSwitch'){
        dev.gangs=1;dev.switchOn1=false;dev.switchOn2=false;
        dev.ratedVoltage=220;dev.ratedCurrent=10;
      }
      if (d.type === 'twoWaySwitch'){
        dev.switchPosition=1;dev.ratedVoltage=220;dev.ratedCurrent=10;
      }
      if (['mcb1','mcb2','mcb3'].includes(d.type)){
        dev.breakerType=d.type==='mcb3'?'C25':'C10';
        dev.ratedCurrent=breakerNominalCurrent(dev);dev.ratedVoltage=ratedVoltageOf(dev);
        dev.customName=protectiveDeviceName(dev);
        dev.breakerHeat=0;dev.breakerCurrentA=0;dev.breakerPhaseCurrents=[];
      }
      if(d.type==='rcd')syncRcdRatings(dev);
      if (TYPES[d.type].kind === 'appliance'){
        dev.applianceOn=false;dev.applianceBurned=false;
        dev.ratedVoltage=220;dev.ratedPower=TYPES[d.type].defaultPower;
        syncApplianceRatings(dev);
      }
      if (d.type === 'vfd'){
        dev.ratedVoltage=380;dev.ratedCurrent=10;dev.baseFrequency=50;dev.maxFrequency=100;
        dev.setFrequency=50;dev.running=false;dev.reverse=false;dev.fault=false;
        dev.vfdInputReady=false;dev.vfdOutputActive=false;
      }
      state.devices.push(dev);
      const placement = TYPES[d.type].title
          + (cand.free ? ' — свободное размещение на рабочем поле.'
                       : ' — рейка ' + mountingRailTitle(cand.rail) + ', позиция ' + (cand.slot+1));
      if (d.id) trace('Аппарат перемещён: ' + placement);   // перенос по полю — рутина
      else log('Установлен: ' + placement, 'ok');
      if (d.attachedRelay){                    // реле едет вместе с пускателем
        state.relays.push(Object.assign({},d.attachedRelay,{kmId:dev.id}));
      }
    }
    if (underLoad) warn('Аппарат снят с рейки под нагрузкой. В реальности это недопустимо: сначала отключите его.');
  } else if(d.type==='comb'){
    warn('Гребёнка устанавливается только на верхние клеммы ряда из '+combCount(d)+' автоматов '+combPoles(d)+'P.');
  } else if (cand && !cand.ok){
    if (d.relayId) log('Тепловое реле снято с пускателя и возвращено в лоток.', 'info');
    else if (d.id) log('Не удалось установить: место занято. ' + TYPES[d.type].title + ' возвращён в лоток.', 'warn');
  } else if (d.id){
    if (d.relayId) log('Тепловое реле KK1 снято с пускателя и возвращено в лоток.', 'info');
    else log('Аппарат снят с DIN-рейки: ' + TYPES[d.type].title
        + (d.attachedRelay ? ' вместе с тепловым реле' : '')
        + (underLoad ? ' (под нагрузкой — недопустимо!)' : ''), underLoad ? 'err' : 'info');
  }
  renderAll();
}

document.addEventListener('pointermove', onPointerMove);
document.addEventListener('pointerup', onPointerUp);

/* Перетаскивание крупных объектов из лотка на свободное место рабочего поля. */
let specialTrayDrag=null;
function specialGhostSize(key){
  if(key==='panel')return {w:PANEL.width,h:panelHeight({railCount:2})};
  if(key==='clamp')return {w:172,h:72};
  if(key==='motor'||key==='dcmotor')return {w:MOTOR.w*MOTOR.scale,h:MOTOR.h*MOTOR.scale};
  if(key==='pushbutton')return {w:PB.w+48,h:PB.h};
  if(key==='multimeter')return {w:METER.w,h:METER.h+28};
  if(key==='inbox')return {w:inboxWidth(),h:INBOX.h};
  return {w:180,h:120};
}
function placeSpecialGhost(evt,d){
  const m=ctmNode().getScreenCTM(),p=snapAlignmentPoint(svgPoint(evt),evt);
  const center=m&&Number.isFinite(p.x)?new DOMPoint(p.x,p.y).matrixTransform(m):{x:evt.clientX,y:evt.clientY};
  d.ghost.style.left=(center.x-d.screenW/2)+'px';
  d.ghost.style.top=(center.y-d.screenH/2)+'px';
}
function startSpecialTrayDrag(evt,key){
  cancelAlignmentGuide();
  if(key==='conduit'){evt.preventDefault();startConduit();conduitDraft.trayPointer=evt.pointerId;return;}
  cancelConduit();
  evt.preventDefault();cancelWire();
  const ghost=document.createElement('div');
  ghost.className='ghost special-ghost';ghost.innerHTML=specialTrayPreview(key);
  const size=specialGhostSize(key),k=sceneScale();
  const screenW=size.w*k,screenH=size.h*k;
  ghost.style.width=screenW+'px';ghost.style.height=screenH+'px';
  document.body.appendChild(ghost);
  specialTrayDrag={pointerId:evt.pointerId,key:key,sx:evt.clientX,sy:evt.clientY,moved:false,
                   ghost:ghost,screenW:screenW,screenH:screenH};
  placeSpecialGhost(evt,specialTrayDrag);
}
document.addEventListener('pointermove',function(evt){
  const d=specialTrayDrag;if(!d||evt.pointerId!==d.pointerId)return;
  if(Math.hypot(evt.clientX-d.sx,evt.clientY-d.sy)>4)d.moved=true;
  placeSpecialGhost(evt,d);
});
function finishSpecialTrayDrag(evt){
  const d=specialTrayDrag;if(!d||(evt.pointerId!==undefined&&evt.pointerId!==d.pointerId))return;
  specialTrayDrag=null;d.ghost.remove();
  const rect=scene.getBoundingClientRect();
  const overScene=evt.clientX>=rect.left&&evt.clientX<=rect.right&&evt.clientY>=rect.top&&evt.clientY<=rect.bottom;
  if(d.moved&&!overScene){renderTray();return;}
  if(d.key==='panel'){
    const p=snapAlignmentPoint(d.moved?svgPoint(evt):svgPoint({clientX:rect.left+rect.width*.5,clientY:rect.top+rect.height*.5}),evt);
    const n=nextSpecialNumber(state.panels,'PN');
    const withInbox=!state.special.inbox;
    state.panels.push({id:'PN'+n,tag:'ЩР'+n,railCount:2,x:p.x-PANEL.width/2,y:p.y-panelHeight({railCount:2})/2,inbox:withInbox,inletVoltage:380,fixed:true});
    if(withInbox)state.special.inbox=true;
    renderAll();return;
  }
  if(d.key==='clamp'){
    const p=snapAlignmentPoint(d.moved?svgPoint(evt):svgPoint({clientX:rect.left+rect.width*.35,clientY:rect.top+rect.height*.3}),evt);
    const clamp=createClamp(p.x-50,p.y);
    const hit=clampNearestWire(clamp);
    if(hit){clamp.wireId=hit.id;clamp.fraction=hit.fraction;clamp.x=hit.x;clamp.y=hit.y;}
    renderClamp();renderTray();return;
  }
  if(d.moved){
    const p=snapAlignmentPoint(svgPoint(evt),evt);
    if(d.key==='motor'){
      const n=nextSpecialNumber(state.motors,'M');
      state.motors.push({id:'M'+n,tag:'M'+n,x:p.x-MOTOR.w*MOTOR.scale/2,y:p.y-MOTOR.h*MOTOR.scale/2,
        w:MOTOR.w,h:MOTOR.h,scale:MOTOR.scale,load:0,rpmActual:0,angle:0,
        polePairs:2,ratedSlipPercent:10,ratedFrequency:50,ratedVoltage:380,ratedCurrent:9,ratedPower:4});
    }
    else if(d.key==='dcmotor'){
      const n=nextSpecialNumber(state.motors,'MD');
      state.motors.push(newDcMotor('MD'+n,p.x-MOTOR.w*MOTOR.scale/2,p.y-MOTOR.h*MOTOR.scale/2));
    }
    else if(d.key==='pushbutton'){
      const n=nextSpecialNumber(state.pushbuttons,'PB'),first=(n-1)*3+1;
      state.pushbuttons.push({id:'PB'+n,tag:'SB'+first+'–SB'+(first+2),x:p.x-PB.w/2,y:p.y-PB.h/2,w:PB.w,h:PB.h,buttons:{up:false,stop:false,down:false}});
    }
    else if(d.key==='inbox'){INBOX.x=p.x-inboxWidth()/2;INBOX.y=p.y-INBOX.h/2;}
    else if(d.key==='multimeter'){
      METER.x=p.x-METER.w/2;METER.y=p.y-METER.h/2;
      meterResetProbes();
    }
  }
  if(d.key!=='motor'&&d.key!=='dcmotor'&&d.key!=='pushbutton')state.special[d.key]=true;
  const what=d.key==='dcmotor'?'Машина постоянного тока':(d.key==='motor'?'Асинхронный двигатель':'Объект');
  log(what+' установлен из лотка на рабочее поле.','ok');
  renderAll();
}
document.addEventListener('pointerup',finishSpecialTrayDrag);
document.addEventListener('pointercancel',finishSpecialTrayDrag);

/* перетаскивание из лотка */
document.getElementById('tray').addEventListener('pointerdown', function(evt){
  const item = evt.target.closest('.tray-item');
  if (!item) return;
  if(evt.target.closest('.tray-add,input,select')||(evt.pointerType==='touch'&&!evt.touchReplay))return;
  if (evt.button !== 0) return;
  if(item.dataset.special){
    startSpecialTrayDrag(evt,item.dataset.special);
    return;
  }
  startDrag(evt, { type: item.dataset.type });
});

/* Свободное перемещение установленного аппарата. Его клеммы остаются теми же,
   поэтому все подключённые провода перестраиваются вслед за корпусом. */
let freeDeviceDrag = null;
function startFreeDeviceDrag(evt, dev, offX, offY){
  evt.preventDefault();
  cancelWire();
  const o = originOf(dev);
  freeDeviceDrag = { pointerId:evt.pointerId, devId:dev.id, type:dev.type, offX:offX, offY:offY,
                     sx:evt.clientX, sy:evt.clientY, moved:false, startX:o.x, startY:o.y,
                     toggleOnClick:canToggleDeviceByClick(dev,evt.target),
                     placement:{x:dev.x,y:dev.y,rail:dev.rail,slot:dev.slot,combAnchorId:dev.combAnchorId} };
}
function computeFreeRailCandidate(evt, fd){
  const p = svgPoint(evt), t = TYPES[fd.type];
  if(fd.type==='comb')return combPlacement(p.x-fd.offX,p.y-fd.offY,devById(fd.devId));
  if (!isFinite(p.x) || !isFinite(p.y)) return null;
  if(t.freeOnly)return null;
  const box=snapAlignmentBox(p.x-fd.offX,p.y-fd.offY,t.modules*MODULE,t.h,evt),left=box.x,top=box.y,centerY=top+t.h/2;
  return railPlacement(left,centerY,t.modules,fd.devId,fd.type,!!relayFor(fd.devId));
}
document.addEventListener('pointermove', function(evt){
  if (!freeDeviceDrag || evt.pointerId !== freeDeviceDrag.pointerId) return;
  const p = svgPoint(evt), d = devById(freeDeviceDrag.devId);
  if (!d) return;
  if (!freeDeviceDrag.moved && Math.hypot(evt.clientX-freeDeviceDrag.sx, evt.clientY-freeDeviceDrag.sy) <= 4) return;
  freeDeviceDrag.moved = true;
  if(d.type==='comb')delete d.combAnchorId;
  const t=TYPES[d.type],box=snapAlignmentBox(p.x-freeDeviceDrag.offX,p.y-freeDeviceDrag.offY,t.modules*MODULE,t.h,evt);
  d.x = box.x;
  d.y = box.y;
  freeDeviceDrag.candidate = computeFreeRailCandidate(evt, freeDeviceDrag);
  renderDevices();
  renderRelays();
  renderWires();
  renderTerminals();
});
function finishFreeDeviceDrag(evt){
  if (!freeDeviceDrag || (evt.pointerId !== undefined && evt.pointerId !== freeDeviceDrag.pointerId)) return;
  const fd=freeDeviceDrag,d=devById(fd.devId),moved=fd.moved;
  // Перепроверяем место при отпускании, а не используем устаревший результат pointermove.
  const cancelled=evt.type==='pointercancel';
  const candidate=moved&&!cancelled?computeFreeRailCandidate(evt,fd):null;
  if(moved&&d){
    if(candidate&&candidate.ok&&candidate.comb){
      d.combAnchorId=candidate.combAnchorId;d.x=candidate.x;d.y=candidate.y;delete d.rail;delete d.slot;
      log('Гребёнка установлена на верхние клеммы '+combCount(d)+' автоматов.','ok');
    }else if(candidate&&candidate.ok){
      d.rail=candidate.rail;d.slot=candidate.slot;
      delete d.x;delete d.y;
      log('Аппарат установлен на DIN-рейку '+mountingRailTitle(candidate.rail)+', позиция '+(candidate.slot+1)+'.','ok');
    }else if(cancelled||d.type==='comb'||!TYPES[d.type].freeOnly){
      ['x','y','rail','slot','combAnchorId'].forEach(function(key){
        if(fd.placement[key]===undefined)delete d[key];else d[key]=fd.placement[key];
      });
      if(!cancelled)log(d.type==='comb'?'Гребёнка устанавливается только на верхние клеммы полного ряда из '+combCount(d)+' подходящих автоматов. Перенос отменён.':candidate?'Место на DIN-рейке занято. Аппарат возвращён на исходное место.':'Этот аппарат устанавливается только на DIN-рейку. Перенос отменён.','warn');
    }
  }
  freeDeviceDrag=null;
  if(!moved&&d&&fd.toggleOnClick&&!cancelled)toggleDevice(d);
  else{
    renderDevices();renderRelays();renderWires();renderTerminals();
  }
}

document.addEventListener('pointerup', finishFreeDeviceDrag);
document.addEventListener('pointercancel', finishFreeDeviceDrag);

/* Удержание ▲/▼: первый шаг выполняется сразу, непрерывное изменение начинается
   после короткой паузы и прекращается при отпускании кнопки в любом месте окна. */
let vfdFrequencyHold=null;
function releaseVfdFrequencyHold(evt){
  const hold=vfdFrequencyHold;
  if(!hold||(evt&&evt.pointerId!==undefined&&evt.pointerId!==hold.pointerId))return;
  vfdFrequencyHold=null;
  clearTimeout(hold.delayTimer);clearInterval(hold.repeatTimer);
  const dev=devById(hold.devId);
  if(dev&&dev.vfdPressToken===hold.pressToken)delete dev.vfdPressed;
  renderDevices();
}
function startVfdFrequencyHold(evt,dev,control,pressToken){
  if(vfdFrequencyHold)releaseVfdFrequencyHold();
  dev.vfdPressed=control;
  const hold={pointerId:evt.pointerId,devId:dev.id,control:control,pressToken:pressToken,delayTimer:null,repeatTimer:null};
  vfdFrequencyHold=hold;
  hold.delayTimer=setTimeout(function(){
    if(vfdFrequencyHold!==hold)return;
    hold.repeatTimer=setInterval(function(){
      if(vfdFrequencyHold!==hold)return;
      const current=devById(hold.devId);
      if(!current){releaseVfdFrequencyHold();return;}
      if(changeVfdFrequency(current,hold.control==='up'?1:-1))renderAll();
    },90);
  },360);
}
document.addEventListener('pointerup',releaseVfdFrequencyHold);
document.addEventListener('pointercancel',releaseVfdFrequencyHold);

/* То же удержание для уставки напряжения якоря тиристорного преобразователя. */
let tpVoltageHold=null;
function releaseTpVoltageHold(evt){
  const hold=tpVoltageHold;
  if(!hold||(evt&&evt.pointerId!==undefined&&evt.pointerId!==hold.pointerId))return;
  tpVoltageHold=null;
  clearTimeout(hold.delayTimer);clearInterval(hold.repeatTimer);
  const dev=devById(hold.devId);
  if(dev&&dev.tpPressToken===hold.pressToken)delete dev.tpPressed;
  renderDevices();
}
function startTpVoltageHold(evt,dev,control,pressToken){
  if(tpVoltageHold)releaseTpVoltageHold();
  dev.tpPressed=control;
  const hold={pointerId:evt.pointerId,devId:dev.id,control:control,pressToken:pressToken,delayTimer:null,repeatTimer:null};
  tpVoltageHold=hold;
  hold.delayTimer=setTimeout(function(){
    if(tpVoltageHold!==hold)return;
    hold.repeatTimer=setInterval(function(){
      if(tpVoltageHold!==hold)return;
      const current=devById(hold.devId);
      if(!current){releaseTpVoltageHold();return;}
      if(changeTpArmatureVoltage(current,hold.control==='up'?10:-10))renderAll();
    },90);
  },360);
}
document.addEventListener('pointerup',releaseTpVoltageHold);
document.addEventListener('pointercancel',releaseTpVoltageHold);

/* перетаскивание / клик по установленному аппарату */
deviceLayer.addEventListener('pointerdown', function(evt){
  const g = evt.target.closest('.dev');
  if (!g) return;
  if (evt.button !== 0) return;                 // средняя кнопка — панорамирование, ПКМ — снятие
  if(evt.target.closest('[data-zone="manual-contactor"]'))return;
  const id = +g.dataset.id;
  const dev = state.devices.find(function(d){ return d.id === id; });
  if (!dev) return;
  const applianceToggle=evt.target.closest('[data-appliance-toggle]');
  if(TYPES[dev.type].kind==='appliance'&&applianceToggle){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    if(dev.applianceBurned){warn(tagOf(dev.id)+': прибор повреждён перенапряжением.');return;}
    dev.applianceOn=!dev.applianceOn;
    if(dev.applianceOn){
      const supply=applianceVoltage(dev);
      if(!voltageIsOperating(supply,dev,220))warn((supply<50?'Нет напряжения':'Нет рабочего напряжения ('+supply.toFixed(1)+' В)')+' — '+TYPES[dev.type].title+' '+tagOf(dev.id)+'.','warning');
    }
    log(tagOf(dev.id)+': '+TYPES[dev.type].title+' '+(dev.applianceOn?'включён.':'отключён.'),'info');
    renderAll();
    return;
  }
  const twoWayKey=evt.target.closest('[data-two-way-switch]');
  if(dev.type==='twoWaySwitch'&&twoWayKey){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    dev.switchPosition=Number(dev.switchPosition)===2?1:2;
    log(tagOf(dev.id)+': общий контакт L переключён на выход '+dev.switchPosition+'.','info');
    renderAll();
    return;
  }
  const switchKey=evt.target.closest('[data-switch-key]');
  if(dev.type==='wallSwitch'&&switchKey){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    const key=Number(switchKey.getAttribute('data-switch-key'))===2?2:1;
    if(key===2&&Number(dev.gangs)!==2)return;
    if(key===1)dev.switchOn1=!dev.switchOn1;
    else dev.switchOn2=!dev.switchOn2;
    log(tagOf(dev.id)+': клавиша '+key+' '+((key===1?dev.switchOn1:dev.switchOn2)?'включена':'отключена')+'.','info');
    renderAll();
    return;
  }
  const vfdControl=evt.target.closest('[data-vfd-control]');
  if(dev.type==='vfd'&&vfdControl){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    const control=vfdControl.getAttribute('data-vfd-control');
    const pressToken=(Number(dev.vfdPressToken)||0)+1;
    dev.vfdPressToken=pressToken;dev.vfdPressed=control;
    if(control==='stop'){
      dev.running=false;
      if(dev.fault){dev.fault=false;log(tagOf(dev.id)+': авария сброшена, преобразователь остановлен.','ok');}
      else log(tagOf(dev.id)+': команда STOP, выходное напряжение снято.','info');
    }else if(control==='run'){
      const input=vfdInputState(dev,potentialMap().pot);
      if(!input.ready){dev.running=false;warn('На входы R/L1, S/L2 и T/L3 нужно подать исправную трёхфазную сеть.');log(tagOf(dev.id)+': RUN отклонён — трёхфазный вход не готов.','warn');}
      else if(dev.fault){warn('Сначала сбросьте аварию кнопкой STOP.');}
      else{dev.running=true;log(tagOf(dev.id)+': RUN — сформирован трёхфазный выход '+vfdSetFrequency(dev).toFixed(1)+' Гц.','ok');}
    }else if(control==='reverse'){
      dev.reverse=!dev.reverse;
      log(tagOf(dev.id)+': направление выхода '+(dev.reverse?'обратное':'прямое')+'.','info');
    }else if(control==='up')changeVfdFrequency(dev,1);
    else if(control==='down')changeVfdFrequency(dev,-1);
    renderAll();
    if(control==='up'||control==='down')startVfdFrequencyHold(evt,dev,control,pressToken);
    else setTimeout(function(){
        const current=devById(dev.id);
        if(!current||current.vfdPressToken!==pressToken)return;
        delete current.vfdPressed;
        renderDevices();
      },140);
    return;
  }
  const tpControl=evt.target.closest('[data-tp-control]');
  if(dev.type==='tp'&&tpControl){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    const control=tpControl.getAttribute('data-tp-control');
    const pressToken=(Number(dev.tpPressToken)||0)+1;
    dev.tpPressToken=pressToken;dev.tpPressed=control;
    const input=tpInputState(dev,potentialMap().pot);
    if(control==='mains'){
      dev.tpOn=!dev.tpOn;
      if(!input.ready)log(tagOf(dev.id)+': выход якоря '+(dev.tpOn?'включён':'отключён')+', но трёхфазный вход не готов — напряжения на якоре не будет.','warn');
      else log(tagOf(dev.id)+': выход якоря '+(dev.tpOn?'включён':'отключён')+', уставка '+tpSetArmatureVoltage(dev).toFixed(0)+' В. Возбуждение '+tpFieldVoltage(dev).toFixed(0)+' В.','ok');
    }else if(control==='up')changeTpArmatureVoltage(dev,10);
    else if(control==='down')changeTpArmatureVoltage(dev,-10);
    if(control==='up'||control==='down')log(tagOf(dev.id)+': уставка напряжения якоря '+tpSetArmatureVoltage(dev).toFixed(0)+' В.','info');
    renderAll();
    if(control==='up'||control==='down')startTpVoltageHold(evt,dev,control,pressToken);
    else setTimeout(function(){
        const current=devById(dev.id);
        if(!current||current.tpPressToken!==pressToken)return;
        delete current.tpPressed;
        renderDevices();
      },140);
    return;
  }
  const rcdTest = evt.target.closest('[data-rcd-test]');
  if (dev.type === 'rcd' && rcdTest){
    evt.preventDefault(); evt.stopPropagation(); cancelWire();
    if (!dev.on){
      log(tagOf(dev.id)+': TEST не сработал — сначала включите УЗО.', 'warn');
      warn('Сначала включите УЗО, затем нажмите TEST.');
      return;
    }
    const map = potentialMap();
    const va = map.pot[nodeKey({devId:dev.id,key:'tL'})];
    const vn = map.pot[nodeKey({devId:dev.id,key:'tN'})];
    const voltage = va && vn ? Math.hypot(va.r-vn.r,va.i-vn.i) : 0;
    const nominal= ratedVoltageOf(dev,220);
    if (!voltageIsOperating(voltage,dev,220)){
      log(tagOf(dev.id)+': TEST не сработал — входное напряжение не соответствует номиналу '+Math.round(nominal)+' В.', 'warn');
      warn('TEST УЗО требует напряжение около '+Math.round(nominal)+' В между входами 1 и N.');
      return;
    }
    dev.tripped = true;
    dev.on = false;
    dev.rcdLeakageMa = 30;
    playBreakerSound(false, true);           // УЗО сработало от контрольного тока кнопки TEST
    log(tagOf(dev.id)+': кнопка TEST создала контрольный ток утечки — УЗО сработало, полюса 1–2 и N–N разомкнуты.', 'ok');
    warn('УЗО сработало от кнопки TEST. Для взвода щёлкните по рукоятке.');
    renderAll();
    return;
  }
  const timerControl=evt.target.closest('[data-timer-control]');
  if (dev.type==='timer' && timerControl){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    const control=timerControl.getAttribute('data-timer-control');
    if(control==='range')dev.timerRange=TIMER_RANGES[(TIMER_RANGES.indexOf(dev.timerRange)+1)%TIMER_RANGES.length];
    if(control==='level')dev.timerLevel=TIMER_LEVELS[(TIMER_LEVELS.indexOf(dev.timerLevel)+1)%TIMER_LEVELS.length];
    if(control==='mode')dev.timerMode=TIMER_MODES[(TIMER_MODES.indexOf(dev.timerMode)+1)%TIMER_MODES.length];
    dev.timerSince=null;dev.timerLastSignal=false;dev.timerActive=false;
    const modeName=dev.timerMode==='on'?'задержка включения':(dev.timerMode==='off'?'задержка отключения':'импульс');
    log(tagOf(dev.id)+': '+modeName+', выдержка '+(timerDelayMs(dev)/1000).toFixed(2)+' с.', 'info');
    renderAll();
    return;
  }
  const zone = evt.target.closest('[data-zone]');   // щелчок по выводам катушки A1–A2
  if (zone && zone.getAttribute('data-zone') === 'coil'){
    evt.preventDefault();
    const u = coilVoltage(dev);
    log(tagOf(dev.id)+': выводы катушки A1–A2, напряжение ' + (Math.round(u/10)*10) + ' В. '
      + 'Пускатель срабатывает, когда напряжение соответствует номиналу '+Math.round(ratedVoltageOf(dev,220))+' В.', 'info');
    return;
  }
  const p = svgPoint(evt), o = originOf(dev);
  startFreeDeviceDrag(evt, dev, p.x-o.x, p.y-o.y);
});

/* Ручное механическое нажатие на жёлтую траверсу пускателя.
   Контакты остаются переключёнными только пока удерживается левая кнопка мыши. */
let manualContactorPress=null;
deviceLayer.addEventListener('pointerdown',function(evt){
  const plate=evt.target.closest('[data-zone="manual-contactor"]');
  if(!plate||evt.button!==0)return;
  const g=plate.closest('.dev'),km=g&&devById(+g.dataset.id);
  if(!km||km.type!=='km1')return;
  evt.preventDefault();evt.stopPropagation();cancelWire();
  manualContactorPress={pointerId:evt.pointerId,devId:km.id};
  km.manualPressed=true;
  updateCoils();
  renderAll();
});
function releaseManualContactor(evt){
  if(!manualContactorPress||(evt&&evt.pointerId!==undefined&&evt.pointerId!==manualContactorPress.pointerId))return;
  const km=devById(manualContactorPress.devId);
  manualContactorPress=null;
  if(!km)return;
  km.manualPressed=false;
  updateCoils();
  renderAll();
}
document.addEventListener('pointerup',releaseManualContactor);
document.addEventListener('pointercancel',releaseManualContactor);

/* двигатель можно свободно перемещать за корпус; клеммы и провода следуют за ним */
let motorDrag = null;
motorLayer.addEventListener('pointerdown', function(evt){
  const body = evt.target.closest('.motor-draggable');
  if (!body || evt.button !== 0) return;
  evt.preventDefault();
  const p = svgPoint(evt);
  const motor=motorById(body.dataset.dev);if(!motor)return;
  motorDrag = { pointerId:evt.pointerId, id:motor.id, offX:p.x-motor.x, offY:p.y-motor.y };
  body.style.cursor = 'grabbing';
});
document.addEventListener('pointermove', function(evt){
  if (!motorDrag || evt.pointerId !== motorDrag.pointerId) return;
  const p = svgPoint(evt);
  const motor=motorById(motorDrag.id);if(!motor)return;
  const box=snapAlignmentBox(p.x-motorDrag.offX,p.y-motorDrag.offY,motor.w*motor.scale,motor.h*motor.scale,evt);
  motor.x = box.x;
  motor.y = box.y;
  renderMotor();
  renderWires();
  renderTerminals();
});
function finishMotorDrag(evt){
  if (!motorDrag || (evt.pointerId !== undefined && evt.pointerId !== motorDrag.pointerId)) return;
  motorDrag = null;
  renderMotor();
}
document.addEventListener('pointerup', finishMotorDrag);
document.addEventListener('pointercancel', finishMotorDrag);

function updateMotorReadout(){
  return withElectricalRead(function(){
    if(!state.motors.length){updateMotorSound(0);return;}
    let soundRpm=0,soundDir=0;
    state.motors.forEach(function(motor){
      const roots=motorInstrumentsModal.classList.contains('open')?[motorLayer,motorInstrumentBody]:[motorLayer];
      const inputs=roots.map(function(root){return root.querySelector('.motor-load[data-mid="'+motor.id+'"]');}).filter(Boolean);
      const boxes=inputs.map(function(input){
        const load=Math.max(0,Math.min(100,Number(motor.load)||0));
        input.value=String(load);
        if(input.classList.contains('motor-load-slider')){
          input.setAttribute('aria-valuenow',String(load));input.setAttribute('aria-valuetext',load.toFixed(0)+' %');
          const x=58+624*load/100,thumb=input.querySelector('.motor-load-thumb'),progress=input.querySelector('.motor-load-progress');
          if(thumb)thumb.setAttribute('cx',String(x));if(progress)progress.setAttribute('x2',String(x));
        }
        return input.closest('.motor-load-control');
      }).filter(Boolean);
      const set=function(sel,text){boxes.forEach(function(box){const el=box.querySelector(sel);if(el)el.textContent=text;});};
      const visualDir=Math.abs(motor.rpmActual||0)>1?Math.sign(motor.rpmActual):0;
      if(motorIsDc(motor)){
        const operating=dcMotorOperatingPoint(motor);
        const rpm=Math.round(Math.abs(motor.rpmActual||0));
        if(boxes.length){
          const values=dcMotorInstrumentValues(motor,operating);
          set('.motor-load-value',operating.load.toFixed(0)+' %');
          set('.motor-rpm-value',values.rpm);
          set('.motor-armature-voltage',values.armatureVoltage);set('.motor-armature-current',values.armatureCurrent);
          set('.motor-field-voltage',values.fieldVoltage);set('.motor-field-current',values.fieldCurrent);
          set('.motor-emf-value',values.emf);set('.motor-power-value',values.power);
          set('.motor-shaft-torque-value',values.torque);
          boxes.forEach(function(box){const alert=box.querySelector('.motor-alert');if(alert){alert.hidden=!operating.acSupply;alert.setAttribute('display',operating.acSupply?'inline':'none');}});
        }
        if(rpm>soundRpm){soundRpm=rpm;soundDir=visualDir;}
        return;
      }
      const direction=motorPhaseDirection(motor),operating=motorVisualOperating(motor,direction);
      if(boxes.length){
        const values=motorInstrumentValues(motor,operating);
        set('.motor-load-value',operating.load.toFixed(0)+' %');
        set('.motor-rpm-value',operating.rpm+' об/мин');
        set('.motor-current-value',operating.current.toFixed(1)+' А');
        set('.motor-frequency-value',operating.frequencyHz.toFixed(1)+' Гц');
        set('.motor-sync-value',values.sync);set('.motor-slip-value',values.slip);
        set('.motor-shaft-torque-value',values.torque);
      }
      if(operating.rpm>soundRpm){soundRpm=operating.rpm;soundDir=visualDir;}
    });
    updateMotorSound(soundDir,soundRpm);
  });
}
motorLayer.addEventListener('pointerdown', function(evt){
  // Показания и корпус пропускают навигацию; регулятор перехватывает только своё управление.
  if (evt.button !== 0 || !evt.target || !evt.target.closest) return;
  const control=evt.target.closest('.motor-load');if(!control)return;
  evt.stopPropagation();
  if(!control.classList.contains('motor-load-slider'))return;
  evt.preventDefault();
  if(motorLoadDrag)return;
  const motor=motorById(control.dataset.mid);if(!motor)return;
  motorLoadDrag={pointerId:evt.pointerId,control:control,motorId:motor.id};
  if(typeof control.focus==='function')control.focus({preventScroll:true});
  if(typeof control.setPointerCapture==='function')try{control.setPointerCapture(evt.pointerId);}catch(e){}
  updateMotorLoadPointer(evt);
});
function updateMotorLoadPointer(evt){
  if(!motorLoadDrag||evt.pointerId!==motorLoadDrag.pointerId)return;
  const control=motorLoadDrag.control,motor=motorById(motorLoadDrag.motorId);if(!motor)return;
  const start=Number(control.dataset.loadX),width=Number(control.dataset.loadWidth);
  if(!isFinite(start)||!(width>0))return;
  motor.load=Math.max(0,Math.min(100,Math.round((svgPoint(evt).x-start)/width*100)));
  updateMotorReadout();
}
document.addEventListener('pointermove',function(evt){
  if(!motorLoadDrag||evt.pointerId!==motorLoadDrag.pointerId)return;
  evt.preventDefault();updateMotorLoadPointer(evt);
},{passive:false});
function finishMotorLoadDrag(evt){
  if(!motorLoadDrag||(evt&&evt.pointerId!==undefined&&evt.pointerId!==motorLoadDrag.pointerId))return;
  if(evt&&evt.type==='pointerup')updateMotorLoadPointer(evt);
  const drag=motorLoadDrag;motorLoadDrag=null;
  if(typeof drag.control.releasePointerCapture==='function')try{drag.control.releasePointerCapture(drag.pointerId);}catch(e){}
  if(motorLoadRenderPending){motorLoadRenderPending=false;renderMotor();}
  queueActionHistory();
}
document.addEventListener('pointerup',finishMotorLoadDrag);
document.addEventListener('pointercancel',finishMotorLoadDrag);
motorLayer.addEventListener('lostpointercapture',finishMotorLoadDrag);
if(typeof window.addEventListener==='function')window.addEventListener('blur',function(){finishMotorLoadDrag();});
motorLayer.addEventListener('keydown',function(evt){
  const control=evt.target.closest&&evt.target.closest('.motor-load-slider');
  if(!control||evt.altKey||evt.ctrlKey||evt.metaKey)return;
  const motor=motorById(control.dataset.mid);if(!motor)return;
  const load=Number(motor.load)||0;
  const next={ArrowLeft:load-1,ArrowDown:load-1,ArrowRight:load+1,ArrowUp:load+1,PageDown:load-10,PageUp:load+10,Home:0,End:100};
  if(!Object.prototype.hasOwnProperty.call(next,evt.key))return;
  evt.preventDefault();evt.stopPropagation();beginActionHistory();
  motor.load=Math.max(0,Math.min(100,next[evt.key]));updateMotorReadout();queueActionHistory();
});
function changeMotorLoad(evt){
  if (!evt.target || !evt.target.classList.contains('motor-load')) return;
  const motor=motorById(evt.target.dataset.mid);if(!motor)return;
  motor.load = Math.max(0, Math.min(100, Number(evt.target.value) || 0));
  updateMotorReadout();
}
motorLayer.addEventListener('input',changeMotorLoad);
motorInstrumentBody.addEventListener('input',changeMotorLoad);

/* Инерция ротора: разгон примерно 2,7 с, свободный выбег около 3,2 с. */
let motorInertiaLast=performance.now();
function motorInertiaTick(){
  return withElectricalRead(function(){
    const now=performance.now(),dt=Math.min(.15,Math.max(0,(now-motorInertiaLast)/1000));
    motorInertiaLast=now;
    if(!state.motors.length){updateMotorSound(0);return;}
    let rerender=false;
    state.motors.forEach(function(motor){
      if(motorIsDc(motor)){ dcMotorInertiaStep(motor,dt); return; }
      const electricalDirection=motorPhaseDirection(motor),targetPoint=motorOperatingPoint(motor,electricalDirection);
      let target=electricalDirection*targetPoint.rpm;
      const before=motor.rpmActual||0,oldSign=Math.abs(before)>1?Math.sign(before):0;
      if(before&&target&&Math.sign(before)!==Math.sign(target))target=0;
      const rate=Math.abs(target)>Math.abs(before)?500:420,step=rate*dt;
      let next=before;if(Math.abs(target-before)<=step)next=target;else next+=Math.sign(target-before)*step;
      if(Math.abs(next)<1&&target===0)next=0;motor.rpmActual=next;
      if(oldSign!==(Math.abs(next)>1?Math.sign(next):0))rerender=true;
    });
    if(rerender)renderMotor();else updateMotorReadout();
  });
}
setInterval(motorInertiaTick,50);

/* Непрерывное покадровое вращение без перезапуска анимации при изменении оборотов. */
let motorFrameLast=performance.now();
function motorRotationFrame(now){
  const dt=Math.min(.08,Math.max(0,(now-motorFrameLast)/1000));
  motorFrameLast=now;
  state.motors.forEach(function(motor){if(Math.abs(motor.rpmActual||0)>.1){motor.angle=(motor.angle+(motor.rpmActual||0)*1.5*dt)%360;const body=motorLayer.querySelector('.motor-draggable[data-dev="'+motor.id+'"]');const rotor=body&&body.querySelector('.motor-rotor');if(rotor)rotor.setAttribute('transform','rotate('+motor.angle.toFixed(3)+' 116 99)');}});
  requestAnimationFrame(motorRotationFrame);
}
requestAnimationFrame(motorRotationFrame);

/* Ввод внутри щита переносит весь щит; ввод из старых схем движется отдельно. */
let inboxDrag = null;
boxLayer.addEventListener('pointerdown', function(evt){
  const body = evt.target.closest('.inbox-draggable');
  if (!body || evt.button !== 0) return;
  const panel=inboxPanel();
  if(panel){startPanelDrag(evt,panel);return;}
  evt.preventDefault();
  cancelWire();
  const p = svgPoint(evt);
  inboxDrag = { pointerId:evt.pointerId, offX:p.x-INBOX.x, offY:p.y-INBOX.y };
  body.style.cursor = 'grabbing';
});
document.addEventListener('pointermove', function(evt){
  if (!inboxDrag || evt.pointerId !== inboxDrag.pointerId) return;
  const p = svgPoint(evt);
  const box=snapAlignmentBox(p.x-inboxDrag.offX,p.y-inboxDrag.offY,inboxWidth(),INBOX.h,evt);
  INBOX.x = box.x;
  INBOX.y = box.y;
  renderInbox();
  renderWires();
  renderTerminals();
});
function finishInboxDrag(evt){
  if (!inboxDrag || (evt.pointerId !== undefined && evt.pointerId !== inboxDrag.pointerId)) return;
  inboxDrag = null;
  renderInbox();
}
document.addEventListener('pointerup', finishInboxDrag);
document.addEventListener('pointercancel', finishInboxDrag);

/* кнопочный пост свободно перемещается за корпус, кроме областей самих кнопок */
let pushStationDrag = null;
deviceLayer.addEventListener('pointerdown', function(evt){
  const station = evt.target.closest('.push-station');
  if (!station || evt.button !== 0 || evt.target.closest('[data-pb]')) return;
  evt.preventDefault();
  const p = svgPoint(evt);
  const pb=pushbuttonById(station.dataset.dev);if(!pb)return;
  pushStationDrag = { pointerId:evt.pointerId, id:pb.id, offX:p.x-pb.x, offY:p.y-pb.y };
  station.style.cursor = 'grabbing';
});
document.addEventListener('pointermove', function(evt){
  if (!pushStationDrag || evt.pointerId !== pushStationDrag.pointerId) return;
  const p = svgPoint(evt);
  const pb=pushbuttonById(pushStationDrag.id);if(!pb)return;
  const box=snapAlignmentBox(p.x-pushStationDrag.offX,p.y-pushStationDrag.offY,pb.w||PB.w,pb.h||PB.h,evt);
  pb.x = box.x;
  pb.y = box.y;
  renderDevices();
  renderWires();
  renderTerminals();
});
function finishPushStationDrag(evt){
  if (!pushStationDrag || (evt.pointerId !== undefined && evt.pointerId !== pushStationDrag.pointerId)) return;
  pushStationDrag = null;
  renderDevices();
}
document.addEventListener('pointerup', finishPushStationDrag);
document.addEventListener('pointercancel', finishPushStationDrag);

/* кнопочный пост: контакт действует, пока пользователь удерживает кнопку мыши */
let activePushbutton = null;
deviceLayer.addEventListener('pointerdown', function(evt){
  const hit = evt.target.closest('[data-pb]');
  if (!hit || evt.button !== 0) return;
  evt.preventDefault();
  evt.stopPropagation();
  const key = hit.getAttribute('data-pb');
  const station=hit.closest('.push-station'),pb=station&&pushbuttonById(station.dataset.dev);
  if (!pb||!(key in pb.buttons)) return;
  activePushbutton = {id:pb.id,key:key};
  pb.buttons[key] = true;
  renderAll();
});
document.addEventListener('pointerup', function(){
  if (!activePushbutton) return;
  const pb=pushbuttonById(activePushbutton.id);if(pb)pb.buttons[activePushbutton.key]=false;
  activePushbutton = null;
  renderAll();
});
document.addEventListener('pointercancel', function(){
  if (!activePushbutton) return;
  const pb=pushbuttonById(activePushbutton.id);if(pb)pb.buttons[activePushbutton.key]=false;
  activePushbutton = null;
  renderAll();
});

/* тепловое реле: кнопки RESET/TEST и перетаскивание */
let relayButtonDown = null;
relayLayer.addEventListener('pointerdown', function(evt){
  const g = evt.target.closest('.relay');
  if (!g) return;
  if (evt.button !== 0) return;
  const rel = anyRelayById(+g.dataset.rid);
  if (!rel) return;

  const zone = evt.target.closest('[data-zone]');
  if (zone){
    evt.preventDefault();
    const z = zone.getAttribute('data-zone');
    if (z === 'dial') cycleSetpoint(rel);
    else if (z === 'test' || z === 'reset'){
      const button = g.querySelector(z === 'test' ? '.relay-test' : '.relay-reset');
      if (button) button.classList.add('is-down');
      relayButtonDown = { relayId:rel.id, action:z, button:button };
    }
    return;
  }
  const km = devById(rel.kmId);
  if (!km) return;
  const p = svgPoint(evt), ko = originOf(km);
  // Тепловое реле физически установлено на пускателе, поэтому за его корпус
  // перемещается вся сборка, а провода обоих аппаратов сохраняются.
  startFreeDeviceDrag(evt, km, p.x-ko.x, p.y-ko.y);
});

document.addEventListener('pointerup', function(){
  if (!relayButtonDown) return;
  const press = relayButtonDown;
  relayButtonDown = null;
  if (press.button) press.button.classList.remove('is-down');
  const rel = anyRelayById(press.relayId);
  if (!rel) return;
  if (press.action === 'test') testRelay(rel);
  else if (press.action === 'reset') resetRelay(rel);
});
document.addEventListener('pointercancel', function(){
  if (!relayButtonDown) return;
  if (relayButtonDown.button) relayButtonDown.button.classList.remove('is-down');
  relayButtonDown = null;
});

/* Единое контекстное меню объектов */
const objectMenuEl=document.getElementById('objectMenu');
let objectMenuTarget=null;
function hideObjectMenu(){
  if(objectMenuEl)objectMenuEl.style.display='none';
  objectMenuTarget=null;
}
function showObjectMenu(evt,target){
  evt.preventDefault();evt.stopPropagation();hideWireMenu();
  objectMenuTarget=target;
  objectMenuEl.style.display='block';
  objectMenuEl.style.left=Math.max(8,Math.min(evt.clientX,window.innerWidth-objectMenuEl.offsetWidth-8))+'px';
  objectMenuEl.style.top=Math.max(8,Math.min(evt.clientY,window.innerHeight-objectMenuEl.offsetHeight-8))+'px';
}

/* Редактор характеристик. Пока здесь собраны основные паспортные поля;
   перечень можно расширять отдельно для каждого типа аппарата. */
const propertiesModal=document.getElementById('propertiesModal');
const propertiesForm=document.getElementById('propertiesForm');
const propertiesFields=document.getElementById('propertiesFields');
const propertiesTitle=document.getElementById('propertiesTitle');
const propertiesSubtitle=document.getElementById('propertiesSubtitle');
let propertiesTarget=null;
function propertyField(key,label,type,def,unit,min,max,step,wide,options){
  return {key:key,label:label,type:type||'text',def:def,unit:unit||'',min:min,max:max,step:step,wide:!!wide,options:options||[]};
}
function characteristicsFor(target){
  let obj=null,title='',type='';
  if(!target)return null;
  if(target.kind==='device'){
    obj=devById(target.id);if(!obj)return null;
    if(TYPES[obj.type].kind==='appliance')syncApplianceRatings(obj);
    if(obj.type==='rcd')syncRcdRatings(obj);
    if(['mcb1','mcb2','mcb3'].includes(obj.type))obj.customName=protectiveDeviceName(obj);
    title=tagOf(obj.id);
    if(['mcb1','mcb2','mcb3'].includes(obj.type)){
      const fallback=obj.type==='mcb3'?'C25':'C10';
      type='Автомат '+(TYPES[obj.type].poles+'P, ')+(obj.breakerType||fallback);
    }else type=obj.customName||TYPES[obj.type].title;
  }else if(target.kind==='relay'){
    obj=anyRelayById(target.id);if(!obj)return null;
    syncThermalSettings(obj);
    title=tagOf('kk'+obj.id);type='Тепловое реле · класс 10A';
  }else if(target.kind==='special'&&target.key==='motor'){
    obj=motorById(target.id);if(!obj)return null;
    title=obj.tag||obj.id;type='Трёхфазный асинхронный двигатель';
  }else if(target.kind==='special'&&target.key==='dcmotor'){
    obj=motorById(target.id);if(!obj||!motorIsDc(obj))return null;
    title=obj.tag||obj.id;type='Двигатель постоянного тока независимого возбуждения';
  }else if(target.kind==='special'&&target.key==='pushbutton'){
    obj=pushbuttonById(target.id);if(!obj)return null;
    title=obj.tag||'SB';type='Кнопочный пост';
  }else if(target.kind==='special'&&target.key==='inbox'){
    obj=state.specialProps.inbox;title=obj.tag||'XT1';type='Вводная клеммная коробка';
  }else if(target.kind==='special'&&target.key==='multimeter'){
    obj=state.specialProps.multimeter;title=obj.tag||'PV1';type='Цифровой мультиметр';
  }else if(target.kind==='special'&&target.key==='clamp'){
    obj=state.clamps.find(function(c){return c.id===target.id;});if(!obj)return null;
    title=obj.tag||obj.id;type='Токовые клещи';
  }else if(target.kind==='special'&&target.key==='panel'){
    obj=panelById(target.id);if(!obj)return null;
    title=obj.tag||obj.id;type='Монтажный щит';
  }
  if(!obj)return null;
  let fields=[];
  if(target.kind==='device'&&obj.type==='rcd'){
    fields.push(propertyField('ratedCurrent','Номинальный ток','select',25,'А',undefined,undefined,undefined,false,
      RCD_CURRENTS.map(function(value){return {value:String(value),label:value+' А'};})));
    fields.push(propertyField('ratedLeakageMa','Дифференциальный ток','select',30,'мА',undefined,undefined,undefined,false,
      RCD_LEAKAGE_CURRENTS.map(function(value){return {value:String(value),label:value+' мА'};})));
  }
  if(target.kind==='device'&&(['mcb1','mcb2','mcb3'].includes(obj.type))){
    const defaultBreakerType=obj.type==='mcb3'?'C25':'C10';
    fields.push(propertyField('breakerType','Тип автомата','select',obj.breakerType||defaultBreakerType,'',undefined,undefined,undefined,false,[
      {value:'C2',label:'C2 — 2 А'},
      {value:'C4',label:'C4 — 4 А'},
      {value:'C6',label:'C6 — 6 А'},
      {value:'C10',label:'C10 — 10 А'},
      {value:'C13',label:'C13 — 13 А'},
      {value:'C16',label:'C16 — 16 А'},
      {value:'C20',label:'C20 — 20 А'},
      {value:'C25',label:'C25 — 25 А'},
      {value:'C32',label:'C32 — 32 А'},
      {value:'C40',label:'C40 — 40 А'},
      {value:'C50',label:'C50 — 50 А'},
      {value:'C63',label:'C63 — 63 А'}
    ]));
  }
  fields.push(propertyField('tag','Позиционное обозначение','text',title));
  if(target.kind==='special'&&target.key==='panel'&&obj.inbox){
    fields.push(propertyField('inletVoltage','Ввод','select',String(panelInletVoltage(obj)),'',undefined,undefined,undefined,false,[
      {value:'380',label:'380 В — трёхфазный'},
      {value:'220',label:'220 В — однофазный'}
    ]));
  }
  const nameField=propertyField('customName','Наименование','text',type,'',undefined,undefined,undefined,true);
  nameField.readOnly=target.kind==='device'&&['mcb1','mcb2','mcb3','rcd'].includes(obj.type);
  fields.push(nameField);
  if(target.kind==='relay'){
    const range=thermalRange(obj);
    fields.push(propertyField('settingRange','Диапазон уставки','select',range.id,'',undefined,undefined,undefined,false,
      THERMAL_RANGES.map(function(r){return {value:r.id,label:thermalNumber(r.min)+'–'+thermalNumber(r.max)+' А'};})));
    fields.push(propertyField('set','Уставка тока','number',obj.set,'А',range.min,range.max,0.001));
  }else if(target.kind==='special'&&target.key==='motor'){
    fields.push(propertyField('ratedCurrent','Номинальный ток','number',9,'А',0.1,1000,0.1));
    fields.push(propertyField('ratedPower','Номинальная мощность','number',4,'кВт',0.1,1000,0.1));
    fields.push(propertyField('ratedFrequency','Номинальная частота','number',50,'Гц',1,400,1));
    fields.push(propertyField('polePairs','Количество пар полюсов','number',2,'',1,20,1));
    fields.push(propertyField('ratedSlipPercent','Номинальное скольжение','number',10,'%',0,95,0.1));
  }else if(target.kind==='special'&&target.key==='dcmotor'){
    fields.push(propertyField('ratedArmatureCurrent','Номинальный ток якоря','number',DCM.ratedArmatureCurrent,'А',0.1,1000,0.1));
    fields.push(propertyField('ratedSpeed','Номинальная частота вращения','number',DCM.ratedSpeed,'об/мин',1,6000,10));
    fields.push(propertyField('armatureResistance','Сопротивление якоря','number',DCM.armatureResistance,'Ом',0.01,200,0.01));
    fields.push(propertyField('fieldResistance','Сопротивление обмотки возбуждения','number',DCM.fieldResistance,'Ом',1,5000,1));
    fields.push(propertyField('ratedPower','Номинальная мощность','number',DCM.ratedPower,'кВт',0.1,1000,0.1));
    fields.push(propertyField('inertiaFactor','Время разгона до номинала','number',DCM.inertiaFactor,'с',0.05,20,0.05));
  }else if(target.kind==='special'&&target.key==='inbox'){
    fields.push(propertyField('frequency','Частота сети','number',50,'Гц',1,400,1));
  }else if(target.kind==='special'&&target.key==='multimeter'){
    fields.push(propertyField('measurementCategory','Категория измерений','text','CAT III 600 V','',undefined,undefined,undefined,true));
  }else if(target.kind==='special'&&target.key==='panel'){
    fields.push(propertyField('fixed','Закрепить','checkbox',true));
    fields.push(propertyField('railCount','Количество DIN-реек','select',String(panelRailCount(obj)),'',undefined,undefined,undefined,false,[
      {value:'1',label:'1 рейка'},{value:'2',label:'2 рейки'},{value:'3',label:'3 рейки'},
      {value:'4',label:'4 рейки'},{value:'5',label:'5 реек'}
    ]));
  }else if(target.kind==='device'){
    if(obj.type==='klemma'||obj.type==='pebus')fields.push(propertyField('wireEntrySide','Сторона подключения','select','right','',undefined,undefined,undefined,false,[
      {value:'right',label:'Справа'},
      {value:'left',label:'Слева'}
    ]));
    if(obj.type==='comb'){
      fields.push(propertyField('combPoles','Исполнение','select',String(combPoles(obj)),'',undefined,undefined,undefined,false,[{value:'1',label:'1P — одна фаза, автоматы 1P'},{value:'2',label:'2P — два полюса, автоматы 2P'},{value:'3',label:'3P — три фазы, автоматы 3P'}]));
      fields.push(propertyField('combCount','Количество автоматов','number',combCount(obj),'шт.',1,Math.floor(SLOTS/combPoles(obj)),1));
    }
    if(obj.type==='lamp')fields.push(propertyField('indicator','Цвет индикатора','select',obj.indicator||'green','',undefined,undefined,undefined,false,[
      {value:'green',label:'Зелёный'},
      {value:'red',label:'Красный'},
      {value:'yellow',label:'Жёлтый'}
    ]));
    if(obj.type==='lamp'||obj.type==='bulb')fields.push(propertyField('ratedPower','Мощность','number',obj.type==='bulb'?100:1,'Вт',0.1,5000,0.1));
    if(TYPES[obj.type].kind==='appliance')fields.push(propertyField('ratedPower','Мощность','number',TYPES[obj.type].defaultPower,'Вт',1,30000,'any'));
    if(obj.type==='wallSwitch')fields.push(propertyField('gangs','Количество клавиш','select',Number(obj.gangs)===2?'2':'1','',undefined,undefined,undefined,false,[
      {value:'1',label:'Одна клавиша'},
      {value:'2',label:'Две клавиши'}
    ]));
    if(obj.type==='vfd'){
      fields.push(propertyField('baseFrequency','Базовая частота двигателя','number',50,'Гц',1,400,1));
      fields.push(propertyField('maxFrequency','Максимальная частота','number',100,'Гц',1,400,1));
      fields.push(propertyField('setFrequency','Заданная частота','number',50,'Гц',0,400,0.1));
    }
    if(obj.type==='timer')fields.push(propertyField('delaySeconds','Выдержка времени','number',5,'с',0.1,86400,0.1));
    if(obj.type==='tp'){
      fields.push(propertyField('maxArmatureVoltage','Максимальное напряжение якоря','number',220,'В',1,1000,1));
      fields.push(propertyField('setArmatureVoltage','Уставка напряжения якоря','number',0,'В',0,1000,1));
      fields.push(propertyField('fieldVoltage','Напряжение возбуждения','number',220,'В',1,1000,1));
    }
  }
  return {object:obj,title:title,type:type,fields:fields,target:target};
}
function closeProperties(){
  if(!propertiesModal)return;
  propertiesModal.classList.remove('open');propertiesModal.setAttribute('aria-hidden','true');
  propertiesTarget=null;
}
function openProperties(target){
  const data=characteristicsFor(target);if(!data)return;
  propertiesTarget=data;
  propertiesTitle.textContent='Характеристики '+data.title;
  propertiesSubtitle.textContent=data.type;
  propertiesFields.innerHTML=data.fields.map(function(f){
    const raw=data.object[f.key]!==undefined&&data.object[f.key]!==null?data.object[f.key]:f.def;
    const attrs=f.type==='number'?' type="number"'+(f.min!==undefined?' min="'+f.min+'"':'')+(f.max!==undefined?' max="'+f.max+'"':'')+(f.step!==undefined?' step="'+f.step+'"':''):' type="text"';
    const label='<span>'+escapeHtml(f.label)+(f.unit?' <em>('+escapeHtml(f.unit)+')</em>':'')+'</span>';
    const control=f.type==='textarea'
      ?'<textarea data-property-key="'+f.key+'">'+escapeHtml(raw)+'</textarea>'
      :f.type==='select'
        ?'<select data-property-key="'+f.key+'">'+f.options.map(function(option){return '<option value="'+escapeHtml(option.value)+'"'+(String(option.value)===String(raw)?' selected':'')+'>'+escapeHtml(option.label)+'</option>';}).join('')+'</select>'
        :f.type==='checkbox'
          ?'<input data-property-key="'+f.key+'" type="checkbox"'+(raw!==false?' checked':'')+'>'
          :'<input data-property-key="'+f.key+'"'+attrs+(f.readOnly?' readonly':'')+' value="'+escapeHtml(raw)+'">';
    return '<label class="property-field'+(f.wide?' wide':'')+(f.type==='checkbox'?' property-toggle':'')+'">'+label+control+'</label>';
  }).join('');
  propertiesModal.classList.add('open');propertiesModal.setAttribute('aria-hidden','false');
  const first=propertiesFields.querySelector('input,select,textarea');if(first)first.focus();
}
propertiesFields.addEventListener('change',function(evt){
  if(propertiesTarget&&propertiesTarget.object.type==='comb'){
    if(evt.target.getAttribute('data-property-key')!=='combPoles')return;
    const max=Math.floor(SLOTS/combPoles({combPoles:evt.target.value}));
    const field=propertiesTarget.fields.find(function(f){return f.key==='combCount';});field.max=max;
    const input=propertiesFields.querySelector('[data-property-key="combCount"]');
    if(input){input.max=max;input.value=Math.max(1,Math.min(max,Math.round(Number(input.value)||3)));}
    return;
  }
  if(propertiesTarget&&propertiesTarget.target.kind==='relay'){
    if(evt.target.getAttribute('data-property-key')!=='settingRange')return;
    const range=thermalRange({settingRange:evt.target.value});
    const field=propertiesTarget.fields.find(function(f){return f.key==='set';});
    field.min=range.min;field.max=range.max;
    const input=propertiesFields.querySelector('[data-property-key="set"]');
    if(input){input.min=range.min;input.max=range.max;input.value=Math.max(range.min,Math.min(range.max,Number(input.value)||range.max));}
    return;
  }
  if(!propertiesTarget||!['mcb1','mcb2','mcb3','rcd'].includes(propertiesTarget.object.type))return;
  const changed=evt.target.getAttribute('data-property-key');
  if(!['breakerType','ratedCurrent','ratedLeakageMa'].includes(changed))return;
  const draft=Object.assign({},propertiesTarget.object);
  ['breakerType','ratedCurrent','ratedLeakageMa'].forEach(function(key){
    const input=propertiesFields.querySelector('[data-property-key="'+key+'"]');
    if(input)draft[key]=input.value;
  });
  const name=propertiesFields.querySelector('[data-property-key="customName"]');
  if(name)name.value=protectiveDeviceName(draft);
  propertiesSubtitle.textContent=protectiveDeviceName(draft);
});
function saveProperties(){
  if(!propertiesTarget)return;
  const obj=propertiesTarget.object;
  const previousComb=obj.type==='comb'?{combPoles:combPoles(obj),combCount:combCount(obj),combAnchorId:obj.combAnchorId}:null;
  const previousCombOrigin=previousComb?combOrigin(obj):null;
  const previousRatedVoltage=ratedVoltageOf(obj,220);
  const previousSwitchGangs=obj.type==='wallSwitch'?(Number(obj.gangs)===2?2:1):0;
  propertiesTarget.fields.forEach(function(f){
    const input=propertiesFields.querySelector('[data-property-key="'+f.key+'"]');if(!input)return;
    let value=input.value;
    if(f.type==='checkbox')value=input.checked;
    else if(f.type==='number'){
      value=Number(value);if(!isFinite(value))value=Number(f.def)||0;
      const min=f.min,max=f.max;
      if(min!==undefined)value=Math.max(min,value);if(max!==undefined)value=Math.min(max,value);
    }else value=String(value).trim();
    if(f.key==='tag'&&!value)value=String(f.def||'');
    if(f.key==='inletVoltage'){setPanelInlet(obj,value);return;}
    obj[f.key]=value;
  });
  if(propertiesTarget.target.kind==='relay')syncThermalSettings(obj);
  if(TYPES[obj.type])obj.ratedVoltage=ratedVoltageOf(obj);
  if(TYPES[obj.type]&&TYPES[obj.type].kind==='appliance')syncApplianceRatings(obj);
  if(obj.type==='rcd')syncRcdRatings(obj);
  if(obj.type==='comb'){
    obj.combPoles=combPoles(obj);obj.combCount=combCount(obj);
    if(previousComb.combAnchorId!==undefined){
      const candidate=combPlacement(previousCombOrigin.x,previousCombOrigin.y,obj);
      if(!candidate){
        Object.assign(obj,previousComb);
        warn('Для такой гребёнки нужен полный ряд из '+combCount({combPoles:Number(propertiesFields.querySelector('[data-property-key="combPoles"]').value),combCount:Number(propertiesFields.querySelector('[data-property-key="combCount"]').value)})+' подходящих автоматов.');
        return;
      }
      obj.combAnchorId=candidate.combAnchorId;obj.x=candidate.x;obj.y=candidate.y;
    }
  }
  if(['mcb1','mcb2','mcb3'].includes(obj.type)){
    const allowed=['C2','C4','C6','C10','C13','C16','C20','C25','C32','C40','C50','C63'];
    if(allowed.indexOf(obj.breakerType)<0)obj.breakerType=obj.type==='mcb3'?'C25':'C10';
    const selectedCurrent=Math.max(2,Number(String(obj.breakerType).replace(/^C/,''))||10);
    obj.ratedCurrent=selectedCurrent;
    obj.ratedVoltage=ratedVoltageOf(obj);
    obj.customName=protectiveDeviceName(obj);
    obj.breakerHeat=0;obj.breakerCurrentA=0;obj.breakerPhaseCurrents=[];
  }
  if(propertiesTarget.target.kind==='special'&&propertiesTarget.target.key==='panel'){
    obj.railCount=panelRailCount(obj);detachPanelDevices(obj,obj.railCount);
  }
  // Изменение номинала означает выбор другой модификации аппарата.
  // Поэтому старое повреждение от перенапряжения к новой модификации не переносим.
  if(Math.abs(ratedVoltageOf(obj,220)-previousRatedVoltage)>.01){
    if('burned' in obj)obj.burned=false;
    if('coilBurned' in obj)obj.coilBurned=false;
    if('timerBurned' in obj)obj.timerBurned=false;
    if('applianceBurned' in obj)obj.applianceBurned=false;
  }
  if(propertiesTarget.target.kind==='device'&&obj.type==='tp'){
    obj.maxArmatureVoltage=Math.max(1,Number(obj.maxArmatureVoltage)||220);
    obj.fieldVoltage=Math.max(1,Number(obj.fieldVoltage)||220);
    setTpArmatureVoltage(obj, Number(obj.setArmatureVoltage)||0);
  }
  if(propertiesTarget.target.kind==='special'&&propertiesTarget.target.key==='motor'){
    obj.ratedVoltage=380;
    obj.polePairs=Math.max(1,Math.round(Number(obj.polePairs)||2));
    const slip=Number(obj.ratedSlipPercent);
    obj.ratedSlipPercent=Math.max(0,Math.min(95,isFinite(slip)?slip:10));
  }
  if(propertiesTarget.target.kind==='special'&&propertiesTarget.target.key==='dcmotor'){
    obj.kind='dc';
    obj.ratedArmatureVoltage=DCM.ratedArmatureVoltage;
    obj.ratedArmatureCurrent=Math.max(.1,Number(obj.ratedArmatureCurrent)||DCM.ratedArmatureCurrent);
    obj.ratedFieldVoltage=DCM.ratedFieldVoltage;
    obj.ratedSpeed=Math.max(1,Number(obj.ratedSpeed)||DCM.ratedSpeed);
    obj.armatureResistance=Math.max(.01,Number(obj.armatureResistance)||DCM.armatureResistance);
    obj.fieldResistance=Math.max(1,Number(obj.fieldResistance)||DCM.fieldResistance);
    obj.inertiaFactor=Math.max(.05,Number(obj.inertiaFactor)||DCM.inertiaFactor);
  }
  if(obj.type==='wallSwitch'){
    obj.gangs=Number(obj.gangs)===2?2:1;
    obj.switchOn1=!!obj.switchOn1;
    obj.switchOn2=obj.gangs===2&&!!obj.switchOn2;
    if(previousSwitchGangs===2&&obj.gangs===1){
      state.wires=state.wires.filter(function(w){return !sameTerm(w.a,obj.id,'O2')&&!sameTerm(w.b,obj.id,'O2');});
      ['a','b'].forEach(function(key){if(state.mm[key]&&sameTerm(state.mm[key],obj.id,'O2'))state.mm[key]=null;});
      if(pending&&sameTerm(pending.from,obj.id,'O2'))cancelWire();
    }
  }
  if(obj.type==='vfd')obj.setFrequency=Math.max(0,Math.min(Number(obj.maxFrequency)||100,Number(obj.setFrequency)||0));
  const label=obj.tag||propertiesTarget.title;
  closeProperties();renderAll();log('Характеристики '+label+' сохранены.','ok');
}
document.getElementById('propertiesClose').addEventListener('click',closeProperties);
document.getElementById('propertiesCancel').addEventListener('click',closeProperties);
propertiesModal.addEventListener('pointerdown',function(evt){if(evt.target===propertiesModal)closeProperties();});
propertiesForm.addEventListener('submit',function(evt){evt.preventDefault();saveProperties();});
document.addEventListener('keydown',function(evt){if(evt.key==='Escape'&&propertiesModal.classList.contains('open')){evt.preventDefault();closeProperties();}});
function detachMeterFromObject(devId){
  ['a','b'].forEach(function(key){
    const sel=state.mm[key];
    if(!sel||String(sel.devId)!==String(devId))return;
    const p=terminal(sel.devId,sel.key);
    // Снятый щуп возвращается в своё гнездо и дальше едет вместе с прибором.
    state.mm[key]=null;
    if(key==='a'){if(p){METER.redX=p.x;METER.redY=p.y;}state.mm.aDocked=true;}
    else{if(p){METER.blackX=p.x;METER.blackY=p.y;}state.mm.bDocked=true;}
  });
}
function removeObjectFromScene(target){
  if(!target)return;
  if(target.kind==='special'&&target.key==='inbox'){
    const panel=inboxPanel();if(panel)target={kind:'special',key:'panel',id:panel.id};
  }
  if(target.kind==='relay'){
    const rel=anyRelayById(target.id);if(!rel)return;
    if(relayLive(rel)){warn('Пускатель под напряжением — сначала обесточьте катушку.');return;}
    detachMeterFromObject('kk'+rel.id);
    state.relays=state.relays.filter(function(r){return r.id!==rel.id;});
    removeWiresFor('kk'+rel.id);
    log('Тепловое реле возвращено в лоток.','info');
  }else if(target.kind==='device'){
    const dev=devById(target.id);if(!dev)return;
    if(isLive(dev)){
      warn(TYPES[dev.type].kind==='contactor'?'Пускатель под напряжением — сначала обесточьте катушку.':'Сначала отключите аппарат или снимите с него напряжение.');return;
    }
    const attached=state.relays.filter(function(r){return r.kmId===dev.id;});
    detachMeterFromObject(dev.id);
    attached.forEach(function(r){detachMeterFromObject('kk'+r.id);removeWiresFor('kk'+r.id);});
    state.relays=state.relays.filter(function(r){return r.kmId!==dev.id;});
    state.devices.filter(function(d){return d.type==='comb'&&d.combAnchorId===dev.id;}).forEach(function(d){const p=combOrigin(d);d.x=p.x;d.y=p.y;delete d.combAnchorId;});
    removeWiresFor(dev.id);state.devices=state.devices.filter(function(d){return d.id!==dev.id;});
    log(TYPES[dev.type].title+' возвращён в лоток'+(attached.length?' вместе с тепловым реле.':'.'),'info');
  }else if(target.kind==='special'){
    const key=target.key;
    if(key==='panel'){
      const panel=panelById(target.id);if(!panel)return;
      if(panel.inbox){detachMeterFromObject('IN');removeWiresFor('IN');state.special.inbox=false;}
      detachPanelDevices(panel,0);state.panels=state.panels.filter(function(p){return p.id!==panel.id;});
      renderAll();return;
    }
    if(key==='clamp'){
      state.clamps=state.clamps.filter(function(c){return c.id!==target.id;});
      if(clampState&&clampState.id===target.id)clampState=null;
      renderClamp();renderTray();return;
    }
    if(key==='inbox'){detachMeterFromObject('IN');removeWiresFor('IN');}
    else if(key==='pushbutton'){
      const pb=pushbuttonById(target.id);if(pb){detachMeterFromObject(pb.id);removeWiresFor(pb.id);state.pushbuttons=state.pushbuttons.filter(function(x){return x.id!==pb.id;});}
    }
    else if(key==='motor'||key==='dcmotor'){
      const motor=motorById(target.id);if(motor){detachMeterFromObject(motor.id);removeWiresFor(motor.id);state.motors=state.motors.filter(function(x){return x.id!==motor.id;});updateMotorSound(0);}
    }
    else if(key==='multimeter'){state.mm.a=null;state.mm.b=null;state.mm.aDocked=true;state.mm.bDocked=true;meterProbeHover=null;meterResetProbes();}
    if(key!=='motor'&&key!=='dcmotor'&&key!=='pushbutton')state.special[key]=false;
    log('Объект удалён с рабочего поля и возвращён в лоток.','info');
  }
  renderAll();
}
objectMenuEl.addEventListener('click',function(evt){
  const action=evt.target.closest('[data-object-act]');if(!action)return;
  const target=objectMenuTarget,kind=action.getAttribute('data-object-act');
  hideObjectMenu();
  if(kind==='properties')openProperties(target);
  else if(kind==='remove')removeObjectFromScene(target);
});
document.addEventListener('pointerdown',function(evt){if(!evt.target.closest('#objectMenu'))hideObjectMenu();});

/* ПКМ по реле */
relayLayer.addEventListener('contextmenu', function(evt){
  const g = evt.target.closest('.relay');
  if (!g) return;
  showObjectMenu(evt,{kind:'relay',id:+g.dataset.rid});
});

/* ПКМ по аппарату или кнопочному посту */
deviceLayer.addEventListener('contextmenu', function(evt){
  const station=evt.target.closest('.push-station');
  if(station){showObjectMenu(evt,{kind:'special',key:'pushbutton',id:station.dataset.dev});return;}
  const g = evt.target.closest('.dev');
  if (!g) return;
  showObjectMenu(evt,{kind:'device',id:+g.dataset.id});
});
boxLayer.addEventListener('contextmenu',function(evt){
  if(!evt.target.closest('.inbox-draggable'))return;
  const panel=inboxPanel();
  showObjectMenu(evt,panel?{kind:'special',key:'panel',id:panel.id}:{kind:'special',key:'inbox'});
});
motorLayer.addEventListener('contextmenu',function(evt){const body=evt.target.closest('.motor-draggable');const control=evt.target.closest('.motor-load-control');const id=body?body.dataset.dev:(control&&control.querySelector('.motor-load')&&control.querySelector('.motor-load').dataset.mid);if(id){const motor=motorById(id);showObjectMenu(evt,{kind:'special',key:motorIsDc(motor)?'dcmotor':'motor',id:id});}});
mmLayer.addEventListener('contextmenu',function(evt){if(evt.target.closest('.multimeter-body,.mm-probe'))showObjectMenu(evt,{kind:'special',key:'multimeter'});});

/* ============================================================
   7. КОММУТАЦИЯ
   ============================================================ */
/* мгновенное обновление лицевой панели аппарата (с анимацией рукоятки/якоря) */
function applyDeviceVisual(dev){
  const g = deviceLayer.querySelector('.dev[data-id="'+dev.id+'"]');
  if (!g) return;

  if (TYPES[dev.type].kind === 'contactor'){       // втягивание якоря пускателя
    Array.prototype.forEach.call(g.querySelectorAll('.plg-depth'), function(plg){
      const aux = plg.classList.contains('aux-actuator');
      const base = aux ? 'aux-actuator plg-depth ' : 'plg-depth ';
      plg.setAttribute('class', base + (dev.coil ? ('pressed ' + (aux ? 'aux-pressing' : 'pressing')) : 'released'));
    });
    const stc = g.querySelector('.stateTxt');
    if (stc){
      stc.textContent = dev.coil ? 'ВКЛ' : 'ОТКЛ';
      stc.setAttribute('fill', dev.coil ? '#1e7a3c' : '#4b5563');
    }
    return;
  }

  const hy = handleY(dev.tripped, dev.on);
  Array.prototype.forEach.call(g.querySelectorAll('.hdl'), function(h){
    h.setAttribute('transform', 'translate(0,'+hy+')');
  });
  const col = dev.tripped ? '#ff8a00' : (dev.on ? '#e01b1b' : '#1e6b3a');
  Array.prototype.forEach.call(g.querySelectorAll('.win'), function(r){ r.setAttribute('fill', col); });
  const st = g.querySelector('.stateTxt');
  if (st){
    st.textContent = dev.tripped ? 'СРАБОТАЛ' : (dev.on ? 'ВКЛ' : 'ОТКЛ');
    st.setAttribute('fill', dev.tripped ? '#ff8a00' : (dev.on ? '#c62828' : '#4b5563'));
  }
}

function toggleDevice(dev){
  const t = TYPES[dev.type];
  if(t.kind==='vfd'){
    const input=vfdInputState(dev,potentialMap().pot);
    log(tagOf(dev.id)+': вход '+(input.ready?Math.round(input.lineVoltageRms)+' В, '+input.frequencyHz.toFixed(1)+' Гц':'не готов')
      +'; задание '+vfdSetFrequency(dev).toFixed(1)+' Гц. Управление кнопками RUN, STOP, REV, ▲ и ▼.','info');
    return;
  }
  if (t.kind === 'timer'){
    log(tagOf(dev.id)+': A1–A2 — '+Math.round(ratedVoltageOf(dev,220))+' В. Без провода S отсчёт начинается при подаче питания; провод S позволяет запускать его отдельно. Красные регуляторы задают диапазон, уставку и режим.', 'info');
    return;
  }
  if(t.kind==='converter'){
    const input=tpInputState(dev,potentialMap().pot);
    log(tagOf(dev.id)+': вход '+(input.ready?Math.round(input.lineVoltageRms)+' В, '+input.frequencyHz.toFixed(1)+' Гц':'не готов')
      +'; выход якоря '+(dev.tpOn?'включён':'отключён')+', уставка '+tpSetArmatureVoltage(dev).toFixed(0)+' В, возбуждение '+tpFieldVoltage(dev).toFixed(0)+' В. Управление кнопками «СЕТЬ», ▲ и ▼.','info');
    renderSide();
    return;
  }
  if (t.kind === 'contactor'){
    log('Пускатель включается катушкой A1–A2. Для ручной проверки удерживайте жёлтые пластины левой кнопкой мыши.', 'info');
    renderSide();
    return;
  }
  if (t.kind === 'meter'){
    log(tagOf(dev.id)+': однофазный счётчик. Клеммы 1–2 — фаза, 3–4 — нейтраль. Показание '+(Number(dev.energyKwh)||0).toFixed(6)+' кВт·ч.', 'info');
    renderSide();
    return;
  }
  if (t.kind === 'sensor'){
    log(tagOf(dev.id)+': '+Math.round(meterVoltage(dev))+' В, '+(Number(dev.sensorCurrentA)||0).toFixed(1)+' А. Измеряется нагрузка после выходов L/N.', 'info');
    renderSide();
    return;
  }
  if (t.kind === 'bulb'){
    const u=bulbVoltage(dev);
    log(tagOf(dev.id)+': лампа накаливания 100 Вт, напряжение '+Math.round(u)+' В'+(dev.burned?' — нить перегорела.':'.'),dev.burned?'warn':'info');
    renderSide();
    return;
  }
  if (t.kind === 'outlet'){
    log(tagOf(dev.id)+': двойная розетка, напряжение между L и N '+Math.round(outletVoltage(dev))+' В. Обе розетки соединены параллельно.', 'info');
    renderSide();
    return;
  }
  if (t.kind !== 'mcb' && t.kind !== 'rcd'){
    log('Клеммная колодка — механическое соединение, коммутации нет.', 'info');
    renderSide();
    return;
  }
  if (dev.tripped){
    dev.tripped = false; dev.on = false; dev.rcdLeakageMa = 0;
    if(t.kind==='mcb'){dev.breakerHeat=0;dev.breakerCurrentA=0;dev.breakerPhaseCurrents=[];}
    playBreakerSound(false);                 // взведение рукоятки после срабатывания
    log(t.title + ': взведён после срабатывания, рукоятка в «0».', 'ok');
  } else if (!dev.on){
    dev.on = true;
    playBreakerSound(true);
    log(t.title + ': ВКЛЮЧЕН (рукоятка «I»).', 'ok');
  } else {
    dev.on = false;
    playBreakerSound(false);
    log(t.title + ': отключён (рукоятка «0»).', 'info');
  }
  /* Изменение автомата влияет не только на катушки, но и на лампы.
     Полностью обновляем электрические состояния и лицевые панели всех аппаратов. */
  renderAll();
}

/* напряжение управления: питание стенда + включённый вводной автомат */

/* ---------- катушка пускателя: A1 и A2 — концы катушки, она питается 220 В ----------
   Катушка — это нагрузка, а не провод: в potentialMap она не замыкает A1 с A2.
   Как только между A1 и A2 появляется напряжение сети (≈220 В), якорь втягивается
   и замыкаются силовые контакты 1-2, 3-4, 5-6 (это уже учтено в internalLinks). */
function coilVoltage(obj){return voltageBetweenTerminals(obj,'A1','A2',true);}
function timerVoltage(obj){return voltageBetweenTerminals(obj,'A1','A2',true);}
function updateTimeRelays(now){
  const timers=state.devices.filter(function(d){return d.type==='timer';});
  if(!timers.length)return false;
  const map=potentialMap();
  let changed=false;
  timers.forEach(function(d){
    const a=map.pot[nodeKey({devId:d.id,key:'A1'})];
    const b=map.pot[nodeKey({devId:d.id,key:'A2'})];
    const s=map.pot[nodeKey({devId:d.id,key:'S'})];
    const u=a&&b?Math.hypot(a.r-b.r,a.i-b.i):0;
    const supplied=!d.timerBurned&&!map.conflict&&voltageIsOperating(u,d,220);
    const externalS=state.wires.some(function(w){
      return sameTerm(w.a,d.id,'S')||sameTerm(w.b,d.id,'S');
    });
    const trigger=supplied&&(!externalS||(s&&b&&a&&
      voltageIsOperating(Math.hypot(s.r-b.r,s.i-b.i),d,220)&&
      Math.hypot(s.r-a.r,s.i-a.i)<20));
    const before=!!d.timerActive, previousSignal=!!d.timerLastSignal;
    const mode=TIMER_MODES.includes(d.timerMode)?d.timerMode:'on';
    const delay=timerDelayMs(d);
    d.timerSupply=!!supplied;
    if(!supplied){
      d.timerActive=false;d.timerSince=null;d.timerLastSignal=false;
    }else if(mode==='on'){
      if(trigger){
        if(!previousSignal||d.timerSince==null)d.timerSince=now;
        d.timerActive=now-d.timerSince>=delay;
      }else{d.timerSince=null;d.timerActive=false;}
      d.timerLastSignal=!!trigger;
    }else if(mode==='off'){
      if(trigger){d.timerActive=true;d.timerSince=null;}
      else if(previousSignal&&d.timerActive)d.timerSince=now;
      if(!trigger&&d.timerSince!=null&&now-d.timerSince>=delay){d.timerActive=false;d.timerSince=null;}
      d.timerLastSignal=!!trigger;
    }else{
      if(trigger&&!previousSignal){d.timerActive=true;d.timerSince=now;}
      if(d.timerActive&&d.timerSince!=null&&now-d.timerSince>=delay){d.timerActive=false;d.timerSince=null;}
      d.timerLastSignal=!!trigger;
    }
    if(before!==!!d.timerActive){
      changed=true;
      log(tagOf(d.id)+': контакт 15–'+(d.timerActive?'18 замкнут, 15–16 разомкнут.':'16 замкнут, 15–18 разомкнут.'),d.timerActive?'ok':'info');
    }
  });
  return changed;
}
function timeRelayTick(){
  const now=performance.now();
  if(updateTimeRelays(now))renderAll();
  else state.devices.filter(function(d){return d.type==='timer';}).forEach(function(d){
    const label=deviceLayer.querySelector('.dev[data-id="'+d.id+'"] .timer-state');
    if(label)label.textContent=timerStatus(d,now);
  });
}
setInterval(timeRelayTick,50);
/* Напряжение между двумя клеммами аппарата. */
function voltageBetweenTerminals(obj,aKey,bKey,allowConflict){
  if(!obj||obj.id===undefined)return 0;
  const map=potentialMap();
  if(map.conflict&&!allowConflict)return 0;
  const a=map.pot[nodeKey({devId:obj.id,key:aKey})];
  const b=map.pot[nodeKey({devId:obj.id,key:bKey})];
  return a&&b?Math.hypot(a.r-b.r,a.i-b.i):0;
}
function lampVoltage(lamp){return voltageBetweenTerminals(lamp,'t0','b0');}
function bulbVoltage(bulb){return voltageBetweenTerminals(bulb,'L','N');}
function outletVoltage(outlet){return voltageBetweenTerminals(outlet,'L','N');}
function applianceVoltage(appliance){return voltageBetweenTerminals(appliance,'L','N');}
function meterVoltage(meter){return voltageBetweenTerminals(meter,'L_in','N_in');}

/* Активная мощность через выход прибора: Re(U * conj(I)). */
function meterPowerW(meter){
  const map=potentialMap();if(map.conflict)return 0;
  const a=map.pot[nodeKey({devId:meter.id,key:'L_out'})],b=map.pot[nodeKey({devId:meter.id,key:'N_out'})];
  if(!a||!b)return 0;
  const currents=clampWireCurrents();let r=0,i=0;
  state.wires.forEach(function(w){
    const value=currents.phasors&&currents.phasors[w.id];if(!value)return;
    const sign=String(w.a.devId)===String(meter.id)&&w.a.key==='L_out'?1:
      (String(w.b.devId)===String(meter.id)&&w.b.key==='L_out'?-1:0);
    r+=sign*value.r;i+=sign*value.i;
  });
  return Math.max(0,(a.r-b.r)*r+(a.i-b.i)*i);
}

let energyMeterLast=performance.now();
function energyMeterTick(){
  return withElectricalRead(function(){
    const now=performance.now(),dt=Math.min(2,Math.max(0,(now-energyMeterLast)/1000));
    energyMeterLast=now;
    state.devices.filter(function(d){return d.type==='meter';}).forEach(function(d){
      const power=meterPowerW(d);
      d.meterPowerW=power;
      d.energyKwh=Math.max(0,Number(d.energyKwh)||0)+power*dt/3600000;
      // Импульс ускорен визуально, само накопление энергии идёт в реальном времени.
      d.meterPulse=power>0&&Math.floor(now/350)%2===0;
      const g=deviceLayer.querySelector('.dev[data-id="'+d.id+'"]');
      if(!g)return;
      const energyEl=g.querySelector('.meter-energy');
      const powerEl=g.querySelector('.meter-power');
      const pulseEl=g.querySelector('.meter-pulse');
      const supplyEl=g.querySelector('.meter-supply-led');
      if(energyEl)energyEl.textContent=meterEnergyText(d.energyKwh);
      if(powerEl)powerEl.textContent=meterPowerText(power);
      if(pulseEl)pulseEl.setAttribute('fill',d.meterPulse?'#ff3b30':'#657079');
      if(supplyEl){
        const powered=meterVoltage(d)>=50;
        supplyEl.setAttribute('fill',powered?'#35e47d':'#245d39');
        supplyEl.classList.toggle('lit',powered);
      }
    });
    state.devices.filter(function(d){return d.type==='sensor';}).forEach(function(d){
      const voltage=meterVoltage(d),currents=clampWireCurrents();
      const value=internalLinkCurrent(currents,{devId:d.id,key:'L_in'},{devId:d.id,key:'L_out'});
      const current=voltage>0?Math.hypot(value.r,value.i):0;
      d.sensorVoltage=voltage;
      d.sensorCurrentA=current;
      const g=deviceLayer.querySelector('.dev[data-id="'+d.id+'"]');
      if(!g)return;
      const voltageEl=g.querySelector('.sensor-v'),currentEl=g.querySelector('.sensor-a');
      if(voltageEl)voltageEl.textContent=Math.round(voltage);
      if(currentEl)currentEl.textContent=current.toFixed(1);
    });
  });
}
setInterval(energyMeterTick,250);

/* Короткий механический щелчок контактора без внешних звуковых файлов. */
let contactorAudio = null;
let motorSound = null;
function playContactorSound(pulledIn){
  try{
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!contactorAudio) contactorAudio = new AudioCtor();
    if (contactorAudio.state === 'suspended') contactorAudio.resume().catch(function(){});
    const ctx = contactorAudio, now = ctx.currentTime;
    const bursts = pulledIn ? [0, .052] : [0];
    bursts.forEach(function(delay, index){
      const duration = pulledIn ? .055 : .075;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate*duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/data.length, 2.5);
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = pulledIn ? (index ? 1550 : 950) : 650;
      filter.Q.value = .8;
      const t = now + delay;
      gain.gain.setValueAtTime(.0001, t);
  gain.gain.exponentialRampToValueAtTime(pulledIn ? .36 : .21, t+.004);
      gain.gain.exponentialRampToValueAtTime(.0001, t+duration);
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start(t); src.stop(t+duration);
    });
    const thump = ctx.createOscillator(), thumpGain = ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(pulledIn ? 105 : 78, now);
    thump.frequency.exponentialRampToValueAtTime(48, now+.075);
  thumpGain.gain.setValueAtTime(pulledIn ? .195 : .12, now);
    thumpGain.gain.exponentialRampToValueAtTime(.0001, now+.09);
    thump.connect(thumpGain); thumpGain.connect(ctx.destination);
    thump.start(now); thump.stop(now+.095);
  } catch (e){ /* звук не должен мешать работе электрической модели */ }
}
/* Щелчок рукоятки автоматического выключателя: сухой и короткий, без
   тяжёлого удара контактора. Слышны близкие щелчки — механизм рукоятки
   и защёлка контакта; включение чуть звонче выключения, а срабатывание
   защиты резче и громче: механизм срывается сам, и рукоятка падает
   в среднее положение. */
function playBreakerSound(switchedOn, tripped){
  try{
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!contactorAudio) contactorAudio = new AudioCtor();
    if (contactorAudio.state === 'suspended') contactorAudio.resume().catch(function(){});
    const ctx = contactorAudio, now = ctx.currentTime;
    const p = {
      on:   { hz:3200, burst:.26,  knock:.075, knockHz:150, knockMs:.05, delays:[0,.012],      duration:.042, decay:5 },
      off:  { hz:2600, burst:.21,  knock:.06,  knockHz:118, knockMs:.05, delays:[0,.012],      duration:.036, decay:5 },
      trip: { hz:3600, burst:.34,  knock:.115, knockHz:132, knockMs:.07, delays:[0,.009,.024], duration:.05,  decay:4 }
    }[tripped ? 'trip' : (switchedOn ? 'on' : 'off')];
    p.delays.forEach(function(delay, index){
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate*p.duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/data.length, p.decay);
      const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      src.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = p.hz * (index ? 1.35 : 1);
      filter.Q.value = 1.2;
      const t = now + delay;
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(index ? p.burst*.45 : p.burst, t+.002);
      gain.gain.exponentialRampToValueAtTime(.0001, t+p.duration);
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start(t); src.stop(t+p.duration);
    });
    const knock = ctx.createOscillator(), knockGain = ctx.createGain();
    knock.type = 'triangle';
    knock.frequency.setValueAtTime(p.knockHz, now);
    knock.frequency.exponentialRampToValueAtTime(64, now+p.knockMs);
    knockGain.gain.setValueAtTime(p.knock, now);
    knockGain.gain.exponentialRampToValueAtTime(.0001, now+p.knockMs+.01);
    knock.connect(knockGain); knockGain.connect(ctx.destination);
    knock.start(now); knock.stop(now+p.knockMs+.015);
  } catch (e){ /* звук не должен мешать работе электрической модели */ }
}
/* Щелчок теплового реле: биметаллический механизм срабатывает легко и сухо,
   заметно тише рукоятки автомата. Нужен потому, что отпадание пускателя
   слышно только при собранной цепи катушки, а само реле щёлкает всегда. */
function playRelaySound(){
  try{
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!contactorAudio) contactorAudio = new AudioCtor();
    if (contactorAudio.state === 'suspended') contactorAudio.resume().catch(function(){});
    const ctx = contactorAudio, now = ctx.currentTime;
    const duration = .028;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate*duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/data.length, 6);
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 1.4;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.14, now+.0015);
    gain.gain.exponentialRampToValueAtTime(.0001, now+duration);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(now); src.stop(now+duration);
    const tick = ctx.createOscillator(), tickGain = ctx.createGain();
    tick.type = 'triangle';
    tick.frequency.setValueAtTime(230, now);
    tick.frequency.exponentialRampToValueAtTime(150, now+.025);
    tickGain.gain.setValueAtTime(.032, now);
    tickGain.gain.exponentialRampToValueAtTime(.0001, now+.03);
    tick.connect(tickGain); tickGain.connect(ctx.destination);
    tick.start(now); tick.stop(now+.035);
  } catch (e){ /* звук не должен мешать работе электрической модели */ }
}
function updateMotorSound(direction,rpm){
  try{
    if (!direction){
      if (!motorSound) return;
      const old = motorSound;
      motorSound = null;
      const t = old.ctx.currentTime;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setValueAtTime(Math.max(.0001, old.gain.gain.value), t);
      old.gain.gain.exponentialRampToValueAtTime(.0001, t+.22);
      setTimeout(function(){
        try{ old.nodes.forEach(function(n){ if (n.stop) n.stop(); }); old.gain.disconnect(); }catch(e){}
      }, 260);
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!contactorAudio) contactorAudio = new AudioCtor();
    if (contactorAudio.state === 'suspended') contactorAudio.resume().catch(function(){});
    if (motorSound){
      motorSound.direction = direction;
      const t=motorSound.ctx.currentTime,ratio=Math.max(.04,Math.min(1,(rpm||0)/1350));
      if(motorSound.shaft)motorSound.shaft.frequency.setTargetAtTime(Math.max(2,(rpm||0)/60),t,.08);
      if(motorSound.rotationPulse)motorSound.rotationPulse.frequency.setTargetAtTime(Math.max(2,(rpm||0)/60),t,.08);
    motorSound.gain.gain.setTargetAtTime(.018+.0795*ratio,t,.12);
      return;
    }
    const ctx = contactorAudio, now = ctx.currentTime;
    const master = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass'; lowpass.frequency.value = 850; lowpass.Q.value = .7;
    master.gain.setValueAtTime(.0001, now);
    const speedRatio=Math.max(.04,Math.min(1,(rpm||0)/1350));
  master.gain.exponentialRampToValueAtTime(.018+.0795*speedRatio, now+.28);
    lowpass.connect(master); master.connect(ctx.destination);

    const hum50 = ctx.createOscillator(), hum100 = ctx.createOscillator(), shaft = ctx.createOscillator();
    const g50 = ctx.createGain(), g100 = ctx.createGain(), shaftGain = ctx.createGain();
    hum50.type = 'sine'; hum50.frequency.value = 50; g50.gain.value = .52;
    hum100.type = 'triangle'; hum100.frequency.value = 100; g100.gain.value = .12;
    shaft.type = 'sine'; shaft.frequency.value = Math.max(2,(rpm||0)/60); shaftGain.gain.value = .34;
    hum50.connect(g50); g50.connect(lowpass);
    hum100.connect(g100); g100.connect(lowpass);
    shaft.connect(shaftGain); shaftGain.connect(lowpass);

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i=0;i<noiseData.length;i++) noiseData[i] = (Math.random()*2-1)*.16;
    const noise = ctx.createBufferSource(), noiseFilter = ctx.createBiquadFilter(), noiseGain = ctx.createGain();
    noise.buffer = noiseBuffer; noise.loop = true;
    noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 1050; noiseFilter.Q.value = .72;
    noiseGain.gain.value = .19;
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(lowpass);

    /* Шорох подшипников: узкая высокая составляющая с медленным плаванием частоты
       и пульсацией общей шумовой дорожки на частоте вращения ротора. */
    const bearing = ctx.createOscillator(), bearingGain = ctx.createGain();
    const bearingFlutter = ctx.createOscillator(), flutterDepth = ctx.createGain();
    bearing.type = 'triangle'; bearing.frequency.value = 670; bearingGain.gain.value = .028;
    bearingFlutter.type = 'sine'; bearingFlutter.frequency.value = 4.7; flutterDepth.gain.value = 9;
    bearingFlutter.connect(flutterDepth); flutterDepth.connect(bearing.frequency);
    bearing.connect(bearingGain); bearingGain.connect(lowpass);
    const rotationPulse = ctx.createOscillator(), pulseDepth = ctx.createGain();
    rotationPulse.type = 'sine'; rotationPulse.frequency.value = Math.max(2,(rpm||0)/60); pulseDepth.gain.value = .045;
    rotationPulse.connect(pulseDepth); pulseDepth.connect(noiseGain.gain);

    hum50.start(now); hum100.start(now); shaft.start(now); noise.start(now);
    bearing.start(now); bearingFlutter.start(now); rotationPulse.start(now);
    motorSound = { ctx:ctx, gain:master,shaft:shaft,rotationPulse:rotationPulse,
      nodes:[hum50,hum100,shaft,noise,bearing,bearingFlutter,rotationPulse], direction:direction };
  } catch (e){ /* отсутствие аудио не влияет на работу двигателя */ }
}
function syncContactorCoils(){
  state.devices.forEach(function(km){
    if (km.type !== 'km1') return;
    const u = coilVoltage(km);
    const electrical = !km.coilBurned && voltageIsOperating(u,km,220); // катушка срабатывает в диапазоне своего паспортного напряжения
    const on = electrical || !!km.manualPressed;
    km.coilU = Math.round(u/10)*10;
    km.coilElectrical = electrical;
    if (on !== km.coil){
      km.coil = on;
      km.coilAnim = on;
      applyDeviceVisual(km);
      playContactorSound(on);
      if (on && electrical) log(tagOf(km.id)+': на катушке A1–A2 появилось ' + km.coilU + ' В — якорь втянут; силовые контакты и НО-контакты 13-14, 53-54 замкнуты, НЗ-контакт 61-62 разомкнут.', 'ok');
      else if(on) log(tagOf(km.id)+': жёлтые пластины нажаты вручную — силовые и НО-контакты принудительно замкнуты, НЗ-контакт 61-62 разомкнут.', 'warn');
      else    log(tagOf(km.id)+': катушка обесточена — якорь вернулся; силовые контакты и НО-контакты 13-14, 53-54 разомкнуты, НЗ-контакт 61-62 замкнут.', 'info');
    }
  });
}

function updateOvervoltageDamage(){
  const damaged=[];
  state.devices.forEach(function(d){
    if(d.type==='lamp'&&!d.burned){
      const u=lampVoltage(d);
      const nominal=ratedVoltageOf(d,220);
      if(voltageIsDestructive(u,d,220)){
        d.burned=true;damaged.push(tagOf(d.id)+' — лампа перегорела ('+Math.round(u)+' В)');
        log('АВАРИЯ: '+tagOf(d.id)+' получила '+Math.round(u)+' В при номинале '+Math.round(nominal)+' В — лампа перегорела.','err');
      }
    }
    if(d.type==='bulb'&&!d.burned){
      const u=bulbVoltage(d);
      const nominal=ratedVoltageOf(d,220);
      if(voltageIsDestructive(u,d,220)){
        d.burned=true;damaged.push(tagOf(d.id)+' — лампа накаливания перегорела ('+Math.round(u)+' В)');
        log('АВАРИЯ: на '+tagOf(d.id)+' подано '+Math.round(u)+' В при номинале '+Math.round(nominal)+' В — нить накала перегорела.','err');
      }
    }
    if(TYPES[d.type].kind==='appliance'&&d.applianceOn&&!d.applianceBurned){
      const u=applianceVoltage(d),nominal=ratedVoltageOf(d,220);
      if(voltageIsDestructive(u,d,220)){
        d.applianceBurned=true;d.applianceOn=false;
        damaged.push(tagOf(d.id)+' — повреждён прибор ('+Math.round(u)+' В)');
        log('АВАРИЯ: '+TYPES[d.type].title+' '+tagOf(d.id)+' получил '+Math.round(u)+' В при номинале '+Math.round(nominal)+' В — прибор повреждён.','err');
      }
    }
    if(d.type==='km1'&&!d.coilBurned){
      const u=coilVoltage(d);
      const nominal=ratedVoltageOf(d,220);
      if(voltageIsDestructive(u,d,220)){
        d.coilBurned=true;d.coil=false;damaged.push(tagOf(d.id)+' — сгорела катушка A1–A2 ('+Math.round(u)+' В)');
        log('АВАРИЯ: на катушку '+tagOf(d.id)+' A1–A2 подано '+Math.round(u)+' В при номинале '+Math.round(nominal)+' В — катушка сгорела.','err');
      }
    }
    if(d.type==='timer'&&!d.timerBurned){
      const u=timerVoltage(d);
      const nominal=ratedVoltageOf(d,220);
      if(voltageIsDestructive(u,d,220)){
        d.timerBurned=true;d.timerActive=false;damaged.push(tagOf(d.id)+' — сгорело реле времени ('+Math.round(u)+' В)');
        log('АВАРИЯ: на '+tagOf(d.id)+' A1–A2 подано '+Math.round(u)+' В при номинале '+Math.round(nominal)+' В — реле времени повреждено.','err');
      }
    }
  });
  if(damaged.length)showPhaseFault('АВАРИЯ: ПЕРЕНАПРЯЖЕНИЕ! '+damaged.join(' · '));
  return damaged.length>0;
}

function updateCoils(){
  updateOvervoltageDamage();
  updateTimeRelays(performance.now());
  // Ручное нажатие физически замыкает контакты сразу. Проверяем этот момент
  // до электрической блокировки, которая может успеть обесточить второй пускатель.
  // Так результат не зависит от порядка KM1/KM2 в массиве устройств.
  if(state.devices.some(function(d){return d.type==='km1'&&d.manualPressed;})){
    const overlapMap=potentialMap();
    if(overlapMap.conflict&&electricalShortFault(overlapMap)){
      syncContactorCoils();
      return;
    }
  }
  syncContactorCoils();
  if (updateRcdLeakage()){
    // УЗО уже разомкнуло защищённую ветвь: катушки должны отпасть
    // в этом же цикле, без дополнительного действия пользователя.
    syncContactorCoils();
  }
  const faultMap = potentialMap();
  if (faultMap.conflict && electricalShortFault(faultMap)){
    // Автомат уже отключён: сразу пересчитываем катушки в новом состоянии сети.
    // Это возвращает якорь и контакты до текущей отрисовки, без дополнительного клика.
    syncContactorCoils();
  } else if(!faultMap.conflict){
    activeShortFaultSignature=null;
  }
}

/* ---------- УЗО: ток, ушедший из защищённой цепи мимо нейтрали ----------
   Проводники в тренажёре идеальны, поэтому прямой контакт защищённой фазы с PE
   моделируется как утечка 230 мА. Это выше IΔn=30 мА и вызывает мгновенное
   двухполюсное отключение. Короткое замыкание между bL и bN за тем же УЗО
   возвращает ток через его нейтральный полюс и утечкой не считается. */
function updateRcdLeakage(){
  const rcds=state.devices.filter(function(d){return d.type==='rcd'&&d.on&&!d.tripped;});
  if(!rcds.length)return false;
  let changed=false;

  rcds.forEach(function(rcd){
    const map=potentialMap();
    if(!map.conflict){
      const currents=clampWireCurrents();
      const phase=internalLinkCurrent(currents,{devId:rcd.id,key:'tL'},{devId:rcd.id,key:'bL'});
      const neutral=internalLinkCurrent(currents,{devId:rcd.id,key:'tN'},{devId:rcd.id,key:'bN'});
      const leakageMa=Math.hypot(phase.r+neutral.r,phase.i+neutral.i)*1000;
      rcd.rcdLeakageMa=leakageMa;
      if(leakageMa+1e-7<Math.max(1,Number(rcd.ratedLeakageMa)||30))return;
      rcd.tripped=true;rcd.on=false;changed=true;playBreakerSound(false,true);
      log('АВАРИЯ: '+tagOf(rcd.id)+' обнаружило дифференциальный ток '+leakageMa.toFixed(1)+' мА. УЗО отключило фазу и нейтраль.','err');
      showPhaseFault('УТЕЧКА ТОКА! '+tagOf(rcd.id)+' · IΔ '+leakageMa.toFixed(1)+' мА · УЗО СРАБОТАЛО');
      return;
    }
    // У прямого КЗ идеальная модель не задаёт конечного тока. Сохраняем
    // отдельно согласованный учебный сценарий прямого контакта с PE/N.
    const adj={};
    function add(a,b){
      const ka=nodeKey(a),kb=nodeKey(b);
      (adj[ka]=adj[ka]||[]).push(kb);
      (adj[kb]=adj[kb]||[]).push(ka);
    }
    function ownPole(pair){
      const a=pair[0],b=pair[1];
      if(String(a.devId)!==String(rcd.id)||String(b.devId)!==String(rcd.id))return false;
      const keys=[a.key,b.key].sort().join('|');
      return keys==='bL|tL'||keys==='bN|tN';
    }
    // Для поиска утечки отделяем входы УЗО от его выходов и исследуем
    // проводники, подключённые к защищённой фазной клемме 2 (bL).
    internalLinks().forEach(function(pair){if(!ownPole(pair))add(pair[0],pair[1]);});
    state.wires.forEach(function(w){add(w.a,w.b);});

    const start=nodeKey({devId:rcd.id,key:'bL'}),seen={},queue=[start];
    while(queue.length){
      const key=queue.shift();
      if(seen[key])continue;
      seen[key]=true;
      (adj[key]||[]).forEach(function(next){if(!seen[next])queue.push(next);});
    }

    const leaksToPe=!!seen[nodeKey({devId:'IN',key:'PE'})];
    const bypassesNeutral=!!seen[nodeKey({devId:'IN',key:'N'})]&&
      !seen[nodeKey({devId:rcd.id,key:'bN'})];
    const leakageMa=(leaksToPe||bypassesNeutral)?230:0;
    rcd.rcdLeakageMa=leakageMa;
    const threshold=Math.max(1,Number(rcd.ratedLeakageMa)||30);
    if(leakageMa<threshold)return;

    rcd.tripped=true;
    rcd.on=false;
    changed=true;
    playBreakerSound(false, true);           // двухполюсное отключение от тока утечки
    const route=leaksToPe?'в PE':'в нейтраль в обход полюса N';
    log('АВАРИЯ: '+tagOf(rcd.id)+' обнаружило ток утечки '+leakageMa+' мА '+route+'. УЗО отключило фазу и нейтраль.','err');
    showPhaseFault('УТЕЧКА ТОКА! '+tagOf(rcd.id)+' · IΔ '+leakageMa+' мА · УЗО СРАБОТАЛО');
  });
  return changed;
}

let activeShortFaultSignature=null;
function electricalShortFault(map){
  if (!map.conflicts || !map.conflicts.length) return false;
  const fault = map.conflicts.slice().sort(function(a,b){ return b.voltage-a.voltage; })[0];
  const isPhaseToPhase = fault.voltage > 300;

  // Компонента аварийной цепи нужна, чтобы отключался именно тот автомат,
  // через выход которого реально проходит ток КЗ.
  const component = {}, queue = [fault.node];
  while (queue.length){
    const key = queue.shift();
    if (component[key]) continue;
    component[key] = true;
    (map.adj[key] || []).forEach(function(n){
      const nk = nodeKey(n);
      if (!component[nk]) queue.push(nk);
    });
  }
  const outputDrive=state.devices.filter(function(d){
    return d.type==='vfd'&&['U','V','W'].some(function(key){return !!component[nodeKey({devId:d.id,key:key})];});
  })[0]||null;
  if(outputDrive&&outputDrive.vfdOutputActive){
    outputDrive.fault=true;outputDrive.running=false;outputDrive.vfdOutputActive=false;
    const signature='VFD|'+outputDrive.id+'|'+fault.node;
    activeShortFaultSignature=signature;
    log('АВАРИЯ: короткое замыкание на выходе '+tagOf(outputDrive.id)+'. Электронная защита ПЧ сняла напряжение U/V/W.','err');
    showPhaseFault('АВАРИЯ ПЧ! '+tagOf(outputDrive.id)+' · КОРОТКОЕ ЗАМЫКАНИЕ НА ВЫХОДЕ · НАЖМИТЕ STOP ДЛЯ СБРОСА.');
    return true;
  }
  // Связность с общей фазной шиной не означает прохождения тока КЗ через
  // контакт. Конечные вспомогательные сопротивления позволяют исключить
  // исправные тупиковые ветви, не задавая физический ток короткого замыкания.
  const faultBranches=internalLinks().map(function(pair){return {a:pair[0],b:pair[1],resistance:.001};})
    .concat(state.wires.map(function(w){return {a:w.a,b:w.b,resistance:.01};}));
  const faultPot=solveAdmittanceNetwork(faultBranches,map.sources||{});
  function contactCarriesFault(d,a,b){
    const value=branchCurrent({a:{devId:d.id,key:a},b:{devId:d.id,key:b},resistance:.001},faultPot);
    return Math.hypot(value.r,value.i)>.001;
  }
  function protectsFault(d){
    if(!d||!d.on||d.tripped)return false;
    if(TYPES[d.type].kind==='mcb')return Array.from({length:TYPES[d.type].poles},function(_,i){return i;}).some(function(i){return !!component[nodeKey({devId:d.id,key:'b'+i})]&&contactCarriesFault(d,'t'+i,'b'+i);});
    if(d.type==='rcd')return !!component[nodeKey({devId:d.id,key:'bL'})]&&contactCarriesFault(d,'tL','bL');
    return false;
  }
  const candidates=state.devices.filter(protectsFault);
  candidates.sort(function(a,b){
    function priority(d){
      if(isPhaseToPhase)return d.type==='mcb3'?30:d.type==='mcb2'?25:d.type==='mcb1'?20:10;
      return ['mcb1','mcb2'].includes(d.type)?30:(d.type==='rcd'?20:10);
    }
    return priority(b)-priority(a);
  });
  const breaker=candidates[0]||null;
  const voltageText = isPhaseToPhase ? '380 В' : '220 В';
  const faultText = isPhaseToPhase ? 'МЕЖФАЗНОЕ КОРОТКОЕ ЗАМЫКАНИЕ' : 'КОРОТКОЕ ЗАМЫКАНИЕ ФАЗА–N/PE';
  const signature=faultText+'|'+fault.node+'|'+Math.round(fault.voltage);

  if(breaker){
    breaker.tripped = true;
    breaker.on = false;
    if(TYPES[breaker.type]&&TYPES[breaker.type].kind==='mcb')breaker.breakerHeat=1;
    playBreakerSound(false, true);           // автоматическое отключение от короткого замыкания
    activeShortFaultSignature=signature;
    applyDeviceVisual(breaker);
    const breakerTag = tagOf(breaker.id);
    log('АВАРИЯ: '+faultText+' ('+voltageText+'). Сработал автомат '+breakerTag+'.', 'err');
    showPhaseFault('АВАРИЯ! '+faultText+' · '+voltageText+' — '+breakerTag+' ОТКЛЮЧЁН.');
    renderSide();
    return true;
  }

  // КЗ может быть выполнено прямо на вводных L1/L2/L3, до автоматов.
  // Раньше в этом случае функция молча завершалась, поэтому авария не показывалась.
  if(activeShortFaultSignature!==signature){
    activeShortFaultSignature=signature;
    log('АВАРИЯ: '+faultText+' ('+voltageText+'). Цепь КЗ не проходит через включённый защитный автомат.', 'err');
    showPhaseFault('АВАРИЯ! '+faultText+' · '+voltageText+' — НЕТ ВКЛЮЧЁННОЙ ЗАЩИТЫ В ЭТОЙ ЦЕПИ.');
  }
  return true;
}


// Диапазоны регулировки РТИ; учебная тепловая характеристика класса 10A.
const THERMAL_RANGES=[
  [0.1,0.16],[0.16,0.25],[0.25,0.4],[0.4,0.63],[0.63,1],[1,1.6],
  [1.6,2.5],[2.5,4],[4,6],[5.5,8],[7,10],[9,13],[12,18],[17,25],
  [23,32],[28,36],[30,40],[37,50],[48,65],[55,70],[63,80],[80,93],
  [55,80],[63,90],[90,120],[120,150],[150,180],[125,200]
].map(function(pair){return {id:pair.join('-'),min:pair[0],max:pair[1]};});
const THERMAL_TAU=6/Math.log(Math.pow(7.2/1.1,2)/(Math.pow(7.2/1.1,2)-1));
const THERMAL_COOL_TAU=180;
function thermalNumber(value){return String(Number(Number(value).toFixed(2))).replace('.',',');}
function thermalRange(rel){
  const selected=THERMAL_RANGES.find(function(r){return r.id===rel.settingRange;});
  if(selected)return selected;
  const set=Number(rel.set)||25;
  return THERMAL_RANGES.find(function(r){return set>=r.min&&set<=r.max;})||THERMAL_RANGES[13];
}
function syncThermalSettings(rel){
  const range=thermalRange(rel);
  rel.settingRange=range.id;
  rel.set=Math.max(range.min,Math.min(range.max,Number(rel.set)||range.max));
  rel.tripClass='10A';
}
function thermalTripSeconds(ratio,heat){
  const q=Math.pow(Math.max(0,Number(ratio)||0)/1.1,2);
  heat=Math.max(0,Number(heat)||0);
  if(heat>=1)return 0;
  return q>1?THERMAL_TAU*Math.log((q-heat)/(q-1)):Infinity;
}
function thermalPhaseCurrents(rel,wireCurrents){
  const id='kk'+rel.id,result=[0,0,0];
  if(wireCurrents.internalPhasors)return result.map(function(_,i){
    const value=internalLinkCurrent(wireCurrents,{devId:rel.kmId,key:'b'+i},{devId:id,key:'p'+i});return Math.hypot(value.r,value.i);
  });
  state.wires.forEach(function(w){
    const current=Math.max(0,Number(wireCurrents[w.id])||0);
    ['a','b'].forEach(function(end){
      if(String(w[end].devId)!==id)return;
      const pole=['p0','p1','p2'].indexOf(w[end].key);
      if(pole>=0)result[pole]+=current;
    });
  });
  return result;
}
function thermalProtectionStep(dt,wireCurrents){
  dt=Math.max(0,Number(dt)||0);
  const currents=wireCurrents||(state.relays.length?clampWireCurrents():{});
  let changed=false;
  const trips=[];
  state.relays.forEach(function(rel){
    syncThermalSettings(rel);
    const before=Number(rel.heat)||0,phases=thermalPhaseCurrents(rel,currents);
    const old=Array.isArray(rel.phaseHeat)&&rel.phaseHeat.length===3?rel.phaseHeat:[before,before,before];
    const next=phases.map(function(current,i){
      const heat=Math.max(0,Number(old[i])||0),q=Math.pow(current/(1.1*rel.set),2);
      const tau=q<heat?THERMAL_COOL_TAU:THERMAL_TAU;
      return Math.max(0,heat+(q-heat)*(-Math.expm1(-dt/tau)));
    });
    if(!rel.tripped&&next.some(function(h){return h>=1;})){
      rel.tripped=true;rel.tested=false;
      rel.tripCurrentA=Math.max.apply(null,phases);
      rel.tripRatio=rel.tripCurrentA/rel.set;
      trips.push({rel:rel,current:rel.tripCurrentA,ratio:rel.tripRatio});
      // После перехода контактов нагрев не перескакивает за порог на длинном шаге.
      next.forEach(function(h,i){next[i]=Math.min(1,h);});
    }
    rel.phaseHeat=next;
    rel.heat=Math.max.apply(null,next);
    rel.phaseCurrents=phases;
    rel.currentA=Math.max.apply(null,phases);
    if(Math.abs(rel.heat-before)>0.0001)changed=true;
  });
  return {changed:changed,trips:trips,currents:currents};
}

/* ---------- независимые тепловые реле KK1 / KK2 ---------- */
function relayLive(rel){
  const km = devById(rel.kmId);
  return !!(km && km.coil);
}
function cycleSetpoint(rel){
  syncThermalSettings(rel);
  const range=thermalRange(rel),step=(range.max-range.min)/8;
  if(range.id==='7-10'){
    rel.set=[7,8,9,10].find(function(value){return value>rel.set+0.00001;})||7;
  }else rel.set=rel.set>=range.max-0.00001?range.min:Math.min(range.max,Number((rel.set+step).toFixed(3)));
  log(tagOf('kk'+rel.id)+': уставка теплового реле — ' + rel.set + ' А (по номинальному току двигателя).', 'info');
  renderAll();
}
function testRelay(rel){
  rel.tested = true;
  rel.tripped = true;
  playRelaySound();                        // срабатывание реле от кнопки TEST
  log(tagOf('kk'+rel.id)+': нажата кнопка TEST — нормально закрытый контакт 95-96 разомкнут, нормально открытый контакт 97-98 замкнут.', 'err');
  warn('Тепловое реле '+tagOf('kk'+rel.id)+' сработало: 95-96 открыт, 97-98 закрыт. Для возврата нажмите RESET.');
  renderAll();
}
function resetRelay(rel){
  if (!rel.tripped){ log(tagOf('kk'+rel.id)+': реле не срабатывало, возврат не требуется.', 'info'); renderAll(); return; }
  rel.tripped = false;
  rel.tested = false;
  playRelaySound();                        // возврат механизма кнопкой RESET
  log(tagOf('kk'+rel.id)+': возврат кнопкой RESET — нормально закрытый контакт 95-96 замкнут, нормально открытый контакт 97-98 разомкнут.', 'ok');
  renderAll();
}

/* ============================================================
   8. ПРОВОДА: клик по винту клеммы — тянем провод, второй клик — соединение
   ============================================================ */
const wireLayer = document.getElementById('wireLayer');
const termLayer = document.getElementById('termLayer');

/* зажимы аппарата в его локальных координатах */
function termDefs(type,obj){
  const t = TYPES[type], w = t.modules*MODULE, h = t.h, out = [];
  if(t.crossModule)return crossModuleTerms(type);
  if(type==='comb')return [];
  if(type==='junction')return junctionTerms();
  if(t.kind==='mcb'){
    const count=t.poles,cell=w/count,colors=count===2?[WC.L1,WC.N]:[WC.L1,WC.L2,WC.L3];
    for(let i=0;i<count;i++)out.push({key:'t'+i,label:String(i*2+1),dx:(i+.5)*cell,dy:18,color:colors[i],entrySide:'top'});
    for(let i=0;i<count;i++)out.push({key:'b'+i,label:String(i*2+2),dx:(i+.5)*cell,dy:h-18,color:colors[i],entrySide:'bottom'});
    return out;
  }
  if (type === 'rcd'){
    out.push({key:'tL', label:'1', dx:w*0.25, dy:18, color:WC.L1});
    out.push({key:'tN', label:'N', dx:w*0.75, dy:18, color:WC.N});
    out.push({key:'bL', label:'2', dx:w*0.25, dy:h-18, color:WC.L1});
    out.push({key:'bN', label:'N', dx:w*0.75, dy:h-18, color:WC.N});
    return out;
  }
  if (type === 'meter'){
    const xs=[w*.125,w*.375,w*.625,w*.875];
    out.push({key:'L_in',  label:'1 · L вход',  dx:xs[0], dy:h-18, color:WC.L1});
    out.push({key:'L_out', label:'2 · L выход', dx:xs[1], dy:h-18, color:WC.L1});
    out.push({key:'N_in',  label:'3 · N вход',  dx:xs[2], dy:h-18, color:WC.N});
    out.push({key:'N_out', label:'4 · N выход', dx:xs[3], dy:h-18, color:WC.N});
    return out;
  }
  if (type === 'sensor'){
    out.push({key:'L_in',label:'L · вход',dx:w*.25,dy:19,color:WC.L1});
    out.push({key:'N_in',label:'N · вход',dx:w*.75,dy:19,color:WC.N});
    out.push({key:'L_out',label:'L · выход',dx:w*.25,dy:h-19,color:WC.L1});
    out.push({key:'N_out',label:'N · выход',dx:w*.75,dy:h-19,color:WC.N});
    return out;
  }
  if (type === 'lamp'){
    out.push({key:'t0', label:'L', dx:w/2, dy:18,   color:WC.L1});
    out.push({key:'b0', label:'N', dx:w/2, dy:h-18, color:WC.N});
    return out;
  }
  if (type === 'bulb'){
    out.push({key:'L',label:'L',dx:w*.28,dy:h-147,color:WC.L1});
    out.push({key:'N',label:'N',dx:w*.72,dy:h-147,color:WC.N});
    return out;
  }
  if (type === 'outlet'){
    const c1=w*.28,c2=w*.72;
    out.push({key:'L',label:'L · ввод',dx:w*.32,dy:21,color:WC.L1,hitR:8.5});
    out.push({key:'N',label:'N · ввод',dx:w*.50,dy:21,color:WC.N,hitR:8.5});
    out.push({key:'PE',label:'PE · ввод',dx:w*.68,dy:21,color:WC.PE,hitR:8.5});
    out.push({key:'s1L',label:'розетка 1 · L',dx:c1-14,dy:108,color:WC.L1,hitR:8});
    out.push({key:'s1N',label:'розетка 1 · N',dx:c1+14,dy:108,color:WC.N,hitR:8});
    out.push({key:'s1PEt',label:'розетка 1 · PE верх',dx:c1,dy:76,color:WC.PE,hitR:8});
    out.push({key:'s1PEb',label:'розетка 1 · PE низ',dx:c1,dy:140,color:WC.PE,hitR:8});
    out.push({key:'s2L',label:'розетка 2 · L',dx:c2-14,dy:108,color:WC.L1,hitR:8});
    out.push({key:'s2N',label:'розетка 2 · N',dx:c2+14,dy:108,color:WC.N,hitR:8});
    out.push({key:'s2PEt',label:'розетка 2 · PE верх',dx:c2,dy:76,color:WC.PE,hitR:8});
    out.push({key:'s2PEb',label:'розетка 2 · PE низ',dx:c2,dy:140,color:WC.PE,hitR:8});
    return out;
  }
  if (TYPES[type].kind === 'appliance')return householdApplianceTerms(type);
  if (type === 'wallSwitch'){
    const gangs=Number(obj&&obj.gangs)===2?2:1;
    if(gangs===2){
      out.push({key:'L',label:'L · общий вход',dx:w*.22,dy:23,color:WC.L1,hitR:9});
      out.push({key:'O1',label:'1 · выход',dx:w*.50,dy:23,color:WC.C,hitR:9});
      out.push({key:'O2',label:'2 · выход',dx:w*.78,dy:23,color:WC.C2,hitR:9});
    }else{
      out.push({key:'L',label:'L · вход',dx:w*.32,dy:23,color:WC.L1,hitR:9});
      out.push({key:'O1',label:'1 · выход',dx:w*.68,dy:23,color:WC.C,hitR:9});
    }
    return out;
  }
  if (type === 'twoWaySwitch'){
    out.push({key:'L',label:'L · общий контакт',dx:w*.22,dy:23,color:WC.L1,hitR:9});
    out.push({key:'O1',label:'1 · перекидной выход',dx:w*.50,dy:23,color:WC.C,hitR:9});
    out.push({key:'O2',label:'2 · перекидной выход',dx:w*.78,dy:23,color:WC.C2,hitR:9});
    return out;
  }
  if (type === 'vfd'){
    out.push({key:'R',label:'R/L1 · вход',dx:w/6,dy:18,color:WC.L1,hitR:10});
    out.push({key:'S',label:'S/L2 · вход',dx:w/2,dy:18,color:WC.L2,hitR:10});
    out.push({key:'T',label:'T/L3 · вход',dx:w*5/6,dy:18,color:WC.L3,hitR:10});
    out.push({key:'U',label:'U · выход',dx:w*.125,dy:h-18,color:WC.L1,hitR:10});
    out.push({key:'V',label:'V · выход',dx:w*.375,dy:h-18,color:WC.L2,hitR:10});
    out.push({key:'W',label:'W · выход',dx:w*.625,dy:h-18,color:WC.L3,hitR:10});
    out.push({key:'PE',label:'PE · корпус',dx:w*.875,dy:h-18,color:WC.PE,hitR:10});
    return out;
  }
  if (type === 'tp'){
    out.push({key:'R',label:'R/L1 · вход',dx:w/6,dy:18,color:WC.L1,hitR:10});
    out.push({key:'S',label:'S/L2 · вход',dx:w/2,dy:18,color:WC.L2,hitR:10});
    out.push({key:'T',label:'T/L3 · вход',dx:w*5/6,dy:18,color:WC.L3,hitR:10});
    [['ya1','Я+ · якорь',WC.C],['ya2','Я− · якорь',WC.C2],
     ['sh1','Ш+ · возбуждение',WC.L1],['sh2','Ш− · возбуждение',WC.L3],
     ['PE','PE · корпус',WC.PE]].forEach(function(row,index){
      out.push({key:row[0],label:row[1],dx:w*(.1+.2*index),dy:h-18,color:row[2],hitR:10});
    });
    return out;
  }
  if (type === 'timer'){
    const xs=[10,w/2,w-10];
    ['A1','S','A2'].forEach(function(key,i){out.push({key:key,label:key,dx:xs[i],dy:22,color:key==='A2'?WC.N:WC.C,hitR:7.5});});
    ['15','16','18'].forEach(function(key,i){out.push({key:key,label:key,dx:xs[i],dy:h-22,color:WC.C,hitR:7.5});});
    return out;
  }
  if (type === 'klemma' || type === 'pebus'){
    // Все шесть зажимов соответствующей шины соединены внутри.
    const color = type === 'pebus' ? WC.PE : WC.N;
    for (let i=0;i<6;i++) out.push({key:'k'+i, label:String(i+1), dx:w/2, dy:(i+0.5)*h/6, color:color});
    return out;
  }
  if (type === 'km1'){
    const cell = w/4, ph = [WC.L1, WC.L2, WC.L3];
    ['1 L1','3 L2','5 L3','13 НО'].forEach(function(l,i){ out.push({key:'t'+i, label:l, dx:(i+0.5)*cell, dy:34,  color:i<3?ph[i]:WC.C,entrySide:'top',entryInset:33.75}); });
    ['2 T1','4 T2','6 T3','14 НО'].forEach(function(l,i){ out.push({key:'b'+i, label:l, dx:(i+0.5)*cell, dy:h-34, color:i<3?ph[i]:WC.C,entrySide:'bottom',entryInset:33.75}); });
    out.push({key:'a53', label:'53 НО', dx:59.75, dy:104, color:WC.C});
    out.push({key:'a61', label:'61 НЗ', dx:97.75, dy:104, color:WC.C2});
    out.push({key:'a54', label:'54 НО', dx:59.75, dy:144, color:WC.C});
    out.push({key:'a62', label:'62 НЗ', dx:97.75, dy:144, color:WC.C2});
    const coilPadTop=(h-150)/2;
    out.push({key:'A1', label:'A1', dx:w-1.5+PAD_W/2, dy:coilPadTop+18, color:WC.C});
    out.push({key:'A2', label:'A2', dx:w-1.5+PAD_W/2, dy:coilPadTop+132, color:WC.C2});
    return out;
  }
  if (type === 'kk1'){
    const cell = TYPES.km1.modules*MODULE/4;
    ['98','97','96','95'].forEach(function(l,i){ out.push({key:'r'+i, label:l, dx:(i+0.5)*cell, dy:THERMAL_AUX.terminalY, color:i<2?WC.C:WC.C2}); });
    ['2 T1','4 T2','6 T3'].forEach(function(l,i){ out.push({key:'p'+i, label:l, dx:(i+0.5)*cell, dy:THERMAL_POWER.terminalY, color:[WC.L1,WC.L2,WC.L3][i]}); });
    return out;
  }
  return out;
}
function originOf(dev){
  if(dev.type==='comb')return combOrigin(dev);
  if (dev.type === 'kk1'){
    const km = devById(dev.kmId);
    if (!km) return null;
    const ko = originOf(km);
    return { x:ko.x, y:ko.y + TYPES.km1.h - RELAY_DROP };
  }
  if (isFinite(dev.x) && isFinite(dev.y)) return { x:dev.x, y:dev.y };
  const rail=mountingRail(dev.rail);
  return rail?{x:rail.x+dev.slot*MODULE,y:rail.y-TYPES[dev.type].h/2}:{x:0,y:0};
}
/* Место входа провода задаётся краем корпуса/колодки отдельно от винта.
   Координаты винта остаются электрическим узлом и целью щупа. */
function terminalWireEntry(t,type,td,obj){
  let side,inset;
  const spec=TYPES[type],w=spec?spec.modules*MODULE:0,h=spec?spec.h:0;
  if(td.entrySide){side=td.entrySide;inset=td.entryInset||17.75;}
  else if(type==='IN'){side='bottom';inset=115.75-td.dy;}
  else if(type==='PB'){side='left';inset=12.5;}
  else if(type==='motor'||type==='dcMotor'){
    if(td.caseGround){side='right';inset=14;}
    else{side=td.dy<16?'top':'bottom';inset=side==='top'?td.dy+8.75:52.75-td.dy;}
    inset*=obj.scale;
  }
  else if(type==='klemma'||type==='pebus'){
    side=obj&&obj.wireEntrySide==='left'?'left':'right';
    inset=side==='left'?td.dx-.25:w-.25-td.dx;
  }
  else if(type==='junction'){
    side=td.side;inset=13.65;t.entryAutoSide=true;
    t.entryAutoAxis=side==='left'||side==='right'?'x':'y';
    t.entryLeftInset=inset;t.entryRightInset=inset;t.entryTopInset=inset;t.entryBottomInset=inset;
  }
  else if(type==='km1'){
    if(td.key==='A1'||td.key==='A2'){side=td.key==='A1'?'top':'bottom';inset=18.5;}
    else{side=td.dy<124?'top':'bottom';inset=22.75;}
  }
  else if(type==='kk1'){
    side='bottom';inset=td.key[0]==='r'?THERMAL_AUX.top+THERMAL_AUX.height+.5-td.dy:h-.25-td.dy;
    t.wireBendRadius=THERMAL_WIRE_BEND_RADIUS;
  }
  else if(type==='outlet'&&td.key[0]==='s'){
    // Контактные отверстия розетки: край самого гнезда, а не всей рамки.
    side=/PEt$/.test(td.key)?'top':'bottom';inset=/PE/.test(td.key)?7.5:7.75;
  }
  else if(spec&&spec.kind==='appliance'){side='top';inset=td.dy-1.5;}
  else if(['rcd','sensor','lamp','vfd','tp','timer','meter','bulb','outlet','wallSwitch','twoWaySwitch'].indexOf(type)>=0){
    side=td.dy<h/2?'top':'bottom';inset=side==='top'?td.dy-.25:h-.25-td.dy;
  }
  if(!side)return t;
  t.entrySide=side;t.entryInset=inset;
  return t;
}
function terminal(devId, key){
  if (String(devId).indexOf('PB') === 0){
    const pb=pushbuttonById(devId);if(!pb)return null;
    const m = PB_TERMS.find(function(t){ return t.key === key; });
    if (!m) return null;
    return terminalWireEntry({ devId:pb.id, key:key, label:m.label, color:m.color, x:pb.x+m.dx, y:pb.y+m.dy },'PB',m,pb);
  }
  if (String(devId).match(/^(M|MD)\d+$/)){                // зажимы двигателя или машины постоянного тока
    const motor=motorById(devId);if(!motor)return null;
    const terms=motorIsDc(motor)?DC_MOTOR_TERMS:MOTOR_TERMS;
    const m = terms.find(function(t){ return t.key === key; });
    if (!m) return null;
    return terminalWireEntry({ devId:motor.id, key:key, label:m.label, color:m.color,
             x:motor.x + m.dx*motor.scale, y:motor.y + m.dy*motor.scale },motorIsDc(motor)?'dcMotor':'motor',m,motor);
  }
  if (String(devId) === 'IN'){                     // зажимы клеммной коробки ввода
    syncPanelInbox();
    const m = inboxTerms().find(function(t){ return t.key === key; });
    if (!m) return null;
    return terminalWireEntry({ devId:'IN', key:key, label:m.label, color:m.color, x:INBOX.x + m.dx, y:INBOX.y + m.dy },'IN',m,INBOX);
  }
  const relay = (typeof devId === 'string' && devId.indexOf('kk') === 0);
  let dev;
  if (relay){
    const r = anyRelayById(+devId.slice(2));
    if (!r) return null;
    dev = { id:devId, type:'kk1', kmId:r.kmId };
  } else {
    dev = devById(+devId);
  }
  if (!dev) return null;
  const o = originOf(dev); if (!o) return null;
  const d = termDefs(dev.type,dev).find(function(t){ return t.key === key; });
  if (!d) return null;
  return terminalWireEntry({ devId:dev.id,key:key,label:d.label,color:d.color,x:o.x+d.dx,y:o.y+d.dy },dev.type,d,dev);
}
function tagOf(devId){
  if (String(devId).indexOf('PB')===0){const pb=pushbuttonById(devId);return pb?pb.tag:'SB';}
  if (String(devId).match(/^(M|MD)\d+$/)){const motor=motorById(devId);return motor?(motor.tag||motor.id):String(devId);}
  if (String(devId) === 'IN') return (state.specialProps&&state.specialProps.inbox&&state.specialProps.inbox.tag)||TAGS.IN;
  if (typeof devId === 'string' && devId.indexOf('kk') === 0){
    const rel = anyRelayById(+devId.slice(2));
    if (!rel) return 'KK';
    return rel.tag || 'KK';
  }
  const dev = devById(+devId);
  if (!dev) return '—';
  return dev.tag || TAGS[dev.type];
}
/* идентификатор из data-атрибута: число для аппарата на рейке, строка для реле и двигателя */
function toDevId(v){
  return isFinite(+v) && String(+v) === String(v) ? +v : v;
}

/* --- отрисовка проводов, клемм и списка --- */
function wireD(ax, ay, bx, by){
  const my = (ay + by)/2;
  return 'M '+ax+','+ay+' C '+ax+','+my+' '+bx+','+my+' '+bx+','+by;
}
/* середина провода: по ней провод можно «взять» и изменить его форму */
function wirePointList(a, b, wr){
  const result=wirePathResult(a,b,wr);
  if(result.repaired){
    const stored=wr&&wr.pts||[];
    return stored.length?stored.map(function(p){return nearestOnPolyline(p,result.samples);}):[pointHalfwayOnPolyline(result.samples)];
  }
  const routing=wireRoutingGeometry(a,b,wr);a=routing.start;b=routing.end;
  const pts = (wr && wr.pts) ? wr.pts : [];
  const shape = (wr && (wr.previewShape || wr.shape)) || 'smooth';
  if (shape === 'arc') return [arcShapeGeometry(a,b,wr).handle];
  if (shape === 's') return [sShapeGeometry(a,b,wr).handle];
  if (shape === 'orthogonal'){
    if(pts.length)return pts.map(function(p){return nearestOnPolyline(p,result.samples);});
    return [pointHalfwayOnPolyline(result.samples)];
  }
  if (pts.length) return pts;
  return [{ x:(a.x+b.x)/2, y:(a.y+b.y)/2 }];       // пока изгибов нет — одна точка посередине
}
function wireNodes(a, b, wr){
  const pts = (wr && wr.pts) ? wr.pts : [];
  return [{ x:a.x, y:a.y }].concat(pts.map(function(p){ return { x:p.x, y:p.y }; }), [{ x:b.x, y:b.y }]);
}

/* Строим горизонтально-вертикальную трассу, а затем заменяем каждую острую
   вершину короткой квадратичной дугой. Прямые участки остаются строго
   горизонтальными или вертикальными. */
function orthogonalRoute(nodes){
  if(!nodes.length)return [];
  const out=[{x:nodes[0].x,y:nodes[0].y}];
  function push(p){
    const last=out[out.length-1];
    if(!last||Math.abs(last.x-p.x)>.001||Math.abs(last.y-p.y)>.001)out.push({x:p.x,y:p.y});
  }
  for(let i=1;i<nodes.length;i++){
    const p=nodes[i-1],q=nodes[i];
    if(Math.abs(q.x-p.x)>=Math.abs(q.y-p.y))push({x:q.x,y:p.y});
    else push({x:p.x,y:q.y});
    push(q);
  }
  return out;
}
function roundedOrthogonalGeometry(points,radius){
  if(!points.length)return {d:'',samples:[]};
  let d='M '+points[0].x+','+points[0].y;
  const samples=[{x:points[0].x,y:points[0].y}];
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],c=points[i],b=points[i+1];
    const ax=c.x-a.x,ay=c.y-a.y,bx=b.x-c.x,by=b.y-c.y;
    const la=Math.hypot(ax,ay),lb=Math.hypot(bx,by);
    const cross=ax*by-ay*bx;
    if(!la||!lb||Math.abs(cross)<.001){d+=' L '+c.x+','+c.y;samples.push({x:c.x,y:c.y});continue;}
    const r=Math.min(radius,la*.45,lb*.45);
    const before={x:c.x-ax/la*r,y:c.y-ay/la*r};
    const after={x:c.x+bx/lb*r,y:c.y+by/lb*r};
    d+=' L '+before.x+','+before.y+' Q '+c.x+','+c.y+' '+after.x+','+after.y;
    samples.push(before);
    for(let step=1;step<=4;step++){
      const t=step/4,u=1-t;
      samples.push({x:u*u*before.x+2*u*t*c.x+t*t*after.x,
                    y:u*u*before.y+2*u*t*c.y+t*t*after.y});
    }
  }
  const last=points[points.length-1];
  d+=' L '+last.x+','+last.y;samples.push({x:last.x,y:last.y});
  return {d:d,samples:samples};
}
function nearestOnPolyline(p,points){
  let best={x:p.x,y:p.y},dist=Infinity;
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
    const t=len2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2)):0;
    const q={x:a.x+dx*t,y:a.y+dy*t},d=Math.hypot(p.x-q.x,p.y-q.y);
    if(d<dist){dist=d;best=q;}
  }
  return best;
}
function pointHalfwayOnPolyline(points){
  if(!points.length)return {x:0,y:0};
  let total=0,lengths=[];
  for(let i=0;i<points.length-1;i++){const l=Math.hypot(points[i+1].x-points[i].x,points[i+1].y-points[i].y);lengths.push(l);total+=l;}
  let target=total/2;
  for(let i=0;i<lengths.length;i++){
    if(target<=lengths[i]){const t=lengths[i]?target/lengths[i]:0;return {x:points[i].x+(points[i+1].x-points[i].x)*t,y:points[i].y+(points[i+1].y-points[i].y)*t};}
    target-=lengths[i];
  }
  return points[points.length-1];
}
/* гладкая кривая через все узлы (Catmull-Rom → кубические Безье) */
function catmullPath(nodes){
  if (!nodes.length) return '';
  let s = 'M '+nodes[0].x+','+nodes[0].y;
  for (let i=0;i<nodes.length-1;i++){
    const p0 = nodes[Math.max(0,i-1)], p1 = nodes[i], p2 = nodes[i+1], p3 = nodes[Math.min(nodes.length-1,i+2)];
    const c1x = p1.x + (p2.x-p0.x)/6, c1y = p1.y + (p2.y-p0.y)/6;
    const c2x = p2.x - (p3.x-p1.x)/6, c2y = p2.y - (p3.y-p1.y)/6;
    s += ' C '+c1x+','+c1y+' '+c2x+','+c2y+' '+p2.x+','+p2.y;
  }
  return s;
}
function arcShapeGeometry(a,b,wr){
  const dx=b.x-a.x,dy=b.y-a.y,h=Math.min(260,Math.max(55,Math.hypot(dx,dy)*0.50));
  let control;
  if(Math.abs(dx)>=Math.abs(dy)) control={x:(a.x+b.x)/2,y:Math.min(a.y,b.y)-h};
  else control={x:Math.max(a.x,b.x)+h,y:(a.y+b.y)/2};
  let handle={x:(a.x+2*control.x+b.x)/4,y:(a.y+2*control.y+b.y)/4};
  const pts=(wr&&wr.pts)||[];
  const useStored=pts.length && !wr.previewShape && wr.shape==='arc';
  if(useStored){
    handle={x:pts[0].x,y:pts[0].y};
    control={x:2*handle.x-(a.x+b.x)/2,y:2*handle.y-(a.y+b.y)/2};
  }
  return {control:control,handle:handle};
}
function sShapeGeometry(a,b,wr){
  let c1,c2;
  if(Math.abs(b.x-a.x)>=Math.abs(b.y-a.y)){
    const dx=b.x-a.x,amp=Math.min(100,Math.max(28,Math.abs(dx)*0.22));
    c1={x:a.x+dx*.33,y:a.y-amp}; c2={x:a.x+dx*.67,y:b.y+amp};
  } else {
    const dy=b.y-a.y,amp=Math.min(100,Math.max(28,Math.abs(dy)*0.22));
    c1={x:a.x+amp,y:a.y+dy*.33}; c2={x:b.x-amp,y:a.y+dy*.67};
  }
  let handle={x:(a.x+3*c1.x+3*c2.x+b.x)/8,y:(a.y+3*c1.y+3*c2.y+b.y)/8};
  const pts=(wr&&wr.pts)||[];
  const useStored=pts.length && !wr.previewShape && wr.shape==='s';
  if(useStored){
    const dx=(pts[0].x-handle.x)/0.75,dy=(pts[0].y-handle.y)/0.75;
    c1={x:c1.x+dx,y:c1.y+dy}; c2={x:c2.x+dx,y:c2.y+dy};
    handle={x:pts[0].x,y:pts[0].y};
  }
  return {c1:c1,c2:c2,handle:handle};
}
/* Прямой участок заводит провод перпендикулярно краю любой колодки. */
function wireVisualEndpoint(t,wr){
  // Закруглённый конец вместе с тенью касается наружного края обводки, не заходит на корпус.
  const inset=(t.entryInset||17.75)+(wireVisualWidth(wr)+2.5)/2;
  if(t.entrySide==='top')return {x:t.x,y:t.y-inset};
  if(t.entrySide==='bottom')return {x:t.x,y:t.y+inset};
  if(t.entrySide==='left')return {x:t.x-inset,y:t.y};
  if(t.entrySide==='right')return {x:t.x+inset,y:t.y};
  return t;
}
/* Одна длина манжеты внутри прямого участка и ещё одна снаружи. */
const WIRE_FERRULE_LENGTH=12;
const WIRE_BEND_RADIUS=12;
function wireEntryLeadLength(wr){
  return Math.max(0,WIRE_FERRULE_LENGTH*2-(wireVisualWidth(wr)+2.5)/2);
}
/* Скругляем также стык прямого ввода с кривой, а не только углы ломаной.
   Разбиение Безье сохраняет форму трассы за пределами короткого скругления. */
function wireTerminalBendRadius(t){return Number(t&&t.wireBendRadius)||WIRE_BEND_RADIUS;}
function roundedWirePath(d,radius,endRadii){
  const commands=d.match(/[MLQC][^MLQC]*/g)||[],segments=[];
  let cursor;
  commands.forEach(function(command){
    const coords=(command.slice(1).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number),points=[];
    for(let i=0;i<coords.length;i+=2)points.push({x:coords[i],y:coords[i+1]});
    if(command[0]==='M'){cursor=points[0];return;}
    if(!cursor||!points.length)return;
    const segment=[cursor].concat(points);
    if(segment.some(function(p){return Math.hypot(p.x-cursor.x,p.y-cursor.y)>.00001;}))segments.push(segment);
    cursor=points[points.length-1];
  });
  if(!segments.length)return d;
  const firstLead=segments[0].length===2?segments[0][1]:null;
  const lastLead=segments.at(-1).length===2?segments.at(-1)[0]:null;
  // Короткое продолжение прямой у клеммы не должно ограничивать радиус.
  for(let i=1;i<segments.length;i++){
    const prev=segments[i-1],next=segments[i];
    if(prev.length!==2||next.length!==2)continue;
    const ax=prev[1].x-prev[0].x,ay=prev[1].y-prev[0].y;
    const bx=next[1].x-next[0].x,by=next[1].y-next[0].y;
    if(ax*bx+ay*by>0&&Math.abs(ax*by-ay*bx)<=1e-7*Math.hypot(ax,ay)*Math.hypot(bx,by)){
      segments.splice(i-1,2,[prev[0],next[1]]);i=Math.max(0,i-2);
    }
  }
  function split(points,t){
    let row=points,left=[row[0]],right=[row[row.length-1]];
    while(row.length>1){
      const next=[];
      for(let i=0;i<row.length-1;i++)next.push({x:row[i].x+(row[i+1].x-row[i].x)*t,y:row[i].y+(row[i+1].y-row[i].y)*t});
      row=next;left.push(row[0]);right.unshift(row[row.length-1]);
    }
    return {left:left,right:right};
  }
  function tangent(points,atEnd){
    const p=points[atEnd?points.length-1:0];
    for(let i=atEnd?points.length-2:1;atEnd?i>=0:i<points.length;i+=atEnd?-1:1){
      const dx=(points[i].x-p.x)*(atEnd?-1:1),dy=(points[i].y-p.y)*(atEnd?-1:1),len=Math.hypot(dx,dy);
      if(len>.00001)return {x:dx/len,y:dy/len};
    }
    return {x:0,y:0};
  }
  const metrics=segments.map(function(points){
    let total=0,prev=points[0];const table=[{t:0,length:0}],steps=points.length===2?1:32;
    for(let i=1;i<=steps;i++){
      const p=split(points,i/steps).left.at(-1);total+=Math.hypot(p.x-prev.x,p.y-prev.y);prev=p;
      table.push({t:i/steps,length:total});
    }
    return {length:total,table:table};
  });
  const lengths=metrics.map(function(m){return m.length;});
  function parameterAtLength(metric,distance){
    for(let i=1;i<metric.table.length;i++){
      const a=metric.table[i-1],b=metric.table[i];
      if(b.length>=distance)return a.t+(b.t-a.t)*(distance-a.length)/(b.length-a.length||1);
    }
    return 1;
  }
  const heads=segments.map(function(){return 0;}),tails=heads.slice();
  for(let i=0;i<segments.length-1;i++){
    const a=tangent(segments[i],true),b=tangent(segments[i+1],false);
    if(a.x*b.x+a.y*b.y>1-1e-6)continue;
    let localRadius=radius;
    if(endRadii&&i===0)localRadius=Math.min(localRadius,endRadii.start);
    if(endRadii&&i===segments.length-2)localRadius=Math.min(localRadius,endRadii.end);
    const cut=Math.min(localRadius,lengths[i]*.4,lengths[i+1]*.4);
    tails[i]=1-parameterAtLength(metrics[i],lengths[i]-cut);
    heads[i+1]=parameterAtLength(metrics[i+1],cut);
  }
  const trimmed=segments.map(function(points,i){
    const before=split(points,1-tails[i]).left;
    return heads[i]?split(before,heads[i]/(1-tails[i])).right:before;
  });
  function pair(p){return p.x+','+p.y;}
  let result='M '+pair(trimmed[0][0]);
  function interior(p,a,b){
    if(!p)return false;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),along=(p.x-a.x)*dx+(p.y-a.y)*dy;
    return len>.00001&&along>.00001&&along<len*len-.00001&&Math.abs((p.x-a.x)*dy-(p.y-a.y)*dx)<len*.00001;
  }
  trimmed.forEach(function(points,i){
    // Сохраняем границы прямых вводов даже после объединения продолжений.
    if(points.length===2){
      if(i===0&&interior(firstLead,points[0],points[1]))result+=' L '+pair(firstLead);
      if(i===trimmed.length-1&&interior(lastLead,points[0],points[1]))result+=' L '+pair(lastLead);
    }
    result+=' '+({2:'L',3:'Q',4:'C'}[points.length])+' '+points.slice(1).map(pair).join(' ');
    if(tails[i]){
      const next=trimmed[i+1],a=points[points.length-1],b=next[0];
      const va=tangent(points,true),vb=tangent(next,false);
      const handle=Math.max(Math.hypot(b.x-a.x,b.y-a.y)*.4,.01);
      result+=' C '+pair({x:a.x+va.x*handle,y:a.y+va.y*handle})+' '+pair({x:b.x-vb.x*handle,y:b.y-vb.y*handle})+' '+pair(b);
    }
  });
  return result;
}
function wireRoutingEndpoint(t,wr){
  const end=wireVisualEndpoint(t,wr),lead=wireEntryLeadLength(wr)+wireTerminalBendRadius(t);
  if(t.entrySide==='top')return {x:end.x,y:end.y-lead};
  if(t.entrySide==='bottom')return {x:end.x,y:end.y+lead};
  if(t.entrySide==='left')return {x:end.x-lead,y:end.y};
  if(t.entrySide==='right')return {x:end.x+lead,y:end.y};
  return t;
}
/* При обратном подходе отводим трассу вбок: для разворота нужны
   две дуги с расстоянием между ними, а не совпадающие точки на одной оси. */
/* У колодок XR сторону выбирает каждый провод отдельно: по ближайшему
   участку трассы, включая ручную точку и управляющие точки дуг. */
function wireTerminalSide(t,other,wr,atEnd){
  if(!t.entryAutoSide)return t;
  const pts=wr&&wr.pts||[],shape=wr&&(wr.previewShape||wr.shape)||'smooth';
  let guide=pts.length?pts[atEnd?pts.length-1:0]:other;
  if(shape==='arc')guide=arcShapeGeometry(atEnd?other:t,atEnd?t:other,wr).control;
  if(shape==='s'){
    const g=sShapeGeometry(atEnd?other:t,atEnd?t:other,wr);guide=atEnd?g.c2:g.c1;
  }
  const axis=t.entryAutoAxis||'x';
  let delta=guide[axis]-t[axis];
  if(Math.abs(delta)<.5)delta=other[axis]-t[axis];
  const side=delta<-.5?(axis==='x'?'left':'top'):delta>.5?(axis==='x'?'right':'bottom'):t.entrySide;
  const insets={left:t.entryLeftInset,right:t.entryRightInset,top:t.entryTopInset,bottom:t.entryBottomInset};
  return Object.assign({},t,{entryAutoSide:false,entrySide:side,entryInset:insets[side]});
}
/* Параллельные перемычки получают отдельную дорожку целиком, до скругления.
   Отступ хранится относительно клемм, поэтому трасса следует за аппаратами. */
function wireJumperLane(a,b,wr){
  if(wr&&(wr.conduitId||wr.previewConduitId))return null;
  const shape=wr&&(wr.previewShape||wr.shape)||'smooth';
  if(!wr||(wr.pts&&wr.pts.length)||!['smooth','straight','orthogonal'].includes(shape))return null;
  const originalA=a;a=wireTerminalSide(a,b,wr,false);b=wireTerminalSide(b,originalA,wr,true);
  const side=a.entrySide;
  if(!side||side!==b.entrySide)return null;
  const normal=side==='top'||side==='bottom'?'y':'x',along=normal==='y'?'x':'y';
  const sign=side==='top'||side==='left'?-1:1;
  const p=wireRoutingEndpoint(a,wr),q=wireRoutingEndpoint(b,wr);
  if(Math.abs(p[normal]-q[normal])>.5||Math.abs(p[along]-q[along])<2*WIRE_BEND_RADIUS+1)return null;
  return {side:side,normal:normal,sign:sign,base:Math.max(sign*p[normal],sign*q[normal]),
    min:Math.min(p[along],q[along])+WIRE_BEND_RADIUS,
    max:Math.max(p[along],q[along])-WIRE_BEND_RADIUS,width:wireVisualWidth(wr)};
}
function chooseWireJumperLane(lane,saved,occupied){
  const offset=saved&&saved.side===lane.side&&Number.isFinite(saved.offset)?Math.max(0,saved.offset):0;
  let coordinate=lane.base+offset;
  // После каждого сдвига повторно учитываем уже занятые дорожки.
  for(let pass=0;pass<=occupied.length;pass++){
    let next=coordinate;
    occupied.forEach(function(other){
      if(other.side!==lane.side||Math.min(lane.max,other.max)<=Math.max(lane.min,other.min))return;
      const distance=(lane.width+other.width)/2;
      if(Math.abs(coordinate-other.coordinate)<distance-.0001)next=Math.max(next,other.coordinate+distance);
    });
    if(next===coordinate)break;
    coordinate=next;
  }
  return {side:lane.side,offset:coordinate-lane.base};
}
function prepareWireJumperLanes(){
  const occupied=[];
  state.wires.forEach(function(wr){
    const a=terminal(wr.a.devId,wr.a.key),b=terminal(wr.b.devId,wr.b.key);
    if(!a||!b)return;
    // Временный просмотр другой формы не меняет сохранённую дорожку.
    const lane=wireJumperLane(a,b,Object.assign({},wr,{previewShape:null}));
    if(!lane)return;
    const chosen=chooseWireJumperLane(lane,wr.autoLane,occupied);
    if(!wr.autoLane||wr.autoLane.side!==chosen.side||wr.autoLane.offset!==chosen.offset)wr.autoLane=chosen;
    occupied.push(Object.assign({},lane,{coordinate:lane.base+chosen.offset}));
  });
  return occupied;
}
function wireRoutingGeometry(a,b,wr){
  const originalA=a;a=wireTerminalSide(a,b,wr,false);b=wireTerminalSide(b,originalA,wr,true);
  const leadA=wireRoutingEndpoint(a,wr),leadB=wireRoutingEndpoint(b,wr);
  const lane=wireJumperLane(a,b,wr),saved=wr&&wr.autoLane;
  if(lane&&saved&&saved.side===lane.side&&Number.isFinite(saved.offset)&&saved.offset>0){
    leadA[lane.normal]+=lane.sign*saved.offset;leadB[lane.normal]+=lane.sign*saved.offset;
  }
  const initial=wireBodyPathD(leadA,leadB,wr);
  const coords=(initial.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number);
  function displaced(t,lead,other,atEnd){
    const v={top:{x:0,y:-1},bottom:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[t.entrySide];
    if(!v)return lead;
    const last=coords.length-2,index=atEnd?last:0;
    let dx=0,dy=0;
    for(let i=atEnd?last-2:2;atEnd?i>=0:i<coords.length;i+=atEnd?-2:2){
      dx=coords[i]-coords[index];dy=coords[i+1]-coords[index+1];if(Math.hypot(dx,dy)>.001)break;
    }
    if((dx*v.x+dy*v.y)/Math.max(.001,Math.hypot(dx,dy))>=-.25)return lead;
    const normal={x:-v.y,y:v.x};
    const pts=wr&&wr.pts||[],toward=pts.length?pts[atEnd?pts.length-1:0]:other;
    const sign=(toward.x-lead.x)*normal.x+(toward.y-lead.y)*normal.y<0?-1:1;
    const gap=2*(wireTerminalBendRadius(t)+1)+wireVisualWidth(wr);
    return {x:lead.x+normal.x*sign*gap,y:lead.y+normal.y*sign*gap};
  }
  const start=displaced(a,leadA,leadB,false),end=displaced(b,leadB,leadA,true);
  return {leadA:leadA,leadB:leadB,start:start,end:end,body:start===leadA&&end===leadB?initial:wireBodyPathD(start,end,wr)};
}
/* Удаляем замкнутые участки только внутри одного провода.
   Пересечения разных проводов и сохранённые точки монтажа не меняются. */
function wireWithoutLoops(d){
  const commands=d.match(/[MLQC][^MLQC]*/g)||[],samples=[];let cursor;
  commands.forEach(function(command){
    const n=(command.slice(1).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number),points=[];
    for(let i=0;i<n.length;i+=2)points.push({x:n[i],y:n[i+1]});
    if(command[0]==='M'){cursor=points[0];samples.push(cursor);return;}
    const controls=[cursor].concat(points),steps=controls.length===2?1:20;
    for(let j=1;j<=steps;j++){
      let row=controls;const t=j/steps;
      while(row.length>1){const next=[];for(let i=0;i<row.length-1;i++)next.push({x:row[i].x*(1-t)+row[i+1].x*t,y:row[i].y*(1-t)+row[i+1].y*t});row=next;}
      if(Math.hypot(row[0].x-samples[samples.length-1].x,row[0].y-samples[samples.length-1].y)>.00001)samples.push(row[0]);
    }
    cursor=points[points.length-1];
  });
  let changed=false;
  for(let i=0;i<samples.length-1;i++){
    const a=samples[i],b=samples[i+1],dx=b.x-a.x,dy=b.y-a.y;
    for(let j=i+2;j<samples.length-1;j++){
      const c=samples[j],e=samples[j+1];
      if(Math.max(a.x,b.x)<Math.min(c.x,e.x)||Math.min(a.x,b.x)>Math.max(c.x,e.x)||Math.max(a.y,b.y)<Math.min(c.y,e.y)||Math.min(a.y,b.y)>Math.max(c.y,e.y))continue;
      const ex=e.x-c.x,ey=e.y-c.y,den=dx*ey-dy*ex;
      if(Math.abs(den)<1e-9)continue;
      const u=((c.x-a.x)*ey-(c.y-a.y)*ex)/den,v=((c.x-a.x)*dy-(c.y-a.y)*dx)/den;
      if(u>1e-7&&u<1-1e-7&&v>1e-7&&v<1-1e-7){
        samples.splice(i+1,j-i,{x:a.x+dx*u,y:a.y+dy*u});changed=true;i=Math.max(-1,i-1);break;
      }
    }
  }
  return {d:changed?roundedOrthogonalGeometry(samples,WIRE_BEND_RADIUS).d:d,samples:samples,changed:changed};
}
function wirePathResult(a,b,wr){
  const contained=wireConduitParts(a,b,wr);if(contained)return contained;
  const originalA=a;a=wireTerminalSide(a,b,wr,false);b=wireTerminalSide(b,originalA,wr,true);
  const g=wireRoutingGeometry(a,b,wr),body=g.body;
  const va=wireVisualEndpoint(a,wr),vb=wireVisualEndpoint(b,wr);
  let path='M '+va.x+','+va.y;
  if(g.leadA!==a)path+=' L '+g.leadA.x+','+g.leadA.y;
  if(g.start!==g.leadA)path+=' L '+g.start.x+','+g.start.y;
  path+=body.replace(/^M\s*[^CLQZ]+/,'');
  if(g.end!==g.leadB)path+=' L '+g.leadB.x+','+g.leadB.y;
  if(g.leadB!==b)path+=' L '+vb.x+','+vb.y;
  const checked=wireWithoutLoops(roundedWirePath(path,WIRE_BEND_RADIUS,{start:wireTerminalBendRadius(a),end:wireTerminalBendRadius(b)}));
  if(checked.changed&&wr&&wr.pts&&wr.pts.length){
    // Конфликтующая точка не должна сокращать защищённый ввод у манжеты.
    const safe=wirePathResult(a,b,Object.assign({},wr,{pts:[]}));safe.repaired=true;return safe;
  }
  return {d:checked.d,samples:checked.samples,repaired:checked.changed};
}
function wirePathD(a,b,wr){return wirePathResult(a,b,wr).d;}
/* Для прямоугольной трассы захватываем сторону, оставляя вводы в клеммы на месте. */
function compactWireCorners(points){
  const out=[];
  points.forEach(function(p){
    const q={x:p.x,y:p.y},last=out.at(-1);
    if(last&&Math.hypot(last.x-q.x,last.y-q.y)<.00001)return;
    while(out.length>1){
      const a=out.at(-2),b=out.at(-1),ax=b.x-a.x,ay=b.y-a.y,bx=q.x-b.x,by=q.y-b.y;
      if(ax*bx+ay*by<=0||Math.abs(ax*by-ay*bx)>.00001)break;
      out.pop();
    }
    out.push(q);
  });
  return out;
}
function wireOrthogonalSegments(a,b,wr){
  const originalA=a;a=wireTerminalSide(a,b,wr,false);b=wireTerminalSide(b,originalA,wr,true);
  const g=wireRoutingGeometry(a,b,wr);
  const route=orthogonalRoute(wireNodes(g.start,g.end,wr));
  const points=compactWireCorners([wireVisualEndpoint(a,wr),g.leadA,g.start].concat(route,[g.end,g.leadB,wireVisualEndpoint(b,wr)]));
  const leadA=wireRoutingEndpoint(a,wr),leadB=wireRoutingEndpoint(b,wr);
  // Наконечник и минимальная длина прямого ввода не являются подвижной стороной.
  if(points.length>1){points[0]=leadA;points[points.length-1]=leadB;}
  return {points:compactWireCorners(points),leadA:leadA,leadB:leadB,sideA:a.entrySide,sideB:b.entrySide};
}
function wireSegmentHitSvg(a,b,wr){
  const points=wireOrthogonalSegments(a,b,wr).points;
  let svg='';
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    if(len<1)continue;
    const trim=Math.min(WIRE_BEND_RADIUS,len*.25),ux=dx/len,uy=dy/len;
    const d='M '+(a.x+ux*trim)+','+(a.y+uy*trim)+' L '+(b.x-ux*trim)+','+(b.y-uy*trim);
    svg+='<path class="wire-segment-hit" data-wire-segment="'+i+'" d="'+d+'" fill="none" stroke="transparent" stroke-width="'+Math.max(16,wireVisualWidth(wr)+6)+'" pointer-events="stroke" style="cursor:'+(Math.abs(dx)>Math.abs(dy)?'ns-resize':'ew-resize')+'"/>';
  }
  return svg;
}
function beginWireSegmentGrab(a,b,wr,p,preferred){
  const geometry=wireOrthogonalSegments(a,b,wr),points=geometry.points;
  let index=-1,best=Infinity;
  for(let i=0;i<points.length-1;i++){
    if(Math.hypot(points[i+1].x-points[i].x,points[i+1].y-points[i].y)<1)continue;
    const distance=distToSeg(p,points[i],points[i+1]);
    if(distance<best){best=distance;index=i;}
  }
  if(Number.isInteger(preferred)&&preferred>=0&&preferred<points.length-1)index=preferred;
  if(index<0||distToSeg(p,points[index],points[index+1])>Math.max(12,wireVisualWidth(wr)+6))return null;
  const start=points[index],end=points[index+1],axis=Math.abs(end.x-start.x)>Math.abs(end.y-start.y)?'y':'x';
  return {id:wr.id,mode:'segment',index:index,axis:axis,pointer:p,points:points,geometry:geometry,visualA:wireVisualEndpoint(wireTerminalSide(a,b,wr,false),wr),visualB:wireVisualEndpoint(wireTerminalSide(b,a,wr,true),wr),
    distance:distToSeg(p,points[index],points[index+1]),
    originalPts:(wr.pts||[]).map(function(p){return {x:p.x,y:p.y};})};
}
function wireRouteCrossing(a,b,c,d){
  const epsilon=.00001,h=Math.abs(a.y-b.y)<epsilon,k=Math.abs(c.y-d.y)<epsilon;
  if(h===k){
    const fixed=h?'y':'x',along=h?'x':'y';
    if(Math.abs(a[fixed]-c[fixed])>epsilon)return null;
    const low=Math.max(Math.min(a[along],b[along]),Math.min(c[along],d[along]));
    const high=Math.min(Math.max(a[along],b[along]),Math.max(c[along],d[along]));
    if(low>high+epsilon)return null;
    const p={x:a.x,y:a.y};p[along]=low;return {point:p,overlap:high-low>epsilon};
  }
  const p={x:h?c.x:a.x,y:h?a.y:c.y};
  if(p.x<Math.min(a.x,b.x)-epsilon||p.x>Math.max(a.x,b.x)+epsilon||p.y<Math.min(a.y,b.y)-epsilon||p.y>Math.max(a.y,b.y)+epsilon||p.x<Math.min(c.x,d.x)-epsilon||p.x>Math.max(c.x,d.x)+epsilon||p.y<Math.min(c.y,d.y)-epsilon||p.y>Math.max(c.y,d.y)+epsilon)return null;
  return {point:p,overlap:false};
}
function wireRouteIsSimple(points){
  const p=compactWireCorners(points);
  for(let i=1;i<p.length;i++){
    if(Math.abs(p[i].x-p[i-1].x)>.00001&&Math.abs(p[i].y-p[i-1].y)>.00001)return false;
    if(i>1){const a=p[i-2],b=p[i-1],c=p[i];if((b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y)<-.00001)return false;}
    for(let j=0;j<i-2;j++)if(wireRouteCrossing(p[i-1],p[i],p[j],p[j+1]))return false;
  }
  return true;
}
function wireRouteEdges(points){return points.slice(1).map(function(p,i){return [points[i],p];});}
function wireRouteDirection(a,b){return Math.abs(b.x-a.x)>Math.abs(b.y-a.y)?(b.x>a.x?0:2):(b.y>a.y?1:3);}
function wireLeadDirection(side){return {right:0,bottom:1,left:2,top:3}[side];}
/* Локальный поиск прямоугольного обхода закреплённых вводов и уже выбранной стороны.
   Вызывается только когда свободное перемещение меняет порядок углов трассы. */
function wireOrthogonalConnector(start,end,obstacles,forbiddenStart,forbiddenEnd){
  if(Math.hypot(start.x-end.x,start.y-end.y)<.00001)return [start];
  const gap=2*WIRE_BEND_RADIUS+4,all=[start,end].concat(obstacles.flat());
  const xs=Array.from(new Set(all.flatMap(function(p){return [p.x-gap,p.x,p.x+gap];}))).sort(function(a,b){return a-b;});
  const ys=Array.from(new Set(all.flatMap(function(p){return [p.y-gap,p.y,p.y+gap];}))).sort(function(a,b){return a-b;});
  const directions=[[1,0],[0,1],[-1,0],[0,-1]],heap=[],costs=new Map();
  function push(node){heap.push(node);let i=heap.length-1;while(i){const parent=(i-1)>>1;if(heap[parent].score<=node.score)break;heap[i]=heap[parent];i=parent;}heap[i]=node;}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;if(heap[child].score>=last.score)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;}
  function equal(a,b){return Math.hypot(a.x-b.x,a.y-b.y)<.00001;}
  function blocked(a,b){
    return obstacles.some(function(edge){const hit=wireRouteCrossing(a,b,edge[0],edge[1]);if(!hit)return false;
      return hit.overlap||!((equal(hit.point,start)||equal(hit.point,end))&&(equal(hit.point,edge[0])||equal(hit.point,edge[1])));
    });
  }
  const first={x:xs.indexOf(start.x),y:ys.indexOf(start.y),direction:4,cost:0,parent:null};first.score=Math.abs(start.x-end.x)+Math.abs(start.y-end.y);push(first);
  let steps=0;
  while(heap.length&&steps++<30000){
    const node=pop(),point={x:xs[node.x],y:ys[node.y]},key=node.x+','+node.y+','+node.direction;
    if(costs.has(key)&&costs.get(key)<node.cost-.00001)continue;
    if(equal(point,end)&&node.direction!==forbiddenEnd){const result=[];for(let p=node;p;p=p.parent)result.push({x:xs[p.x],y:ys[p.y]});return compactWireCorners(result.reverse());}
    for(let direction=0;direction<4;direction++){
      if((node.direction===4&&direction===forbiddenStart)||(node.direction<4&&direction===(node.direction+2)%4))continue;
      const x=node.x+directions[direction][0],y=node.y+directions[direction][1];if(x<0||x>=xs.length||y<0||y>=ys.length)continue;
      const next={x:xs[x],y:ys[y]};if((equal(next,end)&&direction===forbiddenEnd)||blocked(point,next))continue;
      const cost=node.cost+Math.abs(next.x-point.x)+Math.abs(next.y-point.y)+(node.direction<4&&node.direction!==direction?2*WIRE_BEND_RADIUS:0),nextKey=x+','+y+','+direction;
      if(costs.has(nextKey)&&costs.get(nextKey)<=cost+.00001)continue;
      costs.set(nextKey,cost);push({x:x,y:y,direction:direction,cost:cost,score:cost+Math.abs(next.x-end.x)+Math.abs(next.y-end.y),parent:node});
    }
  }
  return null;
}
function freeWireSegmentRoute(grab,points){
  const leadA=grab.geometry.leadA,leadB=grab.geometry.leadB,visualA=grab.visualA,visualB=grab.visualB;
  const body=compactWireCorners([leadA].concat(points,[leadB]));
  if(wireRouteIsSimple([visualA].concat(body,[visualB])))return body;
  const a=points[grab.index],b=points[grab.index+1],along=grab.axis==='y'?'x':'y',normal=grab.axis,gap=2*WIRE_BEND_RADIUS+4;
  const direction=wireRouteDirection(a,b),positive=b[along]>a[along],middle=(a[along]+b[along])/2;
  const stubs=[[visualA,leadA],[leadB,visualB]],variants=[[a,b]];
  let low=Math.min(a[along],b[along]),high=Math.max(a[along],b[along]);
  stubs.forEach(function(edge){
    const p=edge[0],q=edge[1];
    if(Math.abs(p[along]-q[along])<.00001&&a[normal]>=Math.min(p[normal],q[normal])-.00001&&a[normal]<=Math.max(p[normal],q[normal])+.00001){
      if(p[along]<middle)low=Math.max(low,p[along]+gap);else high=Math.min(high,p[along]-gap);
    }
  });
  function variant(left,right){if(right-left<1)return;const p={x:a.x,y:a.y},q={x:b.x,y:b.y};p[along]=positive?left:right;q[along]=positive?right:left;variants.push([p,q]);}
  variant(low,high);const half=Math.min(Math.abs(b[along]-a[along])/2,WIRE_BEND_RADIUS);
  variant(middle-half,middle+half);variant(middle-gap-half,middle-gap+half);variant(middle+gap-half,middle+gap+half);
  for(const pair of variants){
    const obstacles=stubs.concat([pair]);
    const outwardA=wireLeadDirection(grab.geometry.sideA),outwardB=wireLeadDirection(grab.geometry.sideB);
    const prefix=wireOrthogonalConnector(leadA,pair[0],obstacles,outwardA===undefined?null:(outwardA+2)%4,(direction+2)%4);
    if(!prefix)continue;
    const suffix=wireOrthogonalConnector(pair[1],leadB,obstacles.concat(wireRouteEdges(prefix)),(direction+2)%4,outwardB);
    if(!suffix)continue;
    const route=compactWireCorners(prefix.concat([pair[1]],suffix));
    if(wireRouteIsSimple([visualA].concat(route,[visualB])))return route;
  }
  return body;
}
function moveWireSegment(wr,grab,p,evt){
  const axis=grab.axis,original=grab.points[grab.index][axis];
  const coordinate=snapAlignmentAxis(original+p[axis]-grab.pointer[axis],axis,evt);
  if(Math.abs(coordinate-original)<.00001){wr.pts=grab.originalPts.map(function(p){return {x:p.x,y:p.y};});return;}
  const points=grab.points.map(function(p){return {x:p.x,y:p.y};});
  points[grab.index][axis]=coordinate;points[grab.index+1][axis]=coordinate;
  const route=freeWireSegmentRoute(grab,points);
  wr.pts=route.slice(1,-1);
}
function wireBodyPathD(a, b, wr){
  const pts = (wr && wr.pts) ? wr.pts : [];
  const shape = (wr && (wr.previewShape || wr.shape)) || 'smooth';
  const nodes = wireNodes(a, b, wr);
  if (shape === 'straight'){
    return nodes.map(function(p,i){ return (i?' L ':'M ')+p.x+','+p.y; }).join('');
  }
  if (shape === 'orthogonal'){
    // Скругляем один раз после добавления прямых вводов с обоих концов.
    return orthogonalRoute(nodes).map(function(p,i){return (i?' L ':'M ')+p.x+','+p.y;}).join('');
  }
  if (shape === 'arc'){
    const g=arcShapeGeometry(a,b,wr);
    return 'M '+a.x+','+a.y+' Q '+g.control.x+','+g.control.y+' '+b.x+','+b.y;
  }
  if (shape === 's'){
    const g=sShapeGeometry(a,b,wr);
    return 'M '+a.x+','+a.y+' C '+g.c1.x+','+g.c1.y+' '+g.c2.x+','+g.c2.y+' '+b.x+','+b.y;
  }
  if (!pts.length) return wireD(a.x, a.y, b.x, b.y);
  return catmullPath(nodes);
}
/* расстояние от точки до отрезка — для вставки новой точки в нужное место провода */
function distToSeg(p, a, b){
  const dx = b.x-a.x, dy = b.y-a.y;
  const len2 = dx*dx + dy*dy;
  let t = len2 ? ((p.x-a.x)*dx + (p.y-a.y)*dy)/len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x+dx*t), p.y - (a.y+dy*t));
}
/* НШВИ: жёлтая манжета вплотную к корпусу, металлическая втулка скрыта в зажиме.
   Направление берём из касательной готовой трассы, включая дуги и изгибы. */
function wireFerruleSvg(t,wr,d,atEnd){
  const coords=(d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number);
  if(coords.length<4)return '';
  const last=coords.length-2;
  const x=coords[atEnd?last:0],y=coords[atEnd?last+1:1];
  let dx=0,dy=0;
  for(let i=atEnd?last-2:2;atEnd?i>=0:i<coords.length;i+=atEnd?-2:2){
    dx=coords[i]-x;dy=coords[i+1]-y;
    if(Math.hypot(dx,dy)>.01)break;
  }
  if(Math.hypot(dx,dy)<=.01)return '';
  const end={x:x,y:y};
  const angle=Math.atan2(dy,dx)*180/Math.PI;
  const width=wireVisualWidth(wr),half=(width+4.5)/2;
  const offset=t.entrySide?-(width+2.5)/2:0;
  return '<g class="wire-ferrule" pointer-events="none" transform="translate('+end.x+' '+end.y+') rotate('+angle+')">'
    +'<rect x="'+offset+'" y="'+(-half)+'" width="'+WIRE_FERRULE_LENGTH+'" height="'+(half*2)+'" rx="1.5" fill="#f4ce21" stroke="#b58b10" stroke-width=".8"/>'
    +'<path d="M '+(offset+2)+','+(-half+1.8)+' h 8" stroke="#fff1a0" stroke-width="1.2" stroke-linecap="round"/>'
    +'<path d="M '+(offset+10)+','+(-half+1)+' v '+(half*2-2)+'" stroke="#d2a610" stroke-width=".8"/>'
    +'</g>';
}
/* Свободный НШВИ: остриё металлической втулки находится у указателя,
   манжета и провод продолжаются назад по касательной трассы. */
function wireFreeFerruleSvg(wr,d,tip){
  const coords=(d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number),last=coords.length-2;
  if(last<2)return '';
  const x=tip.x,y=tip.y,dx=coords[last]-x,dy=coords[last+1]-y;
  if(Math.hypot(dx,dy)<=.01)return '';
  const angle=Math.atan2(dy,dx)*180/Math.PI,width=wireVisualWidth(wr),half=(width+4.5)/2,pin=12,pinHalf=(width+2.5)/2;
  return '<g class="wire-ferrule" pointer-events="none" transform="translate('+x+' '+y+') rotate('+angle+')">'
    +'<g class="wire-free-ferrule"><rect class="wire-ferrule-pin" x="0" y="'+(-pinHalf)+'" width="'+pin+'" height="'+(pinHalf*2)+'" rx=".8" fill="#c2c8cb" stroke="#7c878e" stroke-width=".7"/>'
    +'<path d="M 2,'+(-pinHalf+1)+' H 11" stroke="#f5f8fa" stroke-width="1"/>'
    +'<rect x="'+pin+'" y="'+(-half)+'" width="'+WIRE_FERRULE_LENGTH+'" height="'+(half*2)+'" rx="1.5" fill="#f4ce21" stroke="#b58b10" stroke-width=".8"/>'
    +'<path d="M '+(pin+2)+','+(-half+1.8)+' h 8" stroke="#fff1a0" stroke-width="1.2" stroke-linecap="round"/>'
    +'<path d="M '+(pin+10)+','+(-half+1)+' v '+(half*2-2)+'" stroke="#d2a610" stroke-width=".8"/></g></g>';
}
function wireFreeBodyEndpoint(a,tip,wr){
  const previous=(wr.pts||[]).slice().reverse().find(function(p){return Math.hypot(p.x-tip.x,p.y-tip.y)>.01;})||wireRoutingEndpoint(a,wr);
  const dx=previous.x-tip.x,dy=previous.y-tip.y;
  const side=Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'top':'bottom');
  const v={top:{x:0,y:-1},bottom:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[side];
  // Трасса заканчивается у заднего края манжеты. Металл и сама манжета
  // находятся перед изоляцией, поэтому цвет провода не выступает из штыря.
  return {x:tip.x+v.x*(12+WIRE_FERRULE_LENGTH),y:tip.y+v.y*(12+WIRE_FERRULE_LENGTH),
    entrySide:side,entryInset:-(wireVisualWidth(wr)+2.5)/2};
}

/* Гофра задаёт только геометрию: электрические концы проводов остаются на клеммах. */
function normalizeConduits(items){
  const seen=new Set();
  return (Array.isArray(items)?items:[]).filter(function(c){
    if(!c||typeof c.id!=='string'||seen.has(c.id)||!Array.isArray(c.pts))return false;
    seen.add(c.id);return c.pts.length>=2&&c.pts.every(function(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y);});
  }).map(function(c){return {id:c.id,pts:c.pts.map(function(p){return {x:p.x,y:p.y};})};});
}
function conduitById(id){return (state.conduits||[]).find(function(c){return c.id===id;})||null;}
function conduitGeometry(c){
  const key=JSON.stringify(c.pts),cached=conduitGeometryCache.get(c.id);
  if(cached&&cached.key===key)return cached;
  const route=compactWireCorners(orthogonalRoute(c.pts)),rounded=roundedOrthogonalGeometry(route,24);
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',rounded.d);
  const length=path.getTotalLength(),points=[];
  const steps=Math.max(1,Math.ceil(length/4));
  for(let i=0;i<=steps;i++){const p=path.getPointAtLength(length*i/steps);points.push({x:p.x,y:p.y,at:length*i/steps});}
  const result={key:key,d:rounded.d,points:points,length:length,path:path};conduitGeometryCache.set(c.id,result);return result;
}
function conduitProjection(c,p){
  const g=conduitGeometry(c);let best=null;
  for(let i=1;i<g.points.length;i++){
    const a=g.points[i-1],b=g.points[i],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
    const t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0;
    const q={x:a.x+dx*t,y:a.y+dy*t,at:a.at+(b.at-a.at)*t};q.distance=Math.hypot(q.x-p.x,q.y-p.y);
    if(!best||q.distance<best.distance)best=q;
  }
  return best;
}
function nearestConduit(p){
  let best=null;
  (state.conduits||[]).forEach(function(c){const q=conduitProjection(c,p);if(q&&q.distance<=28&&(!best||q.distance<best.distance))best=Object.assign({id:c.id},q);});
  return best;
}
function conduitFraction(c,at){const length=conduitGeometry(c).length;return length?Math.max(0,Math.min(1,at/length)):0;}
function conduitExitFor(c,entry,destination){
  const g=conduitGeometry(c),first=g.points[0],last=g.points.at(-1);
  if(entry<.001)return 1;if(entry>.999)return 0;
  return Math.hypot(destination.x-first.x,destination.y-first.y)<=Math.hypot(destination.x-last.x,destination.y-last.y)?0:1;
}
function conduitSpan(c,a,b,wr){
  const g=conduitGeometry(c),entryEnd=wr.previewConduitEntryEnd||wr.conduitEntryEnd||'a';
  const saved=wr.previewConduitId?wr.previewConduitEntry:wr.conduitEntry;
  const projection=conduitProjection(c,entryEnd==='b'?b:a);if(!projection)return null;
  const entry=Number.isFinite(saved)?Math.max(0,Math.min(1,saved)):conduitFraction(c,projection.at);
  const savedExit=wr.previewConduitId?undefined:wr.conduitExit;
  let exit=savedExit===0||savedExit===1?savedExit:conduitExitFor(c,entry,entryEnd==='b'?a:b);
  if(Math.abs(entry-exit)<.001)exit=1-exit;
  const startAt=(entryEnd==='b'?exit:entry)*g.length,endAt=(entryEnd==='b'?entry:exit)*g.length;
  const p=g.path.getPointAtLength(startAt),q=g.path.getPointAtLength(endAt),lo=Math.min(startAt,endAt),hi=Math.max(startAt,endAt);
  let inner=g.points.filter(function(p){return p.at>lo+.0001&&p.at<hi-.0001;});if(startAt>endAt)inner=inner.slice().reverse();
  return {points:[{x:p.x,y:p.y}].concat(inner,[{x:q.x,y:q.y}]),startAt:startAt,endAt:endAt};
}
function wireConduitParts(a,b,wr){
  const c=wr&&conduitById(wr.previewConduitId||wr.conduitId);if(!c)return null;
  const originalA=a;a=wireTerminalSide(a,b,wr,false);b=wireTerminalSide(b,originalA,wr,true);
  const va=wireVisualEndpoint(a,wr),vb=wireVisualEndpoint(b,wr),la=wireRoutingEndpoint(a,wr),lb=wireRoutingEndpoint(b,wr);
  const span=conduitSpan(c,la,lb,wr);if(!span||span.points.length<2)return null;
  const inside=span.points,g=conduitGeometry(c);
  function unit(dx,dy){const len=Math.hypot(dx,dy)||1;return {x:dx/len,y:dy/len};}
  function outward(at,lead){
    const p=g.path.getPointAtLength(at);
    if(at<.01){const q=g.path.getPointAtLength(Math.min(4,g.length));return unit(p.x-q.x,p.y-q.y);}
    if(at>g.length-.01){const q=g.path.getPointAtLength(Math.max(0,g.length-4));return unit(p.x-q.x,p.y-q.y);}
    // Боковой ввод остаётся в выбранной точке, подходя с той стороны, где находится провод.
    const prev=g.path.getPointAtLength(Math.max(0,at-2)),next=g.path.getPointAtLength(Math.min(g.length,at+2));
    const n=unit(-(next.y-prev.y),next.x-prev.x),sign=(lead.x-p.x)*n.x+(lead.y-p.y)*n.y>=0?1:-1;
    return {x:n.x*sign,y:n.y*sign};
  }
  function connector(v,lead,portal,at,endTerm){
    const normal=outward(at,lead),throat={x:portal.x+normal.x*36,y:portal.y+normal.y*36},radius=wireTerminalBendRadius(endTerm);
    const key=JSON.stringify([v.x,v.y,lead.x,lead.y,portal.x,portal.y,at,radius]);
    if(!g.connectors)g.connectors=new Map();if(g.connectors.has(key))return g.connectors.get(key);
    const pipeEdges=wireRouteEdges(compactWireCorners(orthogonalRoute(c.pts)));
    const obstacles=pipeEdges.concat([[v,lead],[portal,throat]]);
    const initial=Math.hypot(v.x-lead.x,v.y-lead.y)>.01?wireRouteDirection(v,lead):null;
    const outwardDirection=wireRouteDirection(portal,throat);
    // Обход не пересекает оболочку и не разворачивается обратно у торца.
    let route=wireOrthogonalConnector(lead,throat,obstacles,initial===null?null:(initial+2)%4,outwardDirection);
    if(!route){
      const side={x:-normal.y,y:normal.x},detour={x:throat.x+normal.x*48+side.x*48,y:throat.y+normal.y*48+side.y*48};
      route=orthogonalRoute([lead,detour,throat]);
    }
    const points=compactWireCorners([v,lead].concat(route,[portal]));
    const forward=roundedOrthogonalGeometry(points,radius).d,reverse=roundedOrthogonalGeometry(points.slice().reverse(),radius).d.replace(/^M[^LQ]+/,'');
    const result={forward:forward,reverse:reverse};if(g.connectors.size>120)g.connectors.clear();g.connectors.set(key,result);return result;
  }
  const before=connector(va,la,inside[0],span.startAt,a);
  const middle='M '+inside.map(function(p){return p.x+','+p.y;}).join(' L ');
  const prefix=before.forward+middle.replace(/^M[^L]+/,'');
  if(wr.conduitPreviewInside)return {d:prefix,outside:before.forward,inside:middle,samples:[va,la].concat(inside)};
  const after=connector(vb,lb,inside.at(-1),span.endAt,b);
  const d=prefix+after.reverse;
  return {d:d,outside:before.forward+' '+after.forward,inside:middle,samples:[va,la].concat(inside,[lb,vb])};
}
function attachWireConduit(wr,id,entry,entryEnd){
  const c=conduitById(id);if(!c)return;
  if(!wr.conduitId)wr.conduitFreePts=(wr.pts||[]).map(function(p){return {x:p.x,y:p.y};});
  wr.conduitId=id;wr.conduitEntry=Math.max(0,Math.min(1,Number(entry)||0));wr.conduitEntryEnd=entryEnd==='b'?'b':'a';
  const destination=wr.conduitEntryEnd==='b'?terminal(wr.a.devId,wr.a.key):terminal(wr.b.devId,wr.b.key);
  wr.conduitExit=conduitExitFor(c,wr.conduitEntry,destination);delete wr.autoLane;
}
function detachWireConduit(wr){
  if(!wr)return;delete wr.conduitId;delete wr.conduitEntry;delete wr.conduitEntryEnd;delete wr.conduitExit;
  wr.pts=wr.conduitFreePts||[];delete wr.conduitFreePts;
}
function pendingConduitEntry(tube,replace){
  if(!pending)return;
  if(replace||pending.conduitId!==tube.id||!Number.isFinite(pending.conduitEntry)){
    pending.conduitId=tube.id;pending.conduitEntry=conduitFraction(conduitById(tube.id),tube.at);
  }
}
function conduitShell(d,extra){
  return '<g pointer-events="none"'+(extra||'')+'><path d="'+d+'" fill="none" stroke="#202a32" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>'
    +'<path d="'+d+'" fill="none" stroke="#596671" stroke-width="26" stroke-linecap="round"/>'
    +'<path d="'+d+'" fill="none" stroke="#29343e" stroke-width="29" stroke-dasharray="2 5"/>'
    +'<path d="'+d+'" fill="none" stroke="#aab7c0" stroke-width="5" stroke-opacity=".35"/></g>';
}
function renderConduits(){
  const layer=document.getElementById('routingConduitLayer');if(!layer)return;
  let s='';
  (state.conduits||[]).forEach(function(c){
    const g=conduitGeometry(c),selected=conduitEdit===c.id,magnet=conduitMagnet===c.id;
    s+='<g class="routing-conduit" data-conduit-id="'+escapeHtml(c.id)+'"><title>Гофра · перетаскивайте участок; Alt — переместить целиком; двойной щелчок — добавить поворот</title>';
    if(selected||magnet)s+='<path d="'+g.d+'" fill="none" stroke="'+(magnet?'#63e6b0':'#f5c85c')+'" stroke-width="39" stroke-linecap="round" pointer-events="none"/>';
    s+=conduitShell(g.d)+'<path d="'+g.d+'" fill="none" stroke="transparent" stroke-width="34" pointer-events="stroke"/>';
    const grabbed=wireGrab&&state.wires.find(function(w){return w.id===wireGrab.id;});
    const entryFraction=grabbed&&grabbed.previewConduitId===c.id?grabbed.previewConduitEntry:pending&&pending.conduitId===c.id?pending.conduitEntry:null;
    if(Number.isFinite(entryFraction)){const entry=g.path.getPointAtLength(Math.max(0,Math.min(1,entryFraction))*g.length);s+='<circle class="conduit-entry-marker" cx="'+entry.x+'" cy="'+entry.y+'" r="9" fill="#63e6b0" stroke="#173b35" stroke-width="2" pointer-events="none"><title>Точка входа провода</title></circle>';}
    if(selected)c.pts.forEach(function(p,i){s+='<circle class="conduit-handle" data-conduit-point="'+i+'" cx="'+p.x+'" cy="'+p.y+'" r="7" fill="#ffe29b" stroke="#526575" stroke-width="2"/>';});
    s+='</g>';
  });
  if(conduitDraft&&conduitDraft.pts.length){
    const pts=conduitDraft.pts.concat(conduitDraft.cursor?[conduitDraft.cursor]:[]),g=roundedOrthogonalGeometry(orthogonalRoute(pts),24);
    s+=conduitShell(g.d,' opacity=".65"');
  }
  layer.innerHTML=s;
  const active=new Set((state.conduits||[]).map(function(c){return c.id;}));conduitGeometryCache.forEach(function(v,k){if(!active.has(k))conduitGeometryCache.delete(k);});
  const bar=document.getElementById('conduitControls'),tool=document.getElementById('conduitTool');
  if(tool)tool.setAttribute('aria-pressed',String(!!conduitDraft));scene.classList.toggle('drawing-conduit',!!conduitDraft);
  if(!bar)return;bar.hidden=!conduitDraft&&!conduitById(conduitEdit);
  document.getElementById('conduitHint').textContent=conduitDraft?'Гофра: щелчки — повороты, двойной щелчок или Enter — конец.':'Гофра: тяните участок или жёлтую точку. Alt — перенос целиком.';
  bar.querySelector('[data-conduit-act="finish"]').hidden=!conduitDraft;
  bar.querySelector('[data-conduit-act="undo"]').hidden=!conduitDraft;
  bar.querySelector('[data-conduit-act="remove"]').hidden=!!conduitDraft;
  bar.querySelector('[data-conduit-act="cancel"]').textContent=conduitDraft?'Отмена':'Готово';
}
function startConduit(){
  cancelAlignmentGuide();
  cancelWire();hideWireMenu();hideObjectMenu();conduitEdit=null;conduitMagnet=null;
  conduitDraft={pts:[],cursor:null};renderConduits();touchStatus('Укажите начало гофры.');
  sideMenuItems.forEach(function(item){item.open=false;});
}
function cancelConduit(){
  if(conduitGrab){const c=conduitById(conduitGrab.id);if(c)c.pts=conduitGrab.pts;}
  conduitDraft=null;conduitEdit=null;conduitGrab=null;conduitMagnet=null;renderConduits();touchStatus('');
}
function finishConduit(){
  if(!conduitDraft)return;
  const pts=compactWireCorners(orthogonalRoute(conduitDraft.pts));
  if(pts.length<2){touchStatus('Укажите хотя бы начало и конец гофры.');return;}
  beginActionHistory();let id;do{id='CF'+state.nextId++;}while(conduitById(id));
  (state.conduits||(state.conduits=[])).push({id:id,pts:pts});conduitDraft=null;conduitEdit=id;
  renderAll();queueActionHistory();touchStatus('Гофра проложена. Подведите к ней провод.');
}
function removeConduit(){
  if(!conduitEdit)return;beginActionHistory();const id=conduitEdit;
  state.wires.forEach(function(w){if(w.conduitId===id)detachWireConduit(w);});
  state.conduits=(state.conduits||[]).filter(function(c){return c.id!==id;});cancelConduit();renderAll();queueActionHistory();
}
function initConduits(){
  document.getElementById('conduitTool').addEventListener('click',function(){if(conduitDraft)cancelConduit();else startConduit();});
  document.getElementById('conduitControls').addEventListener('click',function(evt){
    const b=evt.target.closest('[data-conduit-act]');if(!b)return;
    if(b.dataset.conduitAct==='finish')finishConduit();
    else if(b.dataset.conduitAct==='remove')removeConduit();
    else if(b.dataset.conduitAct==='undo'&&conduitDraft){conduitDraft.pts.pop();renderConduits();}
    else cancelConduit();
  });
  // Захват в фазе capture исключает одновременное создание провода и перенос аппарата.
  scene.addEventListener('pointerdown',function(evt){
    if(evt.button===1)return;
    if(conduitDraft){
      evt.preventDefault();evt.stopImmediatePropagation();if(evt.button===2){cancelConduit();return;}
      if(evt.button!==0)return;const p=snapAlignmentPoint(svgPoint(evt),evt),last=conduitDraft.pts.at(-1);
      if(!last||Math.hypot(p.x-last.x,p.y-last.y)>3)conduitDraft.pts.push(p);
      conduitDraft.cursor=null;renderConduits();return;
    }
    const body=evt.target.closest('[data-conduit-id]');if(!body||pending||evt.button!==0)return;
    evt.preventDefault();evt.stopImmediatePropagation();hideWireMenu();
    const c=conduitById(body.dataset.conduitId),p=svgPoint(evt);if(!c)return;
    conduitEdit=c.id;const handle=evt.target.closest('[data-conduit-point]');
    let seg=0,best=Infinity;c.pts.slice(1).forEach(function(q,i){const d=distToSeg(p,c.pts[i],q);if(d<best){best=d;seg=i;}});
    conduitGrab={id:c.id,pointerId:evt.pointerId,start:p,pts:c.pts.map(function(q){return {x:q.x,y:q.y};}),point:handle?+handle.dataset.conduitPoint:null,segment:seg,whole:evt.altKey};renderConduits();
  },true);
  scene.addEventListener('dblclick',function(evt){
    if(conduitDraft){evt.preventDefault();evt.stopImmediatePropagation();finishConduit();return;}
    const body=evt.target.closest('[data-conduit-id]');if(!body||pending)return;
    const c=conduitById(body.dataset.conduitId),p=snapAlignmentPoint(svgPoint(evt),evt);let seg=0,best=Infinity;
    c.pts.slice(1).forEach(function(q,i){const d=distToSeg(p,c.pts[i],q);if(d<best){best=d;seg=i;}});
    beginActionHistory();c.pts.splice(seg+1,0,p);conduitEdit=c.id;renderAll();queueActionHistory();
  },true);
  scene.addEventListener('contextmenu',function(evt){if(conduitDraft||evt.target.closest('[data-conduit-id]'))evt.preventDefault();},true);
  document.addEventListener('pointermove',function(evt){
    if(conduitDraft){conduitDraft.cursor=snapAlignmentPoint(svgPoint(evt),evt);renderConduits();return;}
    if(!conduitGrab||evt.pointerId!==conduitGrab.pointerId)return;
    const c=conduitById(conduitGrab.id);if(!c)return;const p=svgPoint(evt),d=conduitGrab;let dx=p.x-d.start.x,dy=p.y-d.start.y;
    c.pts=d.pts.map(function(q){return {x:q.x,y:q.y};});
    if(d.whole){
      const xs=d.pts.map(function(q){return q.x;}),ys=d.pts.map(function(q){return q.y;});
      const cx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2,cy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2;
      dx=snapAlignmentAxis(cx+dx,'x',evt)-cx;dy=snapAlignmentAxis(cy+dy,'y',evt)-cy;
      c.pts.forEach(function(q){q.x+=dx;q.y+=dy;});
    }
    else if(d.point!==null){
      const i=d.point;c.pts[i]=snapAlignmentPoint({x:d.pts[i].x+dx,y:d.pts[i].y+dy},evt);
      const prev=d.pts[i-1],next=d.pts[i+1],q=d.pts[i];
      const straight=prev&&next&&((Math.abs(prev.x-q.x)<.01&&Math.abs(next.x-q.x)<.01)||(Math.abs(prev.y-q.y)<.01&&Math.abs(next.y-q.y)<.01));
      if(!straight)[i-1,i+1].forEach(function(j){if(j<0||j>=c.pts.length)return;if(Math.abs(d.pts[j].x-d.pts[i].x)<.01)c.pts[j].x=c.pts[i].x;else c.pts[j].y=c.pts[i].y;});
    }else{
      const i=d.segment,axis=Math.abs(d.pts[i+1].x-d.pts[i].x)>Math.abs(d.pts[i+1].y-d.pts[i].y)?'y':'x';
      const coordinate=snapAlignmentAxis(d.pts[i][axis]+(axis==='x'?dx:dy),axis,evt);
      c.pts[i][axis]=coordinate;c.pts[i+1][axis]=coordinate;
    }
    renderConduits();renderWires();renderClamp();
  });
  document.addEventListener('pointerup',function(evt){
    if(conduitDraft&&conduitDraft.trayPointer===evt.pointerId){delete conduitDraft.trayPointer;const r=scene.getBoundingClientRect();if(evt.clientX>=r.left&&evt.clientX<=r.right&&evt.clientY>=r.top&&evt.clientY<=r.bottom){conduitDraft.pts.push(snapAlignmentPoint(svgPoint(evt),evt));renderConduits();}}
    if(conduitGrab&&evt.pointerId===conduitGrab.pointerId){const c=conduitById(conduitGrab.id);if(c){const pts=compactWireCorners(orthogonalRoute(c.pts));c.pts=pts.length>1?pts:conduitGrab.pts;}conduitGrab=null;renderAll();}
  });
  document.addEventListener('pointercancel',function(){if(wireGrab){const w=state.wires.find(function(w){return w.id===wireGrab.id;});if(w){delete w.previewConduitId;delete w.previewConduitEntry;delete w.previewConduitEntryEnd;if(wireGrab.freePts)w.pts=wireGrab.freePts;}wireGrab=null;renderWires();}if(conduitGrab){const c=conduitById(conduitGrab.id);if(c)c.pts=conduitGrab.pts;conduitGrab=null;renderAll();}conduitMagnet=null;renderConduits();});
  document.addEventListener('keydown',function(evt){
    if(evt.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(evt.key==='Escape')cancelConduit();
    else if(conduitDraft&&evt.key==='Enter'){evt.preventDefault();finishConduit();}
    else if(conduitDraft&&evt.key==='Backspace'){evt.preventDefault();conduitDraft.pts.pop();renderConduits();}
    else if(conduitEdit&&evt.key==='Delete'){evt.preventDefault();removeConduit();}
  });
}

function renderWires(){
  const occupiedLanes=prepareWireJumperLanes();
  let s = '';
  state.wires.forEach(function(wr){
    const a = terminal(wr.a.devId, wr.a.key), b = terminal(wr.b.devId, wr.b.key);
    if (!a || !b) return;
    const wireColor = wr.color || a.color;
    const width=wireVisualWidth(wr);
    const contained=wireConduitParts(a,b,wr);
    const d = contained?contained.d:wirePathD(a,b,wr);
    const grabbing = (wireGrab && wireGrab.id === wr.id) ? ' grabbing' : '';
    let dots = '';
    if(!contained&&(wr.previewShape||wr.shape)!=='orthogonal')wirePointList(a, b, wr).forEach(function(p){
      dots += '<circle class="wire-dot" cx="'+p.x+'" cy="'+p.y+'" r="4.5" fill="'+wireColor+'" stroke="#ffffff" stroke-width="1.2" pointer-events="none"/>';
    });
    s += '<g class="wireG'+grabbing+'" data-wid="'+wr.id+'">'
       +   '<title>Провод №'+wr.id+' · медь · '+wireSectionLabel(wireSectionOf(wr))+(contained?' · в гофре':'')+'</title>'
       +   '<path class="wire" d="'+(contained?contained.outside:d)+'" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="'+(width+2.5)+'" stroke-linecap="round"/>'
       +   wireStrokeGeom(contained?contained.outside:d, wireColor, 'wire',false,width)
       +   (contained?'<g opacity=".28" pointer-events="none">'+wireStrokeGeom(contained.inside,wireColor,'wire',false,width)+'</g>':'')
       +   wireFerruleSvg(a,wr,d,false)+wireFerruleSvg(b,wr,d,true)
       +   dots
       +   '<path class="wire-hit" d="'+(contained?contained.outside:d)+'" fill="none" stroke="transparent" stroke-width="'+Math.max(16,width+6)+'" stroke-linecap="round" pointer-events="stroke"/>'
       +   (!contained&&(wr.previewShape||wr.shape)==='orthogonal'?wireSegmentHitSvg(a,b,wr):'')
       + '</g>';
  });
  if (pending && pending.pt){
    const a=terminal(pending.from.devId,pending.from.key);
    const target=pending.target&&terminal(pending.target.devId,pending.target.key);
    if(a){
      // Те же параметры и конечная клемма, которые получит готовый провод.
      const preview={pts:pending.pts||[],shape:pending.shape||wireDefaults.shape,
        sectionMm2:normalizeWireSection(pending.sectionMm2),conduitId:pending.conduitId,conduitEntry:pending.conduitEntry,
        conduitPreviewInside:!!(pending.conduitId&&!target&&nearestConduit(pending.pt))};
      const b=target||(preview.conduitPreviewInside?pending.pt:wireFreeBodyEndpoint(a,pending.pt,preview));
      const lane=target&&wireJumperLane(a,b,preview);
      if(lane)preview.autoLane=chooseWireJumperLane(lane,null,occupiedLanes);
      const start=wireVisualEndpoint(a,preview);
      const d=pending.pristine&&!target&&!preview.pts.length&&!preview.conduitId
        ?'M '+start.x+','+start.y+' L '+b.x+','+b.y:wirePathD(a,b,preview);
      const color=pending.color||wireDefaults.color,width=wireVisualWidth(preview);
      s+='<g class="wire-preview" pointer-events="none">';
      s+='<path d="'+d+'" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="'+(width+2.5)+'" stroke-linecap="round"/>';
      s+=wireStrokeGeom(d,color,null,true,width);
      s+=wireFerruleSvg(a,preview,d,false);
      s+=target?wireFerruleSvg(target,preview,d,true):preview.conduitPreviewInside?'':wireFreeFerruleSvg(preview,d,pending.pt);
      if(!target)s+='<circle class="wire-pending-end" cx="'+pending.pt.x+'" cy="'+pending.pt.y+'" r="1" fill="transparent" stroke="transparent" stroke-width="36" vector-effect="non-scaling-stroke" pointer-events="all"><title>Потяните свободный конец провода</title></circle>';
      (preview.conduitId?[]:(target?wirePointList(a,b,preview):(pending.pts||[]))).forEach(function(p){
        s+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4.5" fill="'+color+'" stroke="#fff" stroke-width="1.2" pointer-events="none"/>';
      });
      s+='</g>';
    }
  }
  wireLayer.innerHTML = s;
}
function renderTerminals(){
  let s = '';
  function one(devId, type, obj){
    termDefs(type,obj).forEach(function(td){
      const p = terminal(devId, td.key);
      if (!p) return;
      s += '<circle class="term" data-dev="'+devId+'" data-key="'+td.key+'" cx="'+p.x+'" cy="'+p.y+'" r="'+(td.hitR||11)+'" fill="transparent" pointer-events="all">'
         + '<title>'+tagOf(devId)+' · зажим '+td.label+' — щёлкните, чтобы тянуть провод</title></circle>';
    });
  }
  state.devices.forEach(function(d){ one(d.id, d.type, d); });
  state.relays.forEach(function(r){ one('kk'+r.id, 'kk1'); });
  state.motors.forEach(function(motor){
    const terms=motorIsDc(motor)?DC_MOTOR_TERMS:MOTOR_TERMS;
    terms.forEach(function(td){
      const p = terminal(motor.id, td.key);
      if (!p) return;
      s += '<circle class="term" data-dev="'+motor.id+'" data-key="'+td.key+'" cx="'+p.x+'" cy="'+p.y+'" r="9" fill="transparent" pointer-events="all">'
         + '<title>'+escapeHtml(motor.id)+' · зажим '+escapeHtml(td.label)+' — щёлкните, чтобы тянуть провод</title></circle>';
    });
  });
  if(state.special.inbox) inboxTerms().forEach(function(td){
    const p = terminal('IN', td.key);
    if (!p) return;
    s += '<circle class="term" data-dev="IN" data-key="'+td.key+'" cx="'+p.x+'" cy="'+p.y+'" r="11" fill="transparent" pointer-events="all">'
       + '<title>XT1 · зажим '+td.label+' — щёлкните, чтобы тянуть провод</title></circle>';
  });
  state.pushbuttons.forEach(function(pb){
    PB_TERMS.forEach(function(td){
      const p = terminal(pb.id, td.key);
      if (!p) return;
      s += '<circle class="term" data-dev="'+pb.id+'" data-key="'+td.key+'" cx="'+p.x+'" cy="'+p.y+'" r="11" fill="transparent" pointer-events="all">'
         + '<title>'+pb.tag+' · зажим '+td.label+' — щёлкните, чтобы тянуть провод</title></circle>';
    });
  });
  // щупы мультиметра
  const probes = [[state.mm.a, '#e01b1b'], [state.mm.b, '#111111']];
  probes.forEach(function(pr){
    if (!pr[0]) return;
    const p = terminal(pr[0].devId, pr[0].key);
    if (!p) return;
    s += '<circle cx="'+p.x+'" cy="'+p.y+'" r="15" fill="none" stroke="'+pr[1]+'" stroke-width="3.2" pointer-events="none"/>';
  });
  if(meterProbeHover){
    s += '<circle cx="'+meterProbeHover.x+'" cy="'+meterProbeHover.y+'" r="11" fill="rgba(245,166,35,.35)" stroke="#f5a623" stroke-width="2" pointer-events="none"/>';
  }
  termLayer.innerHTML = s;
  // Если щуп защёлкнут на клемме, его корпус и кабель следуют за аппаратом.
  renderMM();
}

/* Пользовательские линии в координатах схемы. Радиус привязки — 10 экранных
   пикселей при любом масштабе; электрические концы проводов не перемещаем. */
function normalizeAlignmentGuides(items){
  const seen=new Set();
  return (Array.isArray(items)?items:[]).slice(0,500).filter(function(g){
    if(!g||typeof g.id!=='string'||!g.id||seen.has(g.id)||!['x','y'].includes(g.axis)||typeof g.position!=='number'||!Number.isFinite(g.position))return false;
    seen.add(g.id);return true;
  }).map(function(g){return {id:g.id,axis:g.axis,position:g.position};});
}
function alignmentGuideById(id){return (state.alignmentGuides||[]).find(function(g){return g.id===id;})||null;}
function alignmentScale(){const m=ctmNode().getScreenCTM();return m?Math.max(.0001,Math.hypot(m.a,m.b||0)):1;}
function snapAlignmentAxis(value,axis,evt){
  if(state.alignmentSnapEnabled===false||(evt&&evt.shiftKey)||!Number.isFinite(value))return value;
  let nearest=value,distance=10/alignmentScale();
  (state.alignmentGuides||[]).forEach(function(g){
    const gap=Math.abs(g.position-value);
    if(g.axis===axis&&gap<=distance){nearest=g.position;distance=gap;}
  });
  return nearest;
}
function snapAlignmentPoint(p,evt){return {x:snapAlignmentAxis(p.x,'x',evt),y:snapAlignmentAxis(p.y,'y',evt)};}
function snapAlignmentBox(x,y,w,h,evt){
  const center=snapAlignmentPoint({x:x+w/2,y:y+h/2},evt);
  return {x:center.x-w/2,y:center.y-h/2};
}
function renderAlignmentGuides(){
  const layer=document.getElementById('alignmentGuideLayer');if(!layer)return;
  const selected=alignmentGuideById(alignmentSelected),bar=document.getElementById('alignmentControls');
  if(bar)bar.hidden=!alignmentDraft&&!selected;
  const hint=document.getElementById('alignmentHint');
  if(hint)hint.textContent=alignmentDraft?(alignmentDraft.axis==='x'?'Вертикальная':'Горизонтальная')+' направляющая: укажите место на поле.':selected?'Передвигайте линию за метку у края экрана.':'';
  const remove=document.getElementById('removeAlignmentGuide');if(remove)remove.hidden=!selected;
  const done=document.getElementById('finishAlignmentGuide');if(done)done.textContent=alignmentDraft?'Отмена':'Готово';
  const k=alignmentScale(),rect=scene.getBoundingClientRect();
  let a=svgPoint({clientX:rect.left,clientY:rect.top}),b=svgPoint({clientX:rect.left+rect.width,clientY:rect.top+rect.height});
  if(!Number.isFinite(a.x)||!Number.isFinite(b.x)){a={x:0,y:-200};b={x:WORKSPACE_W,y:WORKSPACE_H};}
  const guides=(state.alignmentGuides||[]).slice();
  const overlays=Array.from(document.querySelectorAll('.wire-defaults,.history-controls,.side-menu-item > summary,.side-menu-item[open] .side-flyout,.conduit-controls:not([hidden])')).map(function(el){return el.getBoundingClientRect();});
  const matrix=ctmNode().getScreenCTM();
  function handlePosition(g){
    const vertical=g.axis==='x';
    const candidates=vertical?[b.y-22/k,b.y-84/k,a.y+22/k,(a.y+b.y)/2]:[b.x-24/k,a.x+24/k,(a.x+b.x)/2];
    for(const at of candidates){
      const p={x:vertical?g.position:at,y:vertical?at:g.position};
      const screen=matrix?new DOMPoint(p.x,p.y).matrixTransform(matrix):p;
      if(!overlays.some(function(r){return screen.x+18>r.left&&screen.x-18<r.right&&screen.y+14>r.top&&screen.y-14<r.bottom;}))return p;
    }
    return {x:vertical?g.position:b.x-24/k,y:vertical?b.y-22/k:g.position};
  }
  if(alignmentDraft&&Number.isFinite(alignmentDraft.position))guides.push({axis:alignmentDraft.axis,position:alignmentDraft.position,preview:true});
  layer.innerHTML=guides.map(function(g){
    const vertical=g.axis==='x',active=g.id===alignmentSelected,color=active?'#f3b94f':'#17abc5';
    const line='<line x1="'+(vertical?g.position:a.x)+'" y1="'+(vertical?a.y:g.position)+'" x2="'+(vertical?g.position:b.x)+'" y2="'+(vertical?b.y:g.position)+'" stroke="'+color+'" stroke-width="'+(active?1.6:1.1)+'" stroke-dasharray="7 5" vector-effect="non-scaling-stroke" opacity="'+(state.alignmentSnapEnabled===false?.45:.85)+'"/>';
    if(g.preview)return line;
    const p=handlePosition(g);
    return line+'<g class="alignment-handle" data-alignment-guide="'+escapeHtml(g.id)+'" transform="translate('+p.x+' '+p.y+') scale('+(1/k)+')" pointer-events="all" role="button" tabindex="0" aria-label="'+(vertical?'Вертикальная':'Горизонтальная')+' направляющая"><title>Перетащите метку, чтобы передвинуть линию. Delete — удалить.</title><rect x="-16" y="-12" width="32" height="24" rx="6" fill="'+(active?'#725018':'#174e60')+'" stroke="'+color+'"/><text x="0" y="5" text-anchor="middle" font-size="18" font-family="Segoe UI,Arial" fill="#fff">'+(vertical?'↔':'↕')+'</text></g>';
  }).join('');
  scene.classList.toggle('placing-alignment-guide',!!alignmentDraft);
  const clear=document.getElementById('clearAlignmentGuides');if(clear)clear.disabled=!(state.alignmentGuides||[]).length;
  const toggle=document.getElementById('alignmentSnapToggle');
  if(toggle){toggle.setAttribute('aria-pressed',String(state.alignmentSnapEnabled!==false));toggle.textContent=state.alignmentSnapEnabled===false?'Привязка выключена':'Привязка включена';}
}
function cancelAlignmentGuide(){
  if(alignmentGrab){const g=alignmentGuideById(alignmentGrab.id);if(g)g.position=alignmentGrab.position;}
  alignmentDraft=null;alignmentSelected=null;alignmentGrab=null;renderAlignmentGuides();
}
function startAlignmentGuide(axis){
  cancelWire();cancelConduit();cancelAlignmentGuide();hideWireMenu();hideObjectMenu();touchPlacement=null;
  alignmentDraft={axis:axis,position:null};document.getElementById('alignmentTools').open=false;renderAlignmentGuides();
}
function removeAlignmentGuide(){
  if(!alignmentSelected)return;beginActionHistory();
  state.alignmentGuides=state.alignmentGuides.filter(function(g){return g.id!==alignmentSelected;});
  cancelAlignmentGuide();queueActionHistory();
}
function initAlignmentGuides(){
  document.getElementById('alignmentTools').addEventListener('toggle',renderAlignmentGuides);
  document.getElementById('wireToolsToggle').addEventListener('click',renderAlignmentGuides);
  document.getElementById('addVerticalGuide').addEventListener('click',function(){startAlignmentGuide('x');});
  document.getElementById('addHorizontalGuide').addEventListener('click',function(){startAlignmentGuide('y');});
  document.getElementById('alignmentSnapToggle').addEventListener('click',function(){beginActionHistory();state.alignmentSnapEnabled=state.alignmentSnapEnabled===false;renderAlignmentGuides();queueActionHistory();});
  document.getElementById('clearAlignmentGuides').addEventListener('click',function(){beginActionHistory();state.alignmentGuides=[];cancelAlignmentGuide();queueActionHistory();});
  document.getElementById('removeAlignmentGuide').addEventListener('click',removeAlignmentGuide);
  document.getElementById('finishAlignmentGuide').addEventListener('click',cancelAlignmentGuide);
  document.addEventListener('pointerdown',function(evt){
    if(!alignmentDraft&&!alignmentGrab&&alignmentSelected&&!evt.target.closest('[data-alignment-guide],#alignmentControls,#alignmentTools')){alignmentSelected=null;renderAlignmentGuides();}
  },true);
  scene.addEventListener('pointerdown',function(evt){
    if(evt.button===1)return;
    const handle=evt.target.closest('[data-alignment-guide]');
    if(!alignmentDraft&&!handle)return;
    evt.preventDefault();evt.stopImmediatePropagation();
    if(evt.button===2){cancelAlignmentGuide();return;}if(evt.button!==0)return;
    const p=svgPoint(evt);if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
    beginActionHistory();
    if(alignmentDraft){
      let id;do{id='G'+state.nextId++;}while(alignmentGuideById(id));
      state.alignmentGuides.push({id:id,axis:alignmentDraft.axis,position:p[alignmentDraft.axis]});
      alignmentSelected=id;alignmentDraft=null;queueActionHistory();
    }else{
      cancelWire();cancelConduit();hideWireMenu();hideObjectMenu();alignmentSelected=handle.dataset.alignmentGuide;
      const g=alignmentGuideById(alignmentSelected);if(g)alignmentGrab={id:g.id,pointerId:evt.pointerId,position:g.position,start:p[g.axis]};
    }
    renderAlignmentGuides();
  },true);
  document.addEventListener('pointermove',function(evt){
    if(!alignmentDraft&&!alignmentGrab)return;const p=svgPoint(evt);if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
    if(alignmentDraft)alignmentDraft.position=p[alignmentDraft.axis];
    if(alignmentGrab&&evt.pointerId===alignmentGrab.pointerId){const g=alignmentGuideById(alignmentGrab.id);if(g)g.position=alignmentGrab.position+p[g.axis]-alignmentGrab.start;}
    renderAlignmentGuides();
  });
  document.addEventListener('pointerup',function(evt){if(alignmentGrab&&evt.pointerId===alignmentGrab.pointerId){alignmentGrab=null;renderAlignmentGuides();queueActionHistory();}});
  document.addEventListener('pointercancel',function(evt){if(alignmentGrab&&evt.pointerId===alignmentGrab.pointerId)cancelAlignmentGuide();});
  scene.addEventListener('contextmenu',function(evt){if(alignmentDraft||evt.target.closest('[data-alignment-guide]'))evt.preventDefault();});
  document.addEventListener('keydown',function(evt){
    if(evt.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    const handle=evt.target.closest('[data-alignment-guide]');if(handle)alignmentSelected=handle.dataset.alignmentGuide;
    if(evt.key==='Escape'&&(alignmentDraft||alignmentSelected)){cancelAlignmentGuide();return;}
    if(alignmentSelected&&evt.key==='Delete'){evt.preventDefault();removeAlignmentGuide();}
  });
}

/* Координаты всех доступных клемм для магнитных направляющих. */
function terminalGuidePoints(){
  const points=[],seen={};
  function add(devId,type,obj){
    termDefs(type,obj).forEach(function(td){
      const p=terminal(devId,td.key); if(!p)return;
      const key=Math.round(p.x*10)+'/'+Math.round(p.y*10);
      if(!seen[key]){seen[key]=true;points.push(p);}
    });
  }
  state.devices.forEach(function(d){add(d.id,d.type,d);});
  state.relays.forEach(function(r){add('kk'+r.id,'kk1');});
  state.motors.forEach(function(motor){(motorIsDc(motor)?DC_MOTOR_TERMS:MOTOR_TERMS).forEach(function(td){const p=terminal(motor.id,td.key);if(p){const k=Math.round(p.x*10)+'/'+Math.round(p.y*10);if(!seen[k]){seen[k]=true;points.push(p);}}});});
  if(state.special.inbox)inboxTerms().forEach(function(td){const p=terminal('IN',td.key);if(p){const k=Math.round(p.x*10)+'/'+Math.round(p.y*10);if(!seen[k]){seen[k]=true;points.push(p);}}});
  state.pushbuttons.forEach(function(pb){PB_TERMS.forEach(function(td){const p=terminal(pb.id,td.key);if(p){const k=Math.round(p.x*10)+'/'+Math.round(p.y*10);if(!seen[k]){seen[k]=true;points.push(p);}}});});
  return points;
}
function snapPendingPoint(raw,evt){
  const p={x:raw.x,y:raw.y};
  if(!terminalGuidesEnabled||!pending||(evt&&evt.shiftKey)){
    if(pending){pending.guideX=null;pending.guideY=null;}
    return snapAlignmentPoint(p,evt);
  }
  const points=terminalGuidePoints(),showDistance=28,snapDistance=13;
  let nx=null,ny=null,dx=Infinity,dy=Infinity;
  points.forEach(function(t){
    const tx=Math.abs(t.x-p.x),ty=Math.abs(t.y-p.y);
    if(tx<dx){dx=tx;nx=t.x;}
    if(ty<dy){dy=ty;ny=t.y;}
  });
  pending.guideX=dx<=showDistance?nx:null;
  pending.guideY=dy<=showDistance?ny:null;
  if(dx<=snapDistance)p.x=nx;
  if(dy<=snapDistance)p.y=ny;
  const manual=snapAlignmentPoint(raw,evt);
  if(manual.x!==raw.x)p.x=manual.x;
  if(manual.y!==raw.y)p.y=manual.y;
  return p;
}
/* Направляющие видны только при прокладке и только рядом с курсором. */
function renderTerminalGuides(){
  if(!guideLayer)return;
  if(!terminalGuidesEnabled||!pending){guideLayer.innerHTML='';return;}
  let s='';
  if(pending.guideX!==null&&pending.guideX!==undefined)s+='<line x1="'+pending.guideX+'" y1="-260" x2="'+pending.guideX+'" y2="'+(WORKSPACE_H+260)+'" stroke="#e887aa" stroke-width="0.7" opacity=".7" pointer-events="none"/>';
  if(pending.guideY!==null&&pending.guideY!==undefined)s+='<line x1="-260" y1="'+pending.guideY+'" x2="'+(WORKSPACE_W+260)+'" y2="'+pending.guideY+'" stroke="#e887aa" stroke-width="0.7" opacity=".7" pointer-events="none"/>';
  guideLayer.innerHTML=s;
}

/* --- взаимодействие --- */
let pending = null;
let wireGrab = null;
let wireMenu = { wid:null, x:0, y:0 };
let wireShapePreviewId = null;
let wireSeq = 1;
function sameTerm(a, devId, key){ return String(a.devId) === String(devId) && a.key === key; }
function wireExists(d1, k1, d2, k2){
  return state.wires.some(function(w){
    return (sameTerm(w.a,d1,k1) && sameTerm(w.b,d2,k2)) || (sameTerm(w.a,d2,k2) && sameTerm(w.b,d1,k1));
  });
}
function removeWiresFor(devId){
  const before = state.wires.length;
  state.wires = state.wires.filter(function(w){
    return String(w.a.devId) !== String(devId) && String(w.b.devId) !== String(devId);
  });
  return before - state.wires.length;
}
function cancelWire(){
  hideTouchLoupe();
  if (!pending) return;
  pending = null;
  touchStatus('');
  conduitMagnet=null;renderConduits();
  renderTerminalGuides();
  renderWires();
}
/* Предпросмотр и завершение жеста используют одну цель под указателем. */
function wirePointerTerminal(evt){
  const under=document.elementFromPoint?document.elementFromPoint(evt.clientX,evt.clientY):null;
  const el=under||evt.target;
  return (el&&el.closest&&el.closest('.term'))||(evt.pointerType==='touch'&&nearestTouchTerminal(evt))||null;
}
function updatePendingPointer(evt){
  if(!pending)return;
  const raw=svgPoint(evt);
  if(!isFinite(raw.x)||!isFinite(raw.y))return;
  const hit=wirePointerTerminal(evt);
  const id=hit?toDevId(hit.dataset.dev):null,key=hit&&hit.dataset.key;
  const target=hit&&!sameTerm(pending.from,id,key)?terminal(id,key):null;
  const source=terminal(pending.from.devId,pending.from.key);
  // У своей клеммы показываем прямой выходящий хвост, а не обратный ввод
  // в тот же винт. Клеммы назначения по-прежнему имеют приоритет.
  if(!target&&source&&!(pending.pts&&pending.pts.length)&&!pending.conduitId
    &&(hit&&sameTerm(pending.from,id,key)||Math.hypot(raw.x-source.x,raw.y-source.y)<Math.max(8,8/alignmentScale()))){
    pending.target=null;pending.pt={x:pending.initialPoint.x,y:pending.initialPoint.y};pending.pristine=true;
    conduitMagnet=null;renderConduits();return;
  }
  pending.target=target?{devId:target.devId,key:target.key}:null;
  pending.pristine=false;
  const tube=!target&&nearestConduit(raw);
  if(tube)pendingConduitEntry(tube,false);
  conduitMagnet=tube?tube.id:null;renderConduits();
  pending.pt=target?{x:target.x,y:target.y}:tube?{x:tube.x,y:tube.y}:snapPendingPoint(raw,evt);
}
function connectTerminals(devId, key){
  if (!pending) return;
  const a = terminal(pending.from.devId, pending.from.key), b = terminal(devId, key);
  if (!a || !b || (String(a.devId) === String(b.devId) && a.key === b.key)){
    pending = null; renderTerminalGuides(); renderWires(); return;
  }
  if (wireExists(a.devId, a.key, b.devId, b.key)){
    warn('Эти зажимы уже соединены проводом.');
    pending = null; renderTerminalGuides(); renderWires(); renderTerminals(); return;
  }
  state.wires.push({ id: wireSeq++, a:{ devId:a.devId, key:a.key }, b:{ devId:b.devId, key:b.key },
                     color:pending.color || wireDefaults.color, shape:pending.shape || wireDefaults.shape,
                     sectionMm2:normalizeWireSection(pending.sectionMm2),conduitId:pending.conduitId||undefined,conduitEntry:pending.conduitEntry,
                     pts:(pending.pts || []).map(function(p){ return {x:p.x,y:p.y}; }) });
  if(pending.conduitId){const wr=state.wires.at(-1);wr.conduitFreePts=wr.pts.map(function(p){return {x:p.x,y:p.y};});attachWireConduit(wr,pending.conduitId,pending.conduitEntry,'a');}
  log('Провод проложен: ' + tagOf(a.devId)+' : '+a.label + ' — ' + tagOf(b.devId)+' : '+b.label + ' · '+wireSectionLabel(pending.sectionMm2)+'.', 'ok');
  pending = null;conduitMagnet=null;
  renderAll();
}
/* Цвет нового провода определяется назначением начальной клеммы.
   Цвета и подписи самих клемм при этом не меняются. */
function wireStartColor(t){
  if(t.color===WC.PE)return WC.PE;
  if(t.color===WC.N)return WC.N;
  if(String(t.devId)==='IN'&&/^L[123]?$/.test(t.key))return WC.L1;
  const dev=devById(+t.devId),motor=motorById(t.devId);
  // Выводы постоянного тока не считаются фазными.
  if(motor&&motorIsDc(motor)||dev&&dev.type==='tp'&&!['R','S','T'].includes(t.key))return wireDefaults.color;
  if([WC.L1,WC.L2,WC.L3].includes(t.color))return WC.L1;
  return wireDefaults.color;
}
function initialWirePoint(t){
  const direction={top:{x:0,y:-1},bottom:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[t.entrySide]||{x:0,y:1};
  const wire={sectionMm2:wireDefaults.sectionMm2},lead=wireRoutingEndpoint(t,wire);
  const distance=Math.max(48,36/alignmentScale());
  return {x:lead.x+direction.x*distance,y:lead.y+direction.y*distance};
}

termLayer.addEventListener('pointerdown', function(evt){
  const hit = evt.target.closest('.term');
  if (!hit || evt.button !== 0) return;
  evt.preventDefault();
  const devId = hit.dataset.dev, key = hit.dataset.key;
  const id = toDevId(devId);
  if (state.mm.mode){ mmPick(id, key); return; }     // в режиме мультиметра ставим щуп
  if (pending){ connectTerminals(id, key); return; }
  const t = terminal(id, key);
  if (!t) return;
  const point=initialWirePoint(t);
  pending = { from:{ devId:id, key:key }, pt:point, initialPoint:{x:point.x,y:point.y}, pristine:true, pts:[], color:wireStartColor(t), shape:wireDefaults.shape, sectionMm2:wireDefaults.sectionMm2, guideX:null, guideY:null };
  log('Провод: начало на зажиме ' + tagOf(id)+' : '+t.label + ' — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.', 'info');
  renderTerminalGuides();
  renderWires();
});
document.addEventListener('pointermove', function(evt){
  if (wireGrab){                                   // перемещаем сторону или точку изгиба
    const wr = state.wires.find(function(x){ return x.id === wireGrab.id; });
    if (wr){
      const p = svgPoint(evt);
      if (isFinite(p.x) && isFinite(p.y)){
        const tube=nearestConduit(p);conduitMagnet=tube?tube.id:null;
        if(tube){wr.previewConduitId=tube.id;wr.previewConduitEntry=conduitFraction(conduitById(tube.id),tube.at);wr.previewConduitEntryEnd=wireGrab.conduitEntryEnd||'a';}else{delete wr.previewConduitId;delete wr.previewConduitEntry;delete wr.previewConduitEntryEnd;}
        renderConduits();
        if(tube||wr.conduitId){renderWires();return;}
        if(wireGrab.mode==='segment')moveWireSegment(wr,wireGrab,p,evt);
        else {
          if (!wr.pts) wr.pts = [];
          wr.pts[wireGrab.idx] = snapAlignmentPoint(p,evt);
        }
        renderWires();
      }
    }
    return;
  }
  if (!pending) return;
  if(evt.pointerType==='touch'&&!evt.touchReplay)return;
  updatePendingPointer(evt);
  renderTerminalGuides();
  renderWires();
});
document.addEventListener('pointerup', function(evt){
  if (wireGrab){
    const wr = state.wires.find(function(x){ return x.id === wireGrab.id; });
    if(wr){const tube=nearestConduit(svgPoint(evt));if(tube){attachWireConduit(wr,tube.id,conduitFraction(conduitById(tube.id),tube.at),wireGrab.conduitEntryEnd);if(wireGrab.freePts)wr.conduitFreePts=wireGrab.freePts;}delete wr.previewConduitId;delete wr.previewConduitEntry;delete wr.previewConduitEntryEnd;}
    conduitMagnet=null;
    if (wr) trace(wireGrab.mode==='segment'?'Участок провода перемещён.':'Форма провода изменена перетаскиванием (контакты на клеммах не тронуты).');
    wireGrab = null;
    renderAll();
    return;
  }
  if (!pending || evt.button !== 0) return;
  const hit=wirePointerTerminal(evt);
  if (!hit) return;                                   // провод остаётся за курсором: ждём второй клик
  const devId = hit.dataset.dev, key = hit.dataset.key;
  const id = toDevId(devId);
  if (sameTerm(pending.from, id, key)) return;
  connectTerminals(id, key);
});
scene.addEventListener('pointerdown', function(evt){
  if (!pending || evt.target.closest('.term,.wire-pending-end')) return;
  // Средняя кнопка предназначена для панорамирования и не отменяет провод.
  if (evt.button === 1) return;
  if (evt.button === 0){
    evt.preventDefault();
    evt.stopPropagation();
    const raw = svgPoint(evt);
    if (!isFinite(raw.x) || !isFinite(raw.y)) return;
    const tube=nearestConduit(raw);
    if(tube){pendingConduitEntry(tube,true);pending.target=null;pending.pt={x:tube.x,y:tube.y};conduitMagnet=tube.id;renderConduits();renderWires();return;}
    const p = snapPendingPoint(raw,evt);
    pending.pts = pending.pts || [];
    pending.pts.push({ x:p.x, y:p.y });
    pending.target=null;
    pending.pristine=false;
    pending.pt = { x:p.x, y:p.y };
    log('Добавлена точка маршрута провода №'+pending.pts.length+'. Продолжайте прокладку.', 'info');
    renderTerminalGuides();
    renderWires();
    return;
  }
  if(evt.button===2)cancelWire();
}, true);
document.addEventListener('keydown', function(evt){ if (evt.key === 'Escape'){ cancelWire(); hideWireMenu(); } });

/* ЛКМ: у прямоугольной трассы двигаем сторону, у остальных форм — ближайшую точку. */
wireLayer.addEventListener('pointerdown', function(evt){
  const g = evt.target.closest ? evt.target.closest('[data-wid]') : null;
  if (!g || evt.button !== 0) return;
  evt.preventDefault();
  cancelWire();
  hideWireMenu();
  const id = +g.dataset.wid;
  const wr = state.wires.find(function(x){ return x.id === id; });
  if (!wr) return;
  const a = terminal(wr.a.devId, wr.a.key), b = terminal(wr.b.devId, wr.b.key);
  if (!a || !b) return;
  const press=svgPoint(evt);
  if(!isFinite(press.x)||!isFinite(press.y))return;
  const conduitEntryEnd=Math.hypot(press.x-a.x,press.y-a.y)<=Math.hypot(press.x-b.x,press.y-b.y)?'a':'b';
  if(wr.conduitId){wireGrab={id:id,mode:'conduit',conduitEntryEnd:conduitEntryEnd};return;}
  const freePts=(wr.pts||[]).map(function(p){return {x:p.x,y:p.y};});
  if(wr.shape==='orthogonal'){
    const segment=evt.target.closest?evt.target.closest('[data-wire-segment]'):null;
    wireGrab=beginWireSegmentGrab(a,b,wr,press,segment?Number(segment.dataset.wireSegment):null);
    // Широкие области захвата соседних проводов могут перекрываться.
    state.wires.forEach(function(other){
      if(other.id===wr.id||other.conduitId||other.shape!=='orthogonal')return;
      const a=terminal(other.a.devId,other.a.key),b=terminal(other.b.devId,other.b.key);
      if(!a||!b)return;
      const candidate=beginWireSegmentGrab(a,b,other,press,null);
      if(candidate&&(!wireGrab||candidate.distance<wireGrab.distance-.0001))wireGrab=candidate;
    });
    if(wireGrab){const chosen=state.wires.find(function(w){return w.id===wireGrab.id;});const ca=terminal(chosen.a.devId,chosen.a.key),cb=terminal(chosen.b.devId,chosen.b.key);wireGrab.conduitEntryEnd=Math.hypot(press.x-ca.x,press.y-ca.y)<=Math.hypot(press.x-cb.x,press.y-cb.y)?'a':'b';wireGrab.freePts=(chosen.pts||[]).map(function(p){return {x:p.x,y:p.y};});renderWires();}
    return;
  }
  if (!wr.pts) wr.pts = [];
  if (!wr.pts.length){
    const handles = wirePointList(a,b,wr);
    wr.pts.push({ x:handles[0].x, y:handles[0].y });
  }
  const p = svgPoint(evt);
  if (!isFinite(p.x) || !isFinite(p.y)) return;
  let idx = 0, best = Infinity;
  wr.pts.forEach(function(q,i){ const d = Math.hypot(q.x-p.x, q.y-p.y); if (d < best){ best = d; idx = i; } });
  wr.pts[idx] = snapAlignmentPoint(p,evt);
  wireGrab = { id:id, idx:idx,freePts:freePts,conduitEntryEnd:conduitEntryEnd };
  renderWires();
});

/* ПКМ по проводу — меню: добавить/удалить точку изгиба или удалить провод */
function showWireMenu(wid, clientX, clientY, sp){
  wireMenu = { wid:wid, x:sp.x, y:sp.y };
  const m = document.getElementById('wireMenu');
  if (!m) return;
  const selected=currentMenuWire(),section=wireSectionOf(selected);
  m.querySelector('[data-act="unconduit"]').hidden=!(selected&&selected.conduitId);
  document.getElementById('wireSectionMenu').innerHTML=wireSectionButtons('data-wire-section',section);
  document.getElementById('wireSectionCurrent').textContent=wireSectionLabel(section);
  m.style.display = 'block';
  m.classList.toggle('flip-sub', clientX + 380 > window.innerWidth);
  m.classList.toggle('raise-sub', clientY + 430 > window.innerHeight);
  const box = m.getBoundingClientRect();
  m.style.left = Math.max(6, Math.min(clientX, window.innerWidth-box.width-6)) + 'px';
  m.style.top  = Math.max(6, Math.min(clientY, window.innerHeight-box.height-6)) + 'px';
}
function hideWireMenu(){
  const m = document.getElementById('wireMenu');
  if (m) m.style.display = 'none';
  if(m)m.querySelectorAll('.menu-sub.open').forEach(function(sub){sub.classList.remove('open');const b=sub.querySelector('.submenu-trigger');if(b)b.setAttribute('aria-expanded','false');});
  clearWireShapePreview();
  wireMenu = { wid:null, x:0, y:0 };
}
function currentMenuWire(){
  return state.wires.find(function(x){ return x.id === wireMenu.wid; }) || null;
}
function previewWireShape(shape){
  const wr = currentMenuWire();
  if (!wr) return;
  if (wireShapePreviewId !== null && wireShapePreviewId !== wr.id){
    const old = state.wires.find(function(x){ return x.id === wireShapePreviewId; });
    if (old) delete old.previewShape;
  }
  wr.previewShape = shape;
  wireShapePreviewId = wr.id;
  renderWires();
}
function clearWireShapePreview(){
  if (wireShapePreviewId === null) return;
  const wr = state.wires.find(function(x){ return x.id === wireShapePreviewId; });
  if (wr) delete wr.previewShape;
  wireShapePreviewId = null;
  renderWires();
}
function addWirePoint(){
  const wr = currentMenuWire();
  const p = { x:wireMenu.x, y:wireMenu.y };
  hideWireMenu();
  if (!wr) return;
  if(wr.conduitId){touchStatus('Сначала выньте провод из гофры через меню.');return;}
  const a = terminal(wr.a.devId, wr.a.key), b = terminal(wr.b.devId, wr.b.key);
  if (!a || !b) return;
  if (!wr.pts) wr.pts = [];
  const nodes = wireNodes(a, b, wr);
  let seg = 0, best = Infinity;
  for (let i=0;i<nodes.length-1;i++){
    const d = distToSeg(p, nodes[i], nodes[i+1]);
    if (d < best){ best = d; seg = i; }
  }
  wr.pts.splice(seg, 0, p);
  trace('На проводе добавлена точка изгиба (всего точек: '+wr.pts.length+').');
  renderAll();
}
function delWirePoint(){
  const wr = currentMenuWire();
  const p = { x:wireMenu.x, y:wireMenu.y };
  hideWireMenu();
  if (!wr) return;
  if (!wr.pts || !wr.pts.length){ warn('У этого провода нет точек изгиба.'); return; }
  let idx = 0, best = Infinity;
  wr.pts.forEach(function(q,i){ const d = Math.hypot(q.x-p.x, q.y-p.y); if (d < best){ best = d; idx = i; } });
  wr.pts.splice(idx, 1);
  trace('Точка изгиба удалена (осталось точек: '+wr.pts.length+').');
  renderAll();
}
function removeMenuWire(){
  const wr = currentMenuWire();
  hideWireMenu();
  if (!wr) return;
  state.wires = state.wires.filter(function(x){ return x.id !== wr.id; });
  log('Провод №'+wr.id+' удалён.', 'ok');
  renderAll();
}
function changeWireColor(color){
  const wr = currentMenuWire();
  hideWireMenu();
  if (!wr) return;
  wr.color = color;
  trace('Цвет провода изменён.');
  renderAll();
}
function changeWireSection(section){
  const wr=currentMenuWire();hideWireMenu();
  if(!wr)return;
  wr.sectionMm2=normalizeWireSection(section);
  log('Провод №'+wr.id+': сечение '+wireSectionLabel(wr.sectionMm2)+'.','info');
  renderAll();
}
function changeWireShape(shape){
  const wr = currentMenuWire();
  hideWireMenu();
  if (!wr) return;
  const names={smooth:'плавная кривая',straight:'прямые отрезки',orthogonal:'прямые углы',arc:'дуга-перемычка',s:'S-образный изгиб'};
  wr.shape = shape || 'smooth';
  if (wr.shape === 'arc' || wr.shape === 's') wr.pts = [];
  trace('Форма провода изменена: '+(names[wr.shape]||wr.shape)+'.');
  renderAll();
}
wireLayer.addEventListener('contextmenu', function(evt){
  const w = evt.target.closest ? evt.target.closest('[data-wid]') : null;
  if (!w) return;
  evt.preventDefault();
  const p = svgPoint(evt);
  showWireMenu(+w.dataset.wid, evt.clientX, evt.clientY, p);
});
(function(){
  const m = document.getElementById('wireMenu');
  if (!m || !m.addEventListener) return;
  m.addEventListener('mouseover', function(evt){
    const shapeButton = evt.target.closest ? evt.target.closest('[data-wire-shape]') : null;
    if (shapeButton) previewWireShape(shapeButton.getAttribute('data-wire-shape'));
  });
  const shapeMenu = m.querySelector('.wire-shapes');
  if (shapeMenu) shapeMenu.addEventListener('mouseleave', clearWireShapePreview);
  m.addEventListener('click', function(evt){
    const trigger=evt.target.closest?evt.target.closest('.submenu-trigger'):null;
    if(trigger){const sub=trigger.closest('.menu-sub'),open=!sub.classList.contains('open');m.querySelectorAll('.menu-sub').forEach(function(other){other.classList.remove('open');const b=other.querySelector('.submenu-trigger');if(b)b.setAttribute('aria-expanded','false');});sub.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));return;}
    const shapeButton = evt.target.closest ? evt.target.closest('[data-wire-shape]') : null;
    if (shapeButton){ changeWireShape(shapeButton.getAttribute('data-wire-shape')); return; }
    const colorButton = evt.target.closest ? evt.target.closest('[data-wire-color]') : null;
    if (colorButton){ changeWireColor(colorButton.getAttribute('data-wire-color')); return; }
    const sectionButton=evt.target.closest?evt.target.closest('[data-wire-section]'):null;
    if(sectionButton){changeWireSection(sectionButton.getAttribute('data-wire-section'));return;}
    const b = evt.target.closest ? evt.target.closest('[data-act]') : null;
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'add') addWirePoint();
    else if (act === 'del') delWirePoint();
    else if (act === 'remove') removeMenuWire();
    else if (act === 'unconduit'){const wr=currentMenuWire();hideWireMenu();detachWireConduit(wr);renderAll();}
  });
})();
document.addEventListener('pointerdown', function(evt){
  const m = document.getElementById('wireMenu');
  if (!m || m.style.display !== 'block') return;
  if (evt.target && evt.target.closest && evt.target.closest('#wireMenu')) return;
  hideWireMenu();
}, true);

/* ============================================================
   8в. ТРЁХФАЗНАЯ СЕТЬ ПЕРЕМЕННОГО ТОКА И МУЛЬТИМЕТР
   Симметричная трёхфазная синусоидальная система: L1, L2 и L3 сдвинуты
   друг относительно друга на 120°, частота по умолчанию 50 Гц.
   Основной расчёт аппаратов ведётся по действующим комплексным значениям,
   а временная модель ниже позволяет получить мгновенные напряжения и токи.
   N–PE = 0 В: ноль и защитный проводник соединены в одной точке.
   ============================================================ */
const AC_NETWORK = Object.freeze({
  kind:'three-phase-four-wire-sine',
  nominalLineVoltageRms:380,
  nominalFrequencyHz:50,
  phaseSequence:Object.freeze(['L1','L2','L3']),
  phaseAnglesDeg:Object.freeze({L1:0,L2:120,L3:240})
});
const V_ZERO = {r:0,i:0,frequencyHz:0,source:'reference'};
function networkLineVoltageRms(){
  const panel=inboxPanel();if(panel)return panelInletVoltage(panel);
  const props=state&&state.specialProps&&state.specialProps.inbox;
  const value=Number(props&&props.ratedVoltage);
  return isFinite(value)&&value>0?value:AC_NETWORK.nominalLineVoltageRms;
}
function networkPhaseVoltageRms(){ return networkLineVoltageRms()/(inboxSinglePhase()?1:Math.sqrt(3)); }
function networkPhaseSequence(){return inboxSinglePhase()?['L1']:AC_NETWORK.phaseSequence.slice();}
function networkKind(){return inboxSinglePhase()?'single-phase-three-wire-sine':AC_NETWORK.kind;}
function networkFrequencyHz(){
  const props=state&&state.specialProps&&state.specialProps.inbox;
  const value=Number(props&&props.frequency);
  return isFinite(value)&&value>0?value:AC_NETWORK.nominalFrequencyHz;
}
function vecPhase(deg,rms){
  const magnitude=isFinite(Number(rms))?Number(rms):networkPhaseVoltageRms();
  const a=deg*Math.PI/180;
  return {r:magnitude*Math.cos(a),i:magnitude*Math.sin(a),frequencyHz:networkFrequencyHz()};
}
function sourcePhasePhasor(phase){
  if(inboxSinglePhase()&&phase!=='L1')return V_ZERO;
  const angle=AC_NETWORK.phaseAnglesDeg[phase];
  if(angle===undefined)return V_ZERO;
  const value=vecPhase(angle,networkPhaseVoltageRms());
  value.source='grid';value.phase=phase;
  return value;
}
/* Постоянное напряжение в той же фазорной модели: мнимая часть равна нулю,
   частота — нулю, а признак dc отличает его от опорного нуля N/PE. */
function dcPhasor(volts,source){
  const value=Number(volts)||0;
  return {r:value,i:0,frequencyHz:0,dc:true,source:source||'dc'};
}
const V_DC_ZERO = Object.freeze({r:0,i:0,frequencyHz:0,dc:true,source:'dc-reference'});
function phasorDifference(a,b){
  a=a||V_ZERO;b=b||V_ZERO;
  const fa=Number(a.frequencyHz)||0,fb=Number(b.frequencyHz)||0;
  // Разность двух постоянных напряжений остаётся постоянной: подставлять
  // частоту сети здесь нельзя, иначе мультиметр покажет на якоре «50 Гц».
  const hasAc=(!a.dc&&fa>0)||(!b.dc&&fb>0);
  const frequencyHz=((a.dc||b.dc)&&!hasAc)?0:(fa||fb||networkFrequencyHz());
  return {r:a.r-b.r,i:a.i-b.i,frequencyHz:frequencyHz,dc:!!((a.dc||b.dc)&&!hasAc)};
}
function acNowSeconds(){
  return typeof performance!=='undefined'&&performance.now?performance.now()/1000:Date.now()/1000;
}
function acPhasorSample(phasor,timeSeconds){
  phasor=phasor||V_ZERO;
  const time=isFinite(Number(timeSeconds))?Number(timeSeconds):acNowSeconds();
  const dc=!!phasor.dc||!(Number(phasor.frequencyHz)>0);
  const rms=Math.hypot(phasor.r,phasor.i);
  if(dc){
    // Постоянное напряжение не имеет действующего значения синусоиды:
    // мгновенное значение равно самому напряжению и не меняется во времени.
    return {
      rms:rms,peak:rms,phaseDeg:phasor.r<0?180:0,
      instantaneous:phasor.r,frequencyHz:0,periodSeconds:Infinity,
      dc:true,timeSeconds:time,phasor:{r:phasor.r,i:phasor.i}
    };
  }
  const frequency=Math.max(.001,Number(phasor.frequencyHz)||networkFrequencyHz());
  const omega=2*Math.PI*frequency;
  return {
    rms:rms,
    peak:rms*Math.SQRT2,
    phaseDeg:rms?Math.atan2(phasor.i,phasor.r)*180/Math.PI:0,
    instantaneous:Math.SQRT2*(phasor.r*Math.cos(omega*time)-phasor.i*Math.sin(omega*time)),
    frequencyHz:frequency,
    periodSeconds:1/frequency,
    dc:false,
    timeSeconds:time,
    phasor:{r:phasor.r,i:phasor.i}
  };
}
function acTerminalSample(term,timeSeconds,map){
  map=map||potentialMap();
  return acPhasorSample(map.pot[nodeKey(term)]||V_ZERO,timeSeconds);
}
function acBetweenSample(a,b,timeSeconds,map){
  map=map||potentialMap();
  return acPhasorSample(phasorDifference(map.pot[nodeKey(a)],map.pot[nodeKey(b)]),timeSeconds);
}
/* Ток через будущее активное/индуктивное/ёмкостное звено. impedance задаётся
   как {r: активное сопротивление, x: реактивное сопротивление} в омах. */
function acCurrentThroughImpedance(a,b,impedance,timeSeconds,map){
  map=map||potentialMap();
  const voltage=phasorDifference(map.pot[nodeKey(a)],map.pot[nodeKey(b)]);
  const z=typeof impedance==='number'?{r:impedance,x:0}:(impedance||{});
  const zr=Number(z.r)||0,zx=Number(z.x)||0,denominator=zr*zr+zx*zx;
  if(denominator<=1e-12)return Object.assign(acPhasorSample(V_ZERO,timeSeconds),{openCircuit:true});
  const current={
    r:(voltage.r*zr+voltage.i*zx)/denominator,
    i:(voltage.i*zr-voltage.r*zx)/denominator
  };
  return Object.assign(acPhasorSample(current,timeSeconds),{openCircuit:false,impedanceOhm:{r:zr,x:zx}});
}
function acSourceSnapshot(timeSeconds){
  const time=isFinite(Number(timeSeconds))?Number(timeSeconds):acNowSeconds();
  const energized=!!(state.power&&state.special.inbox),phasors={},sequence=networkPhaseSequence();
  sequence.forEach(function(phase){phasors[phase]=energized?sourcePhasePhasor(phase):V_ZERO;});
  const phaseSamples={},lineSamples={};
  sequence.forEach(function(phase){phaseSamples[phase]=acPhasorSample(phasors[phase],time);});
  [['L1','L2'],['L2','L3'],['L3','L1']].forEach(function(pair){
    if(!phasors[pair[0]]||!phasors[pair[1]])return;
    lineSamples[pair[0]+'-'+pair[1]]=acPhasorSample(phasorDifference(phasors[pair[0]],phasors[pair[1]]),time);
  });
  return {
    kind:networkKind(),
    energized:energized,
    frequencyHz:networkFrequencyHz(),
    periodSeconds:1/networkFrequencyHz(),
    phaseSequence:sequence,
    lineVoltageRms:networkLineVoltageRms(),
    phaseVoltageRms:networkPhaseVoltageRms(),
    timeSeconds:time,
    phases:phaseSamples,
    lines:lineSamples
  };
}
const TRAINING_AC_API=Object.freeze({
  config:AC_NETWORK,
  snapshot:acSourceSnapshot,
  sampleTerminal:acTerminalSample,
  sampleBetween:acBetweenSample,
  currentThroughImpedance:acCurrentThroughImpedance
});
if(typeof window!=='undefined')window.TrainingAC=TRAINING_AC_API;
function nodeKey(t){ return String(t.devId)+'/'+t.key; }
function contactorClosed(d){ return !!(d && (d.coil || d.manualPressed)); }

/* внутренние связи аппаратов: замкнутые контакты, перемычки, силовой тракт реле */
function internalLinks(){
  const L = [];
  function link(d1,k1,d2,k2){ L.push([{ devId:d1, key:k1 }, { devId:d2, key:k2 }]); }
  state.devices.forEach(function(d){
    if(TYPES[d.type].kind==='mcb'&&d.on&&!d.tripped){for(let i=0;i<TYPES[d.type].poles;i++)link(d.id,'t'+i,d.id,'b'+i);}
    if (d.type === 'rcd' && d.on && !d.tripped){
      link(d.id,'tL',d.id,'bL');
      link(d.id,'tN',d.id,'bN');
    }
    if (d.type === 'meter'){
      link(d.id,'L_in',d.id,'L_out');
      link(d.id,'N_in',d.id,'N_out');
    }
    if (d.type === 'sensor'){
      link(d.id,'L_in',d.id,'L_out');
      link(d.id,'N_in',d.id,'N_out');
    }
    if (d.type === 'outlet'){
      link(d.id,'L',d.id,'s1L');link(d.id,'L',d.id,'s2L');
      link(d.id,'N',d.id,'s1N');link(d.id,'N',d.id,'s2N');
      link(d.id,'PE',d.id,'s1PEt');link(d.id,'PE',d.id,'s1PEb');
      link(d.id,'PE',d.id,'s2PEt');link(d.id,'PE',d.id,'s2PEb');
    }
    if (d.type === 'wallSwitch'){
      if(d.switchOn1)link(d.id,'L',d.id,'O1');
      if(Number(d.gangs)===2&&d.switchOn2)link(d.id,'L',d.id,'O2');
    }
    if (d.type === 'twoWaySwitch'){
      link(d.id,'L',d.id,Number(d.switchPosition)===2?'O2':'O1');
    }
    if(d.type==='junction'){
      ['top','right','bottom','left'].forEach(function(side){
        link(d.id,side+'0',d.id,side+'1');link(d.id,side+'1',d.id,side+'2');
      });
    }
    if (d.type === 'km1' && contactorClosed(d)){
      for (let i=0;i<3;i++) link(d.id,'t'+i,d.id,'b'+i);
      link(d.id,'t3',d.id,'b3');                  // нормально открытый 13-14 замыкается только при втянутой катушке
      link(d.id,'a53',d.id,'a54');                // ПКИ-11: нормально открытый 53-54
    }
    if (d.type === 'km1' && !contactorClosed(d)){ link(d.id,'a61',d.id,'a62'); } // ПКИ-11: нормально закрытый 61-62
    if (d.type === 'timer'){
      if (d.timerActive) link(d.id,'15',d.id,'18');
      else link(d.id,'15',d.id,'16');
    }
    if (d.type === 'klemma' || d.type === 'pebus' || TYPES[d.type].crossModule){ // N/PE: все зажимы, включая оба ряда, — один узел
      const terms=termDefs(d.type,d);
      for (let i=0;i<terms.length-1;i++) link(d.id,terms[i].key,d.id,terms[i+1].key);
    }
  });
  state.devices.filter(function(d){return d.type==='comb';}).forEach(function(d){
    const members=combMembers(d).filter(Boolean);
    for(let phase=0;phase<combPoles(d);phase++){
      for(let i=1;i<members.length;i++)link(members[0].id,'t'+phase,members[i].id,'t'+phase);
    }
  });
  state.relays.forEach(function(r){
    for (let i=0;i<3;i++) link(r.kmId,'b'+i,'kk'+r.id,'p'+i);   // силовой тракт «пускатель → реле»
    if (r.tripped) link('kk'+r.id,'r1','kk'+r.id,'r0');         // 97-98 (NO) замкнут
    else           link('kk'+r.id,'r2','kk'+r.id,'r3');         // 95-96 (NC) замкнут
  });
  state.pushbuttons.forEach(function(pb){
    const buttons=pb.buttons||{};
    if (buttons.up)    link(pb.id,'upL',pb.id,'upR');       // зелёная: НО
    if (!buttons.stop) link(pb.id,'stopL',pb.id,'stopR');   // красная: НЗ
    if (buttons.down)  link(pb.id,'downL',pb.id,'downR');   // зелёная: НО
  });
  // Постоянные перемычки соединяют концы обмоток каждого асинхронного двигателя.
  // У машины постоянного тока якорь и обмотка возбуждения замкнуты только внутри
  // самой машины, поэтому перемычек в схеме нет.
  state.motors.forEach(function(motor){
    if(motorIsDc(motor))return;
    link(motor.id,'W2',motor.id,'U2');
    link(motor.id,'U2',motor.id,'V2');
  });
  return L;
}
function vfdSetFrequency(d){
  return Math.max(0,Math.min(Math.max(1,Number(d&&d.maxFrequency)||100),Number(d&&d.setFrequency===undefined?50:d.setFrequency)||0));
}
function changeVfdFrequency(d,delta){
  if(!d)return false;
  const before=vfdSetFrequency(d),maximum=Math.max(1,Number(d.maxFrequency)||100);
  d.setFrequency=Math.max(0,Math.min(maximum,before+Number(delta||0)));
  return Math.abs(d.setFrequency-before)>.0001;
}
function vfdInputState(d,pot){
  pot=pot||{};
  const phases=['R','S','T'].map(function(key){return pot[nodeKey({devId:d.id,key:key})];});
  if(phases.some(function(v){return !v;}))return {ready:false,lineVoltageRms:0,frequencyHz:0,reason:'missing-phase'};
  const frequencies=phases.map(function(v){return Number(v.frequencyHz)||networkFrequencyHz();});
  if(Math.max.apply(null,frequencies)-Math.min.apply(null,frequencies)>.05)return {ready:false,lineVoltageRms:0,frequencyHz:0,reason:'frequency-mismatch'};
  const lines=[];
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)lines.push(Math.hypot(phases[i].r-phases[j].r,phases[i].i-phases[j].i));
  const average=lines.reduce(function(sum,v){return sum+v;},0)/lines.length;
  const nominal=ratedVoltageOf(d,380),balanced=lines.every(function(v){return v>=nominal*.8&&v<=nominal*1.18;});
  return {ready:balanced,lineVoltageRms:average,frequencyHz:frequencies[0],reason:balanced?'':'voltage'};
}
function vfdOutputPhasors(d,input){
  const frequency=vfdSetFrequency(d),base=Math.max(1,Number(d.baseFrequency)||50);
  const lineRms=ratedVoltageOf(d,380)*Math.min(1,frequency/base);
  const phaseRms=lineRms/Math.sqrt(3);
  const angles=d.reverse?[0,240,120]:[0,120,240];
  const result={};
  ['U','V','W'].forEach(function(key,index){
    const value=vecPhase(angles[index],phaseRms);
    value.frequencyHz=frequency;value.source='vfd:'+d.id;value.phase=key;
    result[key]=value;
  });
  result.frequencyHz=frequency;result.lineVoltageRms=lineRms;result.input=input;
  return result;
}
function tpMaxArmatureVoltage(d){
  return Math.max(1,Number(d&&d.maxArmatureVoltage)||ratedVoltageOf(d,220));
}
function tpSetArmatureVoltage(d){
  return Math.max(0,Math.min(tpMaxArmatureVoltage(d),Number(d&&d.setArmatureVoltage)||0));
}
function tpFieldVoltage(d){
  return Math.max(1,Number(d&&d.fieldVoltage)||220);
}
function changeTpArmatureVoltage(d,delta){
  if(!d)return false;
  const before=tpSetArmatureVoltage(d),maximum=tpMaxArmatureVoltage(d);
  d.setArmatureVoltage=Math.max(0,Math.min(maximum,before+Number(delta||0)));
  return Math.abs(d.setArmatureVoltage-before)>.0001;
}
/* Явная установка уставки: tpSetArmatureVoltage — это чтение уставки. */
function setTpArmatureVoltage(d,volts){
  if(!d)return false;
  const before=tpSetArmatureVoltage(d);
  d.setArmatureVoltage=Math.max(0,Math.min(tpMaxArmatureVoltage(d),Number(volts)||0));
  return Math.abs(d.setArmatureVoltage-before)>.0001;
}
/* Силовой вход преобразователя проверяется так же, как вход ПЧ. */
function tpInputState(d,pot){
  pot=pot||{};
  const phases=['R','S','T'].map(function(key){return pot[nodeKey({devId:d.id,key:key})];});
  if(phases.some(function(v){return !v;}))return {ready:false,lineVoltageRms:0,frequencyHz:0,reason:'missing-phase'};
  const frequencies=phases.map(function(v){return Number(v.frequencyHz)||networkFrequencyHz();});
  if(Math.max.apply(null,frequencies)-Math.min.apply(null,frequencies)>.05)return {ready:false,lineVoltageRms:0,frequencyHz:0,reason:'frequency-mismatch'};
  const lines=[];
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)lines.push(Math.hypot(phases[i].r-phases[j].r,phases[i].i-phases[j].i));
  const average=lines.reduce(function(sum,v){return sum+v;},0)/lines.length;
  const nominal=ratedVoltageOf(d,380),balanced=lines.every(function(v){return v>=nominal*.8&&v<=nominal*1.18;});
  return {ready:balanced,lineVoltageRms:average,frequencyHz:frequencies[0],reason:balanced?'':'voltage'};
}
/* Пассивные ветви: одно и то же сопротивление используется для напряжений,
   токов и мощности. Пониженное напряжение не разрывает резистивную цепь. */
function resistiveLoads(){
  const loads=[];
  function add(d,a,b,power,available){
    if(available)loads.push({a:{devId:d.id,key:a},b:{devId:d.id,key:b},resistance:nominalResistance(d,power)});
  }
  state.devices.forEach(function(d){
    if(d.type==='lamp')add(d,'t0','b0',1,!d.burned);
    if(d.type==='bulb')add(d,'L','N',100,!d.burned);
    if(TYPES[d.type].kind==='appliance')add(d,'L','N',TYPES[d.type].defaultPower,d.applianceOn&&!d.applianceBurned);
    if(d.type==='km1')add(d,'A1','A2',8,!d.coilBurned);
    if(d.type==='timer')add(d,'A1','A2',4,!d.timerBurned);
  });
  return loads;
}
/* Упрощённая стационарная модель обмоток АД: I0 = 0,3 In, I(100 %) = In.
   Комплексная проводимость учитывает оба конца обмотки, звёздную точку,
   несимметрию и потерю фазы. Паспортная точка согласована с P, In и КПД. */
function acMotorWindingBranches(pot,onlyMotor){
  const result=[];
  (onlyMotor?[onlyMotor]:state.motors).forEach(function(m){
    if(motorIsDc(m))return;
    const values=['U1','V1','W1','W2','U2','V2'].map(function(k){return pot[nodeKey({devId:m.id,key:k})];}).filter(Boolean);
    const ac=values.find(function(v){return !v.dc&&v.frequencyHz>0;});
    const dc=!ac&&values.some(function(v){return v.dc;});
    const frequency=ac?ac.frequencyHz:networkFrequencyHz(),base=Math.max(1,Number(m.ratedFrequency)||50);
    const voltage=ratedVoltageOf(m,380)/Math.sqrt(3)*Math.min(1,frequency/base);
    const nominal=Math.max(.1,Number(m.ratedCurrent)||9),load=Math.max(0,Math.min(1,(Number(m.load)||0)/100));
    const current=nominal*Math.sqrt(.09+.91*load*load);
    const efficiency=Math.max(.1,Math.min(1,Number(m.efficiency)||.9));
    const ratedPf=Math.max(.2,Math.min(.95,(Math.max(.01,Number(m.ratedPower)||4)*1000)/(Math.sqrt(3)*ratedVoltageOf(m,380)*nominal*efficiency)));
    const pf=.15+(ratedPf-.15)*load,admittance=current/Math.max(.01,voltage);
    const g=dc?{r:1/3.2,i:0}:{r:admittance*pf,i:-admittance*Math.sqrt(1-pf*pf)};
    AC_WINDING_PAIRS.forEach(function(pair){result.push({a:{devId:m.id,key:pair[0]},b:{devId:m.id,key:pair[1]},g:g,motorId:m.id});});
  });
  return result;
}
function electricalLoads(pot){return resistiveLoads().concat(acMotorWindingBranches(pot));}
function branchKey(ref){return typeof ref==='string'?ref:nodeKey(ref);}
function branchAdmittance(e){return e.g||{r:1/e.resistance,i:0};}
function branchCurrent(e,pot){
  const a=pot[branchKey(e.a)],b=pot[branchKey(e.b)];
  if(!a||!b)return {r:0,i:0};
  const r=a.r-b.r,i=a.i-b.i,g=branchAdmittance(e);
  return {r:g.r*r-g.i*i,i:g.r*i+g.i*r};
}
function internalLinkCurrent(currents,a,b){
  const values=currents.internalPhasors||{},ka=nodeKey(a),kb=nodeKey(b);
  if(values[ka+'|'+kb])return values[ka+'|'+kb];
  const reverse=values[kb+'|'+ka];return reverse?{r:-reverse.r,i:-reverse.i}:{r:0,i:0};
}
/* Общий узловой решатель для комплексных проводимостей. Фиксированные
   потенциалы — граничные условия; плавающие компоненты не получают питания. */
function solveAdmittanceNetwork(branches,fixed){
  const adj={},pot=Object.assign({},fixed),seen=new Set();
  Object.keys(fixed).forEach(function(k){adj[k]=[];});
  branches.forEach(function(e){
    const a=branchKey(e.a),b=branchKey(e.b),g=branchAdmittance(e);
    (adj[a]||(adj[a]=[])).push({to:b,g:g});(adj[b]||(adj[b]=[])).push({to:a,g:g});
  });
  Object.keys(adj).forEach(function(start){
    if(seen.has(start))return;
    const queue=[start],component=[];seen.add(start);
    while(queue.length){const k=queue.pop();component.push(k);adj[k].forEach(function(e){if(!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}});}
    const sources=component.filter(function(k){return fixed[k];}).map(function(k){return fixed[k];});
    if(!sources.length)return;
    const free=component.filter(function(k){return !fixed[k];}),size=free.length*2,position={};
    if(!size)return;
    free.forEach(function(k,j){position[k]=j*2;});
    const matrix=Array.from({length:size},function(){return new Float64Array(size+1);});
    free.forEach(function(k){
      const j=position[k];
      adj[k].forEach(function(e){
        const r=e.g.r,i=e.g.i,p=position[e.to];
        matrix[j][j]+=r;matrix[j][j+1]-=i;matrix[j+1][j]+=i;matrix[j+1][j+1]+=r;
        if(p!==undefined){matrix[j][p]-=r;matrix[j][p+1]+=i;matrix[j+1][p]-=i;matrix[j+1][p+1]-=r;}
        else if(fixed[e.to]){const v=fixed[e.to];matrix[j][size]+=r*v.r-i*v.i;matrix[j+1][size]+=i*v.r+r*v.i;}
      });
    });
    for(let col=0;col<size;col++){
      let pivot=col;for(let j=col+1;j<size;j++)if(Math.abs(matrix[j][col])>Math.abs(matrix[pivot][col]))pivot=j;
      const temp=matrix[col];matrix[col]=matrix[pivot];matrix[pivot]=temp;
      if(Math.abs(matrix[col][col])<1e-14)return;
      for(let j=col+1;j<size;j++){const ratio=matrix[j][col]/matrix[col][col];if(!ratio)continue;for(let k=col;k<=size;k++)matrix[j][k]-=ratio*matrix[col][k];}
    }
    const values=new Float64Array(size),meta=sources.find(function(v){return v.frequencyHz>0||v.dc;})||sources[0];
    for(let j=size-1;j>=0;j--){let value=matrix[j][size];for(let k=j+1;k<size;k++)value-=matrix[j][k]*values[k];values[j]=value/matrix[j][j];}
    free.forEach(function(k){const j=position[k];pot[k]={r:values[j],i:values[j+1],frequencyHz:meta.frequencyHz||0,dc:!!meta.dc,source:meta.source};});
  });
  return pot;
}
/* Идеальные провода объединяются в узлы. Неизвестные потенциалы решаются
   по сумме токов (Va-Vb)/R = 0, отдельно для двух частей фазора.
   Известные потенциалы источников остаются фиксированными; через нагрузки
   они не распространяются как через перемычку и не создают ложного КЗ. */
function solveLoadPotentials(adj,pot){
  const loads=electricalLoads(pot),groups=[],owner={},keys=new Set(Object.keys(adj));
  loads.forEach(function(e){keys.add(nodeKey(e.a));keys.add(nodeKey(e.b));});
  keys.forEach(function(start){
    if(owner[start]!==undefined)return;
    const id=groups.length,group={keys:[],fixed:null,edges:[]},queue=[start];owner[start]=id;
    while(queue.length){
      const key=queue.pop();group.keys.push(key);
      if(pot[key])group.fixed=pot[key];
      (adj[key]||[]).forEach(function(n){const k=nodeKey(n);if(owner[k]===undefined){owner[k]=id;queue.push(k);}});
    }
    groups.push(group);
  });
  loads.forEach(function(e){
    const a=owner[nodeKey(e.a)],b=owner[nodeKey(e.b)];if(a===b)return;
    const g=branchAdmittance(e);groups[a].edges.push({to:b,g:g});groups[b].edges.push({to:a,g:g});
  });
  const branches=[],fixed={};
  groups.forEach(function(group,j){
    if(group.fixed)fixed[String(j)]=group.fixed;
    group.edges.forEach(function(e){if(j<e.to)branches.push({a:String(j),b:String(e.to),g:e.g});});
  });
  const solved=solveAdmittanceNetwork(branches,fixed);
  groups.forEach(function(group,j){if(solved[String(j)])group.keys.forEach(function(k){pot[k]=solved[String(j)];});});
}
function potentialMap(){
  if(electricalReadContext&&electricalReadContext.potential)return electricalReadContext.potential;
  const adj = {}, pot = {}, conflicts = [], seenConflicts = {},sources={};
  function add(a,b){
    const ka = nodeKey(a), kb = nodeKey(b);
    (adj[ka] = adj[ka] || []).push(b);
    (adj[kb] = adj[kb] || []).push(a);
  }
  internalLinks().forEach(function(p){ add(p[0], p[1]); });
  state.wires.forEach(function(w){ add(w.a, w.b); });

  const queue = [];
  let queueHead=0,conflict = false;
  function recordConflict(k,a,b){
    const voltage=Math.hypot(a.r-b.r,a.i-b.i);
    const fa=Number(a.frequencyHz)||0,fb=Number(b.frequencyHz)||0;
    const frequencyMismatch=!!(fa&&fb&&Math.abs(fa-fb)>.05);
    if(voltage<=1&&!frequencyMismatch)return;
    conflict=true;
    const severity=voltage>1?voltage:Math.max(Math.hypot(a.r,a.i),Math.hypot(b.r,b.i));
    const signature=k+'|'+Math.round(severity/10)*10+'|'+Math.round(fa*10)+'|'+Math.round(fb*10);
    if(seenConflicts[signature])return;
    seenConflicts[signature]=true;
    conflicts.push({node:k,voltage:severity,a:a,b:b,frequencyMismatch:frequencyMismatch,frequencyA:fa,frequencyB:fb});
  }
  function src(devId, key, v){
    const k=nodeKey({devId:devId,key:key});
    sources[k]=v;
    if(k in pot)recordConflict(k,pot[k],v);
    else pot[k]=v;
    queue.push({ devId:devId, key:key, v:v });
  }
  function propagate(){
    while(queueHead<queue.length){
      const cur=queue[queueHead++];
      const list=adj[nodeKey(cur)]||[];
      for(let i=0;i<list.length;i++){
        const n=list[i],k=nodeKey(n);
        if(!(k in pot)){pot[k]=cur.v;queue.push({devId:n.devId,key:n.key,v:cur.v});}
        else recordConflict(k,pot[k],cur.v);
      }
    }
  }
  if (state.power&&state.special.inbox){
    networkPhaseSequence().forEach(function(phase){src('IN',phase,sourcePhasePhasor(phase));});
  }
  if(state.special.inbox){src('IN','N',V_ZERO);src('IN','PE',V_ZERO);}
  propagate();

  // Выход ПЧ является новым трёхфазным источником, гальванически отделённым
  // от входа. Сначала определяем качество сети R/S/T, затем распространяем U/V/W.
  state.devices.filter(function(d){return d.type==='vfd';}).forEach(function(d){
    const input=vfdInputState(d,pot);
    d.vfdInputReady=input.ready;d.vfdInputVoltage=input.lineVoltageRms;d.vfdInputFrequency=input.frequencyHz;
    d.vfdOutputActive=!!(input.ready&&d.running&&!d.fault&&vfdSetFrequency(d)>.05);
    if(!d.vfdOutputActive)return;
    const output=vfdOutputPhasors(d,input);
    src(d.id,'U',output.U);src(d.id,'V',output.V);src(d.id,'W',output.W);
    propagate();
  });

  // Тиристорный преобразователь. Обмотка возбуждения получает питание вместе
  // с сетью, якорь — только при включённом выходе. Минусовые зажимы обоих
  // выходов приведены к общей точке преобразователя, поэтому постоянное
  // напряжение отсчитывается от того же нуля, что N и PE: соединение Я− или Ш−
  // с нулём не является ошибкой монтажа, а заземление плюса — является.
  state.devices.filter(function(d){return d.type==='tp';}).forEach(function(d){
    const input=tpInputState(d,pot);
    d.tpInputReady=input.ready;d.tpInputVoltage=input.lineVoltageRms;d.tpInputFrequency=input.frequencyHz;
    if(!input.ready)return;
    const sourceTag='tp:'+d.id;
    src(d.id,'sh1',dcPhasor(tpFieldVoltage(d),sourceTag));src(d.id,'sh2',V_DC_ZERO);
    propagate();
    if(d.tpOn){
      const armature=tpSetArmatureVoltage(d);
      if(armature>.5){ src(d.id,'ya1',dcPhasor(armature,sourceTag));src(d.id,'ya2',V_DC_ZERO); }
      else { src(d.id,'ya1',V_DC_ZERO);src(d.id,'ya2',V_DC_ZERO); }
    } else { src(d.id,'ya1',V_DC_ZERO);src(d.id,'ya2',V_DC_ZERO); }
    propagate();
  });
  if(!conflict)solveLoadPotentials(adj,pot);
  const result={pot:pot,conflict:conflict,conflicts:conflicts,adj:adj,sources:sources,
    ac:{frequencyHz:networkFrequencyHz(),lineVoltageRms:networkLineVoltageRms(),phaseVoltageRms:networkPhaseVoltageRms(),kind:networkKind()}};
  if(electricalReadContext)electricalReadContext.potential=result;
  return result;
}

/* Находим тепловое реле, через силовой тракт которого фактически запитан М1. */
function motorSupplyRelay(motor){
  motor=motor||state.motors[0];
  if(!motor)return null;
  const map = potentialMap();
  if (map.conflict) return null;
  const motorKeys = ['U1','V1','W1'].map(function(k){ return nodeKey({devId:motor.id,key:k}); });
  for (let ri=0;ri<state.relays.length;ri++){
    const rel = state.relays[ri], km = devById(rel.kmId);
    if (!km || !km.coil) continue;
    const reached = {};
    for (let pi=0;pi<3;pi++){
      const start = nodeKey({devId:'kk'+rel.id,key:'p'+pi}), seen = {}, queue = [start];
      while (queue.length){
        const key = queue.shift();
        if (seen[key]) continue;
        seen[key] = true;
        if (motorKeys.indexOf(key) >= 0) reached[key] = true;
        (map.adj[key] || []).forEach(function(n){
          const nk = nodeKey(n);
          if (!seen[nk]) queue.push(nk);
        });
      }
    }
    if (Object.keys(reached).length === 3) return rel;
  }
  return null;
}

/* ---------- токовая защита автоматических выключателей ----------
   Токи берутся из той же узловой модели, что питает показания токовых клещей.
   Для 3P автомата контролируются все три полюса, а срабатывание определяется
   наиболее нагруженной фазой. Характеристика C имеет две области:
   накопление тепла выше In и быстрое электромагнитное отключение от 5·In. */
function breakerNominalCurrent(dev){
  const fromType=Number(String(dev&&dev.breakerType||'').replace(/^[A-ZА-Я]+/i,''));
  return isFinite(fromType)&&fromType>0?fromType:(dev&&dev.type==='mcb3'?25:10);
}
function breakerPoleCurrents(dev,wireCurrents){
  const count=dev&&TYPES[dev.type]&&TYPES[dev.type].poles||1,result=[];
  const phasors=wireCurrents.phasors;
  for(let pole=0;pole<count;pole++){
    const top='t'+pole,bottom='b'+pole;
    if(wireCurrents.internalPhasors){
      const value=internalLinkCurrent(wireCurrents,{devId:dev.id,key:top},{devId:dev.id,key:bottom});result.push(Math.hypot(value.r,value.i));continue;
    }
    const topSum={r:0,i:0,total:0},bottomSum={r:0,i:0,total:0};
    function add(ref,direction,current,value){
      if(String(ref.devId)!==String(dev.id))return;
      const sum=ref.key===top?topSum:ref.key===bottom?bottomSum:null;
      if(!sum)return;
      sum.total+=current;
      if(value){sum.r+=direction*value.r;sum.i+=direction*value.i;}
    }
    state.wires.forEach(function(w){
      const current=Math.max(0,Number(wireCurrents[w.id])||0),value=phasors&&phasors[w.id];
      add(w.a,1,current,value);add(w.b,-1,current,value);
    });
    // Суммируем направленные токи по Кирхгофу: транзитная перемычка на клемме
    // не проходит через контакты автомата. Ветви нагрузки складываются векторно.
    const topCurrent=phasors?Math.hypot(topSum.r,topSum.i):topSum.total;
    const bottomCurrent=phasors?Math.hypot(bottomSum.r,bottomSum.i):bottomSum.total;
    // Оба направления питания; для заданных вручную модулей без фазоров
    // сохраняется поддержка испытательных токов защиты.
    result.push(Math.max(topCurrent,bottomCurrent));
  }
  return result;
}
function breakerProtectionStep(dt,wireCurrents){
  dt=Math.min(.5,Math.max(0,Number(dt)||0));
  const breakers=state.devices.filter(function(d){return ['mcb1','mcb2','mcb3'].includes(d.type);});
  const active=breakers.some(function(d){return d.on&&!d.tripped;});
  const currents=wireCurrents||(active?clampWireCurrents():{}),candidates=[];
  let changed=false;
  breakers.forEach(function(dev){
    const before=Math.max(0,Number(dev.breakerHeat)||0);
    if(!dev.on||dev.tripped){
      dev.breakerCurrentA=0;dev.breakerPhaseCurrents=[];
      if(!dev.tripped)dev.breakerHeat=Math.max(0,before-dt/12);
      if(Math.abs((dev.breakerHeat||0)-before)>.0001)changed=true;
      return;
    }
    const phaseCurrents=breakerPoleCurrents(dev,currents);
    const current=Math.max.apply(null,phaseCurrents.concat([0]));
    const nominal=breakerNominalCurrent(dev),ratio=current/nominal;
    dev.breakerPhaseCurrents=phaseCurrents;
    dev.breakerCurrentA=current;
    if(ratio>1){
      // Небольшая перегрузка отключается с выдержкой времени; чем выше ток,
      // тем быстрее нагревается расцепитель. При 5·In зона C отключает сразу.
      dev.breakerHeat=ratio>=5?1:Math.min(1,before+dt*(ratio*ratio-1)/8);
    }else dev.breakerHeat=Math.max(0,before-dt/12);
    if(Math.abs(dev.breakerHeat-before)>.0001)changed=true;
    if(dev.breakerHeat>=1)candidates.push({dev:dev,current:current,nominal:nominal,ratio:ratio,phases:phaseCurrents});
  });
  // В последовательной цепи первым отключается автомат с наибольшей кратностью
  // перегрузки. После его отключения ток исчезнет, остальные начнут остывать.
  candidates.sort(function(a,b){return b.ratio-a.ratio||a.nominal-b.nominal;});
  const trip=candidates[0]||null;
  if(trip){
    trip.dev.tripped=true;trip.dev.on=false;trip.dev.breakerHeat=1;
    playBreakerSound(false,true);
  }
  return {changed:changed,tripped:trip,currents:currents};
}

let thermalLastTick = Date.now();
function thermalTick(){
  const now = Date.now(), dt = Math.max(0, (now-thermalLastTick)/1000);
  thermalLastTick = now;
  const breakerResult=breakerProtectionStep(dt);
  if(breakerResult.tripped){
    const trip=breakerResult.tripped,dev=trip.dev;
    const phases=trip.phases.map(function(v,i){return (TYPES[dev.type].poles>1?('P'+(i+1)+' '):'')+v.toFixed(1)+' А';}).join(', ');
    log('АВАРИЯ: '+tagOf(dev.id)+' отключён по перегрузке. Ток '+trip.current.toFixed(1)+' А превысил номинал '+trip.nominal.toFixed(trip.nominal%1?1:0)+' А'+(TYPES[dev.type].poles>1?' ('+phases+')':'')+'.','err');
    warn('Сработал автомат '+tagOf(dev.id)+': перегрузка '+trip.current.toFixed(1)+' А при номинале '+trip.nominal.toFixed(trip.nominal%1?1:0)+' А.');
    showPhaseFault('ПЕРЕГРУЗКА! '+tagOf(dev.id)+' · '+trip.current.toFixed(1)+' А > '+trip.nominal.toFixed(trip.nominal%1?1:0)+' А · АВТОМАТ ОТКЛЮЧЁН');
    renderAll();
    return;
  }
  // Один расчёт токов на оба вида защиты. Без автоматов реле также работает.
  const currents=state.devices.some(function(d){return ['mcb1','mcb2','mcb3'].includes(d.type)&&d.on&&!d.tripped;})
    ?breakerResult.currents:(state.relays.length?clampWireCurrents():{});
  const result=thermalProtectionStep(dt,currents);
  result.trips.forEach(function(trip){
    playRelaySound();
    log(tagOf('kk'+trip.rel.id)+': тепловая перегрузка — '+trip.current.toFixed(2)+' А / '+thermalNumber(trip.rel.set)+' А = '+trip.ratio.toFixed(2)+' уставки. Контакт 95-96 разомкнут.','err');
  });
  if(result.trips.length){
    warn('Сработало тепловое реле '+result.trips.map(function(t){return tagOf('kk'+t.rel.id);}).join(', ')+': контакт 95-96 разомкнут.');
    renderAll();
  }else if(result.changed)updateMotorReadout();
}
setInterval(thermalTick, 250);

function termName(sel){
  if (!sel) return '—';
  const t = terminal(sel.devId, sel.key);
  return tagOf(sel.devId) + ' · ' + (t ? t.label : sel.key);
}
function nominalResistance(dev,defaultPower){
  const voltage=ratedVoltageOf(dev,220),power=Math.max(.01,Number(dev&&dev.ratedPower)||defaultPower);
  return voltage*voltage/power;
}
function resistanceBetween(a, b){
  const branches=[];
  function edge(x,y,r){
    const kx=nodeKey(x), ky=nodeKey(y);
    branches.push({a:kx,b:ky,resistance:r});
  }
  state.wires.forEach(function(w){ edge(w.a,w.b,0.05); });
  internalLinks().forEach(function(p){ edge(p[0],p[1],0.03); });
  // Три обмотки каждого асинхронного двигателя в звезде, а у машины
  // постоянного тока — сопротивление якоря и обмотки возбуждения.
  state.motors.forEach(function(motor){
    if(motorIsDc(motor)){
      const d=dcMotorData(motor);
      edge({devId:motor.id,key:'ya1'},{devId:motor.id,key:'ya2'},d.Ra);
      edge({devId:motor.id,key:'sh1'},{devId:motor.id,key:'sh2'},d.Rf);
      return;
    }
    AC_WINDING_PAIRS.forEach(function(pair){edge({devId:motor.id,key:pair[0]},{devId:motor.id,key:pair[1]},3.2);});
  });
  // Исправная катушка пускателя: ориентировочное сопротивление постоянному току.
  state.devices.filter(function(d){ return d.type === 'km1' && !d.coilBurned; }).forEach(function(d){
    edge({devId:d.id,key:'A1'},{devId:d.id,key:'A2'},480);
  });
  // Электронная часть реле времени — нагрузка, а не перемычка между A1 и A2.
  state.devices.filter(function(d){return d.type==='timer'&&!d.timerBurned;}).forEach(function(d){
    edge({devId:d.id,key:'A1'},{devId:d.id,key:'A2'},12000);
    edge({devId:d.id,key:'S'},{devId:d.id,key:'A2'},50000);
  });
  // Лампа является нагрузкой, а не прямым замыканием между L и N.
  state.devices.filter(function(d){ return d.type === 'lamp' && !d.burned; }).forEach(function(d){
    edge({devId:d.id,key:'t0'},{devId:d.id,key:'b0'},nominalResistance(d,1));
  });
  state.devices.filter(function(d){return d.type==='bulb'&&!d.burned;}).forEach(function(d){
    edge({devId:d.id,key:'L'},{devId:d.id,key:'N'},nominalResistance(d,100));
  });
  state.devices.filter(function(d){return TYPES[d.type].kind==='appliance'&&d.applianceOn&&!d.applianceBurned;}).forEach(function(d){
    edge({devId:d.id,key:'L'},{devId:d.id,key:'N'},nominalResistance(d,TYPES[d.type].defaultPower));
  });
  const start=nodeKey(a),finish=nodeKey(b);if(start===finish)return 0;
  // Пробное напряжение 1 В. Эквивалентное R = 1 / I учитывает все ветви,
  // включая параллельные цепи и мосты, без подключения рабочего источника.
  const fixed={};fixed[start]={r:1,i:0};fixed[finish]={r:0,i:0};
  const pot=solveAdmittanceNetwork(branches,fixed);let current=0;
  branches.forEach(function(e){const value=branchCurrent(e,pot);if(e.a===start)current+=value.r;if(e.b===start)current-=value.r;});
  return current>1e-12?1/current:Infinity;
}
function measureNow(){
  const a=state.mm.a, b=state.mm.b, fn=state.mm.fn||'voltage';
  if (!a || !b) return null;
  if (fn==='voltage'||fn==='dcvoltage'){
    const map=potentialMap();
    const va=(nodeKey(a) in map.pot)?map.pot[nodeKey(a)]:null;
    const vb=(nodeKey(b) in map.pot)?map.pot[nodeKey(b)]:null;
    const ta=terminal(a.devId,a.key), tb=terminal(b.devId,b.key);
    const isDc=function(v){return !!v&&(v.dc||!Number(v.frequencyHz));};
    let u=null,note='';
    if (!va || !vb) note='Одна из клемм без потенциала — цепь разорвана или на вводе нет питания.';
    else if(fn==='dcvoltage'){
      if(!isDc(va)||!isDc(vb)) note='На клеммах переменное напряжение — переключите мультиметр в режим V~.';
      else{
        const raw=va.r-vb.r;
        u=Math.round(raw*10)/10;
        if(Math.abs(u)<1) note='Постоянного напряжения нет: точки соединены одним проводником либо цепь разомкнута.';
        else note='Постоянное напряжение'+(u<0?' обратной полярности (красный щуп на минусе)':'')+'.';
      }
      if(map.conflict) note='КЗ! Разные потенциалы соединены напрямую.';
      return {cap:'Напряжение DC',display:u===null?'— В':((u>0?'+':'')+u+' В'),note:note,ok:u!==null,danger:map.conflict};
    }
    if (!va || !vb) note='Одна из клемм без потенциала — цепь разорвана или на вводе нет питания.';
    else {
      const raw=Math.hypot(va.r-vb.r,va.i-vb.i);
      u=Math.round(raw*10)/10;
      const peIn=(ta&&ta.color===WC.PE)||(tb&&tb.color===WC.PE);
      if(u<3){
        note='Напряжения нет: один и тот же проводник либо цепь разомкнута.';
        const nn=(ta&&ta.color===WC.N&&tb&&tb.color===WC.PE)||(tb&&tb.color===WC.N&&ta&&ta.color===WC.PE);
        if(nn) note='Ноль и PE соединены в одной точке — 0 В, это нормально.';
      } else if(isDc(va)&&isDc(vb)) note='Это постоянное напряжение '+u+' В — измеряйте его в режиме V⎓.';
      else {note='Измеренное напряжение между щупами: '+u+' В.';if(peIn)note+=' Измерение относительно PE.';}
    }
    if(map.conflict) note='КЗ! Разные потенциалы соединены напрямую.';
    return {cap:'Напряжение AC',display:u===null?'— В':u+' В',note:note,ok:u!==null,danger:map.conflict};
  }
  const liveBreakers=state.devices.filter(function(d){
    return (['mcb1','mcb2','mcb3','rcd'].includes(d.type)) && d.on && !d.tripped;
  });
  if (liveBreakers.length) return {cap:'Безопасность',display:'⚠',
    note:'Перед измерением сопротивления или прозвонкой отключите автоматы QF1 и QF2.',
    ok:false,danger:true};
  const r=resistanceBetween(a,b);
  if(fn==='continuity'){
    const closed=isFinite(r)&&r<5;
    return {cap:'Прозвонка',display:closed?'● ЗВУК':'OL',note:closed?'Непрерывная цепь, сопротивление '+r.toFixed(1)+' Ω.':'Цепь разомкнута либо сопротивление выше порога прозвонки.',ok:closed};
  }
  let resistanceDisplay;
  if(!isFinite(r)) resistanceDisplay='>1 MΩ';
  else if(r<=0.5) resistanceDisplay=Math.max(0,r).toFixed(1)+' Ω';
  else if(r>=1000) resistanceDisplay=(r/1000).toFixed(1)+' kΩ';
  else resistanceDisplay=(r<10?r.toFixed(1):Math.round(r))+' Ω';
  return {cap:'Сопротивление',display:resistanceDisplay,
    note:isFinite(r)?(r<=0.5?'Цепь замкнута: сопротивление провода или закрытого контакта.':'Расчётное сопротивление выбранного участка.'):'Цепь разомкнута: сопротивление больше 1 МОм.',
    ok:isFinite(r)};
}
/* ============================================================
   8a. КНОПОЧНЫЙ ЦИФРОВОЙ МУЛЬТИМЕТР
   Показания выводятся «семисегментными» знаками, как на настоящем ЖК.
   ============================================================ */
const MM_FN_LABEL={voltage:'AC',dcvoltage:'DC',resistance:'Ω',continuity:'ПРОЗВОНКА'};

/* Показания обычным шрифтом; размер уменьшается для длинных значений. */
function mmReading(text,color,maxSize){
  const size=Math.min(maxSize||48,160/Math.max(1,String(text).length)/.65);
  return '<text class="mm-reading" x="118" y="128" text-anchor="middle" font-size="'+size.toFixed(1)+'" font-weight="700" fill="'+color+'" font-family="Segoe UI,Arial">'+escapeHtml(text)+'</text>';
}
function mmScreen(powered,res,fn){
  fn=fn||state.mm.fn||'voltage';
  const sx=22,sy=42,sw=192,sh=124;
  let s='<rect x="'+sx+'" y="'+sy+'" width="'+sw+'" height="'+sh+'" rx="7" fill="#26343c" stroke="#7f8b92" stroke-width="1.5"/>';
  s+='<rect x="26" y="46" width="184" height="116" rx="4" fill="'+(powered?(res&&res.danger?'#f4ddd0':'#c3cfb2'):'#b8c3b7')+'"/>';
  if(powered){
    s+='<text x="34" y="63" font-size="8.5" font-weight="700" fill="#344234" font-family="Segoe UI,Arial">'+escapeHtml(MM_FN_LABEL[fn]||'')+'</text>';
    if(res&&res.danger)s+='<text x="202" y="63" text-anchor="end" font-size="8.5" font-weight="700" fill="#9c352a" font-family="Segoe UI,Arial">ВНИМАНИЕ</text>';
    const src=res?String(res.display):'—';
    const numeric=src.match(/^([+-]?[0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
    if(numeric){
      s+=mmReading(numeric[1].replace('+',''),'#1b2026');
      s+='<text x="202" y="155" text-anchor="end" font-size="12" font-weight="700" fill="#293b30" font-family="Segoe UI,Arial">'+escapeHtml(numeric[2])+'</text>';
    }else if(src==='—'){
      s+=mmReading('—','#1b2026');
    }else{
      s+=mmReading(src,'#293b30',22);
    }
  }else{
    s+=mmReading('0.000','#8f9c92');
  }
  return s;
}
/* Два действующих гнезда соответствуют координатам подключения кабелей. */
function mmJack(x,y,color){
  return '<circle cx="'+x+'" cy="'+y+'" r="14.5" fill="'+color+'" stroke="#7f8b92" stroke-width="1.5"/>'
       + '<circle cx="'+x+'" cy="'+y+'" r="10" fill="#343b41" stroke="#c6cdd2" stroke-width="1.5"/>'
       + '<circle cx="'+x+'" cy="'+y+'" r="6" fill="#14181c"/>';
}
/* Общая лицевая панель для рабочего прибора и миниатюры в лотке. */
function mmBodyInner(powered,res,fn,tag){
  const W=METER.w,H=METER.h;
  fn=fn||'voltage';
  let s='<rect x="1" y="1" width="'+(W-2)+'" height="'+(H-2)+'" rx="30" fill="#41484f" stroke="#252c32" stroke-width="2.5"/>';
  s+='<rect x="8" y="7" width="'+(W-16)+'" height="'+(H-14)+'" rx="24" fill="#f5ce34" stroke="#b48e1a" stroke-width="1.5"/>';
  s+='<rect x="12" y="11" width="'+(W-24)+'" height="'+(H-22)+'" rx="20" fill="none" stroke="#fff0a5" opacity=".65"/>';
  s+='<text x="18" y="32" font-size="10" font-weight="700" fill="#4b4632" font-family="Segoe UI,Arial">'+escapeHtml(tag||'PV1')+'</text>';
  s+='<text x="'+(W-18)+'" y="32" text-anchor="end" font-size="11" font-weight="700" fill="#4b4632" font-family="Segoe UI,Arial">МУЛЬТИМЕТР</text>';
  s+=mmScreen(powered,res,fn);
  [['voltage','V~','НАПРЯЖЕНИЕ AC'],['dcvoltage','V⎓','НАПРЯЖЕНИЕ DC'],['resistance','Ω','СОПРОТИВЛЕНИЕ'],['continuity','','ПРОЗВОНКА']].forEach(function(mode,i){
    const x=18+(i%2)*106,y=192+Math.floor(i/2)*54,w=94,h=48,on=fn===mode[0];
    s+='<g class="mm-mode" data-mm-fn="'+mode[0]+'" style="cursor:pointer">';
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="'+(on?'#f0a623':'#41484f')+'" stroke="#343b41" stroke-width="1.4"/>';
    s+='<rect x="'+(x+3)+'" y="'+(y+3)+'" width="'+(w-6)+'" height="'+(h-6)+'" rx="6" fill="none" stroke="'+(on?'#ffe0a1':'#687079')+'" stroke-width=".8"/>';
    if(mode[0]==='continuity'){
      s+='<g class="mm-sound-icon" transform="translate('+(x+w/2)+','+(y+17)+')" fill="none" stroke="'+(on?'#343b41':'#f2f4f5')+'" stroke-width="1.8" stroke-linecap="round"><path d="M -9,-3 L -6,-3 L -2,-7 L -2,7 L -6,3 L -9,3 Z" fill="'+(on?'#343b41':'#f2f4f5')+'"/><path d="M 2,-4 Q 6,0 2,4 M 6,-7 Q 13,0 6,7"/></g>';
    }else{
      s+='<text x="'+(x+w/2)+'" y="'+(y+23)+'" text-anchor="middle" font-size="16" font-weight="700" fill="'+(on?'#343b41':'#f2f4f5')+'" font-family="Segoe UI,Arial">'+mode[1]+'</text>';
    }
    s+='<text x="'+(x+w/2)+'" y="'+(y+39)+'" text-anchor="middle" font-size="'+(mode[0]==='continuity'?8:6.5)+'" fill="'+(on?'#51432b':'#c3cbd1')+'" font-family="Segoe UI,Arial">'+mode[2]+'</text>';
    s+='<title>Режим измерения: '+mode[2].toLowerCase()+'</title></g>';
  });
  [METER_JACKS.black,METER_JACKS.red].forEach(function(j){s+='<rect x="'+(j.dx-10)+'" y="'+j.dy+'" width="20" height="'+(-j.dy+3)+'" rx="5" fill="#51585f" stroke="#252c32" stroke-width="1.2"/>';});
  s+='<text x="'+METER_JACKS.black.dx+'" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#4b4632" font-family="Segoe UI,Arial">COM</text>';
  s+='<text x="'+METER_JACKS.red.dx+'" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#4b4632" font-family="Segoe UI,Arial">VΩ</text>';
  s+=mmJack(METER_JACKS.black.dx,METER_JACKS.black.dy,'#626971');
  s+=mmJack(METER_JACKS.red.dx,METER_JACKS.red.dy,'#d64545');
  return s;
}
function renderMM(){
  return withElectricalRead(function(){
    if(!mmLayer)return;
    if(!state.special.multimeter){mmLayer.innerHTML='';return;}
    // В старых сохранениях могли остаться отдельные режимы катушки и контактов.
    if(state.mm.fn==='coil'||state.mm.fn==='contacts')state.mm.fn='resistance';
    state.mm.power=true;
    const powered=true;
    ['a','b'].forEach(function(key){
      const sel=state.mm[key];
      if((!meterProbeDrag||meterProbeDrag.key!==key)&&(!sel||!terminal(sel.devId,sel.key)))meterDockProbe(key);
    });
    // Координаты острия: на клемме — по клемме, иначе по гнезду или свободному месту.
    function probeTip(key){
      const sel=state.mm[key];
      if(sel){const t=terminal(sel.devId,sel.key);if(t)return {x:t.x,y:t.y};}
      return meterProbeFallback(key);
    }
    const red=probeTip('a'), black=probeTip('b');
    // Кабели выходят из двух верхних гнёзд прибора.
    const redJack=meterJack('red'),blackJack=meterJack('black');
    let res=measureNow();
    if(powered&&res&&/^—\s/.test(String(res.display))){
      // Вместо прочерка индикатор показывает нуль, как настоящий прибор в этом режиме.
      res=Object.assign({},res,{display:String(res.display).replace('—','0,0')});
    }
    function cable(a,b,color){
      // Кабель выходит из гнезда и подходит к рукоятке щупа с вертикальной касательной
      // на обоих концах — без прямых углов.
      const bend=Math.max(14,Math.min(90,Math.abs(a.y-b.y)*0.34+22));
      const d='M '+a.x+','+a.y+' C '+a.x+','+(a.y-bend)+' '+b.x+','+(b.y+bend)+' '+b.x+','+b.y;
      return '<path d="'+d+'" fill="none" stroke="#12161a" stroke-width="8.4" stroke-linecap="round"/>'
           + '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/>';
    }
    function probe(p,color,key,label){
      // Остриё в точке p; рукоятка прямая, игла направлена вверх.
      const tilt=meterProbeTilt(key);
      return '<g class="mm-probe" data-probe="'+key+'" transform="translate('+p.x+','+p.y+') rotate('+tilt+')" style="touch-action:none">'
           + '<path class="mm-probe-needle" d="M 0,0 L -2.6,7 L -2.6,22 L 2.6,22 L 2.6,7 Z" fill="#dce3e8" stroke="#46515c" stroke-width="1.2" stroke-linejoin="round" pointer-events="none"/>'
           + '<line x1="-.8" y1="7" x2="-.8" y2="21" stroke="#ffffff" stroke-width="1.1" pointer-events="none"/>'
           + '<rect x="-6" y="20" width="12" height="7" rx="3" fill="#33393f" stroke="#12161a" stroke-width="1.5" pointer-events="none"/>'
           + '<rect x="-7" y="26" width="14" height="17" rx="7" fill="'+color+'" stroke="#12161a" stroke-width="1.7" pointer-events="none"/>'
           + '<rect x="-3.6" y="29" width="7.2" height="8" rx="3.6" fill="#fff" opacity=".18" pointer-events="none"/>'
           + '<rect x="-4.6" y="37" width="9.2" height="6" rx="2.4" fill="#12161a" opacity=".65" pointer-events="none"/>'
           + '<rect class="mm-probe-grip" x="-15" y="20" width="30" height="24" rx="9" fill="transparent" pointer-events="all" style="cursor:grab">'
           + '<title>'+label+' щуп — возьмите за рукоятку и поднесите остриё к клемме</title></rect></g>';
    }
    let s='<g class="multimeter-body" transform="translate('+METER.x+','+METER.y+')" style="cursor:grab;touch-action:none">';
    s+=mmBodyInner(powered,res,state.mm.fn,state.specialProps.multimeter.tag);
    s+='</g>';
    // Кабели выходят из гнёзд и подходят к рукояткам: видно, что щупы вставлены.
    s+=cable(blackJack,meterProbeGrip('b',black),'#17191c')+cable(redJack,meterProbeGrip('a',red),'#d62f35');
    s+=probe(black,'#17191c','b','Чёрный')+probe(red,'#d62f35','a','Красный');
    mmLayer.innerHTML=s;
  });
}
function mmPick(devId, key){
  if (!state.mm.a || state.mm.b){ state.mm.a = { devId:devId, key:key }; state.mm.b = null; }
  else state.mm.b = { devId:devId, key:key };
  renderAll();
  const res = measureNow();
  if (res){
    log('Мультиметр ['+res.cap+']: ' + termName(state.mm.a) + ' — ' + termName(state.mm.b) + ' = ' + res.display + '. ' +
        res.note.replace(/<[^>]+>/g,''), res.danger?'err':'info');
  }
}

/* Отдельный мультиметр: корпус и оба щупа перемещаются независимо.
   При отпускании щуп защёлкивается на ближайшей клемме. */
let meterDrag = null, meterProbeDrag = null, meterProbeHover = null;
function meterProbePoint(key){
  const sel=state.mm[key];
  if(sel){const t=terminal(sel.devId,sel.key);if(t)return {x:t.x,y:t.y};}
  return meterProbeFallback(key);
}
function nearestTerminalForProbe(p){
  let best=null,dist=Infinity;
  Array.prototype.forEach.call(termLayer.querySelectorAll('.term'),function(el){
    const x=Number(el.getAttribute('cx')),y=Number(el.getAttribute('cy'));
    const d=Math.hypot(x-p.x,y-p.y);
    if(d<dist){dist=d;best={devId:toDevId(el.dataset.dev),key:el.dataset.key,x:x,y:y};}
  });
  return dist<=34?best:null;
}
mmLayer.addEventListener('pointerdown',function(evt){
  if(evt.button!==0)return;
  const mode=evt.target.closest('.mm-mode');
  if(mode){
    evt.preventDefault();evt.stopPropagation();
    state.mm.fn=mode.getAttribute('data-mm-fn')||'voltage';
    const names={voltage:'напряжение AC',dcvoltage:'напряжение DC',resistance:'сопротивление',continuity:'прозвонка'};
    trace('Мультиметр: выбран режим «'+(names[state.mm.fn]||state.mm.fn)+'».');
    renderMM();return;
  }
  const probe=evt.target.closest('.mm-probe');
  if(probe){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    const key=probe.getAttribute('data-probe'),p=meterProbePoint(key),cursor=svgPoint(evt);
    state.mm[key]=null;
    // Щуп снят с клеммы и вынут из гнезда — дальше он двигается свободно.
    if(key==='a'){METER.redX=p.x;METER.redY=p.y;state.mm.aDocked=false;}
    else{METER.blackX=p.x;METER.blackY=p.y;state.mm.bDocked=false;}
    meterProbeHover=null;
    meterProbeDrag={pointerId:evt.pointerId,key:key,offX:p.x-cursor.x,offY:p.y-cursor.y};
    renderTerminals();renderMM();return;
  }
  const body=evt.target.closest('.multimeter-body');
  if(body){
    evt.preventDefault();evt.stopPropagation();cancelWire();
    const p=svgPoint(evt);
    meterDrag={pointerId:evt.pointerId,offX:p.x-METER.x,offY:p.y-METER.y};
  }
});
document.addEventListener('pointermove',function(evt){
  if(meterDrag&&evt.pointerId===meterDrag.pointerId){
    const p=svgPoint(evt),box=snapAlignmentBox(p.x-meterDrag.offX,p.y-meterDrag.offY,METER.w,METER.h,evt),nx=box.x,ny=box.y;
    const dx=nx-METER.x,dy=ny-METER.y;
    // Свободный щуп перемещается вместе с прибором; вставленный в гнездо едет за ним сам.
    if(!state.mm.a){
      if(state.mm.aDocked!==false){const f=meterProbeFallback('a');METER.redX=f.x;METER.redY=f.y;state.mm.aDocked=true;}
      else{METER.redX+=dx;METER.redY+=dy;}
    }
    if(!state.mm.b){
      if(state.mm.bDocked!==false){const f=meterProbeFallback('b');METER.blackX=f.x;METER.blackY=f.y;state.mm.bDocked=true;}
      else{METER.blackX+=dx;METER.blackY+=dy;}
    }
    METER.x=nx;METER.y=ny;renderMM();
  }
  if(meterProbeDrag&&evt.pointerId===meterProbeDrag.pointerId){
    const p=svgPoint(evt);
    const tip={x:p.x+meterProbeDrag.offX,y:p.y+meterProbeDrag.offY};
    if(meterProbeDrag.key==='a'){METER.redX=tip.x;METER.redY=tip.y;}
    else{METER.blackX=tip.x;METER.blackY=tip.y;}
    meterProbeHover=nearestTerminalForProbe(tip);
    renderTerminals();
  }
});
function finishMeterPointer(evt){
  if(meterDrag&&(!evt||evt.pointerId===undefined||evt.pointerId===meterDrag.pointerId))meterDrag=null;
  if(!meterProbeDrag||evt&&evt.pointerId!==undefined&&evt.pointerId!==meterProbeDrag.pointerId)return;
  const key=meterProbeDrag.key,p=meterProbePoint(key),hit=meterProbeHover||nearestTerminalForProbe(p);
  meterProbeDrag=null;
  meterProbeHover=null;
  if(hit){
    state.mm[key]={devId:hit.devId,key:hit.key};
    if(key==='a'){METER.redX=hit.x;METER.redY=hit.y;state.mm.aDocked=false;}
    else{METER.blackX=hit.x;METER.blackY=hit.y;state.mm.bDocked=false;}
  }else meterDockProbe(key);
  renderTerminals();renderMM();
  const res=measureNow();
  if(res)log('Мультиметр ['+res.cap+']: '+termName(state.mm.a)+' — '+termName(state.mm.b)+' = '+res.display+'. '+res.note,res.danger?'err':'info');
}
document.addEventListener('pointerup',finishMeterPointer);
document.addEventListener('pointercancel',finishMeterPointer);

/* ============================================================
   8b. МАСШТАБ И ПЕРЕМЕЩЕНИЕ РАБОЧЕГО ПОЛЯ
   колесо мыши — приблизить/отдалить, зажатое колесо — сдвинуть поле
   ============================================================ */
let view = { x:0, y:0, w:VW, h:VH };
let pan = null;
const Z_MIN = VW/8, Z_MAX = WORKSPACE_W*1.4;

/* Геометрия viewBox одинакова на ПК и мобильных устройствах. Адаптация экрана
   выполняется интерфейсом, а не изменением координат сцены: так колесо мыши
   и предельное отдаление остаются прежними. */
function viewAspect(){
  if(state.roomScene==='household'){
    const rect=scene.getBoundingClientRect();
    if(rect.width>0&&rect.height>0)return rect.height/rect.width;
  }
  // Более широкий верстак сохраняет прежнюю высоту обзора и размер двигателей.
  return VH/VW*2000/workbenchViewWidth();
}
function workbenchViewWidth(){return state.workbench?Math.max(2000,state.workbench.x+state.workbench.width+40):2000;}
function sceneWorkspaceWidth(){return state.roomScene==='household'?HOUSEHOLD_W:Math.max(WORKSPACE_W,state.workbench?state.workbench.x+state.workbench.width:0);}
function sceneWorkspaceHeight(){return state.roomScene==='household'?HOUSEHOLD_H:WORKSPACE_H;}
function maxViewWidth(){
  // На широком экране предельный масштаб щита совпадает с предельным масштабом верстака.
  return state.roomScene==='household'?Math.max(HOUSEHOLD_W,Z_MAX*(VH/VW)/viewAspect()):Z_MAX;
}
function applyView(){
  const household=state.roomScene==='household';
  const dual=!!(state.workbench&&motorById(state.workbench.dcMotorId));
  const stand=STAND_OPTIONS.find(function(option){return option.key===state.standId;});
  // Стенд у левого края; место под панель проводов оставляет CSS.
  const leftAligned=!!state.workbench&&!household;
  scene.classList.toggle('workbench-view',leftAligned);
  scene.setAttribute('preserveAspectRatio',leftAligned?'xMinYMax meet':'xMidYMax meet');
  document.title=stand?stand.title+' · Тренажёр-стенд':household?'Бытовой монтаж — комнаты · Тренажёр-стенд':dual?'Тренажёр-стенд — Асинхронный двигатель и ДПТ':'Тренажёр-стенд — Пуск и реверс трёхфазного АД';
  const description=document.getElementById('sceneDescription');
  if(description)description.textContent=stand?stand.title:household?'Бытовой монтаж: комнаты и бытовые приборы':dual?'Испытания асинхронного двигателя и двигателя постоянного тока':'Пуск и реверс трёхфазного асинхронного двигателя';
  const hint=document.getElementById('sceneHint');
  if(hint)hint.textContent=stand?stand.hint:household?'Размещайте приборы из лотка и подключайте L, N и PE':dual?'ДПТ слева · асинхронный двигатель справа':'Ввод, защита и магнитные пускатели';
  STAND_OPTIONS.forEach(function(option){
    const button=document.getElementById(option.button);if(!button)return;
    const active=option.key===state.standId;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
  scene.setAttribute('viewBox', view.x+' '+view.y+' '+view.w+' '+view.h);
  renderAlignmentGuides();
}
function clampView(){
  view.w = Math.max(Z_MIN, Math.min(maxViewWidth(), view.w));
  view.h = view.w * viewAspect();
  const mx = view.w*0.35, my = view.h*0.35;
  view.x = Math.max(-mx, Math.min(sceneWorkspaceWidth() - view.w + mx, view.x));
  // При отдалении не открываем сотни пикселей пустого поля над вводом XT1.
  const minY=state.roomScene==='household'?Math.min(-200,-view.h*.5):state.workbench?Math.min(-40,-view.h*.35,state.workbench.y+state.workbench.height+280-view.h):-40;
  view.y = Math.max(minY, Math.min(sceneWorkspaceHeight() - view.h + my, view.y));
}
function screenToScene(cx, cy){
  const m = scene.getScreenCTM();
  if (!m) return { x:cx, y:cy };
  return new DOMPoint(cx, cy).matrixTransform(m.inverse());
}
function zoomAt(factor, cx, cy){
  const p = (cx === undefined) ? { x:view.x + view.w/2, y:view.y + view.h/2 } : screenToScene(cx, cy);
  const nw = Math.max(Z_MIN, Math.min(maxViewWidth(), view.w * factor));
  const rf = nw / view.w;
  view.x = p.x - (p.x - view.x) * rf;
  view.y = p.y - (p.y - view.y) * rf;
  view.w = nw;
  view.h = nw * viewAspect();
  clampView();
  applyView();
}
function resetView(){
  if(state.roomScene==='household'){
    const aspect=viewAspect(),w=maxViewWidth(),h=w*aspect;
    view={x:(HOUSEHOLD_W-w)/2,y:(HOUSEHOLD_H-h)/2,w:w,h:h};applyView();return;
  }
  let w=state.workbench?workbenchViewWidth():VW,h=w*viewAspect();
  const panel=state.workbench&&panelById(state.workbench.panelId);
  if(panel){
    // Высокий собранный щит должен помещаться вместе со всем верстаком.
    const fitHeight=state.workbench.y+state.workbench.height+280-(panel.y+200-40);
    if(fitHeight>h){h=fitHeight;w=h/viewAspect();}
  }
  // Ножки верстака стоят у нижнего края; 200 учитывает смещение группы world.
  const y=state.workbench?state.workbench.y+state.workbench.height+280-h:0;
  view={x:0,y:y,w:w,h:h};applyView();
}
if(typeof window.addEventListener==='function')window.addEventListener('resize',function(){
  touchUI();
  if(state.roomScene==='household'){
    const center=view.y+view.h/2;view.h=view.w*viewAspect();view.y=center-view.h/2;
  }
  clampView();applyView();hideWireMenu();hideObjectMenu();
});

scene.addEventListener('wheel', function(evt){
  evt.preventDefault();
  zoomAt(evt.deltaY < 0 ? 0.88 : 1.14, evt.clientX, evt.clientY);
}, { passive:false });
scene.addEventListener('mousedown', function(evt){ if (evt.button === 1) evt.preventDefault(); });
scene.addEventListener('auxclick',  function(evt){ if (evt.button === 1) evt.preventDefault(); });
scene.addEventListener('pointerdown', function(evt){
  if (evt.button !== 1) return;                    // зажали колесо — двигаем поле
  evt.preventDefault();
  pan = { sx: evt.clientX, sy: evt.clientY, vx: view.x, vy: view.y };
  const st = document.querySelector('.stage');
  if (st && st.classList) st.classList.add('panning');
});
document.addEventListener('pointermove', function(evt){
  if (!pan) return;
  const m = scene.getScreenCTM();
  if (!m || !m.a) return;
  view.x = pan.vx - (evt.clientX - pan.sx) / m.a;
  view.y = pan.vy - (evt.clientY - pan.sy) / m.d;
  clampView();
  applyView();
  if (pending){
    updatePendingPointer(evt);
    renderWires();
  }
});
document.addEventListener('pointerup', function(evt){
  if (!pan) return;
  pan = null;
  const st = document.querySelector('.stage');
  if (st && st.classList) st.classList.remove('panning');
});

/* ============================================================
   9. ПАНЕЛЬ: ЛОТОК ДЕТАЛЕЙ
   ============================================================ */
function specialTrayPreview(key){
  if(key==='conduit')return '<svg class="mini" viewBox="0 0 180 100">'+conduitShell('M 20,80 V 45 Q 20,20 45,20 H 160')+'</svg>';
  if(key==='panel'){
    const panel={x:0,y:0,railCount:2,tag:'ЩР'};
    let s=panelInner(panel);
    if(!state.special.inbox)s+='<g transform="translate('+PANEL.inboxX+','+PANEL.inboxY+')">'+inboxInner()+'</g>';
    for(let row=0;row<2;row++)s+=railSvg({x:32,y:PANEL.firstRail+row*PANEL.pitch,slots:SLOTS});
    return '<svg class="mini" viewBox="0 0 '+PANEL.width+' '+panelHeight(panel)+'" preserveAspectRatio="xMidYMid meet">'+s+'</svg>';
  }
  if(key==='clamp')return '<svg class="mini" viewBox="-36 -36 172 72" preserveAspectRatio="xMidYMid meet">'+clampObjectSvg({id:'preview',x:0,y:0,wireId:null,drag:false},{})+'</svg>';
  if(key==='motor'){
    return '<svg class="mini" viewBox="-20 -20 272 292" preserveAspectRatio="xMidYMid meet">'
      +motorInner(0,{load:0,rpm:0,current:0,visualDur:1})+'</svg>';
  }
  if(key==='dcmotor'){
    return '<svg class="mini" viewBox="-20 -20 272 292" preserveAspectRatio="xMidYMid meet">'
      +dcMotorInner(0,null,{angle:0})+'</svg>';
  }
  if(key==='pushbutton'){
    return '<svg class="mini" viewBox="-36 0 206 320" preserveAspectRatio="xMidYMid meet">'
      +pushbuttonInner()+'</svg>';
  }
  if(key==='inbox'){
    return '<svg class="mini" viewBox="0 0 '+inboxWidth()+' '+INBOX.h+'" preserveAspectRatio="xMidYMid meet">'
      +inboxInner()+'</svg>';
  }
  if(key==='multimeter'){
    const W=METER.w,H=METER.h;
    function miniProbe(j,color,key){
      return '<g transform="translate('+j.dx+','+(j.dy-40)+') rotate('+meterProbeTilt(key)+')">'
        +'<path d="M 0,0 L -2.6,7 L -2.6,22 L 2.6,22 L 2.6,7 Z" fill="#dce3e8" stroke="#46515c" stroke-width="1.2"/>'
        +'<rect x="-7" y="26" width="14" height="17" rx="7" fill="'+color+'" stroke="#12161a" stroke-width="1.6"/></g>';
    }
    return '<svg class="mini" viewBox="-18 -60 '+(W+36)+' '+(H+68)+'" preserveAspectRatio="xMidYMid meet">'
      +mmBodyInner(true,{display:'0.0 В'},'voltage','PV')
      +miniProbe(METER_JACKS.black,'#17191c','b')+miniProbe(METER_JACKS.red,'#d62f35','a')+'</svg>';
  }
  return '';
}
const TRAY_CATEGORIES=[
  {id:'mounting',title:'Монтаж и соединения',icon:'▦',types:['klemma','pebus','crossN','crossPE','junction','comb'],specials:['panel','inbox','conduit']},
  {id:'protection',title:'Защита',icon:'◇',types:['mcb1','mcb2','mcb3','rcd','kk1'],specials:[]},
  {id:'control',title:'Управление',icon:'⌘',types:['km1','timer','wallSwitch','twoWaySwitch'],specials:['pushbutton']},
  {id:'drive',title:'Привод',icon:'⚙',types:['vfd','tp'],specials:['motor','dcmotor']},
  {id:'lighting',title:'Освещение и розетки',icon:'☀',types:['bulb','lamp','outlet'],specials:[]},
  {id:'appliances',title:'Бытовые приборы',icon:'⌂',types:['fridge','washer','boiler','stove','split'],specials:[]},
  {id:'measurement',title:'Измерения',icon:'◴',types:['meter','sensor'],specials:['multimeter','clamp']}
];
const TRAY_CATEGORY_KEY='electrosim-tray-categories-v1';
let trayExpanded={mounting:true},traySearchOpen={},trayQuery='',trayRenderKey=null;
const trayPreviewCache=new Map();
function trayPreviewGeometry(type,special){
  if(type){
    const t=TYPES[type],w=type==='comb'?combWidth(combTraySettings):t.modules*MODULE;
    return {x:0,y:-(t.over||0),w:w+(t.overR||0),h:t.h+(t.over||0)};
  }
  const sizes={conduit:[0,0,180,100],panel:[0,0,PANEL.width,panelHeight({railCount:2})],
    inbox:[0,0,inboxWidth(),INBOX.h],clamp:[-36,-36,172,72],motor:[-20,-20,272,292],
    dcmotor:[-20,-20,272,292],pushbutton:[-36,0,206,320],
    multimeter:[-18,-60,METER.w+36,METER.h+68]};
  const size=sizes[special];return {x:size[0],y:size[1],w:size[2],h:size[3]};
}
function trayPreviewPlaceholder(type,special){
  const size=trayPreviewGeometry(type,special);
  return '<span class="mini tray-preview-placeholder" aria-hidden="true" style="width:'+(74*size.w/size.h)+'px"></span>';
}
function trayPreviewSvg(type,special){
  const size=trayPreviewGeometry(type,special);
  return special?specialTrayPreview(special):'<svg class="mini" viewBox="'+[size.x,size.y,size.w,size.h].join(' ')+'" preserveAspectRatio="xMidYMid meet">'+deviceInner(type,type==='comb'?combTraySettings:{})+'</svg>';
}
function trayRasterKey(type,special){
  if(type==='comb')return 'comb:'+combPoles(combTraySettings)+':'+combCount(combTraySettings);
  if(type)return 'type:'+type;
  if(special==='panel'&&state.special.inbox)return 'special:panel:empty';
  if(special==='panel'||special==='inbox')return 'special:'+special+':'+(inboxSinglePhase()?'single':'three')+':'+networkLineVoltageRms()+':'+networkFrequencyHz();
  return 'special:'+special;
}
function trayRasterAsset(type,special){
  const catalog=window.ELECTROSIM_TRAY_PREVIEWS;
  return catalog&&catalog[trayRasterKey(type,special)];
}
function trayPreviewMarkup(type,special){
  const settings=type==='comb'?combTraySettings:
    special==='panel'||special==='inbox'?[state.special.inbox,inboxSinglePhase(),state.specialProps.inbox]:null;
  const key=JSON.stringify([type,special,settings]);
  if(trayPreviewCache.has(key))return trayPreviewCache.get(key);
  const size=trayPreviewGeometry(type,special);
  const raster=trayRasterAsset(type,special);
  let markup;
  if(raster){
    // В лотке используются готовые изображения: iPhone не разбирает и не
    // растеризует сложный SVG при каждом появлении миниатюры на экране.
    markup='<img class="mini tray-raster" width="'+(74*size.w/size.h)+'" height="74" alt="" draggable="false" loading="eager" decoding="async" src="'+raster.src+'">';
  }else{
    // Нестандартные параметры ввода сохраняют точный рисунок без сети.
    let svg=trayPreviewSvg(type,special);markup=svg;
    if(special!=='panel'&&special!=='inbox'){
      svg=svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,Roboto,Arial,sans-serif" font-size="14" ');
      markup='<img class="mini" width="'+(74*size.w/size.h)+'" height="74" alt="" draggable="false" decoding="async" src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)+'">';
    }
  }
  if(trayPreviewCache.size>=64)trayPreviewCache.delete(trayPreviewCache.keys().next().value);
  trayPreviewCache.set(key,markup);return markup;
}
const trayWarmImages=[],trayWarmSources=new Set();let trayWarmQueued=false;
function warmTrayPreviews(){
  if(trayWarmQueued||typeof window.Image!=='function')return;
  trayWarmQueued=true;
  setTimeout(function(){
    trayWarmQueued=false;
    const items=document.getElementById('tray').querySelectorAll('.tray-category[open] .tray-item');
    Array.from(items).slice(0,6).forEach(function(item){
      const asset=trayRasterAsset(item.dataset.type||null,item.dataset.special||null);
      if(!asset||trayWarmSources.has(asset.src))return;
      trayWarmSources.add(asset.src);
      const image=new window.Image();image.decoding='async';image.src=asset.src;
      trayWarmImages.push(image);if(trayWarmImages.length>6)trayWarmImages.shift();
    });
  },0);
}
function trayIsOpen(){
  const box=document.getElementById('tray'),menu=box.closest&&box.closest('.side-menu-item');
  return !!(menu&&menu.open);
}
function hydrateTrayCategory(category){
  if(!category.open||!trayIsOpen())return;
  category.querySelectorAll('.tray-preview-placeholder').forEach(function(placeholder){
    const item=placeholder.closest('.tray-item');
    placeholder.outerHTML=trayPreviewMarkup(item.dataset.type||null,item.dataset.special||null);
  });
}
function hydrateTrayPreviews(){
  document.getElementById('tray').querySelectorAll('.tray-category[open]').forEach(hydrateTrayCategory);
}
try{
  const saved=JSON.parse(localStorage.getItem(TRAY_CATEGORY_KEY)||'null');
  if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
    TRAY_CATEGORIES.forEach(function(c){if(typeof saved[c.id]==='boolean')trayExpanded[c.id]=saved[c.id];});
  }
}catch(e){/* Недоступное хранилище не мешает пользоваться категориями. */}
function trayCategoryFor(type,special){
  return TRAY_CATEGORIES.find(function(c){return special?c.specials.includes(special):c.types.includes(type);})||TRAY_CATEGORIES[0];
}
function traySearchText(text){
  return String(text||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim();
}
function trayMatches(text,query){
  const normalized=traySearchText(text);
  return traySearchText(query).split(/\s+/).filter(Boolean).every(function(word){return normalized.includes(word);});
}
function trayCacheKey(){
  return JSON.stringify([state.standaloneRails,state.special,inboxSinglePhase(),state.specialProps.inbox,trayQuery,trayExpanded,traySearchOpen,combTraySettings]);
}
function saveTrayCategories(){
  try{localStorage.setItem(TRAY_CATEGORY_KEY,JSON.stringify(trayExpanded));}catch(e){}
}
function setAllTrayCategories(open){
  TRAY_CATEGORIES.forEach(function(c){if(trayQuery)traySearchOpen[c.id]=open;else trayExpanded[c.id]=open;});
  if(!trayQuery)saveTrayCategories();
  renderTray();
}
function renderTray(){
  const key=trayCacheKey();
  if(key===trayRenderKey)return;
  const box=document.getElementById('tray'),groups={};
  TRAY_CATEGORIES.forEach(function(c){groups[c.id]=[];});
  function add(type,special,title,description,card){
    const category=trayCategoryFor(type,special);
    if(trayQuery&&!trayMatches(title+' '+description+' '+category.title+' '+(type||special),trayQuery))return;
    groups[category.id].push(card);
  }
  Object.keys(STOCK).forEach(function(type){
    const t=TYPES[type];
    const description=type==='comb'?'Только на верхние клеммы ряда автоматов':(t.freeOnly?'свободное размещение':t.modules+' мод. · '+(t.modules*17.5).toFixed(1)+' мм')+' · '+(KIND_RU[t.kind]||'');
    add(type,null,t.title,description,
      '<div class="tray-item" data-type="'+type+'">'
      +trayPreviewPlaceholder(type,null)
      +'<div class="tray-meta"><b>'+escapeHtml(t.title)+'</b><span>'+escapeHtml(description)+'</span>'
      +'</div>'
      +'<span class="stock" title="Количество не ограничено">∞</span><button type="button" class="tray-add" aria-label="Разместить: '+escapeHtml(t.title)+'">+</button></div>');
  });
  const specialTitles={conduit:'Гофра для проводов',inbox:'Клеммная коробка XT1',pushbutton:'Кнопочный пост',motor:'Асинхронный двигатель',dcmotor:'Двигатель постоянного тока',multimeter:'Цифровой мультиметр',clamp:'Токовые клещи',panel:'Монтажный щит'};
  const unlimitedSpecials={conduit:true,motor:true,dcmotor:true,pushbutton:true,clamp:true,panel:true};
  Object.keys(specialTitles).forEach(function(special){
    if(special==='inbox'&&state.standaloneRails===false)return;
    if(!unlimitedSpecials[special]&&state.special[special])return;
    add(null,special,specialTitles[special],'Перетащите на рабочее поле',
      '<div class="tray-item tray-special" data-special="'+special+'">'
      +trayPreviewPlaceholder(null,special)+'<div class="tray-meta"><b>'+specialTitles[special]+'</b>'
      +'<span>Перетащите на рабочее поле</span></div><span class="stock">'+(unlimitedSpecials[special]?'∞':'×1')+'</span>'
      +'<button type="button" class="tray-add" aria-label="Разместить: '+specialTitles[special]+'">+</button></div>');
  });
  let visible=0;
  box.innerHTML=TRAY_CATEGORIES.map(function(c){
    const cards=groups[c.id];if(!cards.length)return '';
    visible+=cards.length;
    const open=trayQuery?traySearchOpen[c.id]!==false:trayExpanded[c.id]===true;
    return '<details class="tray-category" data-tray-category="'+c.id+'"'+(open?' open':'')+'>'
      +'<summary><span class="tray-category-icon" aria-hidden="true">'+c.icon+'</span><span>'+c.title+'</span>'
      +'<span class="tray-category-count">'+cards.length+'</span></summary>'
      +'<div class="tray-category-items">'+cards.join('')+'</div></details>';
  }).join('');
  if(!visible)box.innerHTML='<div class="tray-empty" role="status">Детали не найдены. Попробуйте другое название.</div>';
  trayRenderKey=key;
  if(trayIsOpen())hydrateTrayPreviews();
  else warmTrayPreviews();
}
function initTrayCategories(){
  const box=document.getElementById('tray');
  const menu=box.closest&&box.closest('.side-menu-item');
  if(menu)menu.addEventListener('toggle',function(evt){if(evt.target===menu&&menu.open)hydrateTrayPreviews();});
  box.addEventListener('toggle',function(evt){
    const category=evt.target;
    if(!category.classList||!category.classList.contains('tray-category')||!box.contains(category))return;
    const id=category.dataset.trayCategory;
    if(!TRAY_CATEGORIES.some(function(c){return c.id===id;}))return;
    if(trayQuery)traySearchOpen[id]=category.open;
    else{trayExpanded[id]=category.open;saveTrayCategories();}
    trayRenderKey=trayCacheKey();
    if(category.open)hydrateTrayCategory(category);
  },true);
  document.getElementById('traySearch').addEventListener('input',function(evt){
    trayQuery=traySearchText(evt.target.value);traySearchOpen={};renderTray();
  });
  document.getElementById('trayCollapseAll').addEventListener('click',function(){setAllTrayCategories(false);});
  document.getElementById('trayExpandAll').addEventListener('click',function(){setAllTrayCategories(true);});
}



/* ============================================================
   ПРОТОКОЛ ИСПЫТАНИЙ
   В протокол попадает только то, что имеет смысл при разборе работы:
   аварии (err), предупреждения (warn), значимые действия (ok) и справка
   по аппаратам (info). Служебная рутина — цвет и форма провода, режим
   мультиметра, работа с пресетами — идёт мимо протокола через trace()
   и остаётся только в консоли разработчика.
   ============================================================ */
const LOG_LIMIT = 60;
const LOG_LEVEL_RU = { err:'АВАРИЯ', warn:'ВНИМАНИЕ', ok:'ДЕЙСТВИЕ', info:'СПРАВКА' };
const LOG_FILTERS = {
  fault:{ title:'Аварии',              levels:['err','warn'] },
  work: { title:'Аварии и действия',   levels:['err','warn','ok'] },
  all:  { title:'Всё',                 levels:['err','warn','ok','info'] }
};
let logItems = [];
let logFilter = 'work';
let logFaultCount = 0;
function trace(msg){
  if (typeof console !== 'undefined' && console.log) console.log('[стенд] ' + msg);
}
function isFaultKind(kind){ return kind === 'err' || kind === 'warn'; }
function logTimeStamp(){
  const d = new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
}
function log(msg, kind){
  const level = LOG_LEVEL_RU[kind] ? kind : 'info';
  logItems.unshift({ ts:logTimeStamp(), msg:String(msg), kind:level });
  if (logItems.length > LOG_LIMIT) logItems.pop();
  if (isFaultKind(level)) logFaultCount++;
  renderLog();
  trace(msg);
}
function renderLog(){
  const box = document.getElementById('log');
  if (!box) return;
  const levels = (LOG_FILTERS[logFilter] || LOG_FILTERS.work).levels;
  const visible = logItems.filter(function(i){ return levels.indexOf(i.kind) >= 0; });
  if (visible.length){
    box.innerHTML = visible.map(function(i){
      return '<div class="'+i.kind+'"><time>'+escapeHtml(i.ts)+'</time>'+escapeHtml(i.msg)+'</div>';
    }).join('');
  } else if (!logItems.length){
    box.innerHTML = '<div class="log-empty">Протокол пуст. Соберите схему, включите питание и запустите двигатель.</div>';
  } else {
    box.innerHTML = '<div class="log-empty">В выбранном фильтре записей нет. Всего в протоколе: '+logItems.length+'.</div>';
  }
  box.scrollTop = 0;
  const count = document.getElementById('logCount');
  if (count) count.textContent = 'Записей: ' + logItems.length;
  const faults = document.getElementById('logFaultCount');
  if (faults){
    faults.textContent = 'Аварий и предупреждений: ' + logFaultCount;
    faults.classList.toggle('clean', logFaultCount === 0);
  }
}
function setLogFilter(name){
  if (!LOG_FILTERS[name]) return;
  logFilter = name;
  const box = document.getElementById('logFilters');
  if (box) Array.prototype.forEach.call(box.querySelectorAll('[data-log-filter]'), function(b){
    const on = b.getAttribute('data-log-filter') === name;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  renderLog();
}
function clearLog(){
  logItems = [];
  logFaultCount = 0;
  renderLog();
}
/* Восстановление протокола из пресета: неизвестные уровни отбрасываем,
   иначе импортированный файл мог бы подсунуть произвольный CSS-класс. */
function restoreLog(journal){
  const items = (journal && Array.isArray(journal.items)) ? journal.items : [];
  logItems = items.filter(function(i){ return i && LOG_LEVEL_RU[i.kind]; })
                  .slice(0, LOG_LIMIT)
                  .map(function(i){ return { ts:String(i.ts || ''), msg:String(i.msg || ''), kind:i.kind }; });
  logFaultCount = Math.max(0, Number(journal && journal.faultCount) || 0);
  setLogFilter((journal && LOG_FILTERS[journal.filter]) ? journal.filter : 'work');
}
function protocolText(){
  const input = document.getElementById('presetName');
  const name = (input && input.value ? input.value : '').trim() || 'без названия';
  const now = new Date();
  const stamp = now.toLocaleDateString('ru-RU') + ', ' + logTimeStamp();
  const head = [
    'ПРОТОКОЛ ИСПЫТАНИЙ',
    'Тренажёр-стенд «Пуск и реверс трёхфазного асинхронного двигателя»',
    'Дата: ' + stamp,
    'Схема: ' + name,
    'Записей: ' + logItems.length + ' · аварий и предупреждений: ' + logFaultCount,
    new Array(64).join('-')
  ];
  const rows = logItems.slice().reverse().map(function(i){
    return i.ts + '  ' + (LOG_LEVEL_RU[i.kind] || 'ЗАПИСЬ').padEnd(9, ' ') + '  ' + i.msg;
  });
  return head.concat(rows.length ? rows : ['Записей нет.']).join('\r\n') + '\r\n';
}
function downloadTextFile(text, filename){
  try{
    const blob = new Blob([text], { type:'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    return true;
  }catch(e){ return false; }
}
function exportProtocol(){
  if (!logItems.length){ warn('Протокол пуст — нечего выгружать.'); return; }
  const text = protocolText();
  const stamp = new Date().toISOString().slice(0,10);
  if (!downloadTextFile(text, safePresetFilename('Протокол-стенда-' + stamp) + '.txt')){
    warn('Не удалось подготовить файл протокола.');
    return;
  }
  log('Протокол испытаний выгружен в файл (записей: ' + logItems.length + ').', 'ok');
}
let toastTimer = null;
function warn(msg,variant){
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = '⚠ ' + msg;
  el.className = variant==='warning'?'show warning':'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.className=''; }, 3400);
}
function showPhaseFault(msg){
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'show fault';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.className=''; }, 7000);
}

function renderSide(){
  return withElectricalRead(function(){
    renderMotor();
    renderTray();
    renderMM();
  });
}
function renderAll(){
  syncPanelInbox();
  updateCoils();                 // сначала считаем, что замкнуто в цепи (катушка A1–A2)
  return withElectricalRead(function(){
    renderPanels();renderRail();
    renderInbox();
    renderDevices();
    renderRelays();
    renderTerminalGuides();
    renderConduits();
    renderAlignmentGuides();
    renderWires();
    renderTerminals();
    renderSide();
    renderClamp();
  });
}

/* ============================================================
   ЛОКАЛЬНЫЕ ПРЕСЕТЫ СХЕМ
   ============================================================ */
const PRESET_STORAGE_KEY = 'ad-trainer-schemes-v1';
let presetFolderHandle=null,presetFolderRefresh=null,presetFolderNeedsPermission=false,presetFolderPersistenceFailed=false;
let folderPresets=presetFilesToPresets(window.ELECTROSIM_PRESET_CATALOG||[]);
function presetStatus(text, error){
  const el=document.getElementById('presetStatus');
  if(!el) return;
  el.textContent=text;
  el.style.color=error?'#ff9a9a':'#93a2b4';
}
function readBrowserPresets(){
  try{
    const raw=localStorage.getItem(PRESET_STORAGE_KEY);
    const list=raw?JSON.parse(raw):[];
    return Array.isArray(list)?list:[];
  }catch(e){ presetStatus('Локальное хранилище браузера недоступно.',true); return []; }
}
function readPresets(){return readBrowserPresets().concat(folderPresets);}
function writePresets(list){
  try{ localStorage.setItem(PRESET_STORAGE_KEY,JSON.stringify(list.filter(function(p){return !p._folderFile;}))); return true; }
  catch(e){ presetStatus('Не удалось сохранить: локальное хранилище недоступно или заполнено.',true); return false; }
}
function presetsFromData(data){
  let incoming=[];
  if(data&&data.format==='ad-trainer-schemes'&&Array.isArray(data.presets))incoming=data.presets;
  else if(data&&data.format==='ad-trainer-scheme'&&data.preset)incoming=[data.preset];
  else if(data&&data.state)incoming=[data];
  return incoming.filter(function(p){return p&&p.state&&Array.isArray(p.state.devices)&&Array.isArray(p.state.wires)
    &&['relays','motors','pushbuttons','panels','clamps'].every(function(key){return p.state[key]===undefined||(Array.isArray(p.state[key])&&p.state[key].every(function(o){return o&&typeof o==='object'&&!Array.isArray(o);}));})
    &&p.state.devices.every(function(d){return d&&typeof d.type==='string'&&Object.prototype.hasOwnProperty.call(TYPES,d.type);})
    &&p.state.wires.every(function(w){return w&&w.a&&w.b&&w.a.devId!==undefined&&w.b.devId!==undefined&&typeof w.a.key==='string'&&typeof w.b.key==='string';});});
}
function presetFilesToPresets(files){
  const list=[];
  if(!Array.isArray(files))return list;
  files.forEach(function(entry){
    if(!entry||typeof entry.file!=='string')return;
    presetsFromData(entry.data).forEach(function(source,index){
      const p=JSON.parse(JSON.stringify(source));
      p.id='folder:'+encodeURIComponent(entry.file)+':'+encodeURIComponent(String(p.id||index))+':'+index;
      p.name=String(p.name||entry.file.replace(/\.ad-scheme\.json$|\.json$/i,''));
      p.updated=Number(p.updated)||Number(entry.modified)||0;
      p._folderFile=entry.file;
      p.state.wires.forEach(function(w){delete w.previewShape;});
      list.push(p);
    });
  });
  return list;
}
function presetFolderStatus(message,error){
  const el=document.getElementById('presetFolderStatus');
  if(el){el.textContent=message;el.style.color=error?'#ff9a9a':'#93a2b4';}
  const button=document.getElementById('presetFolderConnect');
  if(button)button.textContent=presetFolderNeedsPermission?'Разрешить доступ к папке presets':presetFolderHandle?'Сменить папку presets':'Подключить папку presets';
}
function presetFolderDb(){
  return new Promise(function(resolve,reject){
    if(typeof indexedDB==='undefined'){reject(new Error('indexedDB'));return;}
    const request=indexedDB.open('electrosim-preset-folder',1);
    request.onupgradeneeded=function(){request.result.createObjectStore('handles');};
    request.onsuccess=function(){resolve(request.result);};
    request.onerror=function(){reject(request.error);};
    request.onblocked=function(){reject(new Error('blocked'));};
  });
}
async function readPresetFolderHandle(){
  const db=await presetFolderDb();
  return new Promise(function(resolve,reject){
    const request=db.transaction('handles','readonly').objectStore('handles').get('presets');
    request.onsuccess=function(){db.close();resolve(request.result||null);};
    request.onerror=function(){db.close();reject(request.error);};
  });
}
async function storePresetFolderHandle(handle){
  const db=await presetFolderDb();
  return new Promise(function(resolve,reject){
    const transaction=db.transaction('handles','readwrite');
    transaction.objectStore('handles').put(handle,'presets');
    transaction.oncomplete=function(){db.close();resolve();};
    transaction.onerror=transaction.onabort=function(){db.close();reject(transaction.error);};
  });
}
async function scanPresetDirectory(handle){
  const entries=[],ignored=[];
  for await(const entry of handle.values()){
    if(entry.kind!=='file'||!/\.json$/i.test(entry.name))continue;
    try{
      const file=await entry.getFile(),data=JSON.parse((await file.text()).replace(/^\uFEFF/,''));
      if(!presetsFromData(data).length)throw new Error('format');
      entries.push({file:entry.name,modified:file.lastModified,data:data});
    }catch(error){
      if(error.name==='NotAllowedError')throw error;
      ignored.push(entry.name);
    }
  }
  entries.sort(function(a,b){return a.file.localeCompare(b.file,'ru');});
  return {presets:presetFilesToPresets(entries),ignored:ignored};
}
async function refreshPresetFolder(){
  if(!presetFolderHandle)return;
  if(presetFolderRefresh)return presetFolderRefresh;
  const handle=presetFolderHandle;
  presetFolderRefresh=(async function(){
    try{
      if(await handle.queryPermission({mode:'read'})!=='granted'){
        presetFolderNeedsPermission=true;
        presetFolderStatus('Для автоматического чтения папки разрешите доступ к ней.',false);return;
      }
      const scanned=await scanPresetDirectory(handle);
      if(handle!==presetFolderHandle)return;
      presetFolderNeedsPermission=false;
      if(JSON.stringify(scanned.presets)!==JSON.stringify(folderPresets)){
        folderPresets=scanned.presets;renderPresetList();
      }
      presetFolderStatus('Папка '+handle.name+': схем '+folderPresets.length+'. Список обновляется автоматически.'+(scanned.ignored.length?' Пропущено файлов: '+scanned.ignored.length+'.':'')+(presetFolderPersistenceFailed?' При следующем открытии подключите папку снова.':''),!!scanned.ignored.length);
    }catch(error){
      presetFolderNeedsPermission=error.name==='NotAllowedError';
      presetFolderStatus(presetFolderNeedsPermission?'Доступ к папке отозван. Разрешите его снова.':'Не удалось прочитать папку. Проверьте, что она доступна, или выберите её снова.',true);
    }
  })();
  try{await presetFolderRefresh;}finally{presetFolderRefresh=null;}
}
async function connectPresetFolder(){
  if(typeof window.showDirectoryPicker!=='function'){
    presetFolderStatus('Этот браузер не поддерживает автоматическое чтение папок. Подключите папку в Chrome или Edge; импорт отдельных файлов доступен здесь.',true);return;
  }
  try{
    if(presetFolderHandle&&presetFolderNeedsPermission){
      if(await presetFolderHandle.requestPermission({mode:'read'})!=='granted'){
        presetFolderStatus('Доступ не предоставлен. Схемы из браузера и каталога остаются доступны.',true);return;
      }
    }else{
      const selected=await window.showDirectoryPicker({id:'electrosim-presets',mode:'read'});
      let handle=selected;
      if(selected.name.toLowerCase()!=='presets'){
        // Можно выбрать и всю папку проекта: находим в ней presets.
        for await(const child of selected.values())if(child.kind==='directory'&&child.name.toLowerCase()==='presets'){handle=child;break;}
      }
      presetFolderHandle=handle;
      try{await storePresetFolderHandle(handle);presetFolderPersistenceFailed=false;}catch(error){presetFolderPersistenceFailed=true;}
    }
    if(presetFolderRefresh)await presetFolderRefresh;
    await refreshPresetFolder();
  }catch(error){if(error.name!=='AbortError')presetFolderStatus('Не удалось подключить папку. Попробуйте выбрать presets ещё раз.',true);}
}
async function initPresetFolder(){
  presetFolderStatus('Из папки presets подключено схем: '+folderPresets.length+'. Для чтения новых файлов подключите папку.');
  if(typeof window.showDirectoryPicker!=='function')return;
  const originalHandle=presetFolderHandle;
  try{
    const saved=await readPresetFolderHandle();
    if(saved&&presetFolderHandle===originalHandle){presetFolderHandle=saved;await refreshPresetFolder();}
  }catch(error){/* Отсутствие разрешения или IndexedDB не мешает обычным схемам. */}
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function schemeSnapshot(name,id){
  syncPanelInbox();
  const wires=state.wires.map(function(w){
    const copy=JSON.parse(JSON.stringify(w));
    copy.sectionMm2=wireSectionOf(w);
    delete copy.previewShape;delete copy.previewConduitId;delete copy.previewConduitEntry;delete copy.previewConduitEntryEnd;
    return copy;
  });
  const devices=JSON.parse(JSON.stringify(state.devices));
  devices.forEach(function(d){
    if(d.type==='comb'){const p=combOrigin(d);d.x=p.x;d.y=p.y;}
    if(d.type==='timer'){
      delete d.timerActive;delete d.timerSupply;delete d.timerSince;delete d.timerLastSignal;
    }
    if(d.type==='vfd'){
      delete d.vfdPressed;delete d.vfdPressToken;delete d.vfdInputReady;
      delete d.vfdInputVoltage;delete d.vfdInputFrequency;delete d.vfdOutputActive;
    }
    if(d.type==='tp'){
      delete d.tpPressed;delete d.tpPressToken;delete d.tpInputReady;
      delete d.tpInputVoltage;delete d.tpInputFrequency;
    }
  });
  return {
    version:3,id:id||('scheme-'+Date.now().toString(36)),name:name,updated:Date.now(),
    state:{power:state.power,devices:devices,
      relays:JSON.parse(JSON.stringify(state.relays)),wires:wires,conduits:JSON.parse(JSON.stringify(state.conduits||[])),nextId:state.nextId,
      alignmentGuides:JSON.parse(JSON.stringify(state.alignmentGuides||[])),alignmentSnapEnabled:state.alignmentSnapEnabled!==false,
      motors:JSON.parse(JSON.stringify(state.motors)),
      pushbuttons:JSON.parse(JSON.stringify(state.pushbuttons)),
      panels:JSON.parse(JSON.stringify(state.panels)),
      standaloneRails:state.standaloneRails!==false,
      workbench:state.workbench?JSON.parse(JSON.stringify(state.workbench)):null,
      roomScene:state.roomScene,standId:state.standId||null,
      clamps:state.clamps.map(function(c){return {id:c.id,tag:c.tag,customName:c.customName,x:c.x,y:c.y,wireId:c.wireId,fraction:c.fraction};}),
      specialProps:JSON.parse(JSON.stringify(state.specialProps||{})),
      special:JSON.parse(JSON.stringify(state.special))},
    positions:{inbox:{x:INBOX.x,y:INBOX.y},pushbutton:{x:PB.x,y:PB.y},
      motor:{x:MOTOR.x,y:MOTOR.y,load:MOTOR.load},
      multimeter:{x:METER.x,y:METER.y,redX:METER.redX,redY:METER.redY,
        blackX:METER.blackX,blackY:METER.blackY,fn:state.mm.fn,power:state.mm.power!==false,
        aDocked:state.mm.aDocked!==false,bDocked:state.mm.bDocked!==false,
        a:state.mm.a?JSON.parse(JSON.stringify(state.mm.a)):null,
        b:state.mm.b?JSON.parse(JSON.stringify(state.mm.b)):null}},
    // Протокол испытаний переносится вместе со схемой: его можно приложить к отчёту.
    journal:{items:JSON.parse(JSON.stringify(logItems)),faultCount:logFaultCount,filter:logFilter},
    view:{x:view.x,y:view.y,w:view.w,h:view.h}
  };
}
function renderPresetList(selectedId){
  const box=document.getElementById('presetList');
  if(!box) return;
  const keepSelected=selectedId||box.value;
  const local=readBrowserPresets().sort(function(a,b){return (b.updated||0)-(a.updated||0);});
  const library=folderPresets.slice().sort(function(a,b){return a.name.localeCompare(b.name,'ru');});
  const list=library.concat(local,openedFilePresets);
  if(!list.length){ box.innerHTML='<option disabled>Готовых схем пока нет</option>';box.value='';updatePresetDeleteButton();return; }
  function option(p){
    const dt=p.updated?new Date(p.updated).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
    return '<option value="'+escapeHtml(p.id)+'"'+(p._folderFile?' title="'+escapeHtml(p._folderFile)+'"':'')+'>'+escapeHtml(p.name)+(dt?' · '+dt:'')+'</option>';
  }
  box.innerHTML=(library.length?'<optgroup label="Готовые схемы">'+library.map(option).join('')+'</optgroup>':'')
    +(local.length?'<optgroup label="Ранее сохранены в браузере">'+local.map(option).join('')+'</optgroup>':'')
    +(openedFilePresets.length?'<optgroup label="Из открытого файла">'+openedFilePresets.map(option).join('')+'</optgroup>':'');
  box.value=list.some(function(p){return p.id===keepSelected;})?keepSelected:list[0].id;
  updatePresetDeleteButton();
}
function updatePresetDeleteButton(){
  const button=document.getElementById('presetLoad');
  if(button)button.disabled=!selectedPreset();
}
function selectedPreset(){
  const box=document.getElementById('presetList');
  if(!box||!box.value) return null;
  return readPresets().concat(openedFilePresets).find(function(p){return p.id===box.value;})||null;
}
function saveCurrentPreset(){
  const input=document.getElementById('presetName');
  let name=(input&&input.value?input.value:'').trim();
  const list=readBrowserPresets();
  if(!name) name='Схема '+(list.length+1);
  const old=list.find(function(p){return String(p.name).toLowerCase()===name.toLowerCase();})||null;
  const snap=schemeSnapshot(name,old&&old.id);
  const next=old?list.map(function(p){return p.id===old.id?snap:p;}):list.concat([snap]);
  if(!writePresets(next)) return;
  if(input) input.value=name;
  renderPresetList(snap.id);
  presetStatus((old?'Обновлена':'Сохранена')+' схема «'+name+'».');
  trace((old?'Пресет обновлён: ':'Пресет сохранён: ')+name+'.');
}
function loadSelectedPreset(){
  const p=selectedPreset();
  if(!p||!p.state){presetStatus('Выберите сохранённую схему.',true);return;}
  openWorkspaceScheme(p);
}
/* Загрузка сохранённой схемы. Вынесена отдельно, чтобы тот же путь можно было
   проверить в тестах без обращения к хранилищу браузера. */
function applyPreset(p){
  if(!p||!p.state)return false;
  resetActionHistory();
  cancelWire(); hideWireMenu();cancelConduit();cancelAlignmentGuide();
  state.power=p.state.power!==false;
  state.devices=JSON.parse(JSON.stringify(p.state.devices||[]));
  state.devices.forEach(function(d){
    if(d.type==='comb'){d.combPoles=combPoles(d);d.combCount=combCount(d);}
    if(d.type==='km1'){d.manualPressed=false;d.coil=false;}
    if(d.type==='timer'){
      d.timerActive=false;d.timerSupply=false;d.timerSince=null;d.timerLastSignal=false;
      if(!TIMER_RANGES.includes(d.timerRange))d.timerRange=10;
      if(!TIMER_LEVELS.includes(d.timerLevel))d.timerLevel=0.5;
      if(!TIMER_MODES.includes(d.timerMode))d.timerMode='on';
    }
    if(d.type==='wallSwitch'){
      d.gangs=Number(d.gangs)===2?2:1;
      d.switchOn1=!!d.switchOn1;
      d.switchOn2=d.gangs===2&&!!d.switchOn2;
      d.ratedVoltage=Math.max(1,Number(d.ratedVoltage)||220);
      d.ratedCurrent=Math.max(.01,Number(d.ratedCurrent)||10);
    }
    if(d.type==='twoWaySwitch'){
      d.switchPosition=Number(d.switchPosition)===2?2:1;
      d.ratedVoltage=Math.max(1,Number(d.ratedVoltage)||220);
      d.ratedCurrent=Math.max(.01,Number(d.ratedCurrent)||10);
    }
    if(['mcb1','mcb2','mcb3'].includes(d.type)){
      const allowed=['C2','C4','C6','C10','C13','C16','C20','C25','C32','C40','C50','C63'];
      if(allowed.indexOf(d.breakerType)<0)d.breakerType=d.type==='mcb3'?'C25':'C10';
      d.ratedCurrent=Math.max(2,Number(String(d.breakerType).replace(/^C/,''))||10);
      d.ratedVoltage=ratedVoltageOf(d);
      d.customName=protectiveDeviceName(d);
      d.breakerHeat=0;d.breakerCurrentA=0;d.breakerPhaseCurrents=[];
    }
    if(d.type==='rcd')syncRcdRatings(d);
    if(TYPES[d.type]&&TYPES[d.type].kind==='appliance'){
      d.applianceOn=!!d.applianceOn;d.applianceBurned=!!d.applianceBurned;
      d.ratedVoltage=Math.max(1,Number(d.ratedVoltage)||220);
      syncApplianceRatings(d);
    }
    if(d.type==='tp'){
      d.ratedVoltage=Math.max(1,Number(d.ratedVoltage)||380);
      d.tpOn=!!d.tpOn;
      d.maxArmatureVoltage=Math.max(1,Number(d.maxArmatureVoltage)||220);
      d.fieldVoltage=Math.max(1,Number(d.fieldVoltage)||220);
      setTpArmatureVoltage(d, Number(d.setArmatureVoltage)||0);
    }
  });
  state.relays=JSON.parse(JSON.stringify(p.state.relays||[]));
  state.relays.forEach(syncThermalSettings);
  thermalLastTick=Date.now();
  ensureInstanceTags();
  state.conduits=normalizeConduits(p.state.conduits);
  state.alignmentGuides=normalizeAlignmentGuides(p.state.alignmentGuides);
  state.alignmentSnapEnabled=p.state.alignmentSnapEnabled!==false;
  state.wires=JSON.parse(JSON.stringify(p.state.wires||[]));
  state.wires.forEach(function(w){w.a=compactCrossModuleRef(w.a);w.b=compactCrossModuleRef(w.b);});
  state.wires.forEach(function(w){delete w.previewConduitId;delete w.previewConduitEntry;delete w.previewConduitEntryEnd;if(w.conduitId&&!conduitById(w.conduitId))detachWireConduit(w);});
  state.motors=JSON.parse(JSON.stringify(p.state.motors||[]));
  state.pushbuttons=JSON.parse(JSON.stringify(p.state.pushbuttons||[]));
  state.panels=JSON.parse(JSON.stringify(Array.isArray(p.state.panels)?p.state.panels:[]));
  state.workbench=normalizeWorkbench(p.state.workbench);
  state.roomScene=p.state.roomScene==='household'?'household':null;
  const stand=STAND_OPTIONS.find(function(option){return option.key===p.state.standId;})
    ||STAND_OPTIONS.find(function(option){return option.file===p._folderFile||option.sourceName===p.name;});
  state.standId=stand?stand.key:null;
  // В старых сохранениях две отдельные рейки были частью рабочего поля.
  state.standaloneRails=p.state.standaloneRails!==false;
  state.panels.forEach(function(panel){panel.fixed=panelIsFixed(panel);panel.railCount=panelRailCount(panel);panel.inletVoltage=panelInletVoltage(panel);panel.x=Number(panel.x)||0;panel.y=Number(panel.y)||0;});
  state.clamps=JSON.parse(JSON.stringify(Array.isArray(p.state.clamps)?p.state.clamps:[]));
  state.clamps.forEach(function(c,i){
    c.id='CL'+(i+1);c.tag=c.tag||'PA'+(i+1);
    c.x=Number(c.x)||0;c.y=Number(c.y)||0;c.drag=false;
    const fraction=Number(c.fraction);c.fraction=Math.max(0,Math.min(1,isFinite(fraction)?fraction:.5));
    if(!state.wires.some(function(w){return w.id===c.wireId;}))c.wireId=null;
  });
  clampState=null;
  state.specialProps=Object.assign({inbox:{tag:'XT1',customName:'Ввод 3×380 В',ratedVoltage:380,frequency:50},multimeter:{tag:'PV1',customName:'Цифровой мультиметр'}},JSON.parse(JSON.stringify(p.state.specialProps||{})));
  state.specialProps.inbox=Object.assign({tag:'XT1',customName:'Ввод 3×380 В',ratedVoltage:380,frequency:50},state.specialProps.inbox||{});
  state.special=Object.assign({inbox:true,pushbutton:false,motor:false,multimeter:true},p.state.special||{});
  state.special.motor=false;
  state.special.pushbutton=false;
  const pos=p.positions||{};
  // Совместимость со старыми сохранениями, где двигатель и пост были одиночными.
  if(!state.motors.length && p.state.special && p.state.special.motor && pos.motor){
    state.motors.push({id:'M1',x:pos.motor.x,y:pos.motor.y,w:MOTOR.w,h:MOTOR.h,scale:MOTOR.scale,
      load:Number(pos.motor.load)||0,rpmActual:0,angle:0});
  }
  if(!state.pushbuttons.length && p.state.special && p.state.special.pushbutton && pos.pushbutton){
    state.pushbuttons.push({id:'PB1',tag:'SB1–SB3',x:pos.pushbutton.x,y:pos.pushbutton.y,w:PB.w,h:PB.h,
      buttons:{up:false,stop:false,down:false}});
  }
  state.motors.forEach(function(m,i){
    if(!m.id)m.id=m.kind==='dc'?('MD'+(i+1)):('M'+(i+1));
    if(!m.tag)m.tag=m.id;m.w=m.w||MOTOR.w;m.h=m.h||MOTOR.h;m.scale=m.scale||MOTOR.scale;
    m.load=Number(m.load)||0;m.rpmActual=0;m.angle=0;
    // Машина постоянного тока: паспортные данные и номиналы по умолчанию.
    if(m.kind==='dc'){
      m.ratedArmatureVoltage=Math.max(1,Number(m.ratedArmatureVoltage)||DCM.ratedArmatureVoltage);
      m.ratedArmatureCurrent=Math.max(.1,Number(m.ratedArmatureCurrent)||DCM.ratedArmatureCurrent);
      m.ratedFieldVoltage=Math.max(1,Number(m.ratedFieldVoltage)||DCM.ratedFieldVoltage);
      m.ratedSpeed=Math.max(1,Number(m.ratedSpeed)||DCM.ratedSpeed);
      m.armatureResistance=Math.max(.01,Number(m.armatureResistance)||DCM.armatureResistance);
      m.fieldResistance=Math.max(1,Number(m.fieldResistance)||DCM.fieldResistance);
      m.inertiaFactor=Math.max(.05,Number(m.inertiaFactor)||DCM.inertiaFactor);
      return;
    }
    m.polePairs=Math.max(1,Math.round(Number(m.polePairs)||2));
    const savedSlip=Number(m.ratedSlipPercent);
    m.ratedSlipPercent=Math.max(0,Math.min(95,isFinite(savedSlip)?savedSlip:10));
    m.ratedFrequency=Math.max(1,Number(m.ratedFrequency)||50);
  });
  state.pushbuttons.forEach(function(pb,i){
    if(!pb.id)pb.id='PB'+(i+1);
    if(!pb.tag){const first=i*3+1;pb.tag='SB'+first+'–SB'+(first+2);}
    pb.w=pb.w||PB.w;pb.h=pb.h||PB.h;pb.buttons={up:false,stop:false,down:false};
  });
  state.wires.forEach(function(w){
    delete w.previewShape;
    w.sectionMm2=wireSectionOf(w);
    // Старые сохранения использовали одну невидимую точку PE на чашку.
    [w.a,w.b].forEach(function(end){
      if(end.key==='s1PE')end.key='s1PEt';
      if(end.key==='s2PE')end.key='s2PEt';
      if(end.devId==='PB')end.devId='PB1';
    });
  });
  state.nextId=p.state.nextId||Math.max(1,state.devices.reduce(function(m,d){return Math.max(m,+d.id||0);},0)+1);
  wireSeq=Math.max(1,state.wires.reduce(function(m,w){return Math.max(m,+w.id||0);},0)+1);
  if(pos.inbox){INBOX.x=pos.inbox.x;INBOX.y=pos.inbox.y;}
  const pm=pos.multimeter;
  if(pm){
    METER.x=isFinite(pm.x)?pm.x:875;METER.y=isFinite(pm.y)?pm.y:1080;
    // В старых сохранениях щупы стояли над верхними вводами: там, где координат нет,
    // берём положение по гнёздам новой разводки.
    METER.redX=isFinite(pm.redX)?pm.redX:METER.x+METER_JACKS.red.dx;
    METER.redY=isFinite(pm.redY)?pm.redY:METER.y+METER_JACKS.red.dy;
    METER.blackX=isFinite(pm.blackX)?pm.blackX:METER.x+METER_JACKS.black.dx;
    METER.blackY=isFinite(pm.blackY)?pm.blackY:METER.y+METER_JACKS.black.dy;
    state.mm={mode:false,power:pm.power!==false,fn:pm.fn||'voltage',a:pm.a||null,b:pm.b||null,
      aDocked:pm.a?false:pm.aDocked!==false,bDocked:pm.b?false:pm.bDocked!==false};
  }else{
    METER.x=875;METER.y=1080;meterResetProbes();
    state.mm={mode:false,power:true,fn:'voltage',a:null,b:null,aDocked:true,bDocked:true};
  }
  if(inboxSinglePhase())pruneInboxConnections();
  state.mm.a=compactCrossModuleRef(state.mm.a);state.mm.b=compactCrossModuleRef(state.mm.b);
  // Размер SVG измеряется уже в компоновке выбранного стенда.
  scene.classList.toggle('workbench-view',!!state.workbench&&state.roomScene!=='household');
  if(p.view&&isFinite(p.view.x)&&isFinite(p.view.y)&&isFinite(p.view.w)){
    view={x:p.view.x,y:p.view.y,w:p.view.w,h:p.view.h||p.view.w*VH/VW};clampView();applyView();
  }else resetView();
  renderRail();renderAll();
  const input=document.getElementById('presetName');if(input)input.value=p.name;
  presetStatus('Загружена схема «'+p.name+'».');
  restoreLog(p.journal);
  trace('Загружен локальный пресет: '+p.name+'.');
  return true;
}
function deleteSelectedPreset(){
  const p=selectedPreset();
  if(!p){presetStatus('Выберите схему для удаления.',true);return;}
  if(p._folderFile){presetStatus('Чтобы убрать эту схему, удалите её файл из папки presets.');return;}
  if(typeof window.confirm==='function'&&!window.confirm('Удалить сохранённую схему «'+p.name+'»?'))return;
  const next=readBrowserPresets().filter(function(x){return x.id!==p.id;});
  if(!writePresets(next))return;
  renderPresetList();presetStatus('Схема «'+p.name+'» удалена.');
}
function safePresetFilename(name){
  return String(name||'scheme').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,' ').trim().slice(0,80)||'scheme';
}
function downloadPresetJson(payload,filename){
  try{
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
    return true;
  }catch(e){presetStatus('Не удалось создать файл сохранения.',true);return false;}
}
function exportSelectedPreset(){
  const p=selectedPreset();
  if(!p){presetStatus('Выберите схему для экспорта.',true);return;}
  const data={format:'ad-trainer-scheme',version:1,exported:new Date().toISOString(),preset:p};
  if(downloadPresetJson(data,safePresetFilename(p.name)+'.ad-scheme.json'))presetStatus('Файл схемы «'+p.name+'» подготовлен для переноса.');
}
function exportAllPresets(){
  const list=readPresets();
  if(!list.length){presetStatus('Сначала сохраните хотя бы одну схему.',true);return;}
  const data={format:'ad-trainer-schemes',version:1,exported:new Date().toISOString(),presets:list};
  const stamp=new Date().toISOString().slice(0,10);
  if(downloadPresetJson(data,'Схемы-стенда-'+stamp+'.ad-scheme.json'))presetStatus('Все сохранённые схемы экспортированы одним файлом.');
}
function uniqueImportedName(name,list){
  const base=String(name||'Импортированная схема').trim()||'Импортированная схема';
  let candidate=base,n=2;
  const used=function(v){return list.some(function(p){return String(p.name).toLowerCase()===v.toLowerCase();});};
  if(used(candidate))candidate=base+' (импорт)';
  while(used(candidate))candidate=base+' (импорт '+(n++)+')';
  return candidate;
}
function importPresetFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    try{
      const data=JSON.parse(String(reader.result||'').replace(/^\uFEFF/,''));
      const incoming=presetsFromData(data);
      if(!incoming.length)throw new Error('format');
      const list=readBrowserPresets(),now=Date.now();
      incoming.forEach(function(src,i){
        const p=JSON.parse(JSON.stringify(src));
        p.id='scheme-import-'+now.toString(36)+'-'+i;
        p.name=uniqueImportedName(p.name,list);
        p.updated=now+i;
        delete p._folderFile;
        (p.state.wires||[]).forEach(function(w){delete w.previewShape;});
        list.push(p);
      });
      if(!writePresets(list))return;
      renderPresetList(incoming.length===1?list[list.length-1].id:null);
      presetStatus('Импортировано схем: '+incoming.length+'. Выберите нужную и нажмите «Загрузить».');
      trace('Импортировано локальных схем: '+incoming.length+'.');
    }catch(e){presetStatus('Файл не является сохранением этого тренажёра.',true);}
  };
  reader.onerror=function(){presetStatus('Не удалось прочитать файл сохранения.',true);};
  reader.readAsText(file,'utf-8');
}

/* ============================================================
   9. ОРГАНЫ УПРАВЛЕНИЯ
   ============================================================ */
/* Схемы: файл пользователя, библиотека сайта и восстановление работы. */
const SCHEME_DRAFT_KEY='electrosim-last-work-v1';
let schemeCleanSignature=null,schemeDraft=null,schemeReplaceAction=null,schemeReturnFocus=null;
let schemeLastDraftPayload='',openedFilePresets=[];
function currentSchemeName(){
  return (document.getElementById('presetName').value||'').trim()||'Моя схема';
}
function schemeSignature(snapshot){
  // Пассивный нагрев, индикация, журнал и масштаб не означают редактирование схемы.
  const transient=/^(coil|manualPressed|heat|phaseHeat|phaseCurrents|currentA|tripCurrentA|tripRatio|energyKwh|rpmActual|angle|timerActive|timerSupply|timerSince|timerLastSignal|vfdPressed|vfdPressToken|vfdInputReady|vfdInputVoltage|vfdInputFrequency|vfdOutputActive|tpPressed|tpPressToken|tpInputReady|tpInputVoltage|tpInputFrequency|breakerHeat|breakerCurrentA|breakerPhaseCurrents|meterPowerW|meterPulse|sensorVoltage|sensorCurrentA)$/;
  return JSON.stringify({name:snapshot.name,state:snapshot.state,positions:snapshot.positions},function(key,value){
    return transient.test(key)?undefined:value;
  });
}
function schemeHasChanges(){
  return schemeCleanSignature!==null&&schemeSignature(schemeSnapshot(currentSchemeName()))!==schemeCleanSignature;
}
function markSchemeClean(){
  schemeCleanSignature=schemeSignature(schemeSnapshot(currentSchemeName()));
}
function updateSchemeRecovery(){
  const box=document.getElementById('schemeRecovery');
  if(!box)return;
  box.hidden=!schemeDraft;
  if(schemeDraft)document.getElementById('schemeRecoveryText').textContent=
    'Последняя работа: «'+schemeDraft.preset.name+'». Восстановить её?';
}
function clearSchemeRecovery(){
  schemeDraft=null;updateSchemeRecovery();
}
function saveSchemeDraft(){
  if(schemeCleanSignature===null||drag||panelDrag||meterDrag||meterProbeDrag||pending||touchPlacement||conduitDraft||conduitGrab||alignmentDraft||alignmentGrab)return;
  try{
    if(schemeDraft){
      if(!schemeHasChanges())return;
      // Начали новую работу без восстановления: прежнюю копию сохраняем в списке.
      const archived=JSON.parse(JSON.stringify(schemeDraft.preset)),list=readBrowserPresets();
      archived.id='recovery:'+String(archived.updated||archived.id);
      archived.name=archived.name+' (автокопия)';
      if(!list.some(function(p){return p.id===archived.id;})){
        if(!writePresets(list.concat([archived])))throw new Error('storage');
      }
      clearSchemeRecovery();renderPresetList();
    }
    const snapshot=schemeSnapshot(currentSchemeName());
    const payload=JSON.stringify({format:'electrosim-work',preset:snapshot,cleanSignature:schemeCleanSignature});
    // updated меняется при каждом снимке; сравниваем само содержимое.
    const comparable=JSON.stringify({state:snapshot.state,positions:snapshot.positions,journal:snapshot.journal,view:snapshot.view,name:snapshot.name,cleanSignature:schemeCleanSignature});
    if(comparable===schemeLastDraftPayload)return;
    localStorage.setItem(SCHEME_DRAFT_KEY,payload);schemeLastDraftPayload=comparable;
    const el=document.getElementById('schemeAutosaveStatus');
    if(el)el.textContent='Автосохранено в этом браузере · '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  }catch(e){
    const el=document.getElementById('schemeAutosaveStatus');
    if(el)el.textContent='Автосохранение недоступно. Сохраните работу в файл.';
  }
}
function saveCurrentSchemeFile(){
  const name=currentSchemeName(),snapshot=schemeSnapshot(name);
  const data={format:'ad-trainer-scheme',version:1,exported:new Date().toISOString(),preset:snapshot};
  if(!downloadPresetJson(data,safePresetFilename(name)+'.ad-scheme.json'))return false;
  document.getElementById('presetName').value=name;
  markSchemeClean();saveSchemeDraft();
  presetStatus('Файл «'+name+'.ad-scheme.json» подготовлен. Найдите его в загрузках браузера.');
  return true;
}
function closeSchemeReplace(){
  const modal=document.getElementById('schemeReplaceModal');
  if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
  schemeReplaceAction=null;
  if(schemeReturnFocus&&schemeReturnFocus.focus)schemeReturnFocus.focus();
}
function requestSchemeReplace(action){
  if(!schemeHasChanges()){action();return;}
  if(schemeReplaceAction)return;
  schemeReplaceAction=action;schemeReturnFocus=document.activeElement;
  const modal=document.getElementById('schemeReplaceModal');
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  document.getElementById('schemeReplaceSave').focus();
}
function finishSchemeReplace(save){
  if(!schemeReplaceAction)return;
  if(save&&!saveCurrentSchemeFile())return;
  const action=schemeReplaceAction;closeSchemeReplace();action();
}
function openWorkspaceScheme(p){
  if(!p||!p.state)return;
  requestSchemeReplace(function(){
    applyPreset(p);clearSchemeRecovery();markSchemeClean();schemeLastDraftPayload='';saveSchemeDraft();
  });
}
const STAND_OPTIONS=[
  {key:'motor-empty',button:'sceneWorkbench',title:'Испытание электродвигателей',
    file:'Стенд двигателя — пустой.ad-scheme.json',sourceName:'Стенд двигателя — пустой',
    hint:'ДПТ и асинхронный двигатель · пустой электрический щит'},
  {key:'motor-reverse',button:'sceneMotorReverse',title:'Пуск-реверс асинхронного двигателя',
    file:'Пуск-Реверс АД.ad-scheme.json',sourceName:'Пуск-Реверс АД',
    hint:'Готовая схема пуска и реверса асинхронного двигателя'},
  {key:'apartment-empty',button:'sceneHousehold',title:'Квартирный щит. Пустой',
    file:'Бытовой монтаж — комнаты.ad-scheme.json',sourceName:'Бытовой монтаж — комнаты',
    hint:'Квартира и пустой щит для самостоятельного монтажа'},
  {key:'apartment-connected',button:'sceneHouseholdConnected',title:'Квартирный щит. Готовый',
    file:'Монтаж квартирного щита.ad-scheme.json',sourceName:'Монтаж квартирного щита',
    hint:'Готовый щит, приборы и подключённая проводка'},
  {key:'free-mounting',button:'sceneFreeMounting',title:'Свободный монтаж',
    file:'Свободный монтаж.ad-scheme.json',sourceName:'Свободный монтаж',
    hint:'Чистое поле для самостоятельного размещения щитов и оборудования'}
];
function openDesignScene(file){
  const preset=folderPresets.find(function(p){return p._folderFile===file;});
  if(!preset){warn('Не найден файл стенда «'+file+'». Обновите каталог схем.');return;}
  const copy=JSON.parse(JSON.stringify(preset));delete copy.view;
  const stand=STAND_OPTIONS.find(function(option){return option.file===file;});
  if(stand)copy.state.standId=stand.key;
  openWorkspaceScheme(copy);
}
function newWorkspaceScheme(){
  requestSchemeReplace(function(){
    const household=state.roomScene==='household';
    const freeMounting=state.standId==='free-mounting';
    cancelWire();hideWireMenu();hideObjectMenu();touchPlacement=null;
    if(freeMounting){
      const preset=JSON.parse(JSON.stringify(folderPresets.find(function(p){return p._folderFile==='Свободный монтаж.ad-scheme.json';})));
      delete preset.view;applyPreset(preset);
    }else if(household){
      const preset=JSON.parse(JSON.stringify(folderPresets.find(function(p){return p._folderFile==='Бытовой монтаж — комнаты.ad-scheme.json';})));
      delete preset.view;applyPreset(preset);
    }else{initialState();resetView();}
    clearLog();renderAll();
    document.getElementById('presetName').value='';
    clearSchemeRecovery();markSchemeClean();schemeLastDraftPayload='';saveSchemeDraft();
    presetStatus(freeMounting?'Новая схема: чистое поле для свободного монтажа.':household?'Новая сцена: комнаты для бытового монтажа.':'Новая схема: ДПТ слева, асинхронный двигатель справа и пустой щит на две DIN-рейки.');
  });
}
function restoreWorkspaceScheme(){
  if(!schemeDraft)return;
  const draft=schemeDraft;
  requestSchemeReplace(function(){
    applyPreset(draft.preset);clearSchemeRecovery();
    schemeCleanSignature=draft.cleanSignature||'';
    schemeLastDraftPayload='';saveSchemeDraft();presetStatus('Последняя работа восстановлена. Для переноса сохраните её в файл.');
  });
}
function discardWorkspaceRecovery(){
  clearSchemeRecovery();schemeLastDraftPayload='';saveSchemeDraft();
}
function openSchemeFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    let incoming;
    try{incoming=presetsFromData(JSON.parse(String(reader.result||'').replace(/^\uFEFF/,'')));}
    catch(e){presetStatus('Не удалось открыть файл. Выберите файл схемы этого тренажёра.',true);return;}
    if(!incoming.length){presetStatus('В файле нет схем этого тренажёра.',true);return;}
    if(incoming.length===1){openWorkspaceScheme(incoming[0]);return;}
    openedFilePresets=incoming.map(function(p,i){
      const copy=JSON.parse(JSON.stringify(p));copy.id='opened-file:'+Date.now()+':'+i;return copy;
    });
    renderPresetList(openedFilePresets[0].id);
    presetStatus('В файле '+incoming.length+' схем. Выберите нужную в списке и нажмите «Открыть выбранную схему».');
  };
  reader.onerror=function(){presetStatus('Не удалось прочитать файл схемы.',true);};
  reader.readAsText(file,'utf-8');
}
function initSchemeWorkspace(){
  markSchemeClean();
  try{
    const raw=JSON.parse(localStorage.getItem(SCHEME_DRAFT_KEY)||'null');
    if(raw&&raw.preset&&presetsFromData(raw.preset).length)schemeDraft=raw;
  }catch(e){/* Повреждённый черновик не препятствует запуску тренажёра. */}
  updateSchemeRecovery();
  function click(id,fn){const el=document.getElementById(id);if(el)el.addEventListener('click',fn);}
  STAND_OPTIONS.forEach(function(option){click(option.button,function(){openDesignScene(option.file);});});
  click('schemeNew',newWorkspaceScheme);click('schemeRestore',restoreWorkspaceScheme);
  click('schemeDiscard',discardWorkspaceRecovery);
  click('schemeReplaceSave',function(){finishSchemeReplace(true);});
  click('schemeReplaceContinue',function(){finishSchemeReplace(false);});
  click('schemeReplaceCancel',closeSchemeReplace);
  const modal=document.getElementById('schemeReplaceModal');
  if(modal)modal.addEventListener('pointerdown',function(e){if(e.target===modal)closeSchemeReplace();});
  document.addEventListener('keydown',function(e){
    if(!schemeReplaceAction)return;
    if(e.key==='Escape'){e.preventDefault();closeSchemeReplace();return;}
    if(e.key==='Tab'){
      const ids=['schemeReplaceSave','schemeReplaceContinue','schemeReplaceCancel'];
      const index=ids.findIndex(function(id){return document.activeElement===document.getElementById(id);});
      e.preventDefault();document.getElementById(ids[(index+(e.shiftKey?2:1)+3)%3]).focus();
    }
  });
  const fileLabel=document.querySelector('label[for="presetImportFile"]');
  if(fileLabel)fileLabel.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();document.getElementById('presetImportFile').click();}
  });
  if(typeof window.addEventListener==='function'){
    window.addEventListener('beforeunload',function(e){
      saveSchemeDraft();
      if(schemeHasChanges()){e.preventDefault();e.returnValue='';}
    });
    window.addEventListener('pagehide',saveSchemeDraft);
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden)saveSchemeDraft();});
  setInterval(saveSchemeDraft,2000);
}


const sideMenuItems=Array.prototype.slice.call(document.querySelectorAll('.side-menu-item'));
sideMenuItems.forEach(function(item){
  item.addEventListener('toggle',function(){
    if(!item.open)return;
    sideMenuItems.forEach(function(other){if(other!==item)other.open=false;});
  });
});
document.addEventListener('pointerdown',function(evt){
  if(evt.target.closest&&evt.target.closest('.side'))return;
  sideMenuItems.forEach(function(item){item.open=false;});
});
document.addEventListener('keydown',function(evt){
  if(evt.key==='Escape')sideMenuItems.forEach(function(item){item.open=false;});
});
document.getElementById('presetSave').addEventListener('click',saveCurrentSchemeFile);
document.getElementById('presetLoad').addEventListener('click',loadSelectedPreset);
document.getElementById('presetList').addEventListener('dblclick',loadSelectedPreset);
document.getElementById('presetList').addEventListener('change',updatePresetDeleteButton);
document.getElementById('presetFolderConnect').addEventListener('click',connectPresetFolder);
const presetDetails=document.getElementById('presetList').closest('details');
if(presetDetails)presetDetails.addEventListener('toggle',function(){if(presetDetails.open)refreshPresetFolder();});
if(typeof window.addEventListener==='function')window.addEventListener('focus',refreshPresetFolder);
document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshPresetFolder();});
setInterval(function(){if(!document.hidden&&presetFolderHandle)refreshPresetFolder();},15000);
document.getElementById('presetImportFile').addEventListener('change',function(e){
  const file=e.target.files&&e.target.files[0];
  openSchemeFile(file);
  e.target.value='';
});

/* Протокол испытаний: фильтр по уровню, выгрузка в файл, очистка. */
function initLogPanel(){
  const filters=document.getElementById('logFilters');
  if(filters)filters.addEventListener('click',function(e){
    const b=e.target.closest('[data-log-filter]');
    if(!b)return;
    setLogFilter(b.getAttribute('data-log-filter'));
  });
  const clear=document.getElementById('logClear');
  if(clear)clear.addEventListener('click',function(){
    if(!logItems.length){warn('Протокол уже пуст.');return;}
    if(typeof window.confirm==='function'&&!window.confirm('Очистить протокол испытаний? Схема и аппараты останутся на месте.'))return;
    clearLog();
  });
  const exp=document.getElementById('logExport');
  if(exp)exp.addEventListener('click',exportProtocol);
  setLogFilter(logFilter);
}

/* Настройки слева задают вид каждого следующего провода. */
function initWireDefaults(){
  const shape=document.getElementById('wireShapeDefault');
  const color=document.getElementById('wireColorDefault');
  const section=document.getElementById('wireSectionDefault');
  const menus=[shape,color,section];
  try{
    const saved=JSON.parse(localStorage.getItem('ad-trainer-wire-defaults')||'{}');
    if(['smooth','straight','orthogonal','arc','s'].indexOf(saved.shape)>=0)wireDefaults.shape=saved.shape;
    if(/^#[0-9a-f]{6}$/i.test(saved.color||''))wireDefaults.color=saved.color;
    wireDefaults.sectionMm2=normalizeWireSection(saved.sectionMm2);
  }catch(e){}
  function paint(){
    if(section){
      const current=section.querySelector('.wire-current-section');
      if(current)current.textContent=wireSectionLabel(wireDefaults.sectionMm2);
      document.getElementById('wireSectionOptions').innerHTML=wireSectionButtons('data-wire-default-section',wireDefaults.sectionMm2);
    }
    menus.forEach(function(menu){const trigger=menu&&menu.querySelector('.wire-default-trigger');if(trigger)trigger.setAttribute('aria-expanded',String(menu.classList.contains('open')));});
    const shapeNames={smooth:'∿',straight:'╱',orthogonal:'└',arc:'⌒',s:'𝑆'};
    const shapeIcon=shape&&shape.querySelector('.wire-current-shape');
    if(shapeIcon)shapeIcon.textContent=shapeNames[wireDefaults.shape]||'∿';
    const colorIcon=color&&color.querySelector('.wire-current-color');
    if(colorIcon){colorIcon.style.background=wireDefaults.color;colorIcon.classList.toggle('pe',wireDefaults.color===WC.PE);}
    if(shape)shape.querySelectorAll('[data-wire-default-shape]').forEach(function(b){b.classList.toggle('selected',b.getAttribute('data-wire-default-shape')===wireDefaults.shape);});
    if(color)color.querySelectorAll('[data-wire-default-color]').forEach(function(b){
      const c=b.getAttribute('data-wire-default-color'); b.classList.toggle('selected',c===wireDefaults.color);
      const sw=b.querySelector('i:not(.pe-swatch)'); if(sw)sw.style.setProperty('--wire-color',c);
    });
  }
  function refresh(changeColor){
    paint();
    if(pending){pending.sectionMm2=wireDefaults.sectionMm2;pending.shape=wireDefaults.shape;if(changeColor)pending.color=wireDefaults.color;renderWires();}
    try{localStorage.setItem('ad-trainer-wire-defaults',JSON.stringify(wireDefaults));}catch(e){}
  }
  if(shape)shape.addEventListener('click',function(e){
    const b=e.target.closest('[data-wire-default-shape]'); if(!b)return;
    wireDefaults.shape=b.getAttribute('data-wire-default-shape')||'smooth'; shape.classList.remove('open'); refresh();
  });
  if(color)color.addEventListener('click',function(e){
    const b=e.target.closest('[data-wire-default-color]'); if(!b)return;
    wireDefaults.color=b.getAttribute('data-wire-default-color')||'#1c1c1c'; color.classList.remove('open'); refresh(true);
  });
  if(section)section.addEventListener('click',function(e){
    const b=e.target.closest('[data-wire-default-section]');if(!b)return;
    wireDefaults.sectionMm2=normalizeWireSection(b.getAttribute('data-wire-default-section'));
    section.classList.remove('open');refresh();
  });
  menus.forEach(function(menu){
    if(!menu)return;
    const trigger=menu.querySelector('.wire-default-trigger');
    if(trigger){trigger.setAttribute('aria-expanded','false');trigger.addEventListener('click',function(){const open=!menu.classList.contains('open');menus.forEach(function(other){if(other)other.classList.remove('open');});menu.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));});}
    menu.addEventListener('mouseenter',function(){if(!document.body.classList.contains('touch-input'))menu.classList.add('open');});
    menu.addEventListener('mouseleave',function(){if(!document.body.classList.contains('touch-input'))menu.classList.remove('open');});
  });
  const tools=document.querySelector('.wire-defaults'),toggle=document.getElementById('wireToolsToggle');
  if(toggle&&tools)toggle.addEventListener('click',function(){const open=!tools.classList.contains('expanded');tools.classList.toggle('expanded',open);toggle.setAttribute('aria-expanded',String(open));});
  document.addEventListener('pointerdown',function(e){if(e.target.closest('.wire-defaults'))return;menus.forEach(function(menu){if(menu){menu.classList.remove('open');const b=menu.querySelector('.wire-default-trigger');if(b)b.setAttribute('aria-expanded','false');}});});
  refresh();
}
function initTerminalGuides(){
  const button=document.getElementById('guideToggle');
  try{terminalGuidesEnabled=localStorage.getItem('ad-trainer-terminal-guides')==='1';}catch(e){}
  function paint(){
    if(!button)return;
    button.classList.toggle('on',terminalGuidesEnabled);
    button.setAttribute('aria-pressed',terminalGuidesEnabled?'true':'false');
  }
  if(button)button.addEventListener('click',function(){
    terminalGuidesEnabled=!terminalGuidesEnabled;
    try{localStorage.setItem('ad-trainer-terminal-guides',terminalGuidesEnabled?'1':'0');}catch(e){}
    paint();renderTerminalGuides();
  });
  paint();
}
/* ============================================================
   10. СТАРТ
   ============================================================ */
/* Перенос щита перемещает ввод, рейки и установленные на них аппараты. */
let panelDrag=null,panelDragFrame=0,panelDragPointer=null;
const panelLayer=document.getElementById('panelLayer');
function updatePanelDrag(){
  if(!panelDrag||!panelDragPointer)return;
  const panel=panelById(panelDrag.id);if(!panel||panelIsFixed(panel))return;
  const evt=panelDragPointer,p=svgPoint(evt);panelDragPointer=null;
  const box=snapAlignmentBox(p.x-panelDrag.offX,p.y-panelDrag.offY,PANEL.width,panelHeight(panel),evt);
  panel.x=box.x;panel.y=box.y;
  renderPanels();renderRail();renderInbox();renderDevices();renderRelays();renderTerminalGuides();renderWires();renderTerminals();renderClamp();
}
function startPanelDrag(evt,panel){
  evt.preventDefault();evt.stopPropagation();
  if(panelIsFixed(panel))return;
  cancelWire();
  const p=svgPoint(evt);panelDrag={id:panel.id,offX:p.x-panel.x,offY:p.y-panel.y,pointerId:evt.pointerId};
}
panelLayer.addEventListener('pointerdown',function(evt){
  if(evt.button!==0)return;
  const body=evt.target.closest('[data-panel-id]'),panel=body&&panelById(body.dataset.panelId);if(!panel)return;
  startPanelDrag(evt,panel);
});
document.addEventListener('pointermove',function(evt){
  if(!panelDrag||evt.pointerId!==panelDrag.pointerId)return;
  panelDragPointer={clientX:evt.clientX,clientY:evt.clientY,shiftKey:evt.shiftKey};
  if(!panelDragFrame)panelDragFrame=requestAnimationFrame(function(){panelDragFrame=0;updatePanelDrag();});
});
function finishPanelDrag(evt){
  if(!panelDrag||evt.pointerId!==panelDrag.pointerId)return;
  if(panelDragFrame){cancelAnimationFrame(panelDragFrame);panelDragFrame=0;}
  if(evt.type!=='pointercancel'){panelDragPointer={clientX:evt.clientX,clientY:evt.clientY,shiftKey:evt.shiftKey};updatePanelDrag();}
  panelDrag=null;panelDragPointer=null;
}
document.addEventListener('pointerup',finishPanelDrag);
document.addEventListener('pointercancel',finishPanelDrag);
panelLayer.addEventListener('contextmenu',function(evt){
  const body=evt.target.closest('[data-panel-id]');if(body)showObjectMenu(evt,{kind:'special',key:'panel',id:body.dataset.panelId});
});
/* Токовые клещи: ток ветви считается по нагрузкам и проводящим связям.
   Малое одинаковое сопротивление проводов позволяет делить ток в параллельных путях. */
let clampState=null;
const clampLayer=document.getElementById('clampLayer');
function createClamp(x,y){
  const n=nextSpecialNumber(state.clamps,'CL');
  const number=nextSpecialNumber(state.clamps.map(function(c){return {id:c.tag||''};}),'PA');
  const c={id:'CL'+n,tag:'PA'+number,x:x,y:y,wireId:null,fraction:.5,drag:false};
  state.clamps.push(c);return c;
}
function clampWireCurrents(){
  if(electricalReadContext&&electricalReadContext.currents)return electricalReadContext.currents;
  const map=potentialMap(),result={};
  if(map.conflict)return result;
  const nodes=[],indices={},edges=[],injections=[];
  function index(n){const k=nodeKey(n);if(indices[k]===undefined){indices[k]=nodes.length;nodes.push(n);injections.push({r:0,i:0});}return indices[k];}
  function edge(a,b,g,id){edges.push({a:index(a),b:index(b),g:g,id:id});}
  internalLinks().forEach(function(p){edge(p[0],p[1],1000,null);});
  state.wires.forEach(function(w){edge(w.a,w.b,100,w.id);});
  function inject(n,r,i){const j=index(n);injections[j].r+=r;injections[j].i+=i;}
  electricalLoads(map.pot).forEach(function(e){
    const na=e.a,nb=e.b;
    const va=map.pot[nodeKey(na)],vb=map.pot[nodeKey(nb)];
    if(!va||!vb)return;
    const value=branchCurrent(e,map.pot);
    inject(na,value.r,value.i);inject(nb,-value.r,-value.i);
  });
  state.motors.forEach(function(m){
    if(motorIsDc(m)){
      const point=dcMotorOperatingPoint(m,map);
      if(point.armatureDc&&point.armaturePresent){inject({devId:m.id,key:'ya1'},point.armatureCurrent,0);inject({devId:m.id,key:'ya2'},-point.armatureCurrent,0);}
      if(point.fieldDc&&Math.abs(point.fieldVoltage)>1){const current=Math.sign(point.fieldVoltage)*point.fieldCurrent;inject({devId:m.id,key:'sh1'},current,0);inject({devId:m.id,key:'sh2'},-current,0);}
      return;
    }
  });
  const drives=state.devices.filter(function(d){return (d.type==='vfd'&&d.vfdInputReady)||(d.type==='tp'&&d.tpInputReady);});
  drives.forEach(function(d){['R','S','T'].forEach(function(k){index({devId:d.id,key:k});});});
  const count=nodes.length,adj=Array.from({length:count},function(){return [];});
  edges.forEach(function(e){adj[e.a].push(e.b);adj[e.b].push(e.a);});
  const pinned={},seen={},components=[],componentIndex=new Int32Array(count);
  nodes.forEach(function(n,j){
    if(map.sources[nodeKey(n)])pinned[j]=true;
  });
  // Независимые проводящие компоненты решаются отдельными матрицами.
  // Это те же узловые уравнения Кирхгофа без огромных блоков из нулей.
  for(let start=0;start<count;start++){
    if(seen[start])continue;
    const queue=[start],component=[];seen[start]=true;
    while(queue.length){
      const j=queue.pop();component.push(j);componentIndex[j]=components.length;
      adj[j].forEach(function(k){if(!seen[k]){seen[k]=true;queue.push(k);}});
    }
    if(!component.some(function(j){return pinned[j];}))pinned[start]=true;
    components.push({nodes:component,edges:[]});
  }
  edges.forEach(function(e){components[componentIndex[e.a]].edges.push(e);});
  function solveCurrents(){
  const real=new Float64Array(count),imag=new Float64Array(count);
  components.forEach(function(component){
    const free=component.nodes.filter(function(j){return !pinned[j];}),position={};
    // Без нагрузки все поправки потенциалов равны нулю.
    if(!free.some(function(j){return injections[j].r!==0||injections[j].i!==0;}))return;
    free.forEach(function(j,k){position[j]=k;});
    const size=free.length;
    const matrix=free.map(function(j){const row=new Float64Array(size+2);row[size]=injections[j].r;row[size+1]=injections[j].i;return row;});
    component.edges.forEach(function(e){
      const a=position[e.a],b=position[e.b];
      if(a!==undefined){matrix[a][a]+=e.g;if(b!==undefined)matrix[a][b]-=e.g;}
      if(b!==undefined){matrix[b][b]+=e.g;if(a!==undefined)matrix[b][a]-=e.g;}
    });
    for(let col=0;col<size;col++){
      let pivot=col;for(let j=col+1;j<size;j++)if(Math.abs(matrix[j][col])>Math.abs(matrix[pivot][col]))pivot=j;
      if(Math.abs(matrix[pivot][col])<1e-10)continue;
      const temp=matrix[col];matrix[col]=matrix[pivot];matrix[pivot]=temp;
      for(let j=col+1;j<size;j++){
        const ratio=matrix[j][col]/matrix[col][col];if(!ratio)continue;
        for(let k=col;k<size+2;k++)matrix[j][k]-=ratio*matrix[col][k];
      }
    }
    for(let row=size-1;row>=0;row--){
      let r=matrix[row][size],i=matrix[row][size+1];
      for(let k=row+1;k<size;k++){r-=matrix[row][k]*real[free[k]];i-=matrix[row][k]*imag[free[k]];}
      if(Math.abs(matrix[row][row])>1e-10){real[free[row]]=r/matrix[row][row];imag[free[row]]=i/matrix[row][row];}
    }
  });
  return {real:real,imag:imag};
  }
  const base=injections.map(function(v){return {r:v.r,i:v.i};});let solved;
  // Выходная мощность идеального преобразователя становится входной нагрузкой.
  // Повторения переносят мощность также через каскад преобразователей.
  for(let pass=0;pass<=drives.length;pass++){
    solved=solveCurrents();if(pass===drives.length)break;
    const supply=injections.map(function(v){return {r:v.r,i:v.i};});
    edges.forEach(function(e){
      const r=-e.g*(solved.real[e.a]-solved.real[e.b]),i=-e.g*(solved.imag[e.a]-solved.imag[e.b]);
      supply[e.a].r+=r;supply[e.a].i+=i;supply[e.b].r-=r;supply[e.b].i-=i;
    });
    const next=base.map(function(v){return {r:v.r,i:v.i};});
    drives.forEach(function(d){
      const keys=d.type==='vfd'?['U','V','W']:['ya1','ya2','sh1','sh2'];let power=0;
      keys.forEach(function(k){const key=nodeKey({devId:d.id,key:k}),j=indices[key],v=map.sources[key];if(j!==undefined&&v)power+=v.r*supply[j].r+v.i*supply[j].i;});
      const efficiency=Math.max(.1,Math.min(1,Number(d.efficiency)||1));
      power=power>=0?power/efficiency:power*efficiency;
      const terms=['R','S','T'].map(function(k){return {key:nodeKey({devId:d.id,key:k}),v:map.pot[nodeKey({devId:d.id,key:k})]};});
      const center=terms.reduce(function(sum,t){sum.r+=t.v.r/3;sum.i+=t.v.i/3;return sum;},{r:0,i:0});
      const denominator=terms.reduce(function(sum,t){return sum+Math.pow(t.v.r-center.r,2)+Math.pow(t.v.i-center.i,2);},0);
      if(denominator<=1e-12)return;
      terms.forEach(function(t){const j=indices[t.key];next[j].r+=power*(t.v.r-center.r)/denominator;next[j].i+=power*(t.v.i-center.i)/denominator;});
    });
    next.forEach(function(v,j){injections[j]=v;});
  }
  const real=solved.real,imag=solved.imag,phasors={},internalPhasors={};
  edges.forEach(function(e){
    const r=-e.g*(real[e.a]-real[e.b]),i=-e.g*(imag[e.a]-imag[e.b]);
    if(e.id!==null){result[e.id]=Math.hypot(r,i);phasors[e.id]={r:r,i:i};}
    else {const key=nodeKey(nodes[e.a])+'|'+nodeKey(nodes[e.b]),value=internalPhasors[key]||(internalPhasors[key]={r:0,i:0});value.r+=r;value.i+=i;}
  });
  Object.defineProperty(result,'phasors',{value:phasors});
  Object.defineProperty(result,'internalPhasors',{value:internalPhasors});
  if(electricalReadContext)electricalReadContext.currents=result;
  return result;
}
const clampPathCache=new WeakMap();
function clampNearestWire(point){
  let best=null;
  wireLayer.querySelectorAll('[data-wid] .wire-hit').forEach(function(path){
    let cached=clampPathCache.get(path);
    const d=path.getAttribute('d');
    if(!cached||cached.d!==d){
      const length=path.getTotalLength();if(!length)return;
      const count=Math.max(16,Math.min(2048,Math.ceil(length/8))),points=[];
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(let j=0;j<=count;j++){
        const p=path.getPointAtLength(length*j/count);points.push({x:p.x,y:p.y});
        minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
      }
      cached={d:d,length:length,points:points,step:length/count,minX:minX,minY:minY,maxX:maxX,maxY:maxY};
      clampPathCache.set(path,cached);
    }
    if(point.x<cached.minX-16||point.x>cached.maxX+16||point.y<cached.minY-16||point.y>cached.maxY+16)return;
    let distance=Infinity,at=0;
    for(let j=1;j<cached.points.length;j++){
      const a=cached.points[j-1],b=cached.points[j],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
      const t=den?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/den)):0;
      const gap=Math.hypot(a.x+t*dx-point.x,a.y+t*dy-point.y);
      if(gap<distance){distance=gap;at=cached.step*(j-1+t);}
    }
    if(distance<16&&(!best||distance<best.distance))best={path:path,cached:cached,at:at,distance:distance};
  });
  if(!best)return null;
  const path=best.path,length=best.cached.length;
  let at=best.at,p=path.getPointAtLength(at),distance=Math.hypot(p.x-point.x,p.y-point.y),step=best.cached.step/2;
  for(let j=0;j<6;j++){
    for(const t of [Math.max(0,at-step),Math.min(length,at+step)]){
      const q=path.getPointAtLength(t),gap=Math.hypot(q.x-point.x,q.y-point.y);
      if(gap<distance){distance=gap;at=t;p=q;}
    }
    step/=2;
  }
  return distance<14?{id:Number(path.parentNode.dataset.wid),fraction:at/length,x:p.x,y:p.y,distance:distance,path:path}:null;
}
let clampDragFrame=0,clampDragPointer=null;
function updateClampDrag(){
  if(!clampState||!clampState.drag)return;
  if(clampDragPointer){
    const evt=clampDragPointer,p=svgPoint(evt);clampDragPointer=null;
    if(isFinite(p.x)&&isFinite(p.y)){const center=snapAlignmentPoint({x:p.x-clampState.offX+50,y:p.y-clampState.offY},evt);clampState.x=center.x-50;clampState.y=center.y;}
  }
  const body=clampLayer.querySelector('[data-clamp-id="'+clampState.id+'"]');
  if(body)body.setAttribute('transform','translate('+clampState.x+','+clampState.y+')');
  const candidate=clampNearestWire(clampState),highlight=clampLayer.querySelector('[data-clamp-highlight]');
  if(highlight){
    highlight.setAttribute('d',candidate?candidate.path.getAttribute('d'):'');
    if(candidate){const wire=state.wires.find(function(w){return w.id===candidate.id;});highlight.setAttribute('stroke-width',wireVisualWidth(wire)+7);}
    highlight.style.display=candidate?'':'none';
  }
}
function clampCurrentText(current){
  const amps=Math.max(0,Number(current)||0);
  if(amps<.000001)return '0.00 A';
  if(amps<.1)return (amps*1000).toFixed(1)+' mA';
  return amps.toFixed(2)+' A';
}
function clampJawSvg(open,angle,frontOnly){
  const upper='M 24 -13 C 20 -26, -6 -29, -20 -17 C -25 -12, -27 -6, -27 0';
  const lower='M 24 13 C 20 26, -6 29, -20 17 C -25 12, -27 6, -27 0';
  function jaw(path,rotation,pivotY){
    return '<g transform="rotate('+rotation+' 24 '+pivotY+')">'
      +'<path d="'+path+'" fill="none" stroke="#92430e" stroke-width="11" stroke-linecap="round"/>'
      +'<path d="'+path+'" fill="none" stroke="#f58220" stroke-width="8" stroke-linecap="round"/>'
      +'</g>';
  }
  return '<g transform="rotate('+angle+')">'
    +(frontOnly?'':jaw(upper,open?22:0,-13))
    +jaw(lower,open?-22:0,13)+'</g>';
}
function clampObjectSvg(clampState,currents){
  let wirePath=null,ringAngle=0;
  if(clampState.wireId!==null){
    const path=wireLayer.querySelector('[data-wid="'+clampState.wireId+'"] .wire-hit');
    if(path){
      const length=path.getTotalLength(),at=length*clampState.fraction;
      const p=path.getPointAtLength(at),before=path.getPointAtLength(Math.max(0,at-1)),after=path.getPointAtLength(Math.min(length,at+1));
      clampState.x=p.x;clampState.y=p.y;wirePath=path;
      ringAngle=8*Math.sin(2*Math.atan2(after.y-before.y,after.x-before.x));
    }
    else clampState.wireId=null;
  }
  const attached=clampState.wireId!==null;
  const text=attached?clampCurrentText(currents[clampState.wireId]):'— A';
  let ring='';
  if(attached&&wirePath){
    // Задняя половина кольца находится за проводом, передняя — перед ним.
    // Ориентация кольца следует касательной даже на дугах провода.
    const wire=state.wires.find(function(w){return w.id===clampState.wireId;});
    const a=wire&&terminal(wire.a.devId,wire.a.key);
    const color=wire&&(wire.color||(a&&a.color))||'#1c1c1c';
    // Окно включает всю толщину губок с запасом: граница не режет провод
    // в месте пересечения с внешним краем задней губки.
    const clipId='clamp-wire-window-'+clampState.id;
    ring='<defs><clipPath id="'+clipId+'" clipPathUnits="userSpaceOnUse"><rect x="-44" y="-44" width="88" height="88" transform="rotate('+ringAngle+')"/></clipPath></defs>'
      +clampJawSvg(false,ringAngle,false)
      +'<g clip-path="url(#'+clipId+')" pointer-events="none"><g transform="translate('+(-clampState.x)+','+(-clampState.y)+')">'
      +wireStrokeGeom(wirePath.getAttribute('d'),color,null,false,wireVisualWidth(wire))+'</g></g>'
      +clampJawSvg(false,ringAngle,true);
  }else{
    ring=clampJawSvg(clampState.drag,0,false);
  }
  return '<g data-clamp-id="'+clampState.id+'" transform="translate('+clampState.x+','+clampState.y+')" style="cursor:grab;touch-action:none">'
    +ring
    +'<path d="M 20 -17 Q 29 -24 39 -19 V 19 Q 29 24 20 17 Z" fill="#24282c" stroke="#555b62" stroke-width="1.5"/>'
    +'<rect x="33" y="-27" width="98" height="54" rx="8" fill="#202428" stroke="#626971" stroke-width="1.5"/>'
    +'<rect x="38" y="-22" width="88" height="44" rx="5" fill="#30363b" stroke="#41484f"/>'
    +'<text x="82" y="-17" text-anchor="middle" font-family="Segoe UI,Arial" font-size="5" fill="#ced4d9">'+escapeHtml(clampState.tag||'PA')+'</text>'
    +'<rect x="42" y="-15" width="80" height="28" rx="3" fill="#b9c8b5" stroke="#101518" stroke-width="2"/>'
    +'<text x="82" y="4" text-anchor="middle" font-family="Consolas,monospace" font-size="15" fill="#26332c">'+text+'</text>'
    +'<text x="82" y="22" text-anchor="middle" font-family="Segoe UI,Arial" font-size="6" fill="#ced4d9">'+(attached?'ТОК · RMS':(clampState.drag?'КЛЕЩИ ОТКРЫТЫ':'АМПЕРМЕТР'))+'</text>'
    +'<rect x="28" y="14" width="10" height="9" rx="2" fill="#f58220" stroke="#92430e"/>'
    +'<circle r="32" fill="transparent" pointer-events="all"/>'
    +'</g>';
}
function renderClamp(force){
  if(!clampLayer)return;
  if(clampState&&clampState.drag&&!force){updateClampDrag();return;}
  const currents=state.clamps.some(function(c){return c.wireId!==null;})?clampWireCurrents():{};
  const highlight='<path data-clamp-highlight="1" d="" style="display:none" fill="none" stroke="#f6ce64" stroke-width="11" stroke-opacity=".28" stroke-linecap="round" pointer-events="none"/>';
  clampLayer.innerHTML=highlight+state.clamps.map(function(c){return clampObjectSvg(c,currents);}).join('');
  if(clampState&&clampState.drag)updateClampDrag();
}
clampLayer.addEventListener('pointerdown',function(evt){
  if(evt.button!==0)return;
  const body=evt.target.closest('[data-clamp-id]');if(!body)return;
  clampState=state.clamps.find(function(c){return c.id===body.dataset.clampId;});if(!clampState)return;
  evt.preventDefault();evt.stopPropagation();cancelWire();
  const p=svgPoint(evt);clampState.offX=p.x-clampState.x;clampState.offY=p.y-clampState.y;
  clampState.wireId=null;clampState.drag=true;
  renderClamp(true);
});
document.addEventListener('pointermove',function(evt){
  if(!clampState||!clampState.drag)return;
  clampDragPointer={clientX:evt.clientX,clientY:evt.clientY,shiftKey:evt.shiftKey};
  if(!clampDragFrame)clampDragFrame=requestAnimationFrame(function(){clampDragFrame=0;updateClampDrag();});
},true);
document.addEventListener('pointerup',function(evt){
  if(!clampState||!clampState.drag)return;
  if(clampDragFrame){cancelAnimationFrame(clampDragFrame);clampDragFrame=0;}
  clampDragPointer={clientX:evt.clientX,clientY:evt.clientY,shiftKey:evt.shiftKey};updateClampDrag();
  clampState.drag=false;
  const hit=clampNearestWire(clampState);
  if(hit){clampState.wireId=hit.id;clampState.fraction=hit.fraction;clampState.x=hit.x;clampState.y=hit.y;}
  renderClamp();
},true);
clampLayer.addEventListener('contextmenu',function(evt){
  const body=evt.target.closest('[data-clamp-id]');if(body)showObjectMenu(evt,{kind:'special',key:'clamp',id:body.dataset.clampId});
});
document.addEventListener('pointercancel',function(){
  if(!clampState||!clampState.drag)return;
  if(clampDragFrame){cancelAnimationFrame(clampDragFrame);clampDragFrame=0;}
  clampDragPointer=null;clampState.drag=false;renderClamp();
},true);
setInterval(function(){if(state.clamps.length&&(!clampState||!clampState.drag))renderClamp();},500);
initWireDefaults();
initTerminalGuides();
initAlignmentGuides();
initConduits();
initialState();
resetView();
renderAll();
renderPresetList();
initPresetFolder();
initLogPanel();
initTrayCategories();
log('Тренажёр запущен: ДПТ слева, асинхронный двигатель справа, пустой щит и ввод XT1 — 3×380 В, N и PE.', 'info');
initSchemeWorkspace();

})();
