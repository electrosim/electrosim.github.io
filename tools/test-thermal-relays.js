/* Время-токовая характеристика, память и реальная цепь 95–96. */
const {load}=require('./sandbox');
const env=load({interactive:true}),t=env.api,s=t.state,check=env.check,near=env.near;
function isolated(set=10){
  s.devices=[];s.motors=[];s.wires=[];
  const r={id:5,kmId:4,set,heat:0,tripped:false};t.syncThermalSettings(r);s.relays=[r];
  for(let i=0;i<3;i++)s.wires.push({id:i+1,a:{devId:'kk5',key:'p'+i},b:{devId:'LOAD',key:'L'+i}});
  return r;
}
function currents(amperes){return {1:amperes,2:amperes,3:amperes};}
console.log('— характеристика класса 10A —');
let previous=Infinity;
for(const ratio of [1.2,1.5,2,3,6,7.2]){
  const seconds=t.thermalTripSeconds(ratio,0),r=isolated();
  check(ratio+' Ir: большая кратность сокращает выдержку',seconds<previous);previous=seconds;
  t.thermalProtectionStep(seconds-.01,currents(r.set*ratio));
  check(ratio+' Ir: до расчётной выдержки реле не сработало',!r.tripped);
  t.thermalProtectionStep(.02,currents(r.set*ratio));
  check(ratio+' Ir: после выдержки реле сработало',r.tripped);
}
near('7,2 Ir: 6 секунд холодного пуска',t.thermalTripSeconds(7.2,0),6,1e-9);
check('1,05 Ir: нет срабатывания за два часа',t.thermalTripSeconds(1.05,0)===Infinity);
check('1,5 Ir: горячее реле отключается менее чем за четыре минуты',t.thermalTripSeconds(1.5,1/(1.1*1.1))<240);
let r=isolated();t.thermalProtectionStep(7200,currents(10.5));check('1,05 Ir: моделирование двух часов не вызывает отключения',!r.tripped);
r=isolated();t.thermalProtectionStep(3600,currents(10));
check('номинальная нагрузка нагревает, но не отключает реле',r.heat>.8&&r.heat<1&&!r.tripped);
const hot=t.thermalTripSeconds(2,r.heat),cold=t.thermalTripSeconds(2,0);
check('предшествующая работа сокращает выдержку',hot<cold);
t.thermalProtectionStep(hot+.01,currents(20));check('горячее реле отключилось в рассчитанный момент',r.tripped);
const heatBeforeReset=r.heat;
t.resetRelay(r);check('RESET разрешён сразу после перегрузки и сохраняет нагрев',!r.tripped&&r.heat===heatBeforeReset);
t.thermalProtectionStep(.25,currents(20));check('при продолжающейся перегрузке реле снова срабатывает',r.tripped);
t.thermalProtectionStep(130,currents(0));const cooled=r.heat;
t.resetRelay(r);check('после охлаждения RESET разрешён и сохраняет остаточный нагрев',!r.tripped&&r.heat===cooled&&cooled>0);
r=isolated();t.testRelay(r);t.resetRelay(r);check('TEST холодного реле допускает ручной возврат',!r.tripped);
r=isolated();t.thermalProtectionStep(20,currents(20));const oneStep=r.heat;
r=isolated();for(let i=0;i<80;i++)t.thermalProtectionStep(.25,currents(20));
near('нагрев не зависит от размера шага таймера',r.heat,oneStep,1e-10);
r=isolated(.2);t.thermalProtectionStep(6.01,currents(1.44));check('малые уставки не округляются до одного ампера',r.tripped);
r=isolated();t.thermalProtectionStep(6.01,{1:72,2:10,3:10});check('перегрузка одной фазы также отключает реле',r.tripped);

console.log('— диапазон, шкала и окно характеристик —');
r=isolated();r.settingRange='7-10';r.set=9;
t.openProperties({kind:'relay',id:r.id});
const rangeInput={value:'2.5-4',getAttribute(){return 'settingRange';}},setInput={value:'9'};
env.els.propertiesFields.querySelector=sel=>sel.includes('settingRange')?rangeInput:sel.includes('"set"')?setInput:null;
env.els.propertiesFields.dispatchEvent({type:'change',target:rangeInput,bubbles:false});
check('смена диапазона сразу обновляет границы и уставку',setInput.min===2.5&&setInput.max===4&&Number(setInput.value)===4);
setInput.value='3.2';t.saveProperties();check('уставка сохраняется в выбранном диапазоне',r.settingRange==='2.5-4'&&r.set===3.2);
check('шкала модели отражает выбранную уставку',t.deviceInner('kk1',r).includes('уставка 3,2 А'));
t.cycleSetpoint(r);check('регулятор действует в выбранном диапазоне',r.set>3.2&&r.set<=4);

console.log('— ток реальной схемы и отключение катушки —');
s.power=true;s.special.inbox=true;s.panels=[];s.devices=[{id:4,type:'km1',coil:true,tag:'KM1'}];
s.motors=[{id:'M1',tag:'M1',kind:'ac',load:0,polePairs:2,ratedSlipPercent:10,ratedFrequency:50,ratedVoltage:380,ratedCurrent:9,ratedPower:4}];
r={id:5,kmId:4,set:4.5,heat:0,tripped:false};s.relays=[r];s.wires=[];let id=1;
function wire(aDev,aKey,bDev,bKey){s.wires.push({id:id++,a:{devId:aDev,key:aKey},b:{devId:bDev,key:bKey}});}
for(let i=0;i<3;i++){wire('IN','L'+(i+1),4,'t'+i);wire('kk5','p'+i,'M1',['U1','V1','W1'][i]);}
wire('IN','L1','kk5','r3');wire('kk5','r2',4,'A1');wire('IN','N',4,'A2');
t.renderAll();check('катушка питается через нормально закрытый 95–96',s.devices[0].coil);
const real=t.clampWireCurrents();t.thermalPhaseCurrents(r,real).forEach((v,i)=>near('реальный ток фазы '+i,v,9,.05));
t.thermalProtectionStep(t.thermalTripSeconds(2,0)+.5,real);t.renderAll();
check('тепловая защита размыкает 95–96, пускатель отпускает',r.tripped&&!s.devices[0].coil);
check('после отпускания ток через реле исчезает',Math.max(...t.thermalPhaseCurrents(r,t.clampWireCurrents()))<.01);
const links=t.internalLinks(),hasPair=(a,b)=>links.some(pair=>pair.every(n=>n.devId==='kk5')&&[a,b].every(k=>pair.some(n=>n.key===k)));
check('после срабатывания 97–98 замкнут, 95–96 разомкнут',hasPair('r0','r1')&&!hasPair('r2','r3'));
console.log(env.fails()?'ПРОВАЛЕНО проверок: '+env.fails():'тепловая защита: все проверки пройдены');
process.exit(env.fails()?1:0);
