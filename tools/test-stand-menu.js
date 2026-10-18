/* Четыре стенда: точные файлы, активный пункт, сохранение и отмена замены. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state;
const options=[
  ['sceneWorkbench','motor-empty','Стенд двигателя — пустой.ad-scheme.json',2,0,0],
  ['sceneMotorReverse','motor-reverse','Пуск-Реверс АД.ad-scheme.json',1,9,40],
  ['sceneHousehold','apartment-empty','Бытовой монтаж — комнаты.ad-scheme.json',0,0,0],
  ['sceneHouseholdConnected','apartment-connected','Монтаж квартирного щита.ad-scheme.json',0,55,81]
];
for(const [button,key,file,motors,devices,wires] of options){
  const source=JSON.parse(fs.readFileSync(path.join(__dirname,'../presets',file),'utf8')).preset;
  const registered=t.folderPresets().find(p=>p._folderFile===file);
  assert(registered,'файл зарегистрирован в автономном каталоге: '+file);
  assert.equal(JSON.stringify(registered.state),JSON.stringify(source.state),'каталог совпадает с файлом '+file);
  t.markSchemeClean();e.els[button].dispatchEvent({type:'click',bubbles:true});
  assert.equal(s.standId,key);assert.equal(s.motors.length,motors);
  assert.equal(s.devices.length,devices);assert.equal(s.wires.length,wires);
  assert.equal(s.panels.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(s.wires.map(w=>[w.id,w.a,w.b]))),source.state.wires.map(w=>[w.id,w.a,w.b]),'проводка загружается из выбранного файла');
  assert.deepEqual(JSON.parse(JSON.stringify(s.devices.map(d=>[d.id,d.type]))),source.state.devices.map(d=>[d.id,d.type]));
  for(const [other]of options)assert.equal(e.els[other].getAttribute('aria-pressed'),String(other===button));
  assert.equal(s.roomScene,key.startsWith('apartment')?'household':null);
  if(key==='motor-empty'){
    assert.equal(s.motors.filter(m=>m.kind==='dc').length,1);
    assert.equal(s.motors.filter(m=>m.kind==='ac').length,1);
    assert.equal((e.els.motorLayer.innerHTML.match(/class="motor-instrument"/g)||[]).length,2);
  }
  const saved=t.schemeSnapshot('Моя работа');assert.equal(saved.state.standId,key);
  const restored=load();assert(restored.api.applyPreset(saved));
  assert.equal(restored.api.state.standId,key);
  assert.equal(restored.els[button].getAttribute('aria-pressed'),'true');
  assert.equal(t.potentialMap().conflict,false,'в загруженном стенде нет конфликта потенциалов');
  if(key==='motor-reverse'){
    for(const breaker of s.devices.filter(d=>d.type==='mcb3'||d.type==='mcb1'))t.toggleDevice(breaker);
    const buttons=s.pushbuttons[0].buttons,motor=s.motors[0];
    buttons.up=true;t.renderAll();buttons.up=false;t.renderAll();
    assert.equal(t.motorPhaseDirection(motor),1,'готовая схема запускается вперёд');
    buttons.stop=true;t.renderAll();buttons.stop=false;t.renderAll();
    assert.equal(t.motorPhaseDirection(motor),0,'кнопка стоп отключает двигатель');
    buttons.down=true;t.renderAll();buttons.down=false;t.renderAll();
    assert.equal(t.motorPhaseDirection(motor),-1,'готовая схема запускается в обратную сторону');
  }
}
t.markSchemeClean();s.panels[0].railCount=4;
e.els.sceneWorkbench.dispatchEvent({type:'click',bubbles:true});
assert.equal(s.standId,'apartment-connected','несохранённая работа не заменена сразу');
t.closeSchemeReplace();assert.equal(s.panels[0].railCount,4);
e.els.sceneWorkbench.dispatchEvent({type:'click',bubbles:true});t.finishSchemeReplace(false);
assert.equal(s.standId,'motor-empty');assert.equal(s.devices.length,0);
console.log('Стенды: четыре пункта, исходные JSON, приборы и проводка, активный выбор, сохранение и отмена — OK.');
