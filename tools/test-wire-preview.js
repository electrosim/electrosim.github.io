const assert=require('assert/strict'),{load}=require('./sandbox');
const e=load({interactive:true}),t=e.api,s=t.state,doc=e.window.document;
const matrix={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};
e.els.scene.getScreenCTM=()=>matrix;e.els.world.getScreenCTM=()=>matrix;
s.power=false;s.devices=[{id:999,type:'mcb1',x:50,y:200,tag:'QF'}];s.wires=[];s.relays=[];s.motors=[];
const cases=[];let seq=1;
for(const type of Object.keys(t.TYPES)){
 if(type==='comb'||type==='kk1')continue;
 const obj={id:seq++,type,x:500,y:500,tag:type,on:false,gangs:2};s.devices.push(obj);
 const defs=t.termDefs(type,obj);for(const td of [defs[0],defs.at(-1)])if(td)cases.push({devId:obj.id,key:td.key});
}
const km=s.devices.find(d=>d.type==='km1');s.relays=[{id:80,kmId:km.id,set:10}];cases.push({devId:'kk80',key:'r0'},{devId:'kk80',key:'p0'});
s.motors=[{id:'M1',kind:'ac',x:700,y:500,scale:1},{id:'MD1',kind:'dc',x:900,y:500,scale:2}];
cases.push({devId:'M1',key:'U1'},{devId:'MD1',key:'sh1'});
s.pushbuttons=[{id:'PB1',x:600,y:600,buttons:{}}];cases.push({devId:'PB1',key:'upL'},{devId:'IN',key:'N'});
function hit(ref){const p=t.terminal(ref.devId,ref.key),el=e.makeEl('circle');el.classList.add('term');el.dataset.dev=String(ref.devId);el.dataset.key=ref.key;el.setAttribute('cx',p.x);el.setAttribute('cy',p.y);el.parentNode=e.els.termLayer;return el;}
const source=hit({devId:999,key:'b0'});
function begin(){t.cancelWire();s.wires=[];doc.elementFromPoint=()=>null;e.pointer(source,'pointerdown',{pointerType:'mouse'});}
function geometry(svg,preview){
 const body=preview?svg.slice(svg.indexOf('class="wire-preview"')):svg;
 const d=preview?body.match(/<path d="([^"]+)"/)[1]:body.match(/<path class="wire" d="([^"]+)"/)[1];
 const sleeves=[...body.matchAll(/class="wire-ferrule(?: [^"]+)?"[^>]*transform="([^"]+)"/g)].map(m=>m[1]);
 return {d,sleeves};
}
let count=0;
for(const ref of cases)for(const shape of ['smooth','straight','orthogonal','arc','s']){
 t.wireDefaults.shape=shape;t.wireDefaults.sectionMm2=count%2?35:.5;begin();
 const target=hit(ref),p=t.terminal(ref.devId,ref.key);doc.elementFromPoint=()=>target;
 e.pointer(doc,'pointermove',{pointerType:'mouse',clientX:p.x+2,clientY:p.y+1});
 const pending=t.touchPending();assert.equal(String(pending.target.devId),String(ref.devId));assert.equal(pending.target.key,ref.key);
 const before=geometry(e.els.wireLayer.innerHTML,true);assert.equal(before.sleeves.length,2,'оба наконечника видны до подключения');
 e.pointer(doc,'pointerup',{pointerType:'mouse',clientX:p.x+2,clientY:p.y+1});
 assert.equal(s.wires.length,1);const after=geometry(e.els.wireLayer.innerHTML,false);
 assert.deepEqual(after,before,'траектория и манжеты не меняются после подключения '+JSON.stringify(ref)+' '+shape);count++;
}
begin();doc.elementFromPoint=()=>source;e.pointer(doc,'pointermove',{pointerType:'mouse',clientX:60,clientY:450});assert.equal(t.touchPending().target,null,'своя клемма не является целью');
const target=hit({devId:1,key:'k0'}),p=t.terminal(1,'k0');doc.elementFromPoint=()=>target;e.pointer(doc,'pointermove',{pointerType:'mouse',clientX:p.x,clientY:p.y});assert(t.touchPending().target);
doc.elementFromPoint=()=>e.els.scene;e.pointer(doc,'pointermove',{pointerType:'mouse',clientX:1000,clientY:1000});assert.equal(t.touchPending().target,null,'выход с клеммы сбрасывает цель');assert.equal(geometry(e.els.wireLayer.innerHTML,true).sleeves.length,2,'у свободного конца есть второй наконечник');
// Сенсорная область захвата совпадает с областью, используемой при отпускании.
e.els.termLayer.querySelectorAll=()=>[target];doc.elementFromPoint=()=>e.els.scene;
const free=e.makeEl('circle');free.classList.add('wire-pending-end');free.parentNode=e.els.wireLayer;
const freePoint=t.touchPending().pt;e.pointer(free,'pointerdown',{pointerType:'touch',clientX:freePoint.x,clientY:freePoint.y});
e.pointer(doc,'pointermove',{pointerType:'touch',clientX:p.x+15,clientY:p.y});e.runFrames();assert(t.touchPending().target);
const preview=geometry(e.els.wireLayer.innerHTML,true);e.pointer(doc,'pointerup',{pointerType:'touch',clientX:p.x+15,clientY:p.y});assert.deepEqual(geometry(e.els.wireLayer.innerHTML,false),preview);
console.log('Призрак: '+count+' подключений, все типы аппаратов, пять форм, оба наконечника, крайние сечения; мышь, выход с клеммы и сенсорный захват — совпадает с готовым проводом.');
