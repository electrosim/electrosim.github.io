/* Автоматический цвет провода по начальной клемме, без изменения клемм. */
const assert=require('assert');
const {load}=require('./sandbox');
const s=load({interactive:true});
const {WC}=s.api;
s.api.state.power=false;
s.api.wireDefaults.color='#ffffff';
s.api.state.devices=['junction','mcb3','mcb1','rcd','meter','sensor','klemma','pebus','lamp','outlet','vfd','tp'].map((type,i)=>({id:i+1,type,x:1000+i*300,y:1000,on:false}));
function begin(devId,key){
  s.api.cancelWire();
  const term=s.makeEl('circle');term.classList.add('term');term.dataset.dev=String(devId);term.dataset.key=key;term.parentNode=s.els.termLayer;
  s.pointer(term,'pointerdown',{pointerType:'mouse'});
  return s.api.touchPending();
}
const cases=[['IN','L1',WC.L1],['IN','L2',WC.L1],['IN','L3',WC.L1],['IN','N',WC.N],['IN','PE',WC.PE],
  [2,'t1',WC.L1],[2,'b2',WC.L1],[3,'t0',WC.L1],[4,'tL',WC.L1],[4,'bN',WC.N],
  [5,'L_out',WC.L1],[5,'N_in',WC.N],[6,'L_in',WC.L1],[6,'N_out',WC.N],
  [7,'k0',WC.N],[8,'k5',WC.PE],[9,'b0',WC.N],[10,'s1PEt',WC.PE],
  [11,'S',WC.L1],[11,'W',WC.L1],[12,'R',WC.L1],[12,'sh1','#ffffff'],[1,'top0','#ffffff']];
for(const [id,key,color] of cases){
  const before=JSON.stringify(s.api.terminal(id,key));
  assert.strictEqual(begin(id,key).color,color,'начальный цвет '+id+':'+key);
  assert.strictEqual(JSON.stringify(s.api.terminal(id,key)),before,'клемма не изменилась');
  assert.strictEqual(s.api.wireDefaults.color,'#ffffff','ручная настройка не меняется');
  s.api.state.wires=[];
  s.api.connectTerminals(1,key==='top0'?'bottom0':'top0');
  assert.strictEqual(s.api.state.wires.at(-1).color,color,'цвет сохраняется в готовом проводе');
}
begin('IN','N');
const shape=s.makeEl('button');shape.setAttribute('data-wire-default-shape','orthogonal');shape.parentNode=s.els.wireShapeDefault;
s.pointer(shape,'click',{pointerType:'mouse'});
assert.strictEqual(s.api.touchPending().color,WC.N,'изменение формы сохраняет автоматический цвет');
assert.strictEqual(s.api.touchPending().shape,'orthogonal');
const custom=s.makeEl('button');custom.setAttribute('data-wire-default-color','#d64545');custom.parentNode=s.els.wireColorDefault;
s.pointer(custom,'click',{pointerType:'mouse'});
assert.strictEqual(s.api.touchPending().color,'#d64545','цвет можно изменить вручную');
assert.strictEqual(begin('IN','PE').color,WC.PE,'следующий провод снова получает цвет начальной клеммы');
assert.strictEqual(begin('IN','L2').color,WC.L1,'все фазы начинают коричневый провод');
console.log('Автоматические цвета проводов и ручной выбор — проверки пройдены.');
