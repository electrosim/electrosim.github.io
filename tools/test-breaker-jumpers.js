const assert=require('assert/strict'),{load}=require('./sandbox');
function fixture(ownPower,otherPower,bottomFeed,reversed){
 const {api:t}=load(),s=t.state;s.power=true;s.special.inbox=true;s.relays=[];s.motors=[];s.wires=[];
 s.devices=[{id:1,type:'mcb1',tag:'QF1',on:true,breakerType:'C10',breakerHeat:0},{id:3,type:'mcb1',tag:'QF3',on:true,breakerType:'C10',breakerHeat:0},
 {id:10,type:'meter',tag:'PI1'},{id:11,type:'sensor',tag:'PVA1'},{id:12,type:'rcd',tag:'QD1',on:true,ratedCurrent:25,ratedLeakageMa:30},
 {id:5,type:'washer',applianceOn:ownPower>0,ratedVoltage:220,ratedPower:ownPower||2000},{id:6,type:'washer',applianceOn:otherPower>0,ratedVoltage:220,ratedPower:otherPower||2000}];
 function wire(dev,key,to,end){let a={devId:dev,key},b={devId:to,key:end};if(reversed)[a,b]=[b,a];const id=s.wires.length+1;s.wires.push({id,a,b});return id;}
 wire('IN','L1',10,'L_in');wire('IN','N',10,'N_in');wire(10,'L_out',11,'L_in');wire(10,'N_out',11,'N_in');wire(11,'L_out',12,'tL');wire(11,'N_out',12,'tN');
 const feed=bottomFeed?'b0':'t0',loadTerminal=bottomFeed?'t0':'b0';wire(12,'bL',1,feed);wire(1,feed,3,'t0');const own=wire(1,loadTerminal,5,'L'),other=wire(3,'b0',6,'L');wire(12,'bN',5,'N');wire(12,'bN',6,'N');
 return {t,s,own,other};
}
let count=0;
for(const bottom of [false,true])for(const reversed of [false,true])for(const powers of [[0,2000],[2000,2000],[2000,0],[4000,2000],[0,0]]){
 const {t,s,own,other}=fixture(...powers,bottom,reversed),currents=t.clampWireCurrents(),qf1=s.devices[0],qf3=s.devices[1];
 const ownCurrent=currents[own],otherCurrent=currents[other];
 assert(Math.abs(t.breakerPoleCurrents(qf1,currents)[0]-ownCurrent)<1e-6,'транзит к соседнему автомату не приписывается QF1');
 assert(Math.abs(t.breakerPoleCurrents(qf3,currents)[0]-otherCurrent)<1e-6,'соседний автомат видит свою нагрузку');
 t.energyMeterTick();assert(Math.abs(s.devices.find(d=>d.type==='sensor').sensorCurrentA-ownCurrent-otherCurrent)<1e-5,'PVA1 показывает суммарный ток потребителей');
 let tripped=null;for(let n=0;n<120;n++){const r=t.breakerProtectionStep(.25,currents);if(r.tripped){tripped=r.tripped;break;}}
 if(powers[0]>2200){assert(tripped&&tripped.dev.id===1,'реальная перегрузка отключает QF1');assert(Math.abs(tripped.current-ownCurrent)<1e-6);}
 else assert(!tripped&&qf1.on&&qf3.on,'перемычка не вызывает ложное срабатывание');
 count++;
}
{
 const {api:t}=load(),s=t.state;s.devices=[{id:1,type:'mcb1'}];s.wires=[{id:1,a:{devId:'IN',key:'L1'},b:{devId:1,key:'t0'}},{id:2,a:{devId:1,key:'t0'},b:{devId:'NEXT',key:'L'}},{id:3,a:{devId:1,key:'b0'},b:{devId:'LOAD',key:'L'}}];
 const currents={1:10,2:5,3:Math.sqrt(29),phasors:{1:{r:8,i:6},2:{r:3,i:4},3:{r:5,i:2}}};assert(Math.abs(t.breakerPoleCurrents(s.devices[0],currents)[0]-Math.sqrt(29))<1e-6,'учитывается направление и фазовый сдвиг, а не сумма модулей');
}
{
 const {t,s,own}=fixture(2000,2000,false,false);s.wires.find(w=>w.a.devId===1&&w.a.key==='t0'&&w.b.devId===3).a.key='b0';
 const currents=t.clampWireCurrents(),value=t.breakerPoleCurrents(s.devices[0],currents)[0];assert(value>17&&value<19,'две настоящие нагрузки после QF1 суммируются');let trip=null;for(let n=0;n<60&&!trip;n++)trip=t.breakerProtectionStep(.25,currents).tripped;assert(trip&&trip.dev.id===1,'реальные две нагрузки отключают C10');
}
console.log('Ток автомата с перемычкой: '+count+' схем, питание сверху/снизу, оба порядка проводов, PVA1, фазоры и настоящая перегрузка — OK.');
