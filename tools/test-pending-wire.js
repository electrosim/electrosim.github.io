const assert=require('assert/strict'),{load}=require('./sandbox');
const copy=value=>JSON.parse(JSON.stringify(value));
const near=(a,b)=>Math.abs(a-b)<1e-6;

function fixture(mobile){
  const e=load({interactive:true,mobile:!!mobile,width:430,height:860}),t=e.api,s=t.state,doc=e.window.document;
  s.power=false;s.devices=[
    {id:999,type:'mcb1',x:600,y:600,tag:'QF1'},
    {id:998,type:'mcb1',x:1050,y:600,tag:'QF2'},
    {id:997,type:'klemma',x:700,y:950,tag:'XN',wireEntrySide:'left'},
    {id:996,type:'klemma',x:900,y:950,tag:'XN',wireEntrySide:'right'}
  ];s.wires=[];s.relays=[];s.motors=[{id:'M1',kind:'ac',x:1200,y:950,scale:1}];s.pushbuttons=[];
  const width=430,height=860;
  e.els.scene.getBoundingClientRect=()=>({left:0,top:0,width,height});
  function matrix(world){
    if(!mobile)return {a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};
    const v=t.touchView(),a=Math.min(width/v.w,height/v.h),x=(width-v.w*a)/2-v.x*a,y=height-v.h*a-v.y*a+(world?200*a:0);
    return {a,b:0,c:0,d:a,e:x,f:y,inverse(){return {a:1/a,b:0,c:0,d:1/a,e:-x/a,f:-y/a};}};
  }
  e.els.scene.getScreenCTM=()=>matrix(false);e.els.world.getScreenCTM=()=>matrix(true);
  const terms=[];
  function hit(devId,key){
    const p=t.terminal(devId,key),el=e.makeEl('circle');assert(p,'существует клемма '+devId+' '+key);
    el.classList.add('term');el.dataset.dev=String(devId);el.dataset.key=key;el.setAttribute('cx',p.x);el.setAttribute('cy',p.y);el.parentNode=e.els.termLayer;terms.push(el);return el;
  }
  const source=hit(999,'t0'),target=hit(998,'t0');
  e.els.termLayer.querySelectorAll=()=>terms;
  function screen(p){const m=matrix(true);return {x:p.x*m.a+m.e,y:p.y*m.d+m.f};}
  function at(el){return screen(t.terminal(el.dataset.dev,el.dataset.key));}
  doc.elementFromPoint=(x,y)=>terms.find(el=>{const p=at(el);return Math.hypot(p.x-x,p.y-y)<8;})||e.els.scene;
  function pointer(el,type,p,id=1,pointerType=mobile?'touch':'mouse'){
    return e.pointer(el,type,{pointerType,pointerId:id,clientX:p.x,clientY:p.y});
  }
  function tap(el,p=at(el)){pointer(el,'pointerdown',p);pointer(el,'pointerup',p);}
  function move(el,p,id=1){pointer(el,'pointermove',p,id);e.runFrames();}
  function handle(){const el=e.makeEl('circle');el.classList.add('wire-pending-end');el.parentNode=e.els.wireLayer;return el;}
  function blank(){
    const free=t.touchPending()&&screen(t.touchPending().pt),avoid=terms.map(at).concat(free?[free]:[]);
    return [{x:40,y:400},{x:390,y:700},{x:40,y:700},{x:390,y:400}].sort((a,b)=>Math.min(...avoid.map(p=>Math.hypot(b.x-p.x,b.y-p.y)))-Math.min(...avoid.map(p=>Math.hypot(a.x-p.x,a.y-p.y))))[0];
  }
  return {e,t,s,doc,source,target,hit,screen,at,pointer,tap,move,handle,blank};
}
function endpoint(f){return copy(f.t.touchPending().pt);}
function preview(f){return f.e.els.wireLayer.innerHTML.slice(f.e.els.wireLayer.innerHTML.indexOf('class="wire-preview"'));}
function classes(svg,name){return [...svg.matchAll(/class="([^"]+)"/g)].filter(m=>m[1].split(/\s+/).includes(name)).length;}
function outward(f,el){
  const a=f.t.terminal(el.dataset.dev,el.dataset.key),b=f.t.touchPending().pt,v={top:[0,-1],bottom:[0,1],left:[-1,0],right:[1,0]}[a.entrySide];
  assert(v,'задан край корпуса');const dx=b.x-a.x,dy=b.y-a.y;
  assert(dx*v[0]+dy*v[1]>25,'свободный конец выходит наружу из клеммы '+a.entrySide);
  assert(near(dx*v[1]-dy*v[0],0),'начальный провод направлен перпендикулярно корпусу');
}
function freeFerruleJoint(f){
  const svg=preview(f),tip=endpoint(f),free=svg.match(/<g class="wire-ferrule"[^>]*transform="([^"]+)"[^>]*><g class="wire-free-ferrule">/);
  assert(free,'свободный НШВИ имеет собственное положение и направление');
  const transform=free[1].match(/translate\(([-\d.e+]+)[ ,]+([-\d.e+]+)\) rotate\(([-\d.e+]+)\)/i);
  assert(transform,'у наконечника заданы перенос и поворот');
  assert(near(+transform[1],tip.x)&&near(+transform[2],tip.y),'остриё металлического штырька находится точно в выбранной точке');
  const path=svg.match(/<path d="([^"]+)"/)[1],coords=(path.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number);
  const x=coords.at(-2)-tip.x,y=coords.at(-1)-tip.y,angle=+transform[3]*Math.PI/180,ux=Math.cos(angle),uy=Math.sin(angle);
  assert(near(Math.hypot(x,y),24),'изоляция заканчивается у заднего края 24-единичного НШВИ, не у металлического острия');
  assert(near(x*uy-y*ux,0)&&near(x*ux+y*uy,24),'изоляция касается заднего края на оси наконечника');
  const px=coords.at(-4)-tip.x,py=coords.at(-3)-tip.y;
  assert(near(px*uy-py*ux,0)&&px*ux+py*uy>=24,'последний участок изоляции входит в манжету сзади');
}

