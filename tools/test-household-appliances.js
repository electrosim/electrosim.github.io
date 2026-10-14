/* Полноразмерные SVG-прибора: реальные клеммы, нагрузка и сохранение. */
const assert=require('assert');
const {load}=require('./sandbox');
for(const type of ['split','fridge','washer','boiler','stove']){
  const e=load({interactive:true}),t=e.api,s=t.state;
  s.power=true;s.motors=[];s.relays=[];s.wires=[];s.special.inbox=true;
  s.panels[0].inletVoltage=220;
  const d={id:1,type,x:3000,y:900,tag:'E1',applianceOn:true,ratedPower:t.TYPES[type].defaultPower};
  s.devices=[d];s.roomScene='household';s.workbench=null;
  t.renderAll();
  assert(e.els.tray.innerHTML.includes('data-type="'+type+'"'));
  const terms=t.termDefs(type,d);
  assert.deepStrictEqual(Array.from(terms,td=>td.key),['L','N','PE']);
  const width=t.TYPES[type].modules*t.MODULE;
  for(const td of terms){
    const p=t.terminal(1,td.key);
    assert(p.x>d.x&&p.x<d.x+width);
    assert(p.y>=d.y&&p.y<d.y+t.TYPES[type].h);
    const source=td.key==='L'?'L1':td.key;
    const hit=e.makeEl('circle');hit.classList.add('term');
    hit.dataset.dev='IN';hit.dataset.key=source;hit.parentNode=e.els.termLayer;
    e.pointer(hit,'pointerdown',{pointerType:'mouse',button:0});
    t.connectTerminals(1,td.key);
  }
  assert.equal(s.wires.length,3);
  assert.equal(t.potentialMap().conflict,false);
  const currents=t.clampWireCurrents();
  assert(Math.abs(currents[s.wires[0].id]-d.ratedPower/220)<1e-6,type+': рабочий ток L');
  assert(Math.abs(currents[s.wires[1].id]-d.ratedPower/220)<1e-6,type+': рабочий ток N');
  assert(!currents[s.wires[2].id],type+': PE не проводит рабочий ток');
  const p=t.terminal(1,'L');
  d.x+=127;d.y+=63;t.renderAll();
  assert.equal(t.terminal(1,'L').x,p.x+127);
  assert.equal(t.terminal(1,'L').y,p.y+63);
  assert.equal(s.wires[0].b.devId,1,'провод закреплён за прибором');
  const saved=t.schemeSnapshot(type);
  const restored=load().api;
  assert(restored.applyPreset(saved));
  assert.equal(restored.state.devices[0].type,type);
  assert.equal(restored.state.wires.length,3);
  assert.equal(restored.terminal(1,'PE').x,t.terminal(1,'PE').x);
  assert.equal(restored.state.roomScene,'household');
  console.log('OK '+type+': лоток, L/N/PE, рабочий ток, перенос и восстановление.');
}
