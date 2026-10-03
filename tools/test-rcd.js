/* Выбор типичных номиналов УЗО, маркировка, защита и сохранение. */
const assert=require('assert');
const {load}=require('./sandbox');
const env=load({interactive:true}),t=env.api,s=t.state;
const rcd={id:1,type:'rcd',tag:'QD1',x:1000,y:1000,on:false,ratedVoltage:999};
s.devices=[rcd];s.wires=[];
const target={kind:'device',id:1},fields=t.characteristicsFor(target).fields;
assert.ok(!fields.some(f=>f.key==='ratedVoltage'));
assert.deepStrictEqual(Array.from(fields.find(f=>f.key==='ratedCurrent').options,o=>Number(o.value)),[16,25,32,40,50,63,80,100]);
assert.deepStrictEqual(Array.from(fields.find(f=>f.key==='ratedLeakageMa').options,o=>Number(o.value)),[10,30,100,300]);
assert.ok(fields.filter(f=>['ratedCurrent','ratedLeakageMa'].includes(f.key)).every(f=>f.type==='select'));
const current=env.makeEl('select'),leakage=env.makeEl('select');
env.els.propertiesFields.querySelector=function(selector){return selector==='[data-property-key="ratedCurrent"]'?current:selector==='[data-property-key="ratedLeakageMa"]'?leakage:null;};
function choose(amps,ma){
  t.openProperties(target);current.value=String(amps);leakage.value=String(ma);t.saveProperties();
  assert.strictEqual(rcd.ratedCurrent,amps);assert.strictEqual(rcd.ratedLeakageMa,ma);assert.strictEqual(rcd.ratedVoltage,220);
  const model=t.deviceInner('rcd',rcd);
  assert.ok(model.includes('>'+amps+' А</text>'));assert.ok(model.includes('>IΔn '+ma+' мА</text>'));
}
choose(16,10);choose(100,300);
const snap=t.schemeSnapshot(),restored=load();assert.ok(restored.api.applyPreset(snap));
assert.strictEqual(restored.api.state.devices[0].ratedCurrent,100);assert.strictEqual(restored.api.state.devices[0].ratedLeakageMa,300);
// Выбранный порог действует в механике утечки, а не только на шильдике.
choose(40,300);rcd.on=true;rcd.tripped=false;s.power=true;
s.wires=[{id:1,a:{devId:'IN',key:'L1'},b:{devId:1,key:'tL'}},
  {id:2,a:{devId:'IN',key:'N'},b:{devId:1,key:'tN'}},
  {id:3,a:{devId:1,key:'bL'},b:{devId:'IN',key:'PE'}}];
assert.strictEqual(t.updateRcdLeakage(),false,'300 мА выдерживает моделируемую утечку 230 мА');
choose(40,100);rcd.on=true;rcd.tripped=false;
assert.strictEqual(t.updateRcdLeakage(),true,'100 мА отключает ту же утечку');
console.log('УЗО: списки номиналов, маркировка, срабатывание и сохранение — проверки пройдены.');
