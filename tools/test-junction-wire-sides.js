const assert=require('assert/strict'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state;
const xr={id:1,type:'junction',x:400,y:400,tag:'XR1'};s.devices=[xr];s.relays=[];s.wires=[];s.motors=[];
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,a+' != '+b);
function point(d,last){const n=d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);return last?{x:n.at(-2),y:n.at(-1)}:{x:n[0],y:n[1]};}
let count=0;
for(const td of t.termDefs('junction')){
 const p=t.terminal(1,td.key),axis=td.side==='left'||td.side==='right'?'x':'y';
 for(const sign of [-1,1])for(const shape of ['smooth','straight','orthogonal','arc','s'])for(const sectionMm2 of [.5,2.5,35])for(const reverse of [false,true]){
  const other={x:p.x,y:p.y};other[axis]+=sign*160;
  const wr={shape,sectionMm2,pts:[]};
  if(shape==='arc'||shape==='s'){const handle={x:(p.x+other.x)/2,y:(p.y+other.y)/2};handle[axis]+=sign*100;wr.pts=[handle];}
  const path=reverse?t.wirePathD(other,p,wr):t.wirePathD(p,other,wr),end=point(path,reverse),cap=(t.wireVisualWidth(wr)+2.5)/2;
  near(end[axis],p[axis]+sign*(13.65+cap));near(end[axis==='x'?'y':'x'],p[axis==='x'?'y':'x']);
  const sleeve=t.wireFerruleSvg(p,wr,path,reverse);assert(sleeve.includes('translate('+end.x+' '+end.y+')'),'манжета на выбранном краю');
  const same=t.terminal(1,td.key);near(same.x,p.x);near(same.y,p.y);
  count++;
 }
 // Ближайшая точка определяет подход даже при другом положении второго конца.
 for(const reverse of [false,true]){
  const other={x:p.x+190,y:p.y+190},guide={x:p.x,y:p.y};guide[axis]-=100;
  const wr={shape:'straight',pts:[guide]};
  let d=reverse?t.wirePathD(other,p,wr):t.wirePathD(p,other,wr);assert(point(d,reverse)[axis]<p[axis]);
  guide[axis]+=200;d=reverse?t.wirePathD(other,p,wr):t.wirePathD(p,other,wr);assert(point(d,reverse)[axis]>p[axis]);
 }
}
s.devices.push({id:2,type:'mcb1',x:90,y:400},{id:3,type:'mcb1',x:850,y:400},
 {id:4,type:'mcb1',x:440,y:40},{id:5,type:'mcb1',x:440,y:850});
s.wires=[{id:1,a:{devId:1,key:'left1'},b:{devId:2,key:'t0'},shape:'straight'},
 {id:2,a:{devId:3,key:'t0'},b:{devId:1,key:'left1'},shape:'straight'},
 {id:3,a:{devId:1,key:'top1'},b:{devId:4,key:'b0'},shape:'straight'},
 {id:4,a:{devId:5,key:'t0'},b:{devId:1,key:'top1'},shape:'straight'}];
t.renderWires();const html=e.els.wireLayer.innerHTML;assert.equal((html.match(/class="wire-ferrule"/g)||[]).length,8);
const saved=t.schemeSnapshot('XR с двух сторон');assert(t.applyPreset(saved));t.renderWires();assert.equal(e.els.wireLayer.innerHTML,html,'входы сохраняются при открытии схемы');
const first=t.wirePathD(t.terminal(1,'left1'),t.terminal(2,'t0'),s.wires[0]);s.devices[0].x+=60;
assert.notEqual(t.wirePathD(t.terminal(1,'left1'),t.terminal(2,'t0'),s.wires[0]),first,'манжеты следуют за коробкой');
console.log('XR: '+count+' подключений; все 12 клемм, обе стороны каждой колодки, пять форм, три сечения, оба конца, перенос точек, сохранение и перенос коробки — OK.');