// Начальная петля в тот же винт недопустима при любом направлении ввода.
const pc=fixture(false);
for(const shape of ['smooth','straight','orthogonal','arc','s'])for(const ref of [[999,'t0'],[999,'b0'],[997,'k0'],[996,'k0'],['M1','U1']]){
  pc.t.wireDefaults.shape=shape;
  const el=pc.hit(...ref);pc.t.cancelWire();pc.pointer(el,'pointerdown',pc.at(el));outward(pc,el);
  const initial=endpoint(pc);pc.move(pc.doc,pc.at(el));assert.deepEqual(endpoint(pc),initial,'нависание мыши над исходной клеммой сохраняет короткий вывод');
  const a=pc.t.terminal(el.dataset.dev,el.dataset.key),dx=initial.x-a.x,dy=initial.y-a.y,len=Math.hypot(dx,dy),path=preview(pc).match(/<path d="([^"]+)"/)[1];
  const coords=(path.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)||[]).map(Number);
  for(let i=0;i<coords.length;i+=2){
    const x=coords[i]-a.x,y=coords[i+1]-a.y,along=(x*dx+y*dy)/len;
    assert(Math.abs(x*dy-y*dx)/len<.01,'короткий вывод не изгибается петлёй для формы '+shape);
    assert(along>0&&along<=len+.01,'начальный провод не возвращается в винт и не выходит за свободный конец');
  }
  assert.equal(classes(preview(pc),'wire-ferrule'),2,'на обоих концах есть НШВИ');
  assert.equal(classes(preview(pc),'wire-free-ferrule'),1,'один наконечник свободен');
  assert.equal(classes(preview(pc),'wire-ferrule-pin'),1,'металлическая часть видна только у свободного наконечника');
  freeFerruleJoint(pc);
}
// Толщина провода и форма трассы не меняют реальный стык изоляции с НШВИ.
for(const section of [.5,35])for(const shape of ['smooth','straight','orthogonal','arc','s']){
  pc.t.wireDefaults.sectionMm2=section;pc.t.wireDefaults.shape=shape;pc.t.cancelWire();pc.pointer(pc.source,'pointerdown',pc.at(pc.source));
  freeFerruleJoint(pc);
  for(const p of [{x:200,y:200},{x:1400,y:200},{x:200,y:1100},{x:1400,y:1100}]){pc.move(pc.doc,p);freeFerruleJoint(pc);}
}
pc.t.wireDefaults.sectionMm2=2.5;
pc.t.wireDefaults.shape='smooth';
pc.t.cancelWire();pc.pointer(pc.source,'pointerdown',pc.at(pc.source));
pc.move(pc.doc,{x:850,y:400});assert.deepEqual(endpoint(pc),{x:850,y:400},'свободный конец следует за мышью');
pc.move(pc.doc,pc.at(pc.target));assert(pc.t.touchPending().target,'курсор захватывает вторую клемму');
assert.equal(classes(preview(pc),'wire-free-ferrule'),0,'у захваченной клеммы НШВИ становится вставленным');
assert.equal(classes(preview(pc),'wire-ferrule-pin'),0,'вставленные металлические части скрыты');
pc.pointer(pc.doc,'pointerup',pc.at(pc.target));assert.equal(pc.s.wires.length,1,'мышью провод подключается');

