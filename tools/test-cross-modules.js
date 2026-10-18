const assert=require('assert/strict'),{load}=require('./sandbox');
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);
const e=load({interactive:true}),t=e.api,s=t.state;
s.power=true;s.special.inbox=true;s.panels[0].inletVoltage=220;
s.devices=[];s.relays=[];s.motors=[];s.pushbuttons=[];s.wires=[];
const rails=t.mountingRails(),rail=rails[0];
const n={id:1,type:'crossN',rail:rail.id,slot:0,tag:'XN1'},pe={id:2,type:'crossPE',rail:rail.id,slot:8,tag:'XPE1'};
s.devices=[n,pe,{id:3,type:'bulb',x:1000,y:1000,ratedPower:100}];
const wire=(a,keyA,b,keyB)=>{const id=s.wires.length+1;s.wires.push({id,a:{devId:a,key:keyA},b:{devId:b,key:keyB},shape:'orthogonal',sectionMm2:2.5});return id;};
function end(path,last){const values=path.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);return last?{x:values.at(-2),y:values.at(-1)}:{x:values[0],y:values[1]};}
for(const dev of [n,pe]){
  const defs=t.termDefs(dev.type,dev),color=dev===pe?t.WC.PE:t.WC.N;
  assert.equal(defs.length,8);assert.equal(new Set(defs.map(d=>d.key)).size,8);
  assert.equal(new Set(defs.map(d=>d.dy)).size,2);assert.equal(new Set(defs.map(d=>d.dx)).size,4);
  assert.equal(t.TYPES[dev.type].modules,2,'корпус занимает два модуля');
  assert.equal(t.TYPES[dev.type].h,144,'высота корпуса уменьшена до 48 мм');
  assert.equal(t.TYPES[dev.type].freeOnly,undefined,'установка на DIN-рейку');
  for(const [i,td] of defs.entries()){
    const p=t.terminal(dev.id,td.key),top=i<4;
    assert.equal(p.entrySide,top?'top':'bottom');assert.equal(p.entryAutoSide,undefined,'сторона фиксирована рядом клемм');
    assert.equal(t.wireStartColor(p),color,'автоматический цвет N/PE');
    for(const shape of ['smooth','straight','orthogonal','arc','s'])for(const sectionMm2 of [.5,2.5,35]){
      const wr={shape,sectionMm2,pts:[]},other={x:p.x+120,y:p.y+(top?-200:200)},path=t.wirePathD(p,other,wr),visual=end(path,false),cap=(t.wireVisualWidth(wr)+2.5)/2;
      near(visual.x,p.x,'вход напротив винта');
      const origin=t.originOf(dev);near(visual.y,origin.y+(top?.25-cap:t.TYPES[dev.type].h-.25+cap),'вход у наружного края');
      const reverse=end(t.wirePathD(other,p,wr),true);near(reverse.x,visual.x,'обратный конец X');near(reverse.y,visual.y,'обратный конец Y');
      const ferrule=t.wireFerruleSvg(p,wr,path,false);assert(ferrule.includes('class="wire-ferrule"'));assert(Math.abs(visual.y-p.y)>31,'наконечник не закрывает винт');
    }
  }
  const svg=t.deviceInner(dev.type,dev);assert.equal((svg.match(/class="cross-module-screw"/g)||[]).length,8);assert(svg.includes('class="cross-module-back"'));
  assert(svg.includes(dev===pe?'#2f9d48':'#1d6fb8'));assert(svg.includes(dev===pe?'>PE</text>':'>N</text>'));
}
const neutral=wire('IN','N',1,'k0');wire('IN','PE',2,'k10');
const phase=wire('IN','L1',3,'L'),ret=wire(3,'N',1,'k10');
const map=t.potentialMap();assert.equal(map.conflict,false);
for(const dev of [n,pe])for(const td of t.termDefs(dev.type,dev)){
  assert(map.pot[dev.id+'/'+td.key],'каждый зажим подключён к общей шине');near(Math.hypot(map.pot[dev.id+'/'+td.key].r,map.pot[dev.id+'/'+td.key].i),0,'потенциал шины');
}
const currents=t.clampWireCurrents();near(currents[phase],100/220,'ток лампы');near(currents[ret],currents[phase],'возврат через нижний ряд');near(currents[neutral],currents[phase],'выход через верхний ряд');
near(t.resistanceBetween({devId:1,key:'k0'},{devId:1,key:'k10'}),7*.03,'непрерывность обоих рядов');
assert.equal(t.resistanceBetween({devId:1,key:'k0'},{devId:2,key:'k0'}),Infinity,'разные модули не соединяются автоматически');
t.renderAll();assert(e.els.tray.innerHTML.includes('data-type="crossN"'));assert(e.els.tray.innerHTML.includes('data-type="crossPE"'));
const saved=t.schemeSnapshot('Кросс-модули');assert(t.applyPreset(saved));assert.equal(s.devices[0].type,'crossN');assert.equal(s.devices[1].type,'crossPE');
assert.equal(s.devices[0].rail,rail.id);assert.equal(s.devices[0].slot,0);near(t.clampWireCurrents()[neutral],100/220,'сохранённое соединение верхнего и нижнего рядов');
// Подключения к удалённым клеммам варианта 2×7 сохраняются на крайней
// клемме того же ряда; повторное открытие нового варианта ничего не меняет.
const legacy=JSON.parse(JSON.stringify(saved));legacy.state.wires.find(w=>w.id===ret).b.key='k13';
legacy.positions.multimeter.a={devId:1,key:'k6'};legacy.positions.multimeter.b={devId:2,key:'k13'};
assert(t.applyPreset(legacy));assert.equal(s.wires.find(w=>w.id===ret).b.key,'k10');assert.equal(s.mm.a.key,'k3');assert.equal(s.mm.b.key,'k10');
assert.equal(legacy.state.wires.find(w=>w.id===ret).b.key,'k13','исходный файл не меняется');
near(t.clampWireCurrents()[neutral],100/220,'старое подключение сохраняет ток');
const compact=t.schemeSnapshot('2×4');assert(t.applyPreset(compact));assert.equal(s.wires.find(w=>w.id===ret).b.key,'k10');
// Ошибочное объединение разных потенциалов через модуль распознаётся как КЗ.
wire('IN','L1',1,'k9');assert(t.potentialMap().conflict);

