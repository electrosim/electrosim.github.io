const {load}=require('./sandbox');

let fails=0;
function check(name,value){
  if(value)console.log('  ok   '+name);
  else{fails++;console.log('  FAIL '+name);}
}
function wheel(box,delta){return box.pointer(box.els.scene,'wheel',{pointerType:'mouse',deltaY:delta,clientX:500,clientY:400});}

console.log('ПК: отдельная геометрия и управление мышью');
const pc=load({interactive:true,width:1575,height:892});
check('мобильная компоновка на ПК выключена',!pc.api.mobileTouchLayout()&&!pc.window.document.documentElement.classList.contains('touch-ui'));
check('исходный масштаб 100%',pc.api.touchView().w===1240&&pc.api.touchView().h===1550);
const out=wheel(pc,120);
check('колесо отдаляет и отменяет прокрутку страницы',out.defaultPrevented&&pc.api.touchView().w>1240);
for(let i=0;i<40;i++)wheel(pc,120);
check('максимальное отдаление достижимо',pc.api.touchView().w===1736);
for(let i=0;i<80;i++)wheel(pc,-120);
check('максимальное приближение достижимо',pc.api.touchView().w===155);

console.log('\nМобильный режим: жест двумя пальцами');
const mobile=load({interactive:true,mobile:true,width:430,height:860});
function geometry(box,width,height){
  box.els.scene.getBoundingClientRect=()=>({left:0,top:0,width,height});
  function matrix(world){
    const v=box.api.touchView(),a=Math.min(width/v.w,height/v.h);
    const e=(width-v.w*a)/2-v.x*a,f=(height-v.h*a)/2-v.y*a+(world?200*a:0);
    return {a,b:0,c:0,d:a,e,f,inverse(){return {a:1/a,b:0,c:0,d:1/a,e:-e/a,f:-f/a};}};
  }
  box.els.scene.getScreenCTM=()=>matrix(false);
  box.els.world.getScreenCTM=()=>matrix(true);
}
function point(box,x,y){const m=box.els.scene.getScreenCTM();return {x:x*m.a+m.e,y:y*m.d+m.f};}
function scenePoint(box,x,y){const m=box.els.scene.getScreenCTM().inverse();return {x:x*m.a+m.e,y:y*m.d+m.f};}
function close(a,b){return Math.abs(a-b)<1e-6;}
geometry(mobile,430,860);
check('мобильная компоновка включена',mobile.api.mobileTouchLayout()&&mobile.window.document.documentElement.classList.contains('touch-ui'));
const before=mobile.api.touchView().w;
mobile.pointer(mobile.els.scene,'pointerdown',{pointerId:1,clientX:100,clientY:300});
mobile.pointer(mobile.els.scene,'pointerdown',{pointerId:2,clientX:300,clientY:300});
const anchor=scenePoint(mobile,200,300);
mobile.pointer(mobile.els.scene,'pointermove',{pointerId:2,clientX:380,clientY:300});
check('движения объединяются до кадра отрисовки',mobile.api.touchView().w===before);
mobile.runFrames();
check('разведение пальцев приближает',mobile.api.touchView().w<before);
let p=point(mobile,anchor.x,anchor.y);
check('точка под центром пальцев сохраняется с полями SVG',close(p.x,240)&&close(p.y,300));
mobile.pointer(mobile.els.scene,'pointerup',{pointerId:2,clientX:380,clientY:300});
const singleAnchor=scenePoint(mobile,100,300);
mobile.pointer(mobile.els.scene,'pointermove',{pointerId:1,clientX:80,clientY:320});
mobile.runFrames();p=point(mobile,singleAnchor.x,singleAnchor.y);
check('после pinch один палец продолжает перенос без скачка',close(p.x,80)&&close(p.y,320));
mobile.pointer(mobile.els.scene,'pointerup',{pointerId:1,clientX:80,clientY:320});
check('жест полностью завершается',mobile.api.touchPointers.size===0);

