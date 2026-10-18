const assert=require('assert/strict'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state;
s.devices=[];s.relays=[];s.wires=[];s.motors=[];
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,a+' != '+b);
function end(d,last){const n=d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);return last?{x:n.at(-2),y:n.at(-1)}:{x:n[0],y:n[1]};}
for(const type of ['klemma','pebus']){
 const bus={id:1,type,x:350,y:200,tag:type==='pebus'?'XPE':'XN'};s.devices=[bus];
 const field=t.characteristicsFor({kind:'device',id:1}).fields.find(f=>f.key==='wireEntrySide');
 assert.equal(field.type,'select');assert.equal(field.def,'right');
 assert.deepEqual(Array.from(field.options,o=>o.value),['right','left']);
 t.openProperties({kind:'device',id:1});
 assert.match(e.els.propertiesFields.innerHTML,/<option value="right" selected>Справа<\/option>/);
 for(let i=0;i<6;i++)for(const sectionMm2 of [.5,2.5,35])for(const shape of ['smooth','straight','orthogonal','arc','s'])for(const side of ['left','right'])for(const targetSide of ['left','right'])for(const reverse of [false,true]){
  bus.wireEntrySide=side;
  const p=t.terminal(1,'k'+i),other={x:p.x+(targetSide==='left'?-220:220),y:p.y+15},wr={shape,sectionMm2,pts:[]};
  assert.equal(p.entrySide,side);assert(!p.entryAutoSide,'сохранённую сторону не меняет направление трассы');
  const d=reverse?t.wirePathD(other,p,wr):t.wirePathD(p,other,wr),visual=end(d,reverse),cap=(t.wireVisualWidth(wr)+2.5)/2;
  near(visual.x,side==='left'?bus.x+.25-cap:bus.x+t.MODULE-.25+cap);near(visual.y,p.y);
  const sleeve=t.wireFerruleSvg(p,wr,d,reverse);assert(sleeve.includes('translate('+visual.x+' '+visual.y+')'),'манжета на том же краю, что и провод');
  near(t.terminal(1,'k'+i).x,bus.x+t.MODULE/2);
 }
 for(const shape of ['smooth','straight','orthogonal','arc','s'])for(const side of ['left','right']){
  bus.wireEntrySide=side;
  const p=t.terminal(1,'k2'),other={x:700,y:p.y+120};
  const wr={shape,pts:[{x:250,y:p.y},{x:600,y:p.y+80}]},before=end(t.wirePathD(p,other,wr),false);
  wr.pts[0].x=520;const after=end(t.wirePathD(p,other,wr),false);
  near(after.x,before.x);near(after.y,before.y);
 }
 s.devices.push({id:2,type:'mcb1',x:80,y:200},{id:3,type:'mcb1',x:650,y:200});
 s.wires=[{id:1,a:{devId:1,key:'k0'},b:{devId:2,key:'t0'},shape:'straight',sectionMm2:2.5},
 {id:2,a:{devId:3,key:'t0'},b:{devId:1,key:'k0'},shape:'straight',sectionMm2:2.5}];
 const connections=JSON.stringify(s.wires),resistance=t.resistanceBetween({devId:1,key:'k0'},{devId:1,key:'k5'});
 const select=e.makeEl('select');e.els.propertiesFields.querySelector=selector=>selector==='[data-property-key="wireEntrySide"]'?select:null;
 for(const side of ['left','right']){
  t.openProperties({kind:'device',id:1});select.value=side;t.saveProperties();
  assert.equal(s.devices[0].wireEntrySide,side);assert.equal(JSON.stringify(s.wires),connections,'переключение сохраняет соединения');
  near(t.resistanceBetween({devId:1,key:'k0'},{devId:1,key:'k5'}),resistance);
  const first=end(t.wirePathD(t.terminal(1,'k0'),t.terminal(2,'t0'),s.wires[0]),false);
  const second=end(t.wirePathD(t.terminal(3,'t0'),t.terminal(1,'k0'),s.wires[1]),true);
  near(first.x,second.x);assert(side==='left'?first.x<bus.x:first.x>bus.x+t.MODULE,'оба провода входят с выбранной стороны');
  t.renderWires();const rendered=e.els.wireLayer.innerHTML;
  const saved=t.schemeSnapshot('Сторона подключения');assert(t.applyPreset(saved));t.renderWires();
  assert.equal(s.devices[0].wireEntrySide,side);assert.equal(e.els.wireLayer.innerHTML,rendered,'после открытия сторона сохраняется');
  s.devices[0].x=0;assert.equal(t.terminal(1,'k0').entrySide,side,'перенос колодки не переключает сторону');s.devices[0].x=350;
  t.openProperties({kind:'device',id:1});
  assert(e.els.propertiesFields.innerHTML.includes('<option value="'+side+'" selected>'),'сохранённый выбор показан при повторном открытии');
 }
}
for(const type of ['crossN','crossPE']){
 s.devices=[{id:1,type,x:350,y:200,wireEntrySide:'left'}];
 assert(!t.characteristicsFor({kind:'device',id:1}).fields.some(f=>f.key==='wireEntrySide'));
 assert.equal(t.terminal(1,'k0').entrySide,'top');assert.equal(t.terminal(1,'k7').entrySide,'bottom');
}
console.log('Шины N/PE: выбор справа/слева в характеристиках, шесть клемм, пять форм, три сечения, оба конца, ручные точки, общая шина, перенос и сохранение — OK.');
