/* DIN-аппараты: установка, свободные позиции, отмена переноса и сохранение проводов. */
const assert=require('assert'),{load}=require('./sandbox');
const DIN_TYPES=['klemma','pebus','mcb1','mcb3','rcd','meter','sensor','lamp','vfd','tp','timer','km1'];
function fixture(type,mobile){
  const e=load({interactive:true,mobile}),t=e.api,s=t.state;
  s.power=false;s.motors=[];s.relays=[];s.devices=[];s.wires=[];s.standaloneRails=false;
  const matrix={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};
  e.els.scene.getScreenCTM=()=>matrix;e.els.world.getScreenCTM=()=>matrix;
  const rails=t.mountingRails(),r=rails[0],r2=rails[1];
  const dev={id:1,type,rail:r.id,slot:0,on:true,tripped:false,tag:type==='rcd'?'QD1':'QF1',breakerType:'C25',ratedCurrent:25,ratedLeakageMa:30};
  const blocker={id:2,type:'mcb3',rail:r.id,slot:4,on:false,tag:'QF2',breakerType:'C25'};
  s.devices=[dev,blocker];s.wires=[{id:1,a:{devId:'IN',key:'L1'},b:{devId:1,key:t.termDefs(type,dev)[0].key},shape:'smooth',color:'#8b5a2b',pts:[],sectionMm2:2.5}];
  const body=e.makeEl('g');body.classList.add('dev');body.dataset.id='1';body.parentNode=e.els.deviceLayer;
  t.renderAll();t.resetActionHistory();
  return {e,t,s,r,r2,dev,blocker,body,pointerType:mobile?'touch':'mouse'};
}
function point(f,rail,slot){return {clientX:rail.x+slot*f.t.MODULE+15,clientY:rail.y-f.t.TYPES[f.dev.type].h/2+35};}
function origin(f){
  if(Number.isFinite(f.dev.x))return {clientX:f.dev.x+15,clientY:f.dev.y+35};
  return point(f,f.t.mountingRails().find(r=>r.id===f.dev.rail),f.dev.slot);
}
function event(f,target,type,p){
  f.e.pointer(target,type,Object.assign({pointerType:f.pointerType,pointerId:1},p));
}
function start(f){event(f,f.body,'pointerdown',origin(f));}
function move(f,p){event(f,f.e.window.document,'pointermove',p);f.e.runFrames();}
function end(f,p,type){event(f,f.e.window.document,type||'pointerup',p);f.e.runTimers(0);}
function placement(d){return JSON.stringify({rail:d.rail,slot:d.slot,x:d.x,y:d.y});}
for(const mobile of [false,true])for(const type of DIN_TYPES){
  const f=fixture(type,mobile),before=placement(f.dev),wire=JSON.stringify(f.s.wires),outside={clientX:2400,clientY:2700};
  start(f);move(f,outside);end(f,outside);
  assert.equal(placement(f.dev),before,'вне рейки аппарат возвращается на исходное место');
  assert.equal(JSON.stringify(f.s.wires),wire,'провода сохранены');
  assert.equal(f.t.actionCounts().undo,0,'неудачный перенос не занимает историю');
  assert.equal(f.dev.on,true,'перенос не отключает аппарат');
  start(f);const occupied=point(f,f.r,5);move(f,occupied);end(f,occupied);
  assert.equal(placement(f.dev),before,'нельзя перекрыть часть соседнего трёхполюсного автомата');
  start(f);const valid=point(f,f.r,7);move(f,valid);end(f,valid,'pointercancel');
  assert.equal(placement(f.dev),before,'отмена возвращает аппарат даже с допустимого места');
  start(f);move(f,valid);end(f,outside);
  assert.equal(placement(f.dev),before,'при отпускании перепроверяются координаты');
  start(f);move(f,valid);
  f.s.devices.push({id:3,type:'mcb1',rail:f.r.id,slot:7,on:false,tag:'QF3'});
  end(f,valid);
  assert.equal(placement(f.dev),before,'проверяется занятость именно при отпускании');
  f.s.devices=f.s.devices.filter(d=>d.id!==3);
  start(f);move(f,outside);end(f,valid);
  assert.equal(f.dev.rail,f.r.id);assert.equal(f.dev.slot,7,'на свободной позиции аппарат защёлкивается');
  assert(!Object.hasOwn(f.dev,'x')&&!Object.hasOwn(f.dev,'y'),'свободные координаты удалены');
  assert.equal(JSON.stringify(f.s.wires),wire);
  start(f);const second=point(f,f.r2,0);move(f,second);end(f,second);
  assert.equal(f.dev.rail,f.r2.id,'перенос на другую рейку');assert.equal(f.dev.slot,0);
  const td=f.t.termDefs(type,f.dev)[0],term=f.t.terminal(1,td.key);
  assert.equal(term.y,f.r2.y-f.t.TYPES[type].h/2+td.dy,'клеммы следуют за аппаратом');
  console.log('OK '+type+' '+(mobile?'touch':'mouse')+': рейка, занятое место, отмена, провода и другая рейка.');
}
for(const mobile of [false,true])for(const type of DIN_TYPES){
  const f=fixture('mcb3',mobile);
  const item=f.e.makeEl('div');item.classList.add('tray-item');item.dataset.type=type;item.parentNode=f.e.els.tray;
  const mini=f.e.makeEl('div');mini.classList.add('mini');mini.parentNode=item;
  const count=f.s.devices.length;
  function trayDrop(p){
    event(f,mini,'pointerdown',{clientX:20,clientY:20});move(f,p);end(f,p);
  }
  trayDrop({clientX:2400,clientY:2700});
  assert.equal(f.s.devices.length,count,'из лотка нельзя установить вне рейки');
  const rcdPoint=slot=>({clientX:f.r.x+slot*f.t.MODULE+f.t.TYPES[type].modules*f.t.MODULE/2,clientY:f.r.y});
  trayDrop(rcdPoint(5));assert.equal(f.s.devices.length,count,'из лотка нельзя установить на занятое место');
  event(f,mini,'pointerdown',{clientX:20,clientY:20});move(f,rcdPoint(7));end(f,{clientX:2400,clientY:2700});
  assert.equal(f.s.devices.length,count,'из лотка проверяется фактическое место отпускания');
  event(f,mini,'pointerdown',{clientX:20,clientY:20});move(f,rcdPoint(7));
  f.s.devices.push({id:3,type:'mcb1',rail:f.r.id,slot:7,on:false,tag:'QF3'});
  end(f,rcdPoint(7));assert.equal(f.s.devices.length,count+1,'новое занятое место не допускает наложения');
  f.s.devices=f.s.devices.filter(d=>d.id!==3);
  trayDrop(rcdPoint(7));assert.equal(f.s.devices.length,count+1,'установка из лотка на свободное место');
  const installed=f.s.devices.at(-1);assert.equal(installed.type,type);assert.equal(installed.rail,f.r.id);assert.equal(installed.slot,7);
}
const free=fixture('mcb1',false);free.dev.type='bulb';free.dev.x=100;free.dev.y=100;delete free.dev.rail;delete free.dev.slot;free.s.wires=[];
start(free);move(free,{clientX:315,clientY:355});end(free,{clientX:315,clientY:355});
assert.equal(free.dev.x,300);assert.equal(free.dev.y,320,'лампа сохраняет свободное размещение');
console.log('DIN-размещение мышью и касанием, пересечения и отмена: все проверки пройдены.');

