const assert=require('assert/strict'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state;
s.devices=[];s.relays=[];s.wires=[];s.motors=[];
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,a+' != '+b);
function end(d,last){const n=d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);return last?{x:n.at(-2),y:n.at(-1)}:{x:n[0],y:n[1]};}
for(const type of ['klemma','pebus']){
 const bus={id:1,type,x:350,y:200,tag:type==='pebus'?'XPE':'XN'};s.devices=[bus];
 for(let i=0;i<6;i++)for(const sectionMm2 of [.5,2.5,35])for(const shape of ['smooth','straight','orthogonal','arc','s'])for(const side of ['left','right'])for(const reverse of [false,true]){
  const p=t.terminal(1,'k'+i),other={x:p.x+(side==='left'?-220:220),y:p.y+15},wr={shape,sectionMm2,pts:[]};
  const d=reverse?t.wirePathD(other,p,wr):t.wirePathD(p,other,wr),visual=end(d,reverse),cap=(t.wireVisualWidth(wr)+2.5)/2;
  near(visual.x,side==='left'?bus.x+.25-cap:bus.x+t.MODULE-.25+cap);near(visual.y,p.y);
  const sleeve=t.wireFerruleSvg(p,wr,d,reverse);assert(sleeve.includes('translate('+visual.x+' '+visual.y+')'),'манжета на том же краю, что и провод');
  near(t.terminal(1,'k'+i).x,bus.x+t.MODULE/2);
 }
 for(const shape of ['smooth','straight','orthogonal']){
  const p=t.terminal(1,'k2'),other={x:700,y:p.y+120};
  const left={shape,pts:[{x:250,y:p.y},{x:600,y:p.y+80}]};assert(end(t.wirePathD(p,other,left),false).x<bus.x,'ближайшая точка задаёт левый подход');
  left.pts[0].x=520;assert(end(t.wirePathD(p,other,left),false).x>bus.x+t.MODULE,'перенос точки меняет сторону');
 }
 s.devices.push({id:2,type:'mcb1',x:80,y:200},{id:3,type:'mcb1',x:650,y:200});
 s.wires=[{id:1,a:{devId:1,key:'k0'},b:{devId:2,key:'t0'},shape:'straight'},
 {id:2,a:{devId:3,key:'t0'},b:{devId:1,key:'k0'},shape:'straight'}];
 t.renderWires();const rendered=e.els.wireLayer.innerHTML;
 const leftX=end(t.wirePathD(t.terminal(1,'k0'),t.terminal(2,'t0'),s.wires[0]),false).x;
 const rightX=end(t.wirePathD(t.terminal(3,'t0'),t.terminal(1,'k0'),s.wires[1]),true).x;
 assert(leftX<bus.x&&rightX>bus.x+t.MODULE,'одна клемма принимает два провода с разных сторон');
 const saved=t.schemeSnapshot('Двусторонняя шина');assert(t.applyPreset(saved));t.renderWires();assert.equal(e.els.wireLayer.innerHTML,rendered,'после открытия стороны не меняются');
 const before=t.wirePathD(t.terminal(1,'k0'),t.terminal(2,'t0'),s.wires[0]);s.devices[0].x=0;
 const after=t.wirePathD(t.terminal(1,'k0'),t.terminal(2,'t0'),s.wires[0]);assert(end(after,false).x>t.MODULE,'перенос шины переключает подход');assert.notEqual(after,before);
}
console.log('Шины N/PE: шесть клемм, левый/правый подход, пять форм, три сечения, оба конца, ручные точки, одновременное подключение, перенос и сохранение — OK.');
