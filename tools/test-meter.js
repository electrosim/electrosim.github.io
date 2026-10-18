/* Дисплей счётчика одинаков при перерисовке и периодическом обновлении. */
const assert=require('assert');
const {load}=require('./sandbox');
const s=load();
const meter={id:1,type:'meter',x:1000,y:1000,energyKwh:2.5,meterPowerW:0};
s.api.state.devices=[meter];s.api.state.wires=[];
const energy=s.makeEl('text'),power=s.makeEl('text'),supply=s.makeEl('circle'),pulse=s.makeEl('circle'),group=s.makeEl('g');
group.querySelector=function(selector){return selector==='.meter-energy'?energy:selector==='.meter-power'?power:selector==='.meter-supply-led'?supply:selector==='.meter-pulse'?pulse:null;};
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
function checkSupply(on){
  s.api.energyMeterTick();
  const fill=on?'#35e47d':'#245d39',model=s.api.deviceInner('meter',meter);
  assert.strictEqual(supply.getAttribute('fill'),fill);
  assert.strictEqual(supply.classList.contains('lit'),on);
  assert(model.includes('class="meter-supply-led'+(on?' lit':'')+'" cx="31" cy="149" r="6" fill="'+fill+'"'),'перерисовка сохраняет состояние питания');
}
checkSupply(false);
s.api.state.power=true;
s.api.state.wires=[
  {id:1,a:{devId:'IN',key:'L1'},b:{devId:1,key:'L_in'}},
  {id:2,a:{devId:'IN',key:'N'},b:{devId:1,key:'N_in'}}
];
checkSupply(true);
assert.strictEqual(power.textContent,'0 Вт','питание светится и без нагрузки');
assert.strictEqual(pulse.getAttribute('fill'),'#657079','импульс не горит без потребления');
s.api.state.power=false;checkSupply(false);
s.api.state.power=true;checkSupply(true);
const neutral=s.api.state.wires.pop();checkSupply(false);
s.api.state.wires.push(neutral);checkSupply(true);
neutral.a.key='L1';checkSupply(false);
neutral.a.key='N';checkSupply(true);
console.log('Счётчик: русские единицы и запятая сохраняются при обновлении и перерисовке.');
console.log('Питание счётчика: L/N без нагрузки, отключение ввода, обрыв нейтрали и одинаковый потенциал — OK.');
