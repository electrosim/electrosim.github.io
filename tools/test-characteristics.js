/* Номиналы, редактируемая мощность и автоматические наименования. */
const assert=require('assert');
const {load}=require('./sandbox');
const env=load({interactive:true}),t=env.api,s=t.state;
s.power=false;
for(const type of Object.keys(t.TYPES)){
  const obj={id:100,type,x:1000,y:1000,ratedVoltage:999};s.devices=[obj];s.wires=[];
  const data=t.characteristicsFor({kind:'device',id:100});
  assert.ok(!data.fields.some(f=>f.key==='ratedVoltage'),type+': ручного напряжения нет');
  assert.ok(!data.fields.some(f=>f.key==='ratedCurrent'&&f.type==='number'),type+': ручного тока нет');
  assert.strictEqual(t.ratedVoltageOf(obj),['mcb3','vfd','tp'].includes(type)?380:220);
  if(['lamp','bulb','fridge','washer','boiler','stove','split'].includes(type))
    assert.ok(data.fields.some(f=>f.key==='ratedPower'&&f.type==='number'),type+': мощность редактируется');
}
// Мощность сохраняется, ток нагрузки рассчитывается при фиксированных 220 В.
const loadObj={id:100,type:'boiler',x:1000,y:1000,ratedVoltage:380,ratedPower:2200};s.devices=[loadObj];
t.openProperties({kind:'device',id:100});
env.els.propertiesFields.querySelector=function(selector){return selector==='[data-property-key="ratedPower"]'?{value:'4400'}:null;};
t.saveProperties();
assert.strictEqual(loadObj.ratedPower,4400);assert.strictEqual(loadObj.ratedCurrent,20);
s.power=true;s.wires=[{id:1,a:{devId:'IN',key:'L1'},b:{devId:100,key:'L'}},{id:2,a:{devId:'IN',key:'N'},b:{devId:100,key:'N'}}];loadObj.applianceOn=true;
assert.ok(Math.abs(t.clampWireCurrents()[1]-20)<.1,'мощность меняет фактический ток');
for(const type of ['mcb1','mcb3','rcd']){
  s.power=false;s.wires=[];
  const obj={id:100,type,x:1000,y:1000,breakerType:'C10',ratedCurrent:25,ratedLeakageMa:30,customName:'Старое имя'};s.devices=[obj];
  const data=t.characteristicsFor({kind:'device',id:100});
  assert.ok(data.fields.find(f=>f.key==='customName').readOnly);
  const controls={customName:env.makeEl('input'),breakerType:env.makeEl('select'),ratedCurrent:env.makeEl('select'),ratedLeakageMa:env.makeEl('select')};
  controls.breakerType.value='C63';controls.ratedCurrent.value='63';controls.ratedLeakageMa.value='100';
  env.els.propertiesFields.querySelector=function(selector){const match=selector.match(/data-property-key="([^"]+)"/);return match?controls[match[1]]||null:null;};
  t.openProperties({kind:'device',id:100});
  assert.match(env.els.propertiesFields.innerHTML,/data-property-key="customName"[^>]* readonly/);
  const control=controls[type==='rcd'?'ratedCurrent':'breakerType'];control.setAttribute('data-property-key',type==='rcd'?'ratedCurrent':'breakerType');control.parentNode=env.els.propertiesFields;
  env.pointer(control,'change');
  const expected=type==='rcd'?'УЗО 2P, 63 А, 100 мА':'Автомат '+(type==='mcb3'?'3P':'1P')+', C63';
  assert.strictEqual(controls.customName.value,expected,'наименование обновилось до сохранения');
  t.saveProperties();assert.strictEqual(obj.customName,expected);
}
s.motors=[{id:'M1',tag:'M1',x:0,y:0,scale:1,ratedVoltage:220}];
const fields=t.characteristicsFor({kind:'special',key:'motor',id:'M1'}).fields;
assert.ok(fields.some(f=>f.key==='ratedCurrent'&&f.type==='number'),'ток двигателя остаётся редактируемым');
assert.ok(!fields.some(f=>f.key==='ratedVoltage'));
assert.strictEqual(t.ratedVoltageOf(s.motors[0]),380);
console.log('Характеристики: фиксированные напряжения, мощность, ток двигателя и наименования — проверки пройдены.');
