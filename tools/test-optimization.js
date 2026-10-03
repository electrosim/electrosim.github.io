/* Регрессии оптимизации: токи ветвей, актуальность расчётов, лоток и УЗО. */
const {load}=require('./sandbox');
const env=load(),t=env.api,s=t.state,check=env.check,near=env.near;
s.power=true;s.special.inbox=true;s.motors=[];s.relays=[];s.pushbuttons=[];
let wireId=1;
function wire(aDev,aKey,bDev,bKey){
  const w={id:wireId++,a:{devId:aDev,key:aKey},b:{devId:bDev,key:bKey}};
  s.wires.push(w);return w.id;
}

console.log('— параллельные нагрузки и независимые фазы —');
s.devices=[
  {id:1,type:'junction',tag:'XR1',x:400,y:100},
  {id:2,type:'bulb',tag:'EL1',x:600,y:100,ratedVoltage:220,ratedPower:100},
  {id:3,type:'split',tag:'E1',x:800,y:100,ratedVoltage:220,ratedPower:1500,applianceOn:true},
  {id:4,type:'boiler',tag:'E2',x:600,y:400,ratedVoltage:220,ratedPower:2000,applianceOn:true}
];
s.wires=[];
const feed=wire('IN','L1',1,'top0');
const branchA=wire(1,'top1',2,'L'),branchB=wire(1,'top2',3,'L');
wire(2,'N','IN','N');wire(3,'N','IN','N');
const phaseB=wire('IN','L2',4,'L');wire(4,'N','IN','N');
const currents=t.clampWireCurrents(),voltage=380/Math.sqrt(3);
near('лампа 100 Вт',currents[branchA],100*voltage/(220*220),.001);
near('сплит-система 1500 Вт',currents[branchB],1500*voltage/(220*220),.001);
near('первый закон Кирхгофа в разветвлении',currents[feed],currents[branchA]+currents[branchB],.000001);
near('отдельная фаза бойлера',currents[phaseB],2000*voltage/(220*220),.001);
const parallel=wire(1,'top2',3,'L'),parallelCurrents=t.clampWireCurrents();
near('два одинаковых провода делят ток поровну',parallelCurrents[parallel],parallelCurrents[branchB],.000001);
near('суммарный ток параллельных проводов сохранён',parallelCurrents[parallel]+parallelCurrents[branchB],currents[branchB],.000001);

console.log('— контекст чтения не переживает коммутацию —');
t.withElectricalRead(function(){
  check('напряжения повторно используют один расчёт',t.potentialMap()===t.potentialMap());
  check('токи повторно используют один расчёт',t.clampWireCurrents()===t.clampWireCurrents());
});
check('между действиями напряжения пересчитываются',t.potentialMap()!==t.potentialMap());
s.devices[2].applianceOn=false;
near('после отключения прибора ток сразу нулевой',t.clampWireCurrents()[branchB],0,.000001);
try{t.withElectricalRead(function(){t.potentialMap();throw new Error('test');});}catch(error){}
check('ошибка также освобождает контекст',t.potentialMap()!==t.potentialMap());

console.log('— лоток не пересоздаётся при неизменном наборе —');
t.renderAll();
let writes=0,html=env.els.tray.innerHTML;
Object.defineProperty(env.els.tray,'innerHTML',{configurable:true,get:function(){return html;},set:function(value){writes++;html=value;}});
t.renderAll();t.renderAll();
check('два действия не перестраивают лоток',writes===0,writes);
s.special.multimeter=true;t.renderAll();
check('изменение доступности прибора обновляет лоток',writes===1,writes);
check('сплит-система осталась в лотке',html.includes('Сплит-система'));

console.log('— порог УЗО из характеристик —');
s.special.multimeter=false;
s.devices=[{id:10,type:'rcd',tag:'QD1',on:true,tripped:false,ratedLeakageMa:300}];
s.wires=[];
wire('IN','L1',10,'tL');wire('IN','N',10,'tN');wire(10,'bL','IN','PE');
check('300 мА: моделируемая утечка 230 мА ниже порога',!t.updateRcdLeakage()&&s.devices[0].on);
s.devices[0].ratedLeakageMa=100;
check('100 мА: та же утечка отключает оба полюса',t.updateRcdLeakage()&&!s.devices[0].on&&s.devices[0].tripped);
s.devices[0].on=true;s.devices[0].tripped=false;delete s.devices[0].ratedLeakageMa;
check('старые схемы сохраняют порог 30 мА',t.updateRcdLeakage()&&s.devices[0].tripped);

console.log(env.fails()?'Проверки оптимизации не пройдены':'Оптимизация: все проверки пройдены');
process.exit(env.fails()?1:0);
