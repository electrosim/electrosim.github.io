/* Панели стенда остаются в координатах SVG, включая регуляторы нагрузки. */
const assert=require('assert/strict'),{load}=require('./sandbox');

function attrs(markup){
  const result={};
  for(const m of markup.matchAll(/([\w-]+)="([^"]*)"/g))result[m[1]]=m[2];
  return result;
}
function classTag(markup,cls,tag){
  return [...markup.matchAll(new RegExp('<'+(tag||'[a-z][\\w-]*')+'\\b[^>]*>','gi'))]
    .map(m=>m[0]).find(m=>(attrs(m).class||'').split(/\s+/).includes(cls));
}
function field(markup,cls){
  const opening=classTag(markup,cls);
  assert(opening,'поле '+cls+' присутствует');
  const start=markup.indexOf(opening)+opening.length;
  return markup.slice(start,markup.indexOf('<',start));
}
function scenePanel(markup,id){
  const start=[...markup.matchAll(/<g\b[^>]*>/g)].find(m=>{
    const a=attrs(m[0]);return a['data-motor']===id&&(a.class||'').split(/\s+/).includes('motor-instrument');
  });
  assert(start,'SVG-панель двигателя '+id+' существует');
  let depth=0;
  for(const token of markup.slice(start.index).matchAll(/<\/?g\b[^>]*>/g)){
    depth+=token[0].startsWith('</')?-1:1;
    if(!depth)return markup.slice(start.index,start.index+token.index+token[0].length);
  }
  assert.fail('SVG-панель '+id+' имеет закрывающий g');
}
function expectedFields(t,motor){
  if(t.motorIsDc(motor)){
    const op=t.dcMotorOperatingPoint(motor),v=t.dcMotorInstrumentValues(motor,op);
    return {'motor-armature-voltage':v.armatureVoltage,'motor-rpm-value':v.rpm,
      'motor-armature-current':v.armatureCurrent,'motor-field-voltage':v.fieldVoltage,
      'motor-field-current':v.fieldCurrent,'motor-shaft-torque-value':v.torque,
      'motor-emf-value':v.emf,'motor-power-value':v.power,'motor-load-value':op.load.toFixed(0)+' %'};
  }
  const op=t.motorVisualOperating(motor,t.motorPhaseDirection(motor)),v=t.motorInstrumentValues(motor,op);
  return {'motor-frequency-value':op.frequencyHz.toFixed(1)+' Гц','motor-rpm-value':op.rpm+' об/мин',
    'motor-current-value':op.current.toFixed(1)+' А','motor-sync-value':v.sync,
    'motor-slip-value':v.slip,'motor-shaft-torque-value':v.torque,'motor-load-value':op.load.toFixed(0)+' %'};
}

const rendered=load({interactive:true,mobile:true,width:390,height:844}),r=rendered.api,rs=r.state;
const rac=rs.motors.find(m=>m.kind==='ac'),rdc=rs.motors.find(m=>m.kind==='dc');
rac.load=42;rac.rpmActual=1125;rdc.load=67;rdc.rpmActual=380;
const converter={id:1,type:'tp',tag:'UZT1',x:100,y:100,ratedVoltage:380,tpOn:true,
  setArmatureVoltage:110,maxArmatureVoltage:220,fieldVoltage:220};
rs.devices=[converter];rs.wires=[];
function wire(a,ka,b,kb){rs.wires.push({id:rs.wires.length+1,a:{devId:a,key:ka},b:{devId:b,key:kb}});}
wire('IN','L1',rac.id,'U1');wire('IN','L2',rac.id,'V1');wire('IN','L3',rac.id,'W1');
wire(rac.id,'W2',rac.id,'U2');wire(rac.id,'U2',rac.id,'V2');
wire('IN','L1',1,'R');wire('IN','L2',1,'S');wire('IN','L3',1,'T');
wire(1,'ya1',rdc.id,'ya1');wire(1,'ya2',rdc.id,'ya2');
wire(1,'sh1',rdc.id,'sh1');wire(1,'sh2',rdc.id,'sh2');
r.renderAll();
const scene=rendered.els.motorLayer.innerHTML;
assert(!/<(?:foreignObject|div|input)\b/i.test(scene),'приборы сцены состоят из SVG, без HTML и foreignObject');
assert(!scene.includes('www.w3.org/1999/xhtml'),'сцена не содержит XHTML-панелей');
for(const motor of [rac,rdc]){
  const svg=scenePanel(scene,motor.id),position=r.motorInstrumentPosition(motor);
  assert.equal(attrs(svg.slice(0,svg.indexOf('>')+1)).transform,'translate('+position.x+','+position.y+')');
  const op=r.motorIsDc(motor)?r.dcMotorOperatingPoint(motor):r.motorVisualOperating(motor,r.motorPhaseDirection(motor));
  const html=r.motorInstrumentInner(motor,op);
  for(const [cls,expected] of Object.entries(expectedFields(r,motor))){
    assert.equal(field(svg,cls),expected,motor.id+' SVG '+cls);
    assert.equal(field(html,cls),expected,motor.id+' HTML '+cls);
  }
  const control=attrs(classTag(svg,'motor-load','g'));
  assert.equal(control.role,'slider');assert.equal(control.tabindex,'0');
  assert.equal(control['aria-valuemin'],'0');assert.equal(control['aria-valuemax'],'100');
  assert.equal(control['aria-valuenow'],String(motor.load));
  assert(control['aria-label'].includes(motor.tag||motor.id));
}
assert.equal(field(scenePanel(scene,rdc.id),'motor-armature-voltage'),'110 В');
assert.equal(field(scenePanel(scene,rdc.id),'motor-field-current'),'1.00 А');
assert.equal(field(scenePanel(scene,rac.id),'motor-slip-value'),'25.0 %');
const tagBefore=rac.tag;rac.tag='M<&"\'>';
r.renderAll();
const escapedPanel=scenePanel(rendered.els.motorLayer.innerHTML,rac.id);
assert(!escapedPanel.includes(rac.tag),'обозначение двигателя экранировано в SVG');
assert(escapedPanel.includes('M&lt;&amp;&quot;'),'символы подписи и aria-label экранируются');
rac.tag=tagBefore;

