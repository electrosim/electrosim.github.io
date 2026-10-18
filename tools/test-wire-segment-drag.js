const assert=require('assert/strict'),{load}=require('./sandbox');
function setup(shape='orthogonal',pts=[]){
 const e=load({interactive:true}),t=e.api,s=t.state,m={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};
 e.els.scene.getScreenCTM=()=>m;e.els.world.getScreenCTM=()=>m;
 s.power=false;s.devices=[{id:1,type:'mcb3',x:100,y:400,tag:'QF1'},{id:2,type:'mcb3',x:500,y:400,tag:'QF2'}];s.relays=[];s.motors=[];s.wires=[{id:1,a:{devId:1,key:'t0'},b:{devId:2,key:'t0'},shape,sectionMm2:2.5,color:'#8b5a2b',pts}];
 t.renderWires();return {e,t,s};
}
function hits(env){return [...env.e.els.wireLayer.innerHTML.matchAll(/class="wire-segment-hit" data-wire-segment="(\d+)" d="([^"]+)"/g)].map(m=>{const n=m[2].match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);return {index:+m[1],a:{x:n[0],y:n[1]},b:{x:n[2],y:n[3]}};});}
function path(env){const {t,s}=env,w=s.wires[0];return t.wirePathD(t.terminal(w.a.devId,w.a.key),t.terminal(w.b.devId,w.b.key),w);}
function drag(env,hit,dx,dy,fraction=.5){
 const {e,t,s}=env,g=e.makeEl('g'),h=e.makeEl('path');g.dataset.wid='1';g.setAttribute('data-wid','1');g.parentNode=e.els.wireLayer;h.dataset.wireSegment=String(hit.index);h.setAttribute('data-wire-segment',String(hit.index));h.parentNode=g;
 const p={x:hit.a.x+(hit.b.x-hit.a.x)*fraction,y:hit.a.y+(hit.b.y-hit.a.y)*fraction},before=JSON.stringify(s.wires[0].pts);
 e.pointer(h,'pointerdown',{pointerType:'mouse',clientX:p.x,clientY:p.y});assert.equal(JSON.stringify(s.wires[0].pts),before,'захват не меняет трассу');
 e.pointer(e.window.document,'pointermove',{pointerType:'mouse',clientX:p.x+dx,clientY:p.y+dy});
 e.pointer(e.window.document,'pointerup',{pointerType:'mouse',clientX:p.x+dx,clientY:p.y+dy});e.runTimers(0);
 const d=path(env);assert(!/NaN|Infinity/.test(d));
 const values=d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number),w=s.wires[0],a=t.wireVisualEndpoint(t.terminal(1,'t0'),w),b=t.wireVisualEndpoint(t.terminal(2,'t0'),w);
 assert.deepEqual(values.slice(0,2),[a.x,a.y],'начальная клемма закреплена');assert.deepEqual(values.slice(-2),[b.x,b.y],'конечная клемма закреплена');
 let previous=null,lastTangent=null;
 for(const command of d.match(/[MLQC][^MLQC]*/g)||[]){
  const nums=command.slice(1).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number),points=[];for(let i=0;i<nums.length;i+=2)points.push({x:nums[i],y:nums[i+1]});
  if(command[0]==='M'){previous=points[0];continue;}
  const curve=[previous,...points];
  if(command[0]==='L')assert(Math.abs(points[0].x-previous.x)<1e-6||Math.abs(points[0].y-previous.y)<1e-6,'прямые участки остаются горизонтальными или вертикальными');
  function tangent(end){const base=curve[end?curve.length-1:0];for(let i=end?curve.length-2:1;end?i>=0:i<curve.length;i+=end?-1:1){const dx=(curve[i].x-base.x)*(end?-1:1),dy=(curve[i].y-base.y)*(end?-1:1),len=Math.hypot(dx,dy);if(len>1e-7)return [dx/len,dy/len];}return null;}
  const incoming=tangent(false);if(incoming&&lastTangent)assert(incoming[0]*lastTangent[0]+incoming[1]*lastTangent[1]>1-2e-6,'изгибы сохраняют плавность');lastTangent=tangent(true)||lastTangent;previous=points.at(-1);
 }

 return d;
}
{
 const a=setup(),b=setup();assert(!a.e.els.wireLayer.innerHTML.includes('class="wire-dot"'),'у прямоугольного провода нет точечных ручек');
 const hit=hits(a)[0],y=hit.a.y;const first=drag(a,hit,35,-60,.2),second=drag(b,hits(b)[0],35,-60,.8);assert.equal(first,second,'любая точка стороны даёт одно перемещение');
 const horizontal=hits(a).find(h=>Math.abs(h.a.y-h.b.y)<1e-7);assert(Math.abs(horizontal.a.y-(y-60))<1e-6,'вся горизонтальная сторона перемещена вверх');assert(Math.abs(horizontal.a.x-hit.a.x)<1e-6&&Math.abs(horizontal.b.x-hit.b.x)<1e-6,'дрейф мыши вдоль стороны игнорируется');
 const snapshot=a.t.schemeSnapshot('Перемещение стороны');a.t.applyPreset(snapshot);assert.equal(path(a),first,'конфигурация сохраняется');
 const above=hits(a).find(h=>Math.abs(h.a.y-h.b.y)<1e-7);drag(a,above,0,200);assert(hits(a).some(h=>Math.abs(h.a.y-above.a.y-200)<1e-6&&Math.abs(h.b.y-above.a.y-200)<1e-6),'сторона проходит за прежний упор, вводы обходятся дополнительными поворотами');
}
for(const side of ['source','target']){
 const a=setup();drag(a,hits(a)[0],0,-100);const vertical=hits(a).filter(h=>Math.abs(h.a.x-h.b.x)<1e-7),hit=side==='source'?vertical[0]:vertical.at(-1);const x=hit.a.x;drag(a,hit,40,21);assert(hits(a).some(h=>Math.abs(h.a.x-x-40)<1e-6&&Math.abs(h.b.x-x-40)<1e-6&&Math.abs(h.b.y-h.a.y)>60),'длинная вертикальная сторона перемещена целиком '+side);
}
{
 const a=setup('orthogonal',[{x:126.25,y:250},{x:250,y:250},{x:250,y:300},{x:450,y:300},{x:450,y:200},{x:526.25,y:200}]);
 const hit=hits(a).find(h=>Math.abs(h.a.x-250)<1e-6&&Math.abs(h.b.x-250)<1e-6);assert(hit);drag(a,hit,40,17);const moved=hits(a).find(h=>Math.abs(h.a.x-290)<1e-6&&Math.abs(h.b.x-290)<1e-6);assert(moved,'внутренняя вертикальная сторона перемещена');assert.equal(moved.a.y,hit.a.y);assert.equal(moved.b.y,hit.b.y);
 const before=path(a);a.t.beginActionHistory();drag(a,moved,-30,0);a.t.finishActionHistory();assert(a.t.undoAction());assert.equal(path(a),before,'перемещение стороны отменяется');assert(a.t.redoAction());assert.notEqual(path(a),before,'перемещение стороны повторяется');
}
{
 const a=setup('smooth');assert(a.e.els.wireLayer.innerHTML.includes('class="wire-dot"'));assert.equal(hits(a).length,0,'остальные формы сохраняют точечное редактирование');
}
{
 const a=setup(),{e,t,s}=a;s.wires.push({id:2,a:{devId:1,key:'t1'},b:{devId:2,key:'t1'},shape:'orthogonal',sectionMm2:2.5,pts:[]});t.renderWires();
 const g=e.makeEl('g'),h=e.makeEl('path');g.dataset.wid='2';g.setAttribute('data-wid','2');g.parentNode=e.els.wireLayer;h.dataset.wireSegment='1';h.setAttribute('data-wire-segment','1');h.parentNode=g;
 const y=t.wireRoutingEndpoint(t.terminal(1,'t0'),s.wires[0]).y;
 e.pointer(h,'pointerdown',{pointerType:'mouse',clientX:350,clientY:y});e.pointer(e.window.document,'pointermove',{pointerType:'mouse',clientX:350,clientY:y-30});e.pointer(e.window.document,'pointerup',{pointerType:'mouse',clientX:350,clientY:y-30});e.runTimers(0);
 assert(s.wires[0].pts.length,'захватывается ближайший провод');assert.equal(s.wires[1].pts.length,0,'перекрывающаяся область другого провода не перехватывает захват');
}
console.log('Перемещение стороны: горизонталь, обе концевые вертикали, внутренняя вертикаль, касательное движение мыши, вводы, сохранение, отмена и повтор — OK.');

