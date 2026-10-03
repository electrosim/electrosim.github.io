/* Дисплей счётчика одинаков при перерисовке и периодическом обновлении. */
const assert=require('assert');
const {load}=require('./sandbox');
const s=load();
const meter={id:1,type:'meter',x:1000,y:1000,energyKwh:2.5,meterPowerW:0};
s.api.state.devices=[meter];s.api.state.wires=[];
const energy=s.makeEl('text'),power=s.makeEl('text'),group=s.makeEl('g');
group.querySelector=function(selector){return selector==='.meter-energy'?energy:selector==='.meter-power'?power:null;};
s.els.deviceLayer.querySelector=function(){return group;};
for(let i=0;i<3;i++){
  s.api.energyMeterTick();
  const model=s.api.deviceInner('meter',meter);
  const text=function(name){return model.match(new RegExp('<text class="'+name+'"[^>]*>([^<]*)</text>'))[1];};
  assert.strictEqual(power.textContent,'0 Вт');
  assert.strictEqual(energy.textContent,'002,500000');
  assert.strictEqual(power.textContent,text('meter-power'));
  assert.strictEqual(energy.textContent,text('meter-energy'));
}
console.log('Счётчик: русские единицы и запятая сохраняются при обновлении и перерисовке.');
