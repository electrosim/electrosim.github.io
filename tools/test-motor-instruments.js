/* Приборы показывают питание и фактическую скорость, включая выбег и реверс. */
const assert=require('assert/strict'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state,m=s.motors[0];
function wire(a,keyA,b,keyB){s.wires.push({id:s.wires.length+1,a:{devId:a,key:keyA},b:{devId:b,key:keyB}});}
wire('IN','L1',m.id,'U1');wire('IN','L2',m.id,'V1');wire('IN','L3',m.id,'W1');
wire(m.id,'W2',m.id,'U2');wire(m.id,'U2',m.id,'V2');
assert.equal(t.motorPhaseDirection(m),1);
m.rpmActual=1350;
let op=t.motorVisualOperating(m,1),v=t.motorInstrumentValues(m,op);
assert.equal(op.frequencyHz,50);assert.equal(v.sync,'1500 об/мин');assert.equal(v.slip,'10.0 %');assert.equal(v.torque,'0.0 Н·м');
m.rpmActual=750;assert.equal(t.motorInstrumentValues(m,t.motorVisualOperating(m,1)).slip,'50.0 %','скольжение следует фактической скорости');
m.load=65;op=t.motorVisualOperating(m,1);assert.equal(op.load,65);assert(op.current>9,'нагрузка повышает ток');assert.equal(t.motorInstrumentValues(m,op).torque,'18.4 Н·м');
s.power=false;op=t.motorVisualOperating(m,0);v=t.motorInstrumentValues(m,op);
assert.equal(op.frequencyHz,0);assert.equal(op.current,0);assert.equal(v.slip,'—');assert.equal(op.rpm,750,'выбег ротора остаётся виден');assert.equal(v.torque,'18.4 Н·м');
m.rpmActual=0;assert.equal(t.motorInstrumentValues(m,t.motorVisualOperating(m,0)).torque,'0.0 Н·м');
s.power=true;s.wires[0].a.key='L2';s.wires[1].a.key='L1';m.rpmActual=-1350;
assert.equal(t.motorPhaseDirection(m),-1);v=t.motorInstrumentValues(m,t.motorVisualOperating(m,-1));assert.equal(v.slip,'10.0 %');assert.equal(v.torque,'18.4 Н·м','момент нагрузки не меняется при реверсе');
const panel=s.panels[0],pos=t.motorInstrumentPosition(m);assert(pos.x>panel.x);assert.equal(pos.y,panel.y);
t.renderAll();assert(e.els.motorLayer.innerHTML.includes('motor-instrument-panel'));assert(!e.els.motorLayer.innerHTML.includes('Нагрев реле'));assert(!e.els.motorLayer.innerHTML.includes('Направление вращения'));assert(!e.els.motorLayer.innerHTML.includes('motor-instrument-note'));assert(e.els.motorLayer.innerHTML.includes('Момент на валу'));
const saved=t.schemeSnapshot('Проверка приборов');assert(t.applyPreset(saved));assert.equal(s.motors[0].load,65);
s.motors=[];t.renderAll();assert.equal(e.els.motorLayer.innerHTML,'');
console.log('Приборная панель: питание, нагрузка, фактическая скорость, скольжение, выбег, реверс и сохранение — проверки пройдены.');