/* Выступающие детали и пересечения между разными рейками. */
for(const mobile of [false,true]){
  const side=fixture('mcb1',mobile);
  side.dev.rail=side.r2.id;side.dev.slot=10;
  side.blocker.type='km1';side.blocker.slot=0;
  const before=placement(side.dev),pad=point(side,side.r,3);
  start(side);move(side,pad);end(side,pad);
  assert.equal(placement(side.dev),before,'аппарат не перекрывает боковую колодку A1–A2');
  const beside=point(side,side.r,4);start(side);move(side,beside);end(side,beside);
  assert.equal(side.dev.slot,4,'рядом с колодкой оставляется свободное место');

  const assembly=fixture('km1',mobile);
  assembly.s.relays=[{id:10,kmId:1,set:25,tripped:false}];
  assembly.s.devices.push({id:3,type:'mcb1',rail:assembly.r2.id,slot:7,on:false,tag:'QF3'});
  const initial=placement(assembly.dev),blocked=point(assembly,assembly.r,7);
  start(assembly);move(assembly,blocked);end(assembly,blocked);
  assert.equal(placement(assembly.dev),initial,'тепловое реле сборки не перекрывает аппарат следующей рейки');
  assert.equal(assembly.s.relays[0].kmId,1,'тепловое реле остаётся на пускателе');
  const clear=point(assembly,assembly.r,9);
  start(assembly);move(assembly,clear);end(assembly,clear);
  assert.equal(assembly.dev.slot,9,'сборка перемещается туда, где свободны все её габариты');

  const under=fixture('mcb1',mobile);
  under.dev.slot=10;under.blocker.type='km1';under.blocker.slot=0;
  under.s.relays=[{id:10,kmId:2,set:25,tripped:false}];
  const original=placement(under.dev),underRelay=point(under,under.r2,0);
  start(under);move(under,underRelay);end(under,underRelay);
  assert.equal(placement(under.dev),original,'обычный аппарат не перекрывает уже установленное тепловое реле');

  const attaching=fixture('km1',mobile);
  attaching.s.devices.push({id:3,type:'mcb1',rail:attaching.r2.id,slot:0,on:false,tag:'QF3'});
  const item=attaching.e.makeEl('div');item.classList.add('tray-item');item.dataset.type='kk1';item.parentNode=attaching.e.els.tray;
  const mini=attaching.e.makeEl('div');mini.classList.add('mini');mini.parentNode=item;
  const target={clientX:attaching.r.x+attaching.t.TYPES.km1.modules*attaching.t.MODULE/2,
    clientY:attaching.r.y+attaching.t.TYPES.km1.h/2+attaching.t.TYPES.kk1.h/2};
  function attach(){event(attaching,mini,'pointerdown',{clientX:20,clientY:20});move(attaching,target);end(attaching,target);}
  attach();assert.equal(attaching.s.relays.length,0,'реле не прикрепляется, если его корпус перекроет нижний аппарат');
  attaching.s.devices=attaching.s.devices.filter(d=>d.id!==3);
  attach();assert.equal(attaching.s.relays.length,1,'реле прикрепляется к пускателю при свободном месте');
  attach();assert.equal(attaching.s.relays.length,1,'два тепловых реле нельзя наложить на один пускатель');
}
console.log('Все DIN-аппараты, боковые колодки и сборки с тепловым реле: проверки пройдены.');
