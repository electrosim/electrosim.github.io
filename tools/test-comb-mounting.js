const assert=require('assert/strict'),{load}=require('./sandbox');
function fixture(){const e=load({interactive:true}),t=e.api,s=t.state;s.power=false;s.devices=[];s.wires=[];s.relays=[];s.motors=[];s.nextId=10;
for(let i=0;i<3;i++)s.devices.push({id:i+1,type:'mcb1',x:200+i*52.5,y:300,on:false});
const matrix={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};e.els.scene.getScreenCTM=()=>matrix;e.els.world.getScreenCTM=()=>matrix;
const tray=e.makeEl('div');tray.classList.add('tray-item');tray.dataset.type='comb';tray.parentNode=e.els.tray;return {e,t,s,tray};}
function drop(f,x,y){f.e.pointer(f.tray,'pointerdown',{pointerType:'mouse',clientX:0,clientY:0});f.e.pointer(f.e.window.document,'pointermove',{pointerType:'mouse',clientX:x,clientY:y});f.e.pointer(f.e.window.document,'pointerup',{pointerType:'mouse',clientX:x,clientY:y});}
const f=fixture();drop(f,700,700);assert.equal(f.s.devices.filter(d=>d.type==='comb').length,0,'на пустое поле гребёнка не устанавливается');
drop(f,278.75,294);const c=f.s.devices.find(d=>d.type==='comb');assert(c);assert.equal(c.combAnchorId,1);assert.equal(f.t.originOf(c).y,270);
f.t.renderAll();assert(f.e.els.deviceLayer.innerHTML.indexOf('comb-body')<f.e.els.deviceLayer.innerHTML.indexOf('C10'),'штыри рисуются под корпусом автомата');
const body=f.e.makeEl('g');body.classList.add('dev');body.dataset.id=String(c.id);body.parentNode=f.e.els.deviceLayer;
f.e.pointer(body,'pointerdown',{pointerType:'mouse',clientX:240,clientY:280});f.e.pointer(f.e.window.document,'pointermove',{pointerType:'mouse',clientX:800,clientY:800});f.e.pointer(f.e.window.document,'pointerup',{pointerType:'mouse',clientX:800,clientY:800});assert.equal(c.combAnchorId,1);assert.equal(f.t.originOf(c).x,200);assert.equal(f.t.originOf(c).y,270,'неудачный перенос возвращает гребёнку');
const large=fixture();assert.equal(large.t.combPlacement(200,270,{combPoles:1,combCount:10}),null,'гребёнка на 10 не устанавливается на 3 автомата');
assert.equal(large.t.combPlacement(200,400,{combPoles:1,combCount:3}),null,'посадка возможна только возле верхних клемм');
const data=f.t.characteristicsFor({kind:'device',id:c.id});f.t.openProperties(data.target);
const count=f.e.makeEl('input');count.value='10';count.setAttribute('data-property-key','combCount');f.e.els.propertiesFields.appendChild(count);
const poles=f.e.makeEl('select');poles.value='1';poles.setAttribute('data-property-key','combPoles');f.e.els.propertiesFields.appendChild(poles);
f.t.saveProperties();assert.equal(c.combCount,3,'свойства не превращают установленную гребёнку в длинную без подходящего ряда');
const three=fixture();three.s.devices.forEach((d,i)=>{d.type='mcb3';d.x=200+i*157.5;});drop(three,278.75,294);const threeComb=three.s.devices.find(d=>d.type==='comb');assert(threeComb);assert.equal(threeComb.combPoles,3);assert.equal(threeComb.combCount,3,'исполнение определяется при первой посадке');
const single=fixture();single.s.devices=single.s.devices.slice(0,1);drop(single,278.75,294);assert.equal(single.s.devices.find(d=>d.type==='comb').combCount,1,'одиночный автомат допускает последующую настройку в свойствах');
console.log('Посадка гребёнки: тонкие скрытые штыри, монтаж только на клеммы, запрет 10 на 3, возврат после переноса и проверка длины в свойствах — проверки пройдены.');
