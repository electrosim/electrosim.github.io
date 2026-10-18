const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{load}=require('./sandbox');
const file='Бытовой монтаж — собранный щит 63 А.ad-scheme.json';
const preset=JSON.parse(fs.readFileSync(path.join(__dirname,'../presets',file),'utf8')).preset;
const e=load({interactive:true}),t=e.api,s=t.state;
const registered=t.folderPresets().find(p=>p._folderFile===file);
assert(registered,'готовый щит есть в меню схем');
assert.equal(JSON.stringify(registered.state),JSON.stringify(preset.state),'каталог и файл содержат одинаковый монтаж');
function reset(){assert(t.applyPreset(preset));}
function device(id){return s.devices.find(d=>d.id===id);}
function volts(map,id){
 const a=map.pot[id+'/L'],b=map.pot[id+'/N'];return a&&b?Math.hypot(a.r-b.r,a.i-b.i):0;
}
function near(a,b,label){assert(Math.abs(a-b)<1e-6,label+': '+a+' / '+b);}
reset();
assert.equal(s.panels.length,1);assert.equal(s.panels[0].railCount,3);assert.equal(s.panels[0].inletVoltage,220);
assert.equal(s.devices.filter(d=>d.type==='mcb1').length,13);
assert.equal(s.devices.filter(d=>d.type==='mcb2'&&d.breakerType==='C63').length,1);
assert.equal(s.devices.filter(d=>d.type==='rcd'&&d.ratedCurrent===63&&d.ratedLeakageMa===30).length,3);
assert.equal(s.devices.filter(d=>d.type==='outlet').length,6);assert.equal(s.devices.filter(d=>d.type==='bulb').length,6);
assert.equal(s.devices.filter(d=>d.type==='wallSwitch').length,6);
for(const type of ['fridge','stove','washer','boiler','split'])assert.equal(s.devices.filter(d=>d.type===type).length,1);
for(const wr of s.wires)for(const r of [wr.a,wr.b])assert(t.terminal(r.devId,r.key),'существующая клемма каждого провода');
for(const wr of s.wires){
 const wanted=Math.min(...wr.pts.map(p=>p.y));
 if(!wr.label.startsWith('QF')||wanted>=580)continue;
 const d=t.wirePathD(t.terminal(wr.a.devId,wr.a.key),t.terminal(wr.b.devId,wr.b.key),wr);
 const numbers=d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);
 const top=Math.min(...numbers.filter((_,i)=>i%2));
 assert(top<=wanted+1,'провод '+wr.id+' сохраняет верхнюю трассу: '+top+' вместо '+wanted);
}
for(const comb of s.devices.filter(d=>d.type==='comb'))assert.equal(t.combMembers(comb).filter(Boolean).length,comb.combCount);
let map=t.potentialMap();assert.equal(map.conflict,false);
for(const c of preset.design.circuits)for(const id of c.consumerIds)near(volts(map,id),220,c.tag+' питание потребителя');
// Выключатель разрывает фазу только своей лампы.
for(const sw of s.devices.filter(d=>d.type==='wallSwitch')){
 const lamp=s.devices.find(d=>d.tag==='EL'+sw.tag.slice(2));sw.switchOn1=false;
 near(volts(t.potentialMap(),lamp.id),0,sw.tag+' отключает свою лампу');sw.switchOn1=true;
}
// Каждый групповой автомат отключает только свои потребители.
for(const c of preset.design.circuits){
 device(c.breakerId).on=false;map=t.potentialMap();
 for(const other of preset.design.circuits)for(const id of other.consumerIds)
  near(volts(map,id),other.tag===c.tag?0:220,c.tag+' избирательно отключает линию '+other.tag);
 device(c.breakerId).on=true;
}
// Три независимые зоны УЗО, без обходных фаз и смешанных нулей.
for(let row=0;row<3;row++){
 device(preset.design.rcdIds[row]).on=false;map=t.potentialMap();
 for(const c of preset.design.circuits)for(const id of c.consumerIds)near(volts(map,id),c.row===row?0:220,'отключение QD'+(row+1));
 device(preset.design.rcdIds[row]).on=true;
}
for(const d of s.devices)if(t.TYPES[d.type].kind==='appliance')d.applianceOn=true;
const current=t.clampWireCurrents(),input=s.wires.find(w=>w.a.devId==='IN'&&w.a.key==='L1');
near(current[input.id],13060/220,'все приборы и лампы: общий ток');
for(const c of preset.design.circuits){
 const outgoing=s.wires.find(w=>w.a.devId===c.breakerId&&w.a.key==='b0');
 const power=c.consumerIds.reduce((sum,id)=>sum+(Number(device(id).ratedPower)||0),0);
 near(current[outgoing.id]||0,power/220,c.tag+' ток группы');
 assert(power/220<=c.rating,'номинальный ток нагрузки не превышает автомат');
}
for(const wr of s.wires)if(wr.color===t.WC.PE)near(current[wr.id]||0,0,'PE не несёт рабочего тока');
assert.equal(t.updateRcdLeakage(t.potentialMap()),false,'исправная схема не отключает УЗО');
for(const id of preset.design.rcdIds)assert(!device(id).tripped);
device(preset.design.mainId).on=false;map=t.potentialMap();
for(const c of preset.design.circuits)for(const id of c.consumerIds)near(volts(map,id),0,'ввод отключает все нагрузки');
reset();s.power=false;for(const id of preset.design.rcdIds)device(id).on=false;
for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal(t.resistanceBetween(
 {devId:preset.design.neutralIds[i],key:'k0'},{devId:preset.design.neutralIds[j],key:'k0'}),Infinity,'N-шины разных УЗО изолированы');
// Настоящая кнопка TEST каждого установленного УЗО.
for(const id of preset.design.rcdIds){
 reset();const body=e.makeEl('g'),button=e.makeEl('g');body.classList.add('dev');body.dataset.id=String(id);body.parentNode=e.els.deviceLayer;
 button.setAttribute('data-rcd-test','1');button.parentNode=body;
 e.pointer(button,'pointerdown',{pointerType:'mouse',button:0});
 assert(device(id).tripped&&!device(id).on,'TEST срабатывает при наличии питания');
}
reset();t.renderAll();const saved=t.schemeSnapshot('Собранный щит');assert(t.applyPreset(saved));
assert.equal(s.wires.length,68);assert.equal(t.potentialMap().conflict,false);
console.log('Собранный щит: 13 групп, 3 УЗО, 6 розеточных блоков, 6 ламп, 5 приборов; токи, PE, изоляция N, TEST и сохранение — OK.');
