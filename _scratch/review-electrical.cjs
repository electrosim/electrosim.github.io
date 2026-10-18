require('./review-preload.cjs');
const {load}=require('../tools/sandbox');
const fs=require('fs');
const results=[];
function fixture(voltage=220){
  const env=load(),t=env.api,s=t.state;
  s.power=true;s.special.inbox=true;s.panels[0].inletVoltage=voltage;
  s.devices=[];s.motors=[];s.relays=[];s.pushbuttons=[];s.wires=[];
  function wire(a,ak,b,bk){const id=s.wires.length+1;s.wires.push({id,a:{devId:a,key:ak},b:{devId:b,key:bk}});return id;}
  return {env,t,s,wire};
}
function note(name,actual,expected,defect){results.push({name,actual,expected,defect});console.log(JSON.stringify(results.at(-1)));}
function loadDevice(id,power=2200){return {id,type:'boiler',applianceOn:true,ratedPower:power};}
function breaker(id){return {id,type:'mcb1',tag:'QF'+id,on:true,tripped:false,breakerType:'C10'};}

{
  const {t,s,wire}=fixture();s.power=false;
  s.devices=[{id:1,type:'bulb',ratedPower:100},{id:2,type:'bulb',ratedPower:100}];
  wire(1,'L',2,'L');wire(1,'N',2,'N');
  const actual=t.resistanceBetween({devId:1,key:'L'},{devId:1,key:'N'}),expected=1/(1/484+1/484.1);
  note('parallel-resistance',actual,expected,Math.abs(actual-expected)>1);
}
for(const returnKey of ['PE','N']){
  const {t,s,wire}=fixture();const rcd={id:1,type:'rcd',on:true,tripped:false,ratedLeakageMa:30};
  s.devices=[rcd,loadDevice(2,2200)];
  wire('IN','L1',1,'tL');wire('IN','N',1,'tN');const live=wire(1,'bL',2,'L');wire(2,'N','IN',returnKey);
  const current=t.clampWireCurrents()[live],tripped=t.updateRcdLeakage();
  note('rcd-loaded-return-to-'+returnKey,{current,tripped,leakageMa:rcd.rcdLeakageMa},{current:10,tripped:true,leakageMa:10000},!tripped&&current>9);
}
{
  const {t,s,wire}=fixture();s.devices=[breaker(1),breaker(2),loadDevice(3,220)];
  wire('IN','L1',1,'t0');wire('IN','L1',2,'t0');wire(1,'b0',3,'L');wire(3,'N','IN','N');wire(2,'b0','IN','N');
  const map=t.potentialMap();t.electricalShortFault(map);
  note('wrong-branch-short-trip',{conflict:map.conflict,tripped:s.devices.filter(d=>d.tripped).map(d=>d.id)}, {tripped:[2]},s.devices[0].tripped&&!s.devices[1].tripped);
}
{
  const {t,s,wire}=fixture();const q1=Object.assign(breaker(1),{x:200,y:300}),q2=Object.assign(breaker(2),{x:200+t.MODULE,y:300});
  const comb={id:90,type:'comb',x:200,y:270,combPoles:1,combCount:2,combAnchorId:1};
  s.devices=[q1,q2,comb,loadDevice(3,1540),loadDevice(4,1540)];
  wire('IN','L1',1,'t0');const out1=wire(1,'b0',3,'L'),out2=wire(2,'b0',4,'L');wire(3,'N','IN','N');wire(4,'N','IN','N');
  const currents=t.clampWireCurrents(),indicated=t.breakerPoleCurrents(q1,currents)[0];
  let trip=null;for(let n=0;n<100&&!trip;n++)trip=t.breakerProtectionStep(.25,currents).tripped;
  note('comb-breaker-overcount',{memberCount:t.combMembers(comb).filter(Boolean).length,branch1:currents[out1],branch2:currents[out2],indicated,trip:trip&&trip.dev.id},{indicated:7,trip:null},indicated>13&&trip&&trip.dev.id===1);
}
for(const type of ['vfd','tp']){
  const {t,s,wire}=fixture(380);const drive={id:1,type,running:true,setFrequency:50,tpOn:true,setArmatureVoltage:220,fieldVoltage:220};
  s.devices=[drive,{id:2,type:'mcb3',on:true,breakerType:'C10'}];
  const inputIds=[];for(let p=0;p<3;p++){wire('IN','L'+(p+1),2,'t'+p);inputIds.push(wire(2,'b'+p,1,['R','S','T'][p]));}
  const outputIds=[];
  if(type==='vfd'){
    s.motors=[{id:'M1',kind:'ac',ratedCurrent:9,ratedPower:4,load:0,ratedFrequency:50,polePairs:2}];
    for(let p=0;p<3;p++)outputIds.push(wire(1,['U','V','W'][p],'M1',['U1','V1','W1'][p]));
  }else{
    const m=t.newDcMotor('MD1',0,0);m.rpmActual=1500;m.load=100;s.motors=[m];
    for(const k of ['ya1','ya2','sh1','sh2'])outputIds.push(wire(1,k,'MD1',k));
  }
  const currents=t.clampWireCurrents();
  note(type+'-input-current',{ready:type==='vfd'?drive.vfdInputReady:drive.tpInputReady,input:inputIds.map(id=>currents[id]),output:outputIds.map(id=>currents[id]),breaker:t.breakerPoleCurrents(s.devices[1],currents)}, {input:'nonzero when output delivers power'},inputIds.every(id=>currents[id]===0)&&outputIds.some(id=>currents[id]>1));
}
{
  const {t,s,wire}=fixture(380);const tp={id:1,type:'tp',tpOn:true,setArmatureVoltage:220,fieldVoltage:220};s.devices=[tp];
  const m=t.newDcMotor('MD1',0,0);m.rpmActual=1500;s.motors=[m];
  for(let p=0;p<3;p++)wire('IN','L'+(p+1),1,['R','S','T'][p]);
  for(const k of ['ya1','ya2','sh1','sh2'])wire(1,k,'MD1',k);
  s.wires=s.wires.filter(w=>w.b.devId!=='MD1'||w.b.key!=='ya1');
  const point=t.dcMotorOperatingPoint(m),before=m.rpmActual;t.dcMotorInertiaStep(m,.05);
  note('dc-open-armature-brakes',{present:point.armaturePresent,current:point.armatureCurrent,torque:point.torque,before,after:m.rpmActual},{current:0,torque:0,after:before},!point.armaturePresent&&Math.abs(point.armatureCurrent)>1&&m.rpmActual<1000);
}
{
  const {t,s,wire}=fixture(380);const m={id:'M1',kind:'ac',ratedCurrent:9,ratedPower:4,load:0,ratedFrequency:50,polePairs:2};s.motors=[m];
  for(let p=0;p<3;p++)wire('IN','L'+(p+1),'M1',['U1','V1','W1'][p]);
  wire('IN','L1','M1','U2');
  const map=t.potentialMap(),point=t.motorOperatingPoint(m,t.motorPhaseDirection(m));
  note('ac-energized-star-point',{conflict:map.conflict,direction:t.motorPhaseDirection(m),current:point.current,starToU1:Math.hypot(map.pot['M1/U1'].r-map.pot['M1/U2'].r,map.pot['M1/U1'].i-map.pot['M1/U2'].i)},{balanced:false,current:'must reflect zero U1 winding voltage and unbalance'},!map.conflict&&point.current===9);
}
{
  const {t,s,wire}=fixture();const km={id:1,type:'km1',coil:false},rel={id:1,kmId:1,set:10,settingRange:'9-13'},load=loadDevice(2,2200);
  s.devices=[km,load];s.relays=[rel];
  wire('IN','L1','kk1','p0');wire('kk1','p0',2,'L');wire(2,'N','IN','N');
  const currents=t.clampWireCurrents(),phases=t.thermalPhaseCurrents(rel,currents);
  note('thermal-terminal-transit',{wireCurrents:Object.values(currents),phases}, {phases:[0,0,0]},phases[0]>19);
}
{
  const {t,s,wire}=fixture(380);const m={id:'M1',kind:'ac',ratedCurrent:9,ratedPower:4,load:100,ratedFrequency:50,ratedSlipPercent:10,polePairs:2,rpmActual:108};s.motors=[m];
  for(let p=0;p<3;p++)wire('IN','L'+(p+1),'M1',['U1','V1','W1'][p]);
  const point=t.motorOperatingPoint(m,t.motorPhaseDirection(m)),instruments=t.motorInstrumentValues(m,point);
  note('ac-rated-load',{rpm:point.rpm,current:point.current,slipPercent:point.slipPercent,torque:instruments.torque}, {current:9,rpm:1350,slipPercent:10},point.current>6*m.ratedCurrent&&point.rpm<200);
}
{
  const {t,s,wire}=fixture(380);const m={id:'M1',kind:'ac',ratedCurrent:9,ratedPower:4,load:0,ratedFrequency:50,polePairs:2};s.motors=[m];
  const ids=[];for(let p=0;p<3;p++)ids.push(wire('IN','L'+(p+1),'M1',['U1','V1','W1'][p]));
  s.wires=s.wires.filter(w=>w.id!==ids[2]);const currents=t.clampWireCurrents();
  note('ac-one-phase-loss',{direction:t.motorPhaseDirection(m),currents:ids.slice(0,2).map(id=>currents[id])},{direction:0,currents:'nonzero in two remaining series-connected windings'},ids.slice(0,2).every(id=>currents[id]===0));
}
{
  const {t,s,wire}=fixture(380);const tp={id:1,type:'tp',tpOn:false,setArmatureVoltage:220,fieldVoltage:220};s.devices=[tp];
  const m=t.newDcMotor('MD1',0,0);s.motors=[m];
  for(let p=0;p<3;p++)wire('IN','L'+(p+1),1,['R','S','T'][p]);
  const sh1=wire(1,'sh1','MD1','sh1'),sh2=wire(1,'sh2','MD1','sh2');
  const currents=t.clampWireCurrents();note('tp-field-on-armature-off',{current1:currents[sh1],current2:currents[sh2]}, {current1:1,current2:1},currents[sh1]!==1||currents[sh2]!==1);
}
fs.writeFileSync(require('path').join(__dirname,'review-electrical-results.json'),JSON.stringify(results,null,2));
console.log('Reproduced defects: '+results.filter(r=>r.defect).length+'/'+results.length);