// Фактическое размещение и перенос обоих типов мышью и касанием.
for(const mobile of [false,true])for(const type of ['crossN','crossPE']){
  const env=load({interactive:true,mobile}),a=env.api,st=a.state;st.power=false;st.devices=[];st.motors=[];st.relays=[];st.wires=[];
  const matrix={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};env.els.scene.getScreenCTM=()=>matrix;env.els.world.getScreenCTM=()=>matrix;
  const r=a.mountingRails()[0],pointerType=mobile?'touch':'mouse',item=env.makeEl('div');item.classList.add('tray-item');item.dataset.type=type;item.parentNode=env.els.tray;
  const mini=env.makeEl('svg');mini.classList.add('mini');mini.parentNode=item;
  const move=p=>{env.pointer(env.window.document,'pointermove',Object.assign({pointerType},p));env.runFrames();};
  const drop=p=>{env.pointer(mini,'pointerdown',{pointerType,clientX:20,clientY:20});move(p);env.pointer(env.window.document,'pointerup',Object.assign({pointerType},p));env.runTimers(0);};
  drop({clientX:2400,clientY:2700});assert.equal(st.devices.length,0,'кросс-модуль не устанавливается вне рейки');
  const target={clientX:r.x+2*a.MODULE+a.TYPES[type].modules*a.MODULE/2,clientY:r.y};drop(target);
  assert.equal(st.devices.length,1);const dev=st.devices[0];assert.equal(dev.rail,r.id);assert.equal(dev.slot,2);
  const body=env.makeEl('g');body.classList.add('dev');body.dataset.id=String(dev.id);body.parentNode=env.els.deviceLayer;
  const first=a.terminal(dev.id,'k0'),start={clientX:a.originOf(dev).x+15,clientY:a.originOf(dev).y+35};
  env.pointer(body,'pointerdown',Object.assign({pointerType},start));const destination={clientX:start.clientX+3*a.MODULE,clientY:start.clientY};move(destination);env.pointer(env.window.document,'pointerup',Object.assign({pointerType},destination));env.runTimers(0);
  assert.equal(dev.slot,5);near(a.terminal(dev.id,'k0').x-first.x,3*a.MODULE,'клеммы следуют за переносом');
}
console.log('Кросс-модули N/PE: 2×4 клеммы, общая шина, токи, КЗ, DIN, мышь/касание, ввод сверху/снизу, наконечники и совместимость сохранений 2×7 — OK.');
