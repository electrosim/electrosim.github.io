/* Пользовательские направляющие: события, привязка и сохранение геометрии. */
const assert=require('assert/strict'),{load}=require('./sandbox');
function setup(scale=1,mobile=false){
  const e=load({interactive:true,mobile}),t=e.api,s=t.state;
  s.power=false;s.motors=[];s.relays=[];s.devices=[];s.wires=[];s.panels=[];s.conduits=[];s.workbench=null;s.standaloneRails=false;
  s.special={inbox:false,multimeter:false};
  const m={a:scale,b:0,c:0,d:scale,e:0,f:0,inverse(){return {a:1/scale,b:0,c:0,d:1/scale,e:0,f:0};}};
  e.els.scene.getScreenCTM=()=>m;e.els.world.getScreenCTM=()=>m;
  const send=(target,type,p={})=>e.pointer(target,type,Object.assign({pointerType:mobile?'touch':'mouse',pointerId:11},p));
  const click=id=>send(e.els[id],'click');
  const add=(axis,x,y)=>{click(axis==='x'?'addVerticalGuide':'addHorizontalGuide');send(e.els.scene,'pointerdown',{clientX:x,clientY:y});send(e.els.scene,'pointerup',{clientX:x,clientY:y});e.runTimers(0);};
  function body(layer,attr,id,cl){const g=e.makeEl('g');if(cl)g.classList.add(cl);if(attr){g.setAttribute(attr,String(id));const key=attr.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());g.dataset[key]=String(id);}g.parentNode=e.els[layer];return g;}
  return {e,t,s,send,click,add,body};
}
for(const mobile of [false,true]){
  const {e,t,s,send,click,add,body}=setup(1,mobile);
  add('x',400,300);add('y',700,500);
  assert.equal(s.alignmentGuides.length,2,'мышь и касание ставят обе линии');
  assert.equal(s.alignmentGuides[0].position,400);assert.equal(s.alignmentGuides[1].position,500);
  assert(e.els.alignmentGuideLayer.innerHTML.includes('vector-effect="non-scaling-stroke"'));
  const id=s.alignmentGuides[0].id,g=body('alignmentGuideLayer','data-alignment-guide',id);
  send(g,'pointerdown',{clientX:400,clientY:22});send(e.window.document,'pointermove',{clientX:460,clientY:80});e.runFrames();send(e.window.document,'pointerup',{clientX:460,clientY:80});e.runTimers(0);
  assert.equal(s.alignmentGuides[0].position,460,'метка переносит линию');
  assert(t.undoAction());assert.equal(s.alignmentGuides[0].position,400);assert(t.redoAction());assert.equal(s.alignmentGuides[0].position,460);
  const again=body('alignmentGuideLayer','data-alignment-guide',id);
  send(again,'pointerdown',{clientX:460,clientY:22});send(e.window.document,'pointermove',{clientX:620,clientY:70});e.runFrames();send(e.window.document,'pointercancel',{clientX:620,clientY:70});e.runTimers(0);
  assert.equal(s.alignmentGuides[0].position,460,'отмена жеста возвращает линию');
  const saved=t.schemeSnapshot('Направляющие');t.applyPreset(saved);assert.equal(s.alignmentGuides.length,2);
  assert.equal(s.alignmentGuides[1].axis,'y');assert.equal(s.alignmentGuides[1].position,500);
  t.startAlignmentGuide('x');send(e.window.document,'keydown',{key:'Escape'});send(e.els.scene,'pointerdown',{clientX:800,clientY:800});send(e.els.scene,'pointerup',{clientX:800,clientY:800});assert.equal(s.alignmentGuides.length,2,'Escape отменяет создание');
  const selected=body('alignmentGuideLayer','data-alignment-guide',id);send(selected,'pointerdown',{clientX:460,clientY:22});send(e.window.document,'pointerup',{clientX:460,clientY:22});click('removeAlignmentGuide');e.runTimers(0);assert.equal(s.alignmentGuides.length,1);
  click('clearAlignmentGuides');e.runTimers(0);assert.equal(s.alignmentGuides.length,0);assert(t.undoAction());assert.equal(s.alignmentGuides.length,1);
}
for(const scale of [.2,1,4]){
  const {t,s,click}=setup(scale);s.alignmentGuides=[{id:'x',axis:'x',position:600},{id:'y',axis:'y',position:450}];
  const raw={x:600+9/scale,y:450-9/scale},p=t.snapAlignmentPoint(raw);
  assert.equal(p.x,600);assert.equal(p.y,450,'радиус привязки одинаков на экране');
  assert.equal(t.snapAlignmentPoint({x:600+11/scale,y:900}).x,600+11/scale,'вне радиуса нет притяжения');
  assert.equal(t.snapAlignmentPoint(raw,{shiftKey:true}).x,raw.x,'Shift отключает привязку');
  const box=t.snapAlignmentBox(600-100+5/scale,450-60-5/scale,200,120);assert.equal(box.x+100,600);assert.equal(box.y+60,450);
  click('alignmentSnapToggle');assert.equal(s.alignmentSnapEnabled,false);assert.equal(t.snapAlignmentPoint(raw).x,raw.x);
  const snap=t.schemeSnapshot('Без привязки');t.applyPreset(snap);assert.equal(s.alignmentSnapEnabled,false);
  t.applyPreset({state:{devices:[],wires:[]}});assert.equal(s.alignmentGuides.length,0);assert.equal(s.alignmentSnapEnabled,true,'старые схемы открываются без линий');
}
{
  const {e,t,s,send,body}=setup();s.alignmentGuides=[{id:'x',axis:'x',position:600},{id:'y',axis:'y',position:500}];
  const d={id:1,type:'outlet',x:100,y:200,tag:'XS1'};s.devices=[d];
  const g=body('deviceLayer','data-id',1,'dev'),w=t.TYPES.outlet.modules*t.MODULE,h=t.TYPES.outlet.h;
  send(g,'pointerdown',{clientX:110,clientY:210});send(e.window.document,'pointermove',{clientX:600-w/2+16,clientY:500-h/2+16});send(e.window.document,'pointerup',{clientX:600-w/2+16,clientY:500-h/2+16});
  assert.equal(d.x+w/2,600);assert.equal(d.y+h/2,500,'центр установленной розетки совпадает с пересечением');
}
{
  const {e,t,s,send,body}=setup();s.devices=[{id:1,type:'mcb3',x:100,y:400,tag:'QF1'},{id:2,type:'mcb3',x:500,y:400,tag:'QF2'}];
  s.wires=[{id:1,a:{devId:1,key:'t0'},b:{devId:2,key:'t0'},shape:'orthogonal',sectionMm2:2.5,pts:[]}];t.renderWires();
  const hit=[...e.els.wireLayer.innerHTML.matchAll(/class="wire-segment-hit" data-wire-segment="(\d+)" d="([^"]+)"/g)][0];assert(hit);
  const n=hit[2].match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number),x=(n[0]+n[2])/2,y=n[1],guide=y-80;
  s.alignmentGuides=[{id:'y',axis:'y',position:guide}];const g=body('wireLayer','data-wid',1),line=e.makeEl('path');line.setAttribute('data-wire-segment',hit[1]);line.dataset.wireSegment=hit[1];line.parentNode=g;
  send(line,'pointerdown',{clientX:x,clientY:y});send(e.window.document,'pointermove',{clientX:x+8,clientY:guide+7});send(e.window.document,'pointerup',{clientX:x+8,clientY:guide+7});
  assert(s.wires[0].pts.some(p=>p.y===guide),'сторона провода привязалась, хотя курсор не дошёл до линии');
  assert.equal(s.wires[0].a.devId,1);assert.equal(s.wires[0].b.devId,2,'клеммы сохранены');
  // Новый провод: промежуточная точка на пересечении пользовательских линий.
  s.wires=[];s.alignmentGuides=[{id:'x',axis:'x',position:350},{id:'y',axis:'y',position:200}];
  const term=body('termLayer','data-dev',1,'term');term.dataset.key='t0';term.setAttribute('data-key','t0');
  send(term,'pointerdown',{clientX:126.25,clientY:400});send(e.els.scene,'pointerdown',{clientX:356,clientY:207});send(e.els.scene,'pointerup',{clientX:356,clientY:207});
  assert.equal(t.touchPending().pts[0].x,350);assert.equal(t.touchPending().pts[0].y,200);
}
{
  const {t,s}=setup();t.applyPreset({state:{alignmentGuides:[null,{id:'a',axis:'x',position:50},{id:'a',axis:'y',position:70},{id:'bad',axis:'z',position:1},{id:'nan',axis:'y',position:Infinity}],devices:[],wires:[]}});
  assert.equal(s.alignmentGuides.length,1,'повреждённые и повторяющиеся линии отбрасываются');
}
for(const kind of ['motor','pushbutton','multimeter','inbox','panel','clamp']){
  const {e,t,s,send,body}=setup();s.alignmentGuides=[{id:'x',axis:'x',position:700},{id:'y',axis:'y',position:600}];
  let obj,w,h,g;
  if(kind==='motor'){obj={id:'M1',x:100,y:100,w:300,h:280,scale:1};s.motors=[obj];w=300;h=280;g=body('motorLayer','data-dev','M1','motor-draggable');}
  if(kind==='pushbutton'){obj={id:'PB1',x:100,y:100,w:260,h:300};s.pushbuttons=[obj];w=260;h=300;g=body('deviceLayer','data-dev','PB1','push-station');}
  if(kind==='multimeter'){obj=t.METER;obj.x=100;obj.y=100;w=obj.w;h=obj.h;s.special.multimeter=true;g=body('mmLayer',null,null,'multimeter-body');}
  if(kind==='inbox'){obj=t.INBOX;obj.x=100;obj.y=100;s.special.inbox=true;w=t.inboxWidth();h=obj.h;g=body('boxLayer','data-dev','IN','inbox-draggable');}
  if(kind==='panel'){obj={id:'PN1',x:100,y:100,railCount:2,fixed:false};s.panels=[obj];w=t.PANEL.width;h=t.panelHeight(obj);g=body('panelLayer','data-panel-id','PN1');}
  if(kind==='clamp'){obj={id:'CL1',x:100,y:100};s.clamps=[obj];w=100;h=0;g=body('clampLayer','data-clamp-id','CL1');}
  send(g,'pointerdown',{clientX:110,clientY:110});send(e.window.document,'pointermove',{clientX:700-w/2+16,clientY:600-h/2+16});e.runFrames();send(e.window.document,'pointerup',{clientX:700-w/2+16,clientY:600-h/2+16});
  assert.equal(obj.x+w/2,700,kind+' привязан по горизонтальному центру');assert.equal(obj.y+h/2,600,kind+' привязан по вертикальному центру');
}
{
  const {e,t,s,send,body}=setup();
  // Песочнице достаточно заглушки измерения SVG: здесь проверяем точки модели,
  // точное скругление и реальная геометрия гофры дополнительно проверены в Edge.
  const create=e.window.document.createElementNS;
  e.window.document.createElementNS=(ns,tag)=>{const el=create(ns,tag);if(tag==='path'){el.getTotalLength=()=>100;el.getPointAtLength=n=>({x:n,y:0});}return el;};
  s.alignmentGuides=[{id:'x',axis:'x',position:400},{id:'y',axis:'y',position:500}];
  t.startConduit();send(e.els.scene,'pointerdown',{clientX:406,clientY:100});send(e.els.scene,'pointerdown',{clientX:406,clientY:506});send(e.els.scene,'pointerdown',{clientX:800,clientY:506});t.finishConduit();
  const c=s.conduits[0];assert.equal(c.pts[0].x,400);assert.equal(c.pts.at(-1).y,500);
  s.alignmentGuides.push({id:'y2',axis:'y',position:650});const g=body('routingConduitLayer','data-conduit-id',c.id);
  send(g,'pointerdown',{clientX:600,clientY:500});send(e.window.document,'pointermove',{clientX:610,clientY:644});send(e.window.document,'pointerup',{clientX:610,clientY:644});
  assert.equal(c.pts.at(-1).y,650);assert.equal(c.pts.at(-2).y,650,'двигаются оба конца горизонтального участка');
  assert.equal(c.pts[0].x,400,'вертикальный участок сохранился');
}
console.log('Направляющие: мышь и касания, перенос и отмена, центры деталей, провод, масштаб, Shift, сохранение и старые схемы — OK.');
