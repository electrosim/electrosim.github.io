/* Крупные мобильные приборы читают ту же модель и меняют ту же нагрузку. */
const assert=require('assert/strict'),{load}=require('./sandbox');
const narrow=load({interactive:true,width:390,height:844});
assert(narrow.window.document.documentElement.classList.contains('touch-ui'),'узкое окно получает крупные кнопки без определения телефона по устройству ввода');
const desktop=load({interactive:true,width:1280,height:720});
assert(!desktop.window.document.documentElement.classList.contains('touch-ui'),'широкое окно с мышью сохраняет обычную компоновку');
const e=load({interactive:true,mobile:true,width:390,height:844}),t=e.api,s=t.state;
const dc=s.motors.find(m=>m.kind==='dc'),ac=s.motors.find(m=>m.kind==='ac');
const modal=e.els.motorInstrumentsModal,body=e.els.motorInstrumentBody;
const before=JSON.stringify(t.schemeSnapshot('До').state),view=JSON.stringify(t.touchView());
e.els.motorInstrumentsToggle.dispatchEvent({type:'click'});
assert(modal.classList.contains('open'));
assert.equal(modal.getAttribute('aria-hidden'),'false');
assert.equal(e.els.motorInstrumentsToggle.getAttribute('aria-expanded'),'true');
assert(e.els.motorInstrumentTabs.innerHTML.includes('АД · M1'));
assert(e.els.motorInstrumentTabs.innerHTML.includes('ДПТ · MD1'));
assert.equal(JSON.stringify(t.schemeSnapshot('До').state),before,'открытие приборов не меняет схему');

function panel(motor,parent){
  const box=e.makeEl('div');box.classList.add('motor-load-control');box.parentNode=parent;
  const input=e.makeEl('input');input.classList.add('motor-load');input.dataset.mid=motor.id;input.parentNode=box;
  const fields={};box.querySelector=sel=>fields[sel]||(fields[sel]=e.makeEl('b'));
  return {input,fields};
}
const canvas={},reader={};
for(const motor of [ac,dc]){canvas[motor.id]=panel(motor,e.els.motorLayer);reader[motor.id]=panel(motor,body);}
e.els.motorLayer.querySelector=sel=>{const m=s.motors.find(m=>sel.includes('data-mid="'+m.id+'"'));return m?canvas[m.id].input:null;};
body.querySelector=sel=>{const m=s.motors.find(m=>sel.includes('data-mid="'+m.id+'"')&&body.innerHTML.includes('data-mid="'+m.id+'"'));return m?reader[m.id].input:null;};

reader[ac.id].input.value='32';reader[ac.id].input.dispatchEvent({type:'input',bubbles:true});
assert.equal(ac.load,32);assert.equal(dc.load,0);
assert.equal(canvas[ac.id].input.value,'32');
assert.equal(reader[ac.id].fields['.motor-load-value'].textContent,'32 %');
assert.equal(JSON.stringify(t.touchView()),view,'регулятор не сдвигает и не масштабирует сцену');

const select=e.makeEl('button');select.dataset.instrumentMotor=dc.id;select.setAttribute('data-instrument-motor',dc.id);select.parentNode=e.els.motorInstrumentTabs;
select.dispatchEvent({type:'click',bubbles:true});
for(const label of ['Напряжение якоря','Ток возбуждения','ЭДС якоря','Мощность на валу'])assert(body.innerHTML.includes(label),label);
assert(!body.innerHTML.includes('Скольжение'));
reader[dc.id].input.value='67';reader[dc.id].input.dispatchEvent({type:'input',bubbles:true});
assert.equal(dc.load,67);assert.equal(ac.load,32);
assert.equal(canvas[dc.id].input.value,'67');
for(const field of ['.motor-load-value','.motor-armature-voltage','.motor-field-current','.motor-rpm-value']){
  assert.equal(reader[dc.id].fields[field].textContent,canvas[dc.id].fields[field].textContent,field+': обе панели показывают одну модель');
}
canvas[dc.id].input.value='41';canvas[dc.id].input.dispatchEvent({type:'input',bubbles:true});
assert.equal(reader[dc.id].input.value,'41','изменение на стенде обновляет открытые приборы');
const content=body.innerHTML;t.renderAll();
assert.equal(body.innerHTML,content,'обычная отрисовка сохраняет регулятор под пальцем');
const saved=t.schemeSnapshot('Нагрузка');
assert.equal(saved.state.motors.find(m=>m.id===dc.id).load,41);
assert.equal(saved.state.motors.find(m=>m.id===ac.id).load,32);

e.window.document.dispatchEvent({type:'keydown',key:'Escape',preventDefault(){}});
assert(!modal.classList.contains('open'));assert.equal(modal.getAttribute('aria-hidden'),'true');
e.els.motorInstrumentsToggle.dispatchEvent({type:'click'});assert(modal.classList.contains('open'));
s.motors=[];t.renderAll();
assert(e.els.motorInstrumentsToggle.hidden,'в стенде без двигателей кнопка скрыта');
assert(!modal.classList.contains('open'),'при удалении двигателей приборы закрываются');
console.log('Мобильные приборы: общие показания, независимая нагрузка, синхронизация, сохранение, навигация и закрытие — OK.');
