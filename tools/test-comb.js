const assert=require('assert/strict'),{load}=require('./sandbox');
function fixture(poles,count){
 const e=load({interactive:true}),t=e.api,s=t.state;s.power=true;s.devices=[];s.wires=[];s.relays=[];s.motors=[];
 const width=t.combWidth({combPoles:poles,combCount:1});
 for(let i=0;i<count;i++)s.devices.push({id:i+1,type:'mcb'+poles,x:200+i*width,y:300,on:true,tripped:false});
 const c={id:90,type:'comb',x:200,y:270,combPoles:poles,combCount:count};s.devices.push(c);return {e,t,s,c,width};
}
function wire(s,a,k,b,j){s.wires.push({id:s.wires.length+1,a:{devId:a,key:k},b:{devId:b,key:j}});}
function voltage(t,id,key){const v=t.potentialMap().pot[t.nodeKey({devId:id,key})];return v?Math.hypot(v.r,v.i):0;}
for(const poles of [1,2,3]){
 const f=fixture(poles,3),{e,t,s,c,width}=f;
 const snap=t.combPlacement(205,275,c);assert(snap&&snap.comb);c.combAnchorId=snap.combAnchorId;
 assert.equal(t.combMembers(c).filter(Boolean).length,3);assert.equal(t.combWidth(c),width*3);
 for(let phase=0;phase<poles;phase++)wire(s,'IN','L'+(phase+1),1,'t'+phase);
 for(let phase=0;phase<poles;phase++)assert(voltage(t,3,'b'+phase)>200,'гребёнка передаёт фазу на третий автомат');
 assert(!t.potentialMap().conflict,'фазы 3P изолированы друг от друга');
 s.devices[2].on=false;assert.equal(voltage(t,3,'b0'),0,'выключенный автомат разрывает свой выход');assert(voltage(t,3,'t0')>200);
 s.devices[2].on=true;s.devices[2].tripped=true;assert.equal(voltage(t,3,'b0'),0,'сработавший автомат разрывает свой выход');s.devices[2].tripped=false;
 c.combCount=2;assert.equal(voltage(t,3,'t0'),0,'длина ограничивает число подключённых автоматов');c.combCount=3;
 delete c.combAnchorId;assert.equal(voltage(t,3,'t0'),0,'снятая гребёнка не проводит');c.combAnchorId=1;
 s.devices[2].x+=10;assert.equal(voltage(t,3,'t0'),0,'непопавший в штырь автомат отключён от гребёнки');s.devices[2].x-=10;
 const saved=t.schemeSnapshot('Гребёнка');assert(t.applyPreset(saved));assert(voltage(t,3,'t0')>200,'монтаж сохраняется');
 const restored=s.devices.find(d=>d.type==='comb');const before=t.originOf(restored);s.devices[0].x+=30;assert.equal(t.originOf(restored).x,before.x+30,'гребёнка следует за первым автоматом');s.devices[0].x-=30;
 const properties=t.characteristicsFor({kind:'device',id:90});assert(properties.fields.some(f=>f.key==='combCount'));assert(properties.fields.some(f=>f.key==='combPoles'));
 t.renderAll();assert(e.els.deviceLayer.innerHTML.includes('comb-body'));
 t.resetActionHistory();t.beginActionHistory();s.devices=s.devices.filter(d=>d.type!=='comb');t.renderAll();t.finishActionHistory();assert.equal(voltage(t,3,'t0'),0);assert(t.undoAction());assert(voltage(t,3,'t0')>200,'отмена восстанавливает соединение');assert(t.redoAction());assert.equal(voltage(t,3,'t0'),0);
}
const f=fixture(1,3);f.c.combAnchorId=1;wire(f.s,'IN','L1',1,'t0');wire(f.s,'IN','L2',2,'t0');assert(f.t.potentialMap().conflict,'разные фазы на общей шине обнаруживаются как КЗ');
assert.equal(f.t.combCount({combPoles:3,combCount:16}),5);
const other=fixture(1,3);other.c.combAnchorId=1;assert.equal(other.t.combPlacement(200,270,{id:91,combCount:3,combPoles:1}),null,'вторая гребёнка не ставится на занятые клеммы');
console.log('Гребёнка: 1P/3P, длина, подача питания, изоляция фаз, отключение автомата, снятие, перенос, сохранение, история и КЗ — проверки пройдены.');