// На телефоне касание выбирает начало, а перемещение поля не тянет конец провода.
const mobile=fixture(true);mobile.tap(mobile.source);assert(mobile.t.touchPending(),'короткое касание начинает провод');outward(mobile,mobile.source);
const fixed=endpoint(mobile),points=copy(mobile.t.touchPending().pts),beforeView=copy(mobile.t.touchView()),bg=mobile.blank();
mobile.pointer(mobile.e.els.scene,'pointerdown',bg);mobile.move(mobile.e.els.scene,{x:bg.x-45,y:bg.y+35});
assert.deepEqual(endpoint(mobile),fixed,'один палец переносит поле, сохраняя конец в координатах схемы');
assert.notDeepEqual(copy(mobile.t.touchView()),beforeView,'поле действительно передвинулось');
assert(mobile.e.els.touchLoupe.style.display==='none'||mobile.e.els.touchLoupe.hidden,'панорамирование не включает лупу провода');
mobile.pointer(mobile.e.els.scene,'pointerup',{x:bg.x-45,y:bg.y+35});
assert.deepEqual(copy(mobile.t.touchPending().pts),points,'панорамирование не добавляет точек маршрута');
const pinchStart=mobile.blank(),other={x:pinchStart.x+(pinchStart.x<215?140:-140),y:pinchStart.y};
mobile.pointer(mobile.e.els.scene,'pointerdown',pinchStart,1);mobile.pointer(mobile.e.els.scene,'pointerdown',other,2);
mobile.move(mobile.e.els.scene,{x:other.x+(other.x>pinchStart.x?60:-60),y:other.y},2);
mobile.pointer(mobile.e.els.scene,'pointerup',{x:other.x+(other.x>pinchStart.x?60:-60),y:other.y},2);mobile.pointer(mobile.e.els.scene,'pointerup',pinchStart,1);
assert.deepEqual(endpoint(mobile),fixed,'pinch сохраняет свободный конец на схеме');assert.deepEqual(copy(mobile.t.touchPending().pts),points,'pinch не добавляет точек');
const waypoint=mobile.blank();mobile.tap(mobile.e.els.scene,waypoint);
assert.equal(mobile.t.touchPending().pts.length,points.length+1,'касание фона добавляет ровно одну точку');
assert.deepEqual(endpoint(mobile),copy(mobile.t.touchPending().pts.at(-1)),'свободный конец останавливается в добавленной точке');
const free=mobile.handle(),from=mobile.screen(endpoint(mobile)),to={x:from.x+60,y:from.y-45};
mobile.pointer(free,'pointerdown',from);mobile.move(free,to);assert.notDeepEqual(endpoint(mobile),copy(mobile.t.touchPending().pts.at(-1)),'за наконечник можно потянуть провод');
mobile.pointer(free,'pointerup',to);const frozen=endpoint(mobile);mobile.move(mobile.e.els.scene,{x:to.x+60,y:to.y});assert.deepEqual(endpoint(mobile),frozen,'после отпускания на фоне конец остаётся на месте');
const count=mobile.t.touchPending().pts.length;assert.equal(count,points.length+1,'перетаскивание наконечника не создаёт скрытых точек');
const free2=mobile.handle(),from2=mobile.screen(endpoint(mobile));mobile.pointer(free2,'pointerdown',from2);mobile.move(free2,mobile.at(mobile.target));mobile.pointer(free2,'pointerup',mobile.at(mobile.target));
assert.equal(mobile.s.wires.length,1,'перетаскивание наконечника на клемму завершает провод');assert.equal(mobile.t.touchPending(),null,'после подключения черновик очищен');

const taps=fixture(true);taps.tap(taps.source);const shift=taps.blank();taps.pointer(taps.e.els.scene,'pointerdown',shift);taps.move(taps.e.els.scene,{x:shift.x-30,y:shift.y+20});taps.pointer(taps.e.els.scene,'pointerup',{x:shift.x-30,y:shift.y+20});taps.tap(taps.target);
assert.equal(taps.s.wires.length,1,'после переноса поля второе касание клеммы завершает провод');assert.equal(taps.s.wires[0].pts.length,0,'два касания и перенос поля соединяют клеммы без лишних точек');

