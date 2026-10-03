/* Закрепление щита: размещение, характеристики, перенос, сохранение. */
const assert=require('assert');
const {load}=require('./sandbox');
const s=load({interactive:true});
s.els.world.getScreenCTM=function(){return {inverse(){return {a:1,b:0,c:0,d:1,e:0,f:0};}};};
s.els.scene.getBoundingClientRect=function(){return {left:0,top:0,right:1000,bottom:1000,width:1000,height:1000};};
const panel=s.api.state.panels[0];
const target={kind:'special',key:'panel',id:panel.id};
assert.strictEqual(panel.fixed,true,'исходный щит закреплён');
assert.strictEqual(s.api.panelIsFixed({}),true,'старые щиты закреплены по умолчанию');
assert.ok(s.api.characteristicsFor(target).fields.some(f=>f.key==='fixed'&&f.type==='checkbox'&&f.def===true));
s.api.openProperties(target);
assert.match(s.els.propertiesFields.innerHTML,/data-property-key="fixed" type="checkbox" checked/);
const control=s.makeEl('input');control.checked=false;
s.els.propertiesFields.querySelector=function(selector){return selector==='[data-property-key="fixed"]'?control:null;};
s.api.saveProperties();
assert.strictEqual(panel.fixed,false,'характеристики открепляют щит');
const body=s.makeEl('g');body.setAttribute('data-panel-id',panel.id);body.dataset.panelId=panel.id;body.parentNode=s.els.panelLayer;
function move(){
  s.pointer(body,'pointerdown',{pointerType:'mouse',clientX:100,clientY:100});
  s.pointer(s.window.document,'pointermove',{pointerType:'mouse',clientX:200,clientY:180});
  s.runFrames();
  s.pointer(s.window.document,'pointerup',{pointerType:'mouse',clientX:200,clientY:180});
}
const x=panel.x,y=panel.y;
move();
assert.strictEqual(panel.x,x+100,'откреплённый щит перемещается');
assert.strictEqual(panel.y,y+80);
const unlocked=s.api.schemeSnapshot();
s.api.openProperties(target);control.checked=true;s.api.saveProperties();
assert.strictEqual(panel.fixed,true,'характеристики закрепляют обратно');
move();
assert.strictEqual(panel.x,x+100,'закреплённый щит не перемещается');
assert.strictEqual(panel.y,y+80);
assert.strictEqual(s.api.panelDrag(),null);
// Через ввод щита также нельзя обойти закрепление.
const inbox=s.makeEl('g');inbox.classList.add('inbox-draggable');inbox.parentNode=s.els.boxLayer;
s.pointer(inbox,'pointerdown',{pointerType:'mouse',clientX:100,clientY:100});
assert.strictEqual(s.api.panelDrag(),null);
const locked=s.api.schemeSnapshot();
const restored=load({interactive:true});
assert.ok(restored.api.applyPreset(unlocked));
assert.strictEqual(restored.api.state.panels[0].fixed,false,'сохранено откреплённое состояние');
assert.ok(restored.api.applyPreset(locked));
assert.strictEqual(restored.api.state.panels[0].fixed,true,'сохранено закреплённое состояние');
delete locked.state.panels[0].fixed;
assert.ok(restored.api.applyPreset(locked));
assert.strictEqual(restored.api.state.panels[0].fixed,true,'старый пресет закреплён по умолчанию');
// Перенос из лотка разрешён до установки; поставленный щит уже закреплён.
const before=s.api.state.panels.length;
s.api.startSpecialTrayDrag({pointerId:4,clientX:0,clientY:0,preventDefault(){}},'panel');
s.pointer(s.window.document,'pointermove',{pointerId:4,clientX:400,clientY:300});
s.api.finishSpecialTrayDrag({pointerId:4,clientX:400,clientY:300});
assert.strictEqual(s.api.state.panels.length,before+1);
assert.strictEqual(s.api.state.panels.at(-1).fixed,true,'щит из лотка закреплён');
console.log('Щиты: закрепление, открепление, размещение и сохранение — проверки пройдены.');
