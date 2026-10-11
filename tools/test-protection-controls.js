/* Управление защитными аппаратами: только рукоятка/TEST, корпус — для переноса. */
const assert=require('assert');
const {load}=require('./sandbox');
function fixture(type,mobile){
  const e=load({interactive:true,mobile:!!mobile}),t=e.api,s=t.state;
  s.power=false;s.motors=[];s.relays=[];s.wires=[];s.panels=[];s.rails=[];
  const dev={id:1,type,x:100,y:100,on:false,tripped:false,tag:type==='rcd'?'QD1':'QF1',breakerType:'C25',ratedCurrent:25,ratedLeakageMa:30};
  s.devices=[dev];
  const matrix={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};
  e.els.scene.getScreenCTM=()=>matrix;e.els.world.getScreenCTM=()=>matrix;
  const body=e.makeEl('g');body.classList.add('dev');body.dataset.id='1';body.parentNode=e.els.deviceLayer;
  const label=e.makeEl('text');label.parentNode=body;
  const handle=e.makeEl('g');handle.classList.add('hdl');handle.parentNode=body;
  const paddle=e.makeEl('rect');paddle.parentNode=handle;
  const test=e.makeEl('g');test.setAttribute('data-rcd-test','1');test.parentNode=body;
  const testLabel=e.makeEl('text');testLabel.parentNode=test;
  t.renderAll();t.resetActionHistory();
  return {e,t,s,dev,body,label,paddle,testLabel,pointerType:mobile?'touch':'mouse'};
}
function event(f,target,type,more){
  return f.e.pointer(target,type,Object.assign({pointerType:f.pointerType,pointerId:1,clientX:300,clientY:300},more));
}
function tap(f,target){
  event(f,target,'pointerdown');event(f,target,'pointerup');f.e.runTimers(0);
}
for(const mobile of [false,true])for(const type of ['mcb1','mcb3','rcd']){
  const f=fixture(type,mobile),name=type+' '+(mobile?'touch':'mouse'),d=f.dev;
  tap(f,f.label);assert.equal(d.on,false,name+': корпус не включает');
  assert.equal(f.t.actionCounts().undo,0,name+': клик корпуса не создаёт действие');
  d.on=true;tap(f,f.label);assert.equal(d.on,true,name+': корпус не отключает');
  d.on=false;d.tripped=true;tap(f,f.label);
  assert.equal(d.tripped,true,name+': корпус не взводит сработавший аппарат');
  d.tripped=false;tap(f,f.paddle);assert.equal(d.on,true,name+': дочерний элемент рукоятки включает');
  tap(f,f.paddle);assert.equal(d.on,false,name+': рукоятка отключает');
  d.tripped=true;tap(f,f.paddle);
  assert.equal(d.tripped,false,name+': рукоятка взводит');
  assert.equal(d.on,false,name+': взведение не включает сразу');
  tap(f,f.paddle);assert.equal(d.on,true,name+': повторный клик включает');
  event(f,f.paddle,'pointerdown');event(f,f.paddle,'pointercancel');
  assert.equal(d.on,true,name+': отмена не отключает');
  event(f,f.body,'pointerdown');
  event(f,f.body,'pointermove',{clientX:350,clientY:330});f.e.runFrames();
  event(f,f.body,'pointerup',{clientX:350,clientY:330});
  assert.equal(d.on,true,name+': перенос корпуса не отключает');
  assert.equal(d.x,150,name+': корпус перемещается по X');
  assert.equal(d.y,130,name+': корпус перемещается по Y');
  event(f,f.paddle,'pointerdown');event(f,f.e.window.document,'pointerup');f.e.runTimers(0);
  assert.equal(d.on,false,name+': отпускание на document завершает клик ручки');
  d.on=true;
  event(f,f.paddle,'pointerdown');
  event(f,f.paddle,'pointermove',{clientX:350,clientY:330});f.e.runFrames();
  event(f,f.paddle,'pointerup',{clientX:350,clientY:330});
  assert.equal(d.on,true,name+': перенос за ручку не отключает');
  assert.equal(d.x,200,name+': перенос за ручку сохраняется');
  console.log('OK '+name+': корпус, ручка, взведение, отмена и перенос.');
}
for(const type of ['mcb1','mcb3','rcd']){
  const f=fixture(type,true);
  event(f,f.paddle,'pointerdown');f.e.runTimers(600);event(f,f.paddle,'pointerup');
  assert.equal(f.dev.on,false,type+': долгое нажатие не включает');
  event(f,f.paddle,'pointerdown');
  event(f,f.e.els.scene,'pointerdown',{pointerId:2,clientX:500});
  event(f,f.e.els.scene,'pointerup',{pointerId:2,clientX:500});
  event(f,f.paddle,'pointerup');
  assert.equal(f.dev.on,false,type+': жест двумя пальцами не включает');
}
function terminalNearby(f){
  const matrix={a:.1,b:0,c:0,d:.1,e:0,f:0,inverse(){return {a:10,b:0,c:0,d:10,e:0,f:0};}};
  f.e.els.scene.getScreenCTM=()=>matrix;f.e.els.world.getScreenCTM=()=>matrix;
  const terminal=f.e.makeEl('circle');terminal.classList.add('term');
  terminal.dataset.dev='IN';terminal.dataset.key='L1';terminal.setAttribute('cx',3000);terminal.setAttribute('cy',3000);terminal.parentNode=f.e.els.termLayer;
  f.e.els.termLayer.querySelectorAll=()=>[terminal];
  assert.equal(f.t.nearestTouchTerminal({clientX:300,clientY:300}),terminal,'рядом действительно находится клемма');
}
const small=fixture('mcb3',true);terminalNearby(small);
tap(small,small.paddle);
assert.equal(small.dev.on,true,'при отдалении касание ручки не уходит на клемму');
assert.equal(small.t.touchPending(),null,'касание ручки не начинает провод');
for(const mobile of [false,true]){
  const f=fixture('rcd',mobile);f.s.special.inbox=true;f.s.power=true;f.dev.on=true;
  f.s.wires=[
    {id:1,a:{devId:'IN',key:'L1'},b:{devId:1,key:'tL'}},
    {id:2,a:{devId:'IN',key:'N'},b:{devId:1,key:'tN'}}
  ];
  if(mobile)terminalNearby(f);
  tap(f,f.testLabel);
  assert.equal(f.dev.tripped,true,'TEST '+(mobile?'touch':'mouse')+': кнопка проверяет УЗО');
  assert.equal(f.dev.on,false,'TEST размыкает полюса');
  assert.equal(f.t.touchPending(),null,'TEST не начинает провод');
}
const history=fixture('mcb1',true);
tap(history,history.paddle);
assert.equal(history.t.actionCounts().undo,1,'одно касание ручки — одно действие');
history.t.undoAction();
assert.equal(history.s.devices[0].on,false,'переключение отменяется');
history.t.redoAction();
assert.equal(history.s.devices[0].on,true,'переключение повторяется');
console.log('Управление только рукоятками, TEST, сенсорные жесты и история — проверки пройдены.');
