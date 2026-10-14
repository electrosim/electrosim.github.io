const assert=require('assert/strict'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state;s.power=false;s.wires=[];s.devices=[];s.relays=[];s.motors=[];
for(const poles of [1,2,3]){
 const d={id:poles,type:'mcb'+poles,x:300*poles,y:400,on:false};s.devices.push(d);
 const defs=t.termDefs(d.type,d);assert.equal(defs.length,poles*2);
 for(const td of defs){
  const p=t.terminal(d.id,td.key),top=td.key[0]==='t';
  assert.equal(p.y,top?418:400+t.TYPES[d.type].h-18);assert.equal(p.entrySide,top?'top':'bottom');
  assert.equal(p.y,top?418:400+t.TYPES[d.type].h-18,'подключение остаётся на винте');
  for(const shape of ['smooth','straight','orthogonal','arc','s']){
   const other={x:p.x+180,y:top?p.y-100:p.y+100};
   const path=t.wirePathD(p,other,{shape,pts:[]});const inset=17.75+(t.wireVisualWidth({})+2.5)/2;const visualY=p.y+(top?-inset:inset);
   const first=path.match(/^M ([\d.-]+),([\d.-]+) L ([\d.-]+),([\d.-]+)/);assert(first,shape);
   assert.equal(Number(first[2]),visualY,'рисунок провода заканчивается в корпусе, а не на винте');assert.equal(Number(first[1]),Number(first[3]));assert(top?Number(first[4])<Number(first[2]):Number(first[4])>Number(first[2]),'ввод идёт перпендикулярно торцу');
   const reversed=t.wirePathD(other,p,{shape,pts:[{x:p.x+70,y:p.y+(top?-90:90)}]});assert(reversed.endsWith(' L '+p.x+','+visualY),'обратный порядок подключения тоже входит в отверстие');
  }
 }
 for(const sectionMm2 of t.WIRE_SECTIONS_MM2){
  for(const key of ['t0','b0']){
   const p=t.terminal(d.id,key),path=t.wirePathD(p,{x:p.x+100,y:p.y},{shape:'smooth',sectionMm2}),m=path.match(/^M ([\d.-]+),([\d.-]+)/);
   const y=Number(m[2]),cap=(t.wireVisualWidth({sectionMm2})+2.5)/2;
   assert(key[0]==='t'?y+cap<=d.y+.25+1e-8:y-cap>=d.y+t.TYPES[d.type].h-.25-1e-8,'конец и тень не пересекают обводку при любом сечении');
  }
 }
 assert.equal((t.deviceInner(d.type,d).match(/class="mcb-wire-inlet"/g)||[]).length,0,'дизайн без чёрных вводов');
}
s.wires=[{id:1,a:{devId:1,key:'b0'},b:{devId:2,key:'t0'},shape:'orthogonal',pts:[],color:'#8b5a2b'}];t.renderAll();assert(e.els.wireLayer.innerHTML.includes('wire-hit'));
const before=e.els.wireLayer.innerHTML;s.devices[1].x+=80;t.renderAll();assert.notEqual(e.els.wireLayer.innerHTML,before,'ввод следует за перемещением автомата');
const saved=t.schemeSnapshot('Ввод проводов');assert(t.applyPreset(saved));assert.equal(s.wires[0].a.key,'b0');assert.equal(s.wires[0].b.key,'t0');
console.log('Ввод проводов в автоматы: 1P/2P/3P, верх/низ, пять форм трассы, обратное подключение, перенос и сохранение — проверки пройдены.');
