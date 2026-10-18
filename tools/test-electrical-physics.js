/* Регрессии ревью: физические инварианты, защита и соединение обмоток. */
const assert=require('assert/strict'),{load}=require('./sandbox');
function near(actual,expected,label,tolerance=1e-7){assert(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${label}: ${actual}, ожидалось ${expected}`);}
function fixture(voltage=220){
  const {api:t}=load(),s=t.state;s.power=true;s.special.inbox=true;s.panels[0].inletVoltage=voltage;
  s.devices=[];s.motors=[];s.relays=[];s.pushbuttons=[];s.wires=[];
  function wire(a,keyA,b,keyB){const id=s.wires.length+1;s.wires.push({id,a:{devId:a,key:keyA},b:{devId:b,key:keyB}});return id;}
  return {t,s,wire};
}
const loadDevice=(id,power)=>({id,type:'boiler',applianceOn:true,ratedPower:power});
const breaker=id=>({id,type:'mcb1',on:true,breakerType:'C10',tag:'QF'+id});
function acMotor(load=100){return {id:'M1',kind:'ac',ratedCurrent:9,ratedPower:4,load,ratedFrequency:50,ratedSlipPercent:10,polePairs:2};}
function windingVoltage(t,id,a,b){const p=t.potentialMap().pot;return Math.hypot(p[id+'/'+a].r-p[id+'/'+b].r,p[id+'/'+a].i-p[id+'/'+b].i);}
function powerOnWires(t,s,ids){
  const p=t.potentialMap().pot,c=t.clampWireCurrents();return ids.reduce((sum,id)=>{
    const w=s.wires.find(w=>w.id===id),v=p[t.nodeKey(w.a)],i=c.phasors[id];
    if(!v){near(c[id],0,'непитающий провод не переносит мощность');return sum;}
    return sum+v.r*i.r+v.i*i.i;
  },0);
}

// Ω: параллельные нагрузки, мост и отсутствие электрической связи.
{
  const {t,s,wire}=fixture();s.power=false;s.devices=[{id:1,type:'bulb',ratedPower:100},{id:2,type:'bulb',ratedPower:100}];
  wire(1,'L',2,'L');wire(1,'N',2,'N');
  near(t.resistanceBetween({devId:1,key:'L'},{devId:1,key:'N'}),1/(1/484+1/484.1),'эквивалент двух параллельных ветвей');
  near(t.resistanceBetween({devId:1,key:'L'},{devId:1,key:'L'}),0,'совпавшие щупы');
  assert.equal(t.resistanceBetween({devId:1,key:'L'},{devId:'ISOLATED',key:'X'}),Infinity);
  // Симметричный мост: две ветви по 968,1 Ом, поперечная лампа тока не несёт.
  s.devices=Array.from({length:5},(_,i)=>({id:i+1,type:'bulb',ratedPower:100}));s.wires=[];
  wire(1,'N',2,'L');wire(3,'N',4,'L');wire(1,'L',3,'L');wire(2,'N',4,'N');
  wire(1,'N',5,'L');wire(3,'N',5,'N');
  const r=t.resistanceBetween({devId:1,key:'L'},{devId:2,key:'N'});
  assert(r>483.9&&r<484.2,'мост решается по всем ветвям, а не поиском пути');
}

// УЗО: нормальный возврат, PE, чужой N, малый ток, обратное питание.
for(const reversed of [false,true])for(const route of ['protected','PE','N']){
  const {t,s,wire}=fixture(),rcd={id:1,type:'rcd',on:true,ratedLeakageMa:30};s.devices=[rcd,loadDevice(2,2200)];
  const phaseIn=reversed?'bL':'tL',phaseOut=reversed?'tL':'bL',neutralIn=reversed?'bN':'tN',neutralOut=reversed?'tN':'bN';
  wire('IN','L1',1,phaseIn);wire('IN','N',1,neutralIn);const phase=wire(1,phaseOut,2,'L');
  if(route==='protected')wire(2,'N',1,neutralOut);else wire(2,'N','IN',route);
  near(t.clampWireCurrents()[phase],10,'ток нагрузки перед срабатыванием');
  assert.equal(t.updateRcdLeakage(),route!=='protected');near(rcd.rcdLeakageMa,route==='protected'?0:10000,'реальный дифференциальный ток');
  if(route!=='protected')near(t.clampWireCurrents()[phase],0,'после отключения тока нет');
}
{
  const {t,s,wire}=fixture(),rcd={id:1,type:'rcd',on:true,ratedLeakageMa:30};s.devices=[rcd,loadDevice(2,4.4)];
  wire('IN','L1',1,'tL');wire('IN','N',1,'tN');wire(1,'bL',2,'L');wire(2,'N','IN','PE');
  assert.equal(t.updateRcdLeakage(),false);near(rcd.rcdLeakageMa,20,'утечка 20 мА ниже уставки');
  rcd.ratedLeakageMa=10;assert.equal(t.updateRcdLeakage(),true);
  rcd.on=true;rcd.tripped=false;s.power=false;assert.equal(t.updateRcdLeakage(),false);near(rcd.rcdLeakageMa,0,'обесточенная цепь');
}

// КЗ: порядок устройств, направление питания и незащищённый ввод.
for(const reversed of [false,true])for(const order of [[1,2],[2,1]]){
  const {t,s,wire}=fixture();s.devices=order.map(breaker).concat(loadDevice(3,220));
  const input=reversed?'b0':'t0',output=reversed?'t0':'b0';
  wire('IN','L1',1,input);wire('IN','L1',2,input);wire(1,output,3,'L');wire(3,'N','IN','N');wire(2,output,'IN','N');
  assert(t.potentialMap().conflict);assert(t.electricalShortFault(t.potentialMap()));
  assert.equal(s.devices.find(d=>d.id===1).on,true,'исправная ветвь остаётся включённой');
  assert.equal(s.devices.find(d=>d.id===2).tripped,true,'аварийная ветвь отключена');assert.equal(t.potentialMap().conflict,false);
}
{
  const {t,s,wire}=fixture();s.devices=[breaker(1)];wire('IN','L1',1,'t0');wire('IN','L1','IN','N');
  t.electricalShortFault(t.potentialMap());assert(s.devices[0].on,'КЗ до автомата не отключает его исправную ветвь');
}

// Гребёнка: ток контакта, подключение нескольких нагрузок, C10 без перегрузки.
for(const reverseWires of [false,true]){
  const {t,s,wire}=fixture(),q1=Object.assign(breaker(1),{x:200,y:300}),q2=Object.assign(breaker(2),{x:200+t.MODULE,y:300});
  s.devices=[q1,q2,{id:90,type:'comb',x:200,y:270,combPoles:1,combCount:2,combAnchorId:1},loadDevice(3,1540),loadDevice(4,1540)];
  wire('IN','L1',1,'t0');wire(1,'b0',3,'L');wire(2,'b0',4,'L');wire(3,'N','IN','N');wire(4,'N','IN','N');
  if(reverseWires)s.wires.forEach(w=>[w.a,w.b]=[w.b,w.a]);
  const currents=t.clampWireCurrents();near(t.breakerPoleCurrents(q1,currents)[0],7,'собственный ток QF1');near(t.breakerPoleCurrents(q2,currents)[0],7,'собственный ток QF2');
  for(let k=0;k<100;k++)assert.equal(t.breakerProtectionStep(.25,currents).tripped,null);
}

// Преобразователи: Pвход = Pвыход, поле при выключенном якоре и входная защита.
for(const type of ['vfd','tp'])for(const active of [false,true]){
  const {t,s,wire}=fixture(380),drive={id:1,type,running:active,setFrequency:50,tpOn:active,setArmatureVoltage:220,fieldVoltage:220};
  const q={id:2,type:'mcb3',on:true,breakerType:'C2'};s.devices=[drive,q];const input=[],output=[];
  for(let p=0;p<3;p++){wire('IN','L'+(p+1),2,'t'+p);input.push(wire(2,'b'+p,1,['R','S','T'][p]));}
  if(type==='vfd'){
    s.motors=[acMotor()];for(let p=0;p<3;p++)output.push(wire(1,['U','V','W'][p],'M1',['U1','V1','W1'][p]));
  }else{
    const m=t.newDcMotor('MD1',0,0);m.rpmActual=1500;m.load=100;s.motors=[m];
    for(const key of ['ya1','ya2','sh1','sh2'])output.push(wire(1,key,m.id,key));
  }
  const incoming=powerOnWires(t,s,input),outgoing=powerOnWires(t,s,output);near(incoming,outgoing,'баланс мощности '+type);
  if(active||type==='tp')assert(incoming>0,'потребление при отдаче энергии');else near(incoming,0,'выключенный ПЧ');
  const currents=t.clampWireCurrents(),phases=t.breakerPoleCurrents(q,currents);input.forEach((id,i)=>near(phases[i],currents[id],'входная защита видит ток'));
  if(type==='tp'&&!active){near(outgoing,220,'мощность только возбуждения');near(currents[output[2]],1,'возбуждение при выключенном якоре');}
  if(type==='vfd'&&active){let trip=null;for(let k=0;k<100&&!trip;k++)trip=t.breakerProtectionStep(.25,currents).tripped;assert(trip&&trip.dev.id===q.id,'защита до ПЧ обнаруживает перегрузку');}
}

// Датчик тока измеряет действующий ток, а не P/U при реактивной нагрузке.
{
  const {t,s,wire}=fixture(380),m=acMotor();s.motors=[m];s.devices=[{id:1,type:'sensor'}];
  wire('IN','L1',1,'L_in');wire(1,'L_out',m.id,'U1');wire('IN','N',1,'N_in');
  wire('IN','L2',m.id,'V1');wire('IN','L3',m.id,'W1');t.energyMeterTick();
  near(s.devices[0].sensorCurrentA,9,'RMS датчика при cos φ < 1');assert(t.meterPowerW(s.devices[0])/t.meterVoltage(s.devices[0])<9);
}

// ДПТ: открытый якорь не создаёт торможения, нулевой источник создаёт торможение.
{
  const {t,s,wire}=fixture(380),tp={id:1,type:'tp',tpOn:true,setArmatureVoltage:220,fieldVoltage:220};s.devices=[tp];
  const m=t.newDcMotor('MD1',0,0);m.rpmActual=1500;s.motors=[m];
  for(let p=0;p<3;p++)wire('IN','L'+(p+1),1,['R','S','T'][p]);for(const k of ['ya1','ya2','sh1','sh2'])wire(1,k,m.id,k);
  const dropped=s.wires.find(w=>w.b.devId===m.id&&w.b.key==='ya1');s.wires=s.wires.filter(w=>w!==dropped);
  let point=t.dcMotorOperatingPoint(m);assert.equal(point.armaturePresent,false);near(point.armatureCurrent,0,'разрыв: ток якоря');near(point.torque,0,'разрыв: момент');
  t.dcMotorInertiaStep(m,.05);near(m.rpmActual,1500,'разрыв: свободное вращение без нагрузки');
  s.wires.push(dropped);tp.setArmatureVoltage=0;point=t.dcMotorOperatingPoint(m);assert(point.armaturePresent&&point.armatureCurrent<0,'замкнутый нулевой источник отличен от разрыва');
}

// АД: паспортный режим, холостой ход, потеря фазы, неверная звёздная точка.
{
  const {t,s,wire}=fixture(380),m=acMotor();s.motors=[m];const feed=[];
  for(let p=0;p<3;p++)feed.push(wire('IN','L'+(p+1),m.id,['U1','V1','W1'][p]));
  let op=t.motorOperatingPoint(m,t.motorPhaseDirection(m)),currents=t.clampWireCurrents();near(op.rpm,1350,'номинальная скорость');near(op.current,9,'номинальный ток');near(op.slipPercent,10,'номинальное скольжение');
  feed.forEach(id=>near(currents[id],9,'ток каждой фазы'));const sum=feed.reduce((v,id)=>({r:v.r+currents.phasors[id].r,i:v.i+currents.phasors[id].i}),{r:0,i:0});near(Math.hypot(sum.r,sum.i),0,'сумма трёх токов');
  near(powerOnWires(t,s,feed),4000/.9,'электрическая мощность номинального режима');
  m.load=0;op=t.motorOperatingPoint(m,t.motorPhaseDirection(m));assert(op.rpm>1350&&op.rpm<1500);assert(op.current>0&&op.current<9);
  m.load=100;const removed=s.wires.pop();currents=t.clampWireCurrents();assert.equal(t.motorPhaseDirection(m),0);assert(currents[feed[0]]>0&&currents[feed[1]]>0);near(currents[feed[0]],currents[feed[1]],'ток двух последовательных обмоток');
  near(windingVoltage(t,m.id,'U1','W2'),190,'потеря фазы: половина линейного напряжения');near(windingVoltage(t,m.id,'W1','V2'),0,'потеря фазы: обесточенная обмотка');
  s.wires.push(removed);wire('IN','L1',m.id,'U2');assert.equal(t.motorPhaseDirection(m),0);near(windingVoltage(t,m.id,'U1','W2'),0,'звезда на фазе: одна обмотка без напряжения');
  currents=t.clampWireCurrents();near(currents[feed[0]],0,'нет тока в шунтированной обмотке');assert(currents[feed[1]]>9,'перенапряжение на оставшейся обмотке повышает ток');
}

// Тепловое реле: транзит на общей клемме не нагревает силовой тракт.
{
  const {t,s,wire}=fixture(),rel={id:1,kmId:1,set:10,settingRange:'9-13'};s.devices=[{id:1,type:'km1',coil:false},loadDevice(2,2200)];s.relays=[rel];
  wire('IN','L1','kk1','p0');wire('kk1','p0',2,'L');wire(2,'N','IN','N');
  t.thermalPhaseCurrents(rel,t.clampWireCurrents()).forEach(v=>near(v,0,'транзитный ток не проходит через реле'));
}
console.log('Физика цепей: сопротивление сети, УЗО, выбор защиты при КЗ, гребёнки, баланс мощности преобразователей, разрыв якоря, обмотки и номиналы АД, тепловое реле — OK.');
