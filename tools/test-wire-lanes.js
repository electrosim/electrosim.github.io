const assert=require('assert/strict'),{load}=require('./sandbox');
function setup(gap=400){
 const e=load({interactive:true}),t=e.api,s=t.state;
 s.power=false;s.devices=[{id:1,type:'mcb3',x:100,y:400},{id:2,type:'mcb3',x:100+gap,y:400}];
 s.wires=[];s.relays=[];s.motors=[];return {e,t,s};
}
function add(s,k,shape,sectionMm2,reverse){const a={devId:1,key:k},b={devId:2,key:k};const w={id:s.wires.length+1,a:reverse?b:a,b:reverse?a:b,shape,sectionMm2,pts:[]};s.wires.push(w);return w;}
function parts(d){let p;return (d.match(/[MLQC][^MLQC]*/g)||[]).flatMap(cmd=>{const nums=cmd.slice(1).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number),q=[];for(let i=0;i<nums.length;i+=2)q.push({x:nums[i],y:nums[i+1]});if(cmd[0]==='M'){p=q[0];return [];}const seg=[p,...q];p=q.at(-1);return [seg];});}
function tangent(seg,end){const p=seg[end?seg.length-1:0];for(let i=end?seg.length-2:1;end?i>=0:i<seg.length;i+=end?-1:1){const dx=(seg[i].x-p.x)*(end?-1:1),dy=(seg[i].y-p.y)*(end?-1:1),len=Math.hypot(dx,dy);if(len>1e-7)return [dx/len,dy/len];}return null;}
let count=0;
for(const gap of [170,400])for(const shape of ['smooth','straight','orthogonal'])for(const prefix of ['t','b'])for(const reverse of [false,true]){
 const {t,s}=setup(gap);[2.5,35,.5].forEach((section,i)=>add(s,prefix+i,shape,section,reverse));t.renderWires();
 const levels=[];
 for(const w of s.wires){
  const a=t.terminal(w.a.devId,w.a.key),b=t.terminal(w.b.devId,w.b.key),d=t.wirePathD(a,b,w),segs=parts(d);
  assert.deepEqual(segs[0][0],{...t.wireVisualEndpoint(a,w)});assert.deepEqual(segs.at(-1).at(-1),{...t.wireVisualEndpoint(b,w)});
  const horizontal=segs.find(seg=>Math.abs(seg[0].x-seg.at(-1).x)>30&&seg.every(p=>Math.abs(p.y-seg[0].y)<1e-6));assert(horizontal,'есть цельный горизонтальный участок');
  levels.push(horizontal[0].y);
  for(const handle of t.wirePointList(a,b,w))assert(Math.abs(handle.y-horizontal[0].y)<1e-6,'точка захвата следует за дорожкой');
  for(let i=1;i<segs.length;i++){const u=tangent(segs[i-1],true),v=tangent(segs[i],false);if(u&&v)assert(u[0]*v[0]+u[1]*v[1]>1-2e-6,'повороты остаются плавными');}
  const direction=reverse?-1:1;for(const seg of segs)for(let i=1;i<seg.length;i++)assert(direction*(seg[i].x-seg[i-1].x)>-1e-5,'нет возвратных узелков');
 }
 for(let i=1;i<3;i++){const gap=Math.abs(levels[i]-levels[i-1]),required=(t.wireVisualWidth(s.wires[i])+t.wireVisualWidth(s.wires[i-1]))/2;assert(Math.abs(gap-required)<1e-6,'провода касаются краями без наложения или просвета');}
 const saved=JSON.stringify(s.wires);for(let j=0;j<4;j++)t.renderWires();assert.equal(JSON.stringify(s.wires),saved,'перерисовка не двигает дорожки');
 const offset=s.wires[2].autoLane.offset;s.wires.splice(1,1);t.renderWires();assert.equal(s.wires[1].autoLane.offset,offset,'удаление соседа не сдвигает дорожку');
 const snapshot=t.schemeSnapshot('Дорожки');assert(t.applyPreset(snapshot));assert.equal(s.wires[1].autoLane.offset,offset,'дорожка сохраняется и восстанавливается');
 s.devices.forEach(dev=>dev.y+=100);t.renderWires();assert.equal(s.wires[1].autoLane.offset,offset,'дорожка следует за автоматами');count++;
}
{
 const {e,t,s}=setup(),doc=e.window.document;const m={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};e.els.scene.getScreenCTM=()=>m;e.els.world.getScreenCTM=()=>m;
 add(s,'t0','smooth',2.5);t.renderWires();t.wireDefaults.shape='smooth';t.wireDefaults.sectionMm2=2.5;
 function hit(dev,key){const p=t.terminal(dev,key),el=e.makeEl('circle');el.classList.add('term');el.dataset.dev=String(dev);el.dataset.key=key;el.parentNode=e.els.termLayer;return el;}
 const a=hit(1,'t1'),b=hit(2,'t1'),p=t.terminal(2,'t1');e.pointer(a,'pointerdown',{pointerType:'mouse'});doc.elementFromPoint=()=>b;e.pointer(doc,'pointermove',{pointerType:'mouse',clientX:p.x,clientY:p.y});
 const preview=e.els.wireLayer.innerHTML.split('class="wire-preview"')[1].match(/<path d="([^"]+)"/)[1];
 e.pointer(doc,'pointerup',{pointerType:'mouse',clientX:p.x,clientY:p.y});const w=s.wires.at(-1);assert.equal(t.wirePathD(t.terminal(w.a.devId,w.a.key),t.terminal(w.b.devId,w.b.key),w),preview,'призрак совпадает с готовым проводом на занятой дорожке');
 w.sectionMm2=35;t.renderWires();assert(w.autoLane.offset>4,'увеличение толщины расширяет дорожку');
 const stable=JSON.stringify(s.wires);w.previewShape='arc';t.renderWires();delete w.previewShape;t.renderWires();assert.equal(JSON.stringify(s.wires),stable,'просмотр дуги не сбивает дорожку');
}
for(const mode of ['manual','arc','s']){
 const {t,s}=setup();add(s,'t0','smooth',2.5);const w=add(s,'t1',mode==='manual'?'smooth':mode,2.5);if(mode==='manual')w.pts=[{x:300,y:300}];
 const a=t.terminal(1,'t1'),b=t.terminal(2,'t1'),before=t.wirePathD(a,b,w);t.renderWires();assert.equal(t.wirePathD(a,b,w),before,'ручная форма сохраняется');assert(!w.autoLane);
}
{
 const {t,s}=setup();add(s,'t0','smooth',2.5);s.devices.push({id:3,type:'mcb3',x:1000,y:400},{id:4,type:'mcb3',x:1400,y:400});
 s.wires.push({id:2,a:{devId:3,key:'t0'},b:{devId:4,key:'t0'},shape:'smooth',pts:[]});t.renderWires();assert.equal(s.wires[1].autoLane.offset,0,'неперекрывающиеся перемычки используют одну высоту');
}
console.log('Дорожки перемычек: '+count+' комбинаций форм/сторон/направлений, смешанные толщины, плавные повороты, отсутствие узелков, стабильность, сохранение и призрак — OK.');