function actualSideAt(d,normal,coordinate,alongPoint){
 let previous;
 for(const command of d.match(/[MLQC][^MLQC]*/g)||[]){
  const nums=command.slice(1).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number),p=[];for(let i=0;i<nums.length;i+=2)p.push({x:nums[i],y:nums[i+1]});
  if(command[0]==='M'){previous=p[0];continue;}
  const points=[previous,...p],axis=normal==='y'?'x':'y',last=p.at(-1);
  if(points.every(q=>Math.abs(q[normal]-coordinate)<1e-5)&&alongPoint>=Math.min(previous[axis],last[axis])-1e-5&&alongPoint<=Math.max(previous[axis],last[axis])+1e-5)return true;
  previous=last;
 }
 return false;
}
let freeCases=0;
for(const delta of [-500,-50,-1,.1,5,15,25,32.75,40,180,500]){
 const a=setup(),hit=hits(a)[0],y=hit.a.y,mid=(hit.a.x+hit.b.x)/2;
 const d=drag(a,hit,0,delta);assert(actualSideAt(d,'y',y+delta,mid),'горизонтальная сторона следует за мышью без упора: '+delta);freeCases++;
}
for(const side of ['source','target'])for(const delta of [-500,-200,-40,-5,5,40,200,500]){
 const a=setup();drag(a,hits(a)[0],0,-100);const vertical=hits(a).filter(h=>Math.abs(h.a.x-h.b.x)<1e-7),hit=side==='source'?vertical[0]:vertical.at(-1),x=hit.a.x,mid=(hit.a.y+hit.b.y)/2;
 const d=drag(a,hit,delta,0);assert(actualSideAt(d,'x',x+delta,mid),'вертикальная сторона проходит за соседний угол '+side+' '+delta);freeCases++;
}
for(const delta of [-400,-150,200,400]){
 const a=setup('orthogonal',[{x:126.25,y:250},{x:250,y:250},{x:250,y:300},{x:450,y:300},{x:450,y:200},{x:526.25,y:200}]),hit=hits(a).find(h=>Math.abs(h.a.x-250)<1e-6&&Math.abs(h.b.x-250)<1e-6);
 const d=drag(a,hit,delta,0);assert(actualSideAt(d,'x',250+delta,275),'внутренняя сторона пересекает координату соседа: '+delta);freeCases++;
}
console.log('Свободное перемещение: '+freeCases+' случаев за пределами соседних углов и вводов; фактическая линия следует за мышью — OK.');