function fixture(){
  const e=load({interactive:true,mobile:true,width:390,height:844}),t=e.api,s=t.state;
  e.els.motorInstrumentsToggle.dispatchEvent({type:'click'});
  const canvas={},reader={};
  function panel(motor,parent,svg){
    const markup=scenePanel(e.els.motorLayer.innerHTML,motor.id);
    const box=e.makeEl(svg?'g':'div');box.classList.add('motor-load-control','motor-instrument-panel');box.parentNode=parent;
    const input=e.makeEl(svg?'g':'input');input.classList.add('motor-load');input.dataset.mid=motor.id;input.setAttribute('data-mid',motor.id);input.parentNode=box;
    if(svg){
      const a=attrs(classTag(markup,'motor-load','g'));
      for(const [key,value] of Object.entries(a)){
        input.setAttribute(key,value);
        if(key.startsWith('data-'))input.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
      }
      input.classList.add('motor-load-slider');
    }
    const fields={};
    box.querySelector=sel=>sel==='.motor-load'?input:(fields[sel]||(fields[sel]=e.makeEl(svg?'text':'b')));
    input.querySelector=sel=>fields[sel]||(fields[sel]=e.makeEl('circle'));
    return {box,input,fields};
  }
  for(const motor of s.motors){canvas[motor.id]=panel(motor,e.els.motorLayer,true);reader[motor.id]=panel(motor,e.els.motorInstrumentBody,false);}
  function find(map,sel){const id=sel.match(/data-mid="([^"]+)"/);return id&&map[id[1]]?map[id[1]].input:null;}
  e.els.motorLayer.querySelector=sel=>find(canvas,sel);
  e.els.motorInstrumentBody.querySelector=sel=>{
    const input=find(reader,sel);return input&&e.els.motorInstrumentBody.innerHTML.includes('data-mid="'+input.dataset.mid+'"')?input:null;
  };
  // Масштаб и перенос отличаются от 1:1, чтобы регулятор проверял SVG-координаты.
  const matrix={a:.4,b:0,c:0,d:.4,e:31,f:53,inverse(){return {a:2.5,b:0,c:0,d:2.5,e:-77.5,f:-132.5};}};
  e.els.scene.getScreenCTM=()=>matrix;e.els.world.getScreenCTM=()=>matrix;
  function point(input,percent){return {clientX:(Number(input.dataset.loadX)+Number(input.dataset.loadWidth)*percent/100)*matrix.a+matrix.e,clientY:300};}
  function select(id){
    const button=e.makeEl('button');button.dataset.instrumentMotor=id;button.setAttribute('data-instrument-motor',id);button.parentNode=e.els.motorInstrumentTabs;
    button.dispatchEvent({type:'click',bubbles:true});e.runTimers(0);
  }
  return {e,t,s,canvas,reader,point,select};
}
for(const kind of ['ac','dc']){
  const f=fixture(),{e,t,s,canvas,reader}=f,m=s.motors.find(m=>m.kind===kind);
  f.select(m.id);t.resetActionHistory();
  const input=canvas[m.id].input,view=JSON.stringify(t.touchView());
  const otherBefore=JSON.stringify(s.motors.filter(x=>x.id!==m.id).map(x=>[x.id,x.load]));
  const key=(name)=>{const event=e.pointer(input,'keydown',{key:name,pointerType:'mouse'});e.runTimers(0);return event;};
  const expectLoad=value=>{
    assert.equal(t.motorById(m.id).load,value,kind+' нагрузка модели');
    assert.equal(input.getAttribute('aria-valuenow'),String(value),kind+' доступное значение SVG');
    assert.equal(input.getAttribute('aria-valuetext'),value+' %');
    assert.equal(Number(canvas[m.id].fields['.motor-load-thumb'].getAttribute('cx')),58+624*value/100,'бегунок следует нагрузке');
    assert.equal(Number(canvas[m.id].fields['.motor-load-progress'].getAttribute('x2')),58+624*value/100,'заполнение шкалы следует нагрузке');
    assert.equal(reader[m.id].input.value,String(value),kind+' значение HTML');
    assert.equal(canvas[m.id].fields['.motor-load-value'].textContent,value+' %');
    assert.equal(reader[m.id].fields['.motor-load-value'].textContent,value+' %');
    assert.equal(JSON.stringify(t.touchView()),view,'регулятор не перемещает и не масштабирует стенд');
  };
  assert(key('ArrowRight').defaultPrevented);expectLoad(1);
  assert.equal(t.actionCounts().undo,1,'изменение с клавиатуры попадает в историю');
  assert(t.undoAction());expectLoad(0);assert(t.redoAction());expectLoad(1);
  assert(key('PageUp').defaultPrevented);expectLoad(11);
  key('ArrowDown');expectLoad(10);key('Home');expectLoad(0);key('ArrowLeft');expectLoad(0);
  key('End');expectLoad(100);key('ArrowUp');expectLoad(100);key('PageDown');expectLoad(90);
  assert(!key('a').defaultPrevented,'посторонние клавиши не перехватываются');
  t.resetActionHistory();
  e.pointer(input,'pointerdown',Object.assign({pointerId:7},f.point(input,22)));
  expectLoad(22);assert.equal(e.api.touchPointers.size,0,'регулятор не начинает навигацию поля');
  e.pointer(e.window.document,'pointermove',Object.assign({pointerId:8},f.point(input,80)));
  expectLoad(22);
  e.pointer(e.window.document,'pointermove',Object.assign({pointerId:7},f.point(input,56)));
  expectLoad(56);
  const retained=e.els.motorLayer.innerHTML;t.renderAll();
  assert.equal(e.els.motorLayer.innerHTML,retained,'перерисовка во время жеста сохраняет SVG-регулятор под пальцем');
  e.pointer(e.window.document,'pointermove',Object.assign({pointerId:7},f.point(input,73)));
  expectLoad(73);assert.equal(t.actionCounts().undo,0,'движения одного жеста ещё не завершают действие');
  e.pointer(e.window.document,'pointerup',Object.assign({pointerId:7},f.point(input,73)));e.runTimers(0);
  assert.equal(t.actionCounts().undo,1,'один жест записывается одним действием');
  assert(t.undoAction());expectLoad(90);assert(t.redoAction());expectLoad(73);
  assert.equal(JSON.stringify(s.motors.filter(x=>x.id!==m.id).map(x=>[x.id,x.load])),otherBefore,'нагрузка второго двигателя не меняется');
  reader[m.id].input.value='38';reader[m.id].input.dispatchEvent({type:'input',bubbles:true});e.runTimers(0);expectLoad(38);
  for(const cls of Object.keys(expectedFields(t,t.motorById(m.id)))){
    assert.equal(canvas[m.id].fields['.'+cls].textContent,reader[m.id].fields['.'+cls].textContent,kind+' синхронизация '+cls);
  }
  assert.equal(t.schemeSnapshot('SVG').state.motors.find(x=>x.id===m.id).load,38);
  if(kind==='dc'){
    s.wires=[{id:1,a:{devId:'IN',key:'L1'},b:{devId:m.id,key:'ya1'}},
      {id:2,a:{devId:'IN',key:'L2'},b:{devId:m.id,key:'ya2'}}];
    t.updateMotorReadout();
    assert.equal(canvas[m.id].fields['.motor-alert'].getAttribute('display'),'inline','ошибка AC видна в SVG');
    assert.equal(reader[m.id].fields['.motor-alert'].hidden,false,'ошибка AC видна в HTML');
    s.wires=[];t.updateMotorReadout();
    assert.equal(canvas[m.id].fields['.motor-alert'].getAttribute('display'),'none','ошибка исчезает из SVG');
    assert.equal(reader[m.id].fields['.motor-alert'].hidden,true,'ошибка исчезает из HTML');
  }
  t.resetActionHistory();
  e.pointer(input,'pointerdown',Object.assign({pointerId:9,pointerType:'mouse'},f.point(input,-25)));expectLoad(0);
  e.pointer(e.window.document,'pointermove',Object.assign({pointerId:9,pointerType:'mouse'},f.point(input,130)));expectLoad(100);
  e.pointer(e.window.document,'pointercancel',{pointerId:9,pointerType:'mouse'});e.runTimers(0);
  e.pointer(e.window.document,'pointermove',Object.assign({pointerId:9,pointerType:'mouse'},f.point(input,20)));expectLoad(100);
  assert.equal(t.actionCounts().undo,1,'отмена указателя завершает действие и освобождает регулятор');
  assert(t.undoAction());expectLoad(38);
}
console.log('SVG-приборы: отсутствие foreignObject, показания АД/ДПТ, подписи, клавиатура, жесты, история и HTML-приборы — OK.');
