/* Сечение независимо от цвета, формы и выбора для следующего провода. */
const assert=require('assert');
const env=require('./sandbox').load({interactive:true}),t=env.api,s=t.state;
s.power=false;s.devices=[{id:1,type:'junction',x:1000,y:1000}];s.wires=[];
function begin(key){
  t.cancelWire();const el=env.makeEl('circle');el.classList.add('term');
  el.dataset.dev='IN';el.dataset.key=key;el.parentNode=env.els.termLayer;
  env.pointer(el,'pointerdown',{pointerType:'mouse'});
}
function choose(section){
  const button=env.makeEl('button');button.setAttribute('data-wire-default-section',String(section));
  button.parentNode=env.els.wireSectionDefault;
  env.pointer(button,'click',{pointerType:'mouse'});
}
choose(6);begin('N');
assert.strictEqual(t.touchPending().sectionMm2,6);
assert.strictEqual(t.touchPending().color,t.WC.N);
choose(1.5);assert.strictEqual(t.touchPending().sectionMm2,1.5,'выбор не применился к рисуемому проводу');
assert.strictEqual(t.touchPending().color,t.WC.N,'сечение изменило автоматический цвет');
t.connectTerminals(1,'top0');
const wire=s.wires[0];assert.strictEqual(wire.sectionMm2,1.5);
const old={color:wire.color,shape:wire.shape,pts:JSON.stringify(wire.pts)};
t.showWireMenu(wire.id,200,200,{x:200,y:200});t.changeWireSection(10);
assert.strictEqual(wire.sectionMm2,10);
assert.strictEqual(t.wireDefaults.sectionMm2,1.5,'изменение отдельного провода повлияло на следующие');
assert.strictEqual(wire.color,old.color);assert.strictEqual(wire.shape,old.shape);assert.strictEqual(JSON.stringify(wire.pts),old.pts);
assert.strictEqual(env.els.wireMenu.style.display,'none','меню не закрылось после выбора');
const snap=t.schemeSnapshot('Сечения');t.applyPreset(snap);
assert.strictEqual(s.wires[0].sectionMm2,10,'сечение потеряно при сохранении и загрузке');
delete snap.state.wires[0].sectionMm2;t.applyPreset(snap);
assert.strictEqual(s.wires[0].sectionMm2,2.5,'старое сохранение не получило значение по умолчанию');
assert.strictEqual(t.normalizeWireSection('0.75'),.75);
assert.strictEqual(t.normalizeWireSection(-1),2.5);
assert.strictEqual(JSON.parse(env.store['ad-trainer-wire-defaults']).sectionMm2,1.5);
// Отрисовка должна сохранять различия на каждом сечении, включая PE и клещи.
let previousWidth=0;
for(const section of t.WIRE_SECTIONS_MM2){
  const width=t.wireVisualWidth({sectionMm2:section});
  assert(width>previousWidth,'толщина не увеличивается для '+section+' мм²');
  previousWidth=width;
}
assert.strictEqual(t.wireVisualWidth({sectionMm2:2.5}),4,'прежняя толщина 2,5 мм² изменилась');
const visible=s.wires[0];visible.color=t.WC.PE;
function drawnWidth(svg,color){
  const matches=[...svg.matchAll(new RegExp('stroke="'+color+'" stroke-width="([^"]+)"','g'))];
  assert(matches.length,'нет цветного участка провода');return Number(matches.at(-1)[1]);
}
visible.sectionMm2=.5;t.renderWires();
const thin=drawnWidth(env.els.wireLayer.innerHTML,t.WC.PE);
visible.sectionMm2=35;t.renderWires();
const thick=drawnWidth(env.els.wireLayer.innerHTML,t.WC.PE);
assert(thick>thin*2,'разница толщин недостаточно заметна');
assert.strictEqual(drawnWidth(env.els.wireLayer.innerHTML,'#1f9d3a'),thick,'полоса PE имеет другую толщину');
choose(6);begin('PE');t.renderWires();
assert.strictEqual(drawnWidth(env.els.wireLayer.innerHTML,t.WC.PE),t.wireVisualWidth({sectionMm2:6}),'предпросмотр имеет другую толщину');
t.cancelWire();
env.els.wireLayer.querySelector=()=>({getTotalLength:()=>100,getPointAtLength:n=>({x:n,y:0}),getAttribute:()=> 'M0 0L100 0'});
const clampSvg=t.clampObjectSvg({id:'CL1',tag:'PA1',wireId:visible.id,fraction:.5},{[visible.id]:0});
assert.strictEqual(drawnWidth(clampSvg,t.WC.PE),thick,'провод меняет толщину внутри клещей');
console.log('Выбор, прокладка, изменение и сохранение сечений: все проверки пройдены');
