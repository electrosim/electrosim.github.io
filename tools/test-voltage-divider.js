/* Последовательные и смешанные цепи: оба закона Кирхгофа и приборы. */
const assert=require('assert');
const {load}=require('./sandbox');
const env=load(),t=env.api,s=t.state;
s.power=true;s.special.inbox=true;s.panels[0].inletVoltage=220;
s.motors=[];s.relays=[];s.devices=[];s.wires=[];
let next=1;
const node=(devId,key)=>({devId,key});
function wire(a,b){const id=next++;s.wires.push({id,a,b});return id;}
function near(actual,expected,label){assert.ok(Math.abs(actual-expected)<1e-7,`${label}: ${actual}, ожидалось ${expected}`);}
function volts(a,b){const p=t.potentialMap().pot,va=p[t.nodeKey(a)],vb=p[t.nodeKey(b)];return va&&vb?Math.hypot(va.r-vb.r,va.i-vb.i):0;}
function bulb(id,power){return {id,type:'bulb',ratedPower:power,x:0,y:0};}
function series(a,b){
  s.devices=[a,b];s.wires=[];
  return [wire(node('IN','L1'),node(a.id,'L')),wire(node(a.id,'N'),node(b.id,'L')),wire(node(b.id,'N'),node('IN','N'))];
}
let a=bulb(1,100),b=bulb(2,100),ids=series(a,b);
near(volts(node(1,'L'),node(1,'N')),110,'равные сопротивления: первое 110 В');
near(volts(node(2,'L'),node(2,'N')),110,'равные сопротивления: второе 110 В');
let currents=t.clampWireCurrents();ids.forEach(id=>near(currents[id],220/(2*484),'одинаковый ток серии'));
assert.strictEqual(t.potentialMap().conflict,false,'нагрузка не считается коротким замыканием');

b.ratedPower=200;
near(volts(node(1,'L'),node(1,'N')),220*2/3,'большее сопротивление получает больше напряжения');
near(volts(node(2,'L'),node(2,'N')),220/3,'меньшее сопротивление получает меньше напряжения');
s.mm.fn='voltage';s.mm.a=node(1,'L');s.mm.b=node(1,'N');
assert.strictEqual(t.measureNow().display,'146.7 В','мультиметр не округляет падение до десятков вольт');

// Схема пользователя: холодильник 300 Вт и стиральная машина 2200 Вт.
a={id:1,type:'fridge',ratedPower:300,applianceOn:true};
b={id:2,type:'washer',ratedPower:2200,applianceOn:true};
ids=series(a,b);
near(volts(node(1,'L'),node(1,'N')),193.6,'холодильник');
near(volts(node(2,'L'),node(2,'N')),26.4,'стиральная машина');
currents=t.clampWireCurrents();ids.forEach(id=>near(currents[id],1.2,'ток клещей 1.2 А'));
near(volts(node(1,'L'),node(1,'N'))+volts(node(2,'L'),node(2,'N')),220,'сумма падений в контуре');

// Счётчик перед серией: P = 220 * 1.2 = 264 Вт.
const meter={id:3,type:'meter',energyKwh:0};s.devices.push(meter);
s.wires=[];wire(node('IN','L1'),node(3,'L_in'));
wire(node(1,'L'),node(3,'L_out')); // Обратный порядок концов провода.
wire(node(1,'N'),node(2,'L'));wire(node(2,'N'),node(3,'N_out'));
wire(node(3,'N_in'),node('IN','N'));
near(t.meterPowerW(meter),264,'активная мощность серии');
// Посторонняя параллельная нагрузка до счётчика не входит в его показания.
s.devices.push(bulb(4,100));wire(node('IN','L1'),node(4,'L'));wire(node(4,'N'),node('IN','N'));
near(t.meterPowerW(meter),264,'счётчик учитывает только свой выход');
const sensor={id:5,type:'sensor'};s.devices.push(sensor);
// Датчик внутри серии измеряет ток и частичное напряжение.
s.wires=s.wires.filter(w=>!(w.a.devId===1&&w.a.key==='N'&&w.b.devId===2));
wire(node(1,'N'),node(5,'L_in'));wire(node(5,'L_out'),node(2,'L'));
wire(node(5,'N_in'),node('IN','N'));
near(t.meterVoltage(sensor),26.4,'датчик видит падение на второй нагрузке');
near(t.meterPowerW(sensor)/t.meterVoltage(sensor),1.2,'датчик показывает ток при пониженном напряжении');
t.energyMeterTick();near(sensor.sensorCurrentA,1.2,'обновление показаний датчика');

// Две параллельные лампы после третьей: R + (R || R).
a=bulb(1,100);b=bulb(2,100);const c=bulb(3,100);
s.devices=[a,b,c];s.wires=[];
const feed=wire(node('IN','L1'),node(1,'L'));
const branch1=wire(node(1,'N'),node(2,'L'));
const branch2=wire(node(1,'N'),node(3,'L'));
wire(node(2,'N'),node('IN','N'));wire(node(3,'N'),node('IN','N'));
near(volts(node(1,'L'),node(1,'N')),220*2/3,'смешанная цепь: серия');
near(volts(node(2,'L'),node(2,'N')),220/3,'параллельная ветвь 1');
near(volts(node(3,'L'),node(3,'N')),220/3,'параллельная ветвь 2');
currents=t.clampWireCurrents();
near(currents[feed],currents[branch1]+currents[branch2],'сумма токов в узле');

// Разрыв возврата, выключенная или сгоревшая нагрузка не создают ток.
ids=series(a,b);s.wires.pop();
near(t.clampWireCurrents()[ids[0]],0,'разорванная цепь');
near(volts(node(1,'L'),node(1,'N')),0,'без возврата нет падения на резисторе');
ids=series(a,b);b.burned=true;
near(t.clampWireCurrents()[ids[0]],0,'сгоревшая нагрузка разрывает цепь');
near(volts(node(2,'L'),node(2,'N')),220,'на разрыве полное напряжение');
ids=series({id:1,type:'fridge',ratedPower:300,applianceOn:true},{id:2,type:'washer',ratedPower:2200,applianceOn:false});
near(t.clampWireCurrents()[ids[0]],0,'выключенная нагрузка разрывает серию');
s.devices[1].applianceOn=true;
near(t.clampWireCurrents()[ids[0]],1.2,'повторное включение восстанавливает ток');
s.power=false;near(t.clampWireCurrents()[ids[0]],0,'сеть выключена');
s.power=true;

// Между фазами: решаются обе составляющие фазора, сумма падений 380 В.
s.panels[0].inletVoltage=380;ids=series(bulb(1,100),bulb(2,100));
s.wires[2].b=node('IN','L2');
near(volts(node(1,'L'),node(1,'N')),190,'линейное напряжение делится пополам');
near(volts(node(2,'L'),node(2,'N')),190,'вторая половина линейного напряжения');
wire(node('IN','L1'),node('IN','L2'));
assert.strictEqual(t.potentialMap().conflict,true,'прямое КЗ фаз по-прежнему обнаруживается');
console.log('Делитель напряжения: серия, смешанные цепи, приборы, отключения и КЗ — проверки пройдены.');