console.log('\nАльбомная ориентация и перенос по закреплённому щиту');
const landscape=load({interactive:true,mobile:true,width:860,height:430});
geometry(landscape,860,430);
const plate=landscape.makeEl('g');plate.setAttribute('data-panel-id',landscape.api.state.panels[0].id);
plate.dataset.panelId=landscape.api.state.panels[0].id;plate.parentNode=landscape.els.panelLayer;
const panel=landscape.api.state.panels[0],panelX=panel.x,panelY=panel.y;
const landscapeAnchor=scenePoint(landscape,430,215);
landscape.pointer(plate,'pointerdown',{pointerId:1,clientX:430,clientY:215});
landscape.pointer(plate,'pointermove',{pointerId:1,clientX:410,clientY:205});landscape.runFrames();
p=point(landscape,landscapeAnchor.x,landscapeAnchor.y);
check('один палец двигает поле по закреплённому щиту',close(p.x,410)&&close(p.y,205));
check('сам щит остаётся на месте',panel.x===panelX&&panel.y===panelY);
landscape.pointer(plate,'pointerdown',{pointerId:2,clientX:610,clientY:205});
const wideAnchor=scenePoint(landscape,510,205);
landscape.pointer(plate,'pointermove',{pointerId:2,clientX:650,clientY:205});landscape.runFrames();
p=point(landscape,wideAnchor.x,wideAnchor.y);
check('pinch учитывает боковые поля альбомного экрана',close(p.x,530)&&close(p.y,205));
landscape.pointer(plate,'pointercancel',{pointerId:2,clientX:650,clientY:205});
landscape.pointer(plate,'pointercancel',{pointerId:1,clientX:410,clientY:205});
check('отмена жеста очищает активные касания',landscape.api.touchPointers.size===0);

console.log('\nПровода, нажатия и границы масштаба');
const editing=load({interactive:true,mobile:true,width:430,height:860});geometry(editing,430,860);
const term=editing.makeEl('circle');term.classList.add('term');
term.dataset.dev='IN';term.dataset.key='L1';term.parentNode=editing.els.termLayer;
editing.pointer(term,'pointerdown',{pointerId:1,clientX:150,clientY:300});
editing.pointer(term,'pointerup',{pointerId:1,clientX:150,clientY:300});
check('касание клеммы начинает провод',!!editing.api.touchPending());
check('при незавершённом проводе доступна отмена',!editing.els.touchCancel.disabled);
const pending=editing.api.touchPending();
editing.pointer(editing.els.scene,'pointerdown',{pointerId:1,clientX:100,clientY:400});
editing.pointer(editing.els.scene,'pointerdown',{pointerId:2,clientX:300,clientY:400});
editing.pointer(editing.els.scene,'pointermove',{pointerId:2,clientX:400,clientY:400});editing.runFrames();
editing.pointer(editing.els.scene,'pointerup',{pointerId:2,clientX:400,clientY:400});
editing.pointer(editing.els.scene,'pointerup',{pointerId:1,clientX:100,clientY:400});
check('масштабирование сохраняет черновик провода',editing.api.touchPending()===pending&&editing.api.state.wires.length===0);
editing.els.touchCancel.dispatchEvent({type:'click',bubbles:true});
check('отмена в меню завершает прокладку',!editing.api.touchPending()&&editing.els.touchCancel.disabled);
const mode=editing.makeEl('g');mode.classList.add('mm-mode');mode.setAttribute('data-mm-fn','resistance');mode.parentNode=editing.els.mmLayer;
editing.pointer(mode,'pointerdown',{pointerId:1,clientX:150,clientY:300});
editing.pointer(mode,'pointerup',{pointerId:1,clientX:150,clientY:300});
check('короткое касание кнопки работает',editing.api.state.mm.fn==='resistance');

const limit=load({interactive:true,mobile:true});geometry(limit,430,860);
limit.pointer(limit.els.scene,'pointerdown',{pointerId:1,clientX:210,clientY:400});
limit.pointer(limit.els.scene,'pointerdown',{pointerId:2,clientX:220,clientY:400});
limit.pointer(limit.els.scene,'pointermove',{pointerId:2,clientX:10000,clientY:400});limit.runFrames();
check('pinch соблюдает максимальное приближение',limit.api.touchView().w===155);
limit.pointer(limit.els.scene,'pointermove',{pointerId:2,clientX:210.01,clientY:400});limit.runFrames();
check('pinch соблюдает максимальное отдаление',limit.api.touchView().w===1736);
limit.pointer(limit.els.scene,'pointerup',{pointerId:2,clientX:210.01,clientY:400});
limit.pointer(limit.els.scene,'pointerup',{pointerId:1,clientX:210,clientY:400});

if(fails){console.error('\nОшибок: '+fails);process.exit(1);}
console.log('\nМышь и сенсорное управление разделены; все проверки пройдены.');
