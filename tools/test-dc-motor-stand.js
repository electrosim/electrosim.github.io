/* Два стенда: реальные показания ДПТ, независимая нагрузка, реверс и выбег. */
const assert=require('assert/strict'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state;
const dc=s.motors.find(m=>m.kind==='dc'),ac=s.motors.find(m=>m.kind==='ac');
const panel=s.panels[0];
assert(t.motorInstrumentPosition(dc).x+740<panel.x);
assert(t.motorInstrumentPosition(ac).x>panel.x+t.PANEL.width);
assert.equal(t.motorInstrumentPosition(dc).y,t.motorInstrumentPosition(ac).y);
assert.equal([...e.els.motorLayer.innerHTML.matchAll(/<g\b[^>]*class="([^"]*)"/g)]
  .filter(m=>m[1].split(/\s+/).includes('motor-instrument')).length,2);
const dcHtml=t.motorInstrumentInner(dc,t.dcMotorOperatingPoint(dc));
for(const label of ['Напряжение якоря','Ток якоря','Напряжение возбуждения','Ток возбуждения','Скорость якоря','Момент на валу','ЭДС якоря','Мощность на валу'])assert(dcHtml.includes(label),label);
for(const label of ['Скольжение','Синхронная скорость','Частота питания'])assert(!dcHtml.includes(label),label);

const tp={id:1,type:'tp',rail:0,slot:0,tag:'UZT1',ratedVoltage:380,tpOn:true,
  setArmatureVoltage:220,maxArmatureVoltage:220,fieldVoltage:220};
s.devices=[tp];
function wire(a,keyA,b,keyB){s.wires.push({id:s.wires.length+1,a:{devId:a,key:keyA},b:{devId:b,key:keyB}});}
wire('IN','L1',1,'R');wire('IN','L2',1,'S');wire('IN','L3',1,'T');
wire(1,'ya1',dc.id,'ya1');wire(1,'ya2',dc.id,'ya2');
wire(1,'sh1',dc.id,'sh1');wire(1,'sh2',dc.id,'sh2');
function run(){for(let i=0;i<400;i++)t.dcMotorInertiaStep(dc,.05);}
function values(){return t.dcMotorInstrumentValues(dc,t.dcMotorOperatingPoint(dc));}
function near(actual,expected,tolerance){assert(Math.abs(actual-expected)<=tolerance,actual+' / '+expected);}
assert.equal(values().rpm,'0 об/мин');
assert.equal(values().armatureVoltage,'220 В');
assert.equal(values().armatureCurrent,'137.5 А','панель показывает пусковой ток, а не номинал');
assert.equal(values().fieldVoltage,'220 В');assert.equal(values().fieldCurrent,'1.00 А');
dc.load=100;run();
near(dc.rpmActual,1500,2);near(t.dcMotorOperatingPoint(dc).armatureCurrent,5,.05);
assert.equal(values().torque,'6.7 Н·м');assert.equal(values().power,'1.06 кВт');
tp.setArmatureVoltage=110;run();
near(dc.rpmActual,1500*102/212,2);
assert.equal(values().armatureVoltage,'110 В');assert.equal(values().power,'0.51 кВт');

// Каждая панель обновляет свои показания и только свою нагрузку.
const boxes={};
for(const m of [dc,ac]){
  const box=e.makeEl('div');box.classList.add('motor-load-control','motor-instrument-panel');box.parentNode=e.els.motorLayer;
  const input=e.makeEl('input');input.classList.add('motor-load');input.dataset.mid=m.id;input.parentNode=box;
  const readouts={};box.querySelector=sel=>readouts[sel]||(readouts[sel]=e.makeEl('b'));
  boxes[m.id]={box,input,readouts};
}
e.els.motorLayer.querySelector=sel=>{const id=sel.match(/data-mid="([^"]+)"/);return id&&boxes[id[1]]?boxes[id[1]].input:null;};
ac.load=80;boxes[dc.id].input.value='65';boxes[dc.id].input.dispatchEvent({type:'input',bubbles:true});
assert.equal(dc.load,65);assert.equal(ac.load,80);run();t.updateMotorReadout();
assert.equal(boxes[dc.id].readouts['.motor-load-value'].textContent,'65 %');
assert.equal(boxes[ac.id].readouts['.motor-load-value'].textContent,'80 %');
assert.equal(boxes[dc.id].readouts['.motor-armature-voltage'].textContent,'110 В');
assert.equal(boxes[dc.id].readouts['.motor-field-current'].textContent,'1.00 А');
assert.equal(boxes[dc.id].readouts['.motor-alert'].hidden,true);

tp.setArmatureVoltage=220;dc.load=100;
s.wires.filter(w=>String(w.a.devId)==='1'&&/^ya/.test(w.a.key)).forEach(w=>{w.b.key=w.b.key==='ya1'?'ya2':'ya1';});
run();near(dc.rpmActual,-1500,2);
assert.equal(values().armatureVoltage,'-220 В');assert.equal(values().armatureCurrent,'-5.0 А');
assert.equal(values().emf,'-212 В');assert.equal(values().power,'1.06 кВт');
t.updateMotorReadout();assert.equal(boxes[dc.id].readouts['.motor-armature-voltage'].textContent,'-220 В');
const snapshot=t.schemeSnapshot('Два стенда');assert(t.applyPreset(snapshot));
assert.equal(s.motors.find(m=>m.id===dc.id).load,100);assert.equal(s.motors.find(m=>m.id===ac.id).load,80);
assert.equal(s.workbench.dcMotorId,dc.id);

const restored=s.motors.find(m=>m.id===dc.id);restored.rpmActual=-1500;
s.wires=s.wires.filter(w=>!(w.b.devId===dc.id&&w.b.key==='ya1'));
let coast=t.dcMotorInstrumentValues(restored,t.dcMotorOperatingPoint(restored));
assert.equal(coast.armatureCurrent,'0.0 А');assert.equal(coast.emf,'-212 В');assert.equal(coast.rpm,'1500 об/мин');
restored.rpmActual=0;coast=t.dcMotorInstrumentValues(restored,t.dcMotorOperatingPoint(restored));
assert.equal(coast.torque,'0.0 Н·м');assert.equal(coast.power,'0.00 кВт');

s.wires=s.wires.filter(w=>!(w.b.devId===dc.id&&/^ya/.test(w.b.key)));
wire('IN','L1',dc.id,'ya1');wire('IN','L2',dc.id,'ya2');
t.updateMotorReadout();assert.equal(boxes[dc.id].readouts['.motor-alert'].hidden,false,'ошибка AC появляется при обновлении');
console.log('ДПТ: два стенда, пуск, напряжение, возбуждение, момент, мощность, независимые регуляторы, реверс, выбег и сохранение — OK.');
