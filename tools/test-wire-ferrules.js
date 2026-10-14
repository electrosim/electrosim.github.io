/* Все электрические клеммы: манжета снаружи, прямой вход, винт свободен. */
const assert=require('assert/strict'),{load}=require('./sandbox');
const env=load({interactive:true}),t=env.api,s=t.state;
s.power=false;s.devices=[];s.relays=[];s.wires=[];s.motors=[];s.pushbuttons=[];s.special.inbox=true;
const cases=[];let id=1;
for(const type of Object.keys(t.TYPES)){
 if(type==='comb'||type==='kk1')continue;
 for(const gangs of type==='wallSwitch'?[1,2]:[1]){
  const obj={id:id++,type,x:400,y:400,on:false,gangs};s.devices.push(obj);
  for(const td of t.termDefs(type,obj))cases.push({devId:obj.id,key:td.key,type,td,obj});
 }
}
const km=s.devices.find(d=>d.type==='km1'),relay={id:80,kmId:km.id,set:10};s.relays=[relay];
for(const td of t.termDefs('kk1'))cases.push({devId:'kk80',key:td.key,type:'kk1'});
s.pushbuttons=[{id:'PB1',x:100,y:100,buttons:{},tag:'SB'}];
for(const key of ['upL','upR','stopL','stopR','downL','downR'])cases.push({devId:'PB1',key,type:'PB'});
for(const kind of ['ac','dc'])for(const scale of [.7,2]){
 const motor={id:(kind==='dc'?'MD':'M')+(scale===2?2:1),kind,x:900,y:800,scale};s.motors.push(motor);
 for(const td of kind==='dc'?t.DC_MOTOR_TERMS:t.MOTOR_TERMS)cases.push({devId:motor.id,key:td.key,type:kind+'Motor',motor,td});
}
for(const key of ['L1','L2','L3','N','PE'])cases.push({devId:'IN',key,type:'IN'});
const vectors={top:[0,-1],bottom:[0,1],left:[-1,0],right:[1,0]};
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-7,msg+': '+a+' / '+b);
let count=0;
for(const c of cases){
 const p=t.terminal(c.devId,c.key),v=vectors[p.entrySide];
 assert(v,c.type+' '+c.key+': вход задан');assert(Number.isFinite(p.entryInset)&&p.entryInset>=0);
 if(c.obj){near(p.x,c.obj.x+c.td.dx,'винт X сохранён');near(p.y,c.obj.y+c.td.dy,'винт Y сохранён');}
 if(c.motor){near(p.x,c.motor.x+c.td.dx*c.motor.scale,'винт X масштаб');near(p.y,c.motor.y+c.td.dy*c.motor.scale,'винт Y масштаб');}
 if(c.type==='kk1'&&c.key[0]==='r'){assert.equal(p.entrySide,'bottom','98–95 подключаются снизу');near(p.entryInset,19.5,'нижний край компактной вспомогательной колодки');const o=t.originOf({type:'kk1',kmId:km.id});near(p.y-o.y,121,'винты 98–95 подняты вместе с колодкой');}
 if(c.type==='IN')near(p.y+p.entryInset,p.y+15.75,'манжета на нижней грани вводной клеммы');
 for(const sectionMm2 of [0.5,2.5,35])for(const shape of ['smooth','straight','orthogonal','arc','s']){
  const wr={shape,sectionMm2,pts:[]},cap=(t.wireVisualWidth(wr)+2.5)/2;
  const visual={x:p.x+v[0]*(p.entryInset+cap),y:p.y+v[1]*(p.entryInset+cap)};
  const other={x:visual.x+v[0]*150+v[1]*80,y:visual.y+v[1]*150+v[0]*80};
  const path=t.wirePathD(p,other,wr),nums=path.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);
  near(nums[0],visual.x,'начало X');near(nums[1],visual.y,'начало Y');
  const leadX=nums[2]-nums[0],leadY=nums[3]-nums[1];
  near(leadX*v[1]-leadY*v[0],0,'вход перпендикулярен корпусу');
  const lead=leadX*v[0]+leadY*v[1];
  assert(lead>=24-cap-1e-7&&lead<=36-cap+1e-7,'изгиб не входит в участок двух длин манжеты');
  const ferrule=t.wireFerruleSvg(p,wr,path,false);
  const rectX=Number(ferrule.match(/<rect x="([^"]+)/)[1]);
  near(rectX,-cap,'манжета начинается ровно у края корпуса');
  assert(!ferrule.includes('#c2c8cb'),'штырька нет');
  const angle=Number(ferrule.match(/rotate\(([^)]+)/)[1])*Math.PI/180;
  near(Math.cos(angle),v[0],'ориентация манжеты X');near(Math.sin(angle),v[1],'ориентация манжеты Y');
  const reverse=t.wirePathD(other,p,wr).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);
  near(reverse.at(-2),visual.x,'обратный конец X');near(reverse.at(-1),visual.y,'обратный конец Y');
 }
 count++;
}
const target=s.devices.find(d=>d.type==='mcb1');
s.wires=cases.filter(c=>c.devId!==target.id).map((c,i)=>({id:i+1,a:{devId:c.devId,key:c.key},b:{devId:target.id,key:'t0'},shape:'smooth',pts:[]}));
t.renderWires();
const html=env.els.wireLayer.innerHTML;
assert.equal((html.match(/class="wire-ferrule"/g)||[]).length,s.wires.length*2,'по манжете на каждом конце');
assert(!html.includes('#c2c8cb'),'металлический штырь скрыт');
assert.equal((html.match(/class="wire-hit"/g)||[]).length,s.wires.length,'захват проводов сохранён');
const before=html;target.x+=60;t.renderWires();assert.notEqual(env.els.wireLayer.innerHTML,before,'манжеты следуют за корпусом');
const saved=t.schemeSnapshot('Все наконечники');assert(t.applyPreset(saved));t.renderWires();
assert.equal((env.els.wireLayer.innerHTML.match(/class="wire-ferrule"/g)||[]).length,s.wires.length*2,'старый формат сохраняет механику');
console.log('НШВИ: '+count+' клемм, все типы аппаратов, четыре стороны, масштаб двигателей, пять форм, три сечения, оба порядка, перенос и сохранение — OK.');
