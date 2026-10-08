
const assert=require('assert');
const {load}=require('./sandbox');
function setup(mobile){
 const s=load({interactive:true,mobile,width:430,height:860});
 const m={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};
 s.els.scene.getScreenCTM=()=>m;s.els.world.getScreenCTM=()=>m;
 s.api.METER.x=100;s.api.METER.y=100;s.api.renderAll();
 s.els.touchLoupe=s.window.document.getElementById('touchLoupe');
 s.els.touchLoupe.hidden=true;
 return s;
}
function probe(s){
 const el=s.makeEl('g');el.classList.add('mm-probe');el.setAttribute('data-probe','a');el.parentNode=s.els.mmLayer;return el;
}
for(const mobile of [true,false]){
 const s=setup(mobile),el=probe(s);
 const p=s.api.meterProbeFallback('a'),g=s.api.meterProbeGrip('a',p);
 s.pointer(el,'pointerdown',{pointerId:1,clientX:g.x,clientY:g.y});
 assert.strictEqual(s.els.touchLoupe.hidden,false,'касание щупа включает лупу');
 s.pointer(el,'pointermove',{pointerId:1,clientX:300,clientY:350});s.runFrames();
 const box=s.els.touchLoupeScene.getAttribute('viewBox').split(' ').map(Number);
 const tip=s.api.meterProbeFallback('a');
 assert.ok(Math.abs(box[0]+box[2]/2-tip.x)<1e-7,'центр по острию, а не рукоятке');
 assert.ok(Math.abs(box[1]+box[3]/2-tip.y)<1e-7);
 assert.ok(Math.abs(126/box[2]-2.5)<1e-7);
 assert.ok(parseFloat(s.els.touchLoupe.style.left)>=8);
 assert.ok(parseFloat(s.els.touchLoupe.style.top)>=8);
 s.pointer(s.els.scene,'pointerdown',{pointerId:2,clientX:360,clientY:350});
 assert.strictEqual(s.els.touchLoupe.hidden,true,'pinch скрывает лупу');
 s.pointer(s.els.scene,'pointercancel',{pointerId:2,clientX:360,clientY:350});
 s.pointer(s.els.scene,'pointercancel',{pointerId:1,clientX:300,clientY:350});
 assert.strictEqual(s.els.touchLoupe.hidden,true);
}
const mouse=setup(false),el=probe(mouse);
mouse.pointer(el,'pointerdown',{pointerType:'mouse',clientX:276,clientY:94});
mouse.pointer(el,'pointermove',{pointerType:'mouse',clientX:300,clientY:350});mouse.runFrames();
assert.strictEqual(mouse.els.touchLoupe.hidden,true,'мышь не включает лупу');
mouse.pointer(el,'pointerup',{pointerType:'mouse',clientX:300,clientY:350});
const s=setup(true);
const term=s.makeEl('circle');term.classList.add('term');term.dataset.dev='IN';term.dataset.key='L1';term.parentNode=s.els.termLayer;
s.pointer(term,'pointerdown',{pointerId:1,clientX:100,clientY:300});
s.pointer(term,'pointerup',{pointerId:1,clientX:100,clientY:300});
s.pointer(s.els.scene,'pointerdown',{pointerId:1,clientX:150,clientY:350});
assert.strictEqual(s.els.touchLoupe.hidden,false,'лупа при прокладке провода');
s.pointer(s.els.scene,'pointermove',{pointerId:1,clientX:200,clientY:400});s.runFrames();
assert.strictEqual(s.els.touchLoupe.hidden,false);
s.pointer(s.els.scene,'pointerup',{pointerId:1,clientX:200,clientY:400});
assert.strictEqual(s.els.touchLoupe.hidden,true,'отпускание скрывает лупу');
s.api.cancelWire();
s.pointer(s.els.scene,'pointerdown',{pointerId:1,clientX:100,clientY:300});
s.pointer(s.els.scene,'pointermove',{pointerId:1,clientX:130,clientY:320});s.runFrames();
assert.strictEqual(s.els.touchLoupe.hidden,true,'перенос поля без лупы');
s.pointer(s.els.scene,'pointerup',{pointerId:1,clientX:130,clientY:320});
console.log('Лупа: сенсорный телефон и ноутбук, центрирование, увеличение, провод, pinch, отпускание и мышь — проверки пройдены.');