// Прямое вытягивание из клеммы работает без обязательного предварительного tap.
const direct=fixture(true);direct.pointer(direct.source,'pointerdown',direct.at(direct.source));direct.move(direct.source,direct.at(direct.target));direct.pointer(direct.source,'pointerup',direct.at(direct.target));
assert.equal(direct.s.wires.length,1,'первым движением из клеммы можно сразу соединить вторую');
const resume=fixture(true);resume.tap(resume.source);
const resumeStart=resume.at(resume.source),resumeEnd={x:resumeStart.x+90,y:resumeStart.y-40};
resume.pointer(resume.source,'pointerdown',resumeStart);resume.move(resume.source,resumeEnd);resume.pointer(resume.source,'pointerup',resumeEnd);
assert(resume.t.touchPending(),'вытягивание из уже выбранной исходной клеммы не отменяет провод');
assert.equal(resume.t.touchPending().from.devId,999);assert.equal(resume.t.touchPending().pts.length,0);
resume.pointer(resume.source,'pointerdown',resume.at(resume.source));resume.move(resume.source,resume.at(resume.target));resume.pointer(resume.source,'pointerup',resume.at(resume.target));
assert.equal(resume.s.wires.length,1,'выбранный провод можно снова вытянуть из исходной клеммы до второй');

// Второй палец прерывает вытягивание и начинает обычное масштабирование.
const interrupted=fixture(true);interrupted.tap(interrupted.source);const grip=interrupted.handle(),ip=interrupted.screen(endpoint(interrupted));
interrupted.pointer(grip,'pointerdown',ip,1);interrupted.move(grip,{x:ip.x+40,y:ip.y+10},1);const paused=endpoint(interrupted);
const second=interrupted.blank();interrupted.pointer(interrupted.e.els.scene,'pointerdown',second,2);interrupted.move(interrupted.e.els.scene,{x:second.x+55,y:second.y+10},2);
interrupted.pointer(interrupted.e.els.scene,'pointerup',{x:second.x+55,y:second.y+10},2);interrupted.pointer(grip,'pointerup',{x:ip.x+40,y:ip.y+10},1);
assert.deepEqual(endpoint(interrupted),paused,'второй палец замораживает конец перед pinch');assert.equal(interrupted.t.touchPending().pts.length,0,'pinch во время вытягивания не оставляет точек');assert.equal(interrupted.s.wires.length,0,'pinch не подключает провод случайно');
const retry=interrupted.handle(),rp=interrupted.screen(endpoint(interrupted));interrupted.pointer(retry,'pointerdown',rp);interrupted.move(retry,{x:rp.x+25,y:rp.y+20});interrupted.pointer(retry,'pointercancel',{x:rp.x+25,y:rp.y+20});
assert.equal(interrupted.t.touchPointers.size,0,'pointercancel очищает сенсорный захват');
assert(interrupted.t.touchPending(),'отмена жеста сохраняет начатый провод');
const retry2=interrupted.handle(),rp2=interrupted.screen(endpoint(interrupted));interrupted.pointer(retry2,'pointerdown',rp2);interrupted.move(retry2,interrupted.at(interrupted.target));interrupted.pointer(retry2,'pointerup',interrupted.at(interrupted.target));assert.equal(interrupted.s.wires.length,1,'после отменённого жеста наконечник снова доступен');
const cancelled=fixture(true);cancelled.tap(cancelled.source);cancelled.e.els.touchCancel.dispatchEvent({type:'click',bubbles:true});
assert.equal(cancelled.t.touchPending(),null,'кнопка отмены удаляет черновик');assert.equal(classes(cancelled.e.els.wireLayer.innerHTML,'wire-preview'),0,'отменённый провод исчезает');assert.equal(cancelled.s.wires.length,0,'отмена не сохраняет провод');
// Втулка внутри гофры не рисуется поверх оболочки и не создаёт ложный выход.
const piped=fixture(false),create=piped.doc.createElementNS;
piped.doc.createElementNS=(ns,tag)=>{
  const el=create(ns,tag);
  if(tag==='path'){el.getTotalLength=()=>600;el.getPointAtLength=at=>({x:400+at,y:300});}
  return el;
};
piped.s.conduits=[{id:'pipe',pts:[{x:400,y:300},{x:1000,y:300}]}];
piped.pointer(piped.source,'pointerdown',piped.at(piped.source));piped.move(piped.doc,{x:700,y:300});
assert.equal(piped.t.touchPending().conduitId,'pipe');
assert.equal(classes(preview(piped),'wire-free-ferrule'),0,'свободный наконечник скрыт внутри гофры');
const pipePath=preview(piped).match(/<path d="([^"]+)"/)[1],pipeCoords=pipePath.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);
assert.equal(pipeCoords.at(-1),300,'предпросмотр заканчивается внутри гофры, не выходя сбоку');
console.log('Прокладка провода: короткий вывод, два НШВИ, видимый свободный штырёк; мышь, касания, pan, pinch, точки, прямое вытягивание и отмена — проверены.');
