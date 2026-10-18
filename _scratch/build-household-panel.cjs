const fs=require('fs'),path=require('path'),{load}=require('../tools/sandbox');
const root=path.join(__dirname,'..'),dir=path.join(root,'presets');
const sourceName='Бытовой монтаж — комнаты.ad-scheme.json';
const source=JSON.parse(fs.readFileSync(path.join(dir,sourceName),'utf8')).preset;
const e=load(),t=e.api;t.applyPreset(source);const s=t.state,panel=s.panels[0];
s.power=true;s.devices=[];s.wires=[];s.relays=[];s.motors=[];s.pushbuttons=[];s.nextId=1;
const rails=t.mountingRails(),nKeys=['k0','k1','k2','k3','k7','k8','k9','k10'];
let next=1,wireId=1;
const ref=(d,key)=>({devId:typeof d==='object'?d.id:d,key});
function dev(type,tag,props){const d=Object.assign({id:next++,type,tag},props);s.devices.push(d);return d;}
function mounted(type,tag,row,slot,props){return dev(type,tag,Object.assign({rail:rails[row].id,slot},props));}
function wire(a,b,color,sectionMm2,pts=[],label=''){
 const w={id:wireId++,a,b,color,sectionMm2,shape:'orthogonal',pts,label};s.wires.push(w);return w;
}
function inner(a,b,color,section,via=[]){return wire(a,b,color,section,via,'Внутренний монтаж щита');}
const main=mounted('mcb2','QF0',0,0,{breakerType:'C63',on:true,tripped:false,customName:'Ввод 220 В · 63 А'});
const rcd=[],neutral=[],earth=[],breakers=[],circuits=[];
for(let row=0;row<3;row++){
 rcd.push(mounted('rcd','QD'+(row+1),row,3,{ratedCurrent:63,ratedLeakageMa:30,rcdType:row===1?'A':'F',on:true,tripped:false}));
 neutral.push(mounted('crossN','XN'+(row+1),row,11,{}));
 earth.push(mounted('pebus','XPE'+(row+1),row,14,{wireEntrySide:'right'}));
}
const defs=[
 [0,'QF1',10,'Освещение: щитовая, прихожая, спальня','lighting',1.5],
 [0,'QF2',16,'Розетка щитовой','socket0',2.5],
 [0,'QF3',16,'Розетка прихожей','socket1',2.5],
 [0,'QF4',10,'Кондиционер спальни','split',2.5],
 [0,'QF5',10,'Холодильник кухни','fridge',2.5],
 [1,'QF6',10,'Освещение: кухня, ванная, подсобка','lighting',1.5],
 [1,'QF7',16,'Розетка спальни','socket2',2.5],
 [1,'QF8',16,'Розетка кухни','socket3',2.5],
 [1,'QF9',32,'Электроплита 7 кВт','stove',6],
 [2,'QF10',16,'Розетка ванной','socket4',2.5],
 [2,'QF11',16,'Розетка подсобки','socket5',2.5],
 [2,'QF12',16,'Стиральная машина','washer',2.5],
 [2,'QF13',16,'Бойлер','boiler',2.5]
];
for(const [row,tag,rating,name,loadType,section] of defs){
 const slot=5+circuits.filter(c=>c.row===row).length;
 const breaker=mounted('mcb1',tag,row,slot,{breakerType:'C'+rating,on:true,tripped:false,circuitName:name});
 breakers.push(breaker);circuits.push({row,tag,rating,name,loadType,section,breaker,index:circuits.length});
}
for(let row=0;row<3;row++){
 const members=circuits.filter(c=>c.row===row).map(c=>c.breaker);
 dev('comb','GS'+(row+1),{combPoles:1,combCount:members.length,combAnchorId:members[0].id});
}
// Ввод и перемычки на входах УЗО. После каждого УЗО своя изолированная N-шина.
inner(ref('IN','L1'),ref(main,'t0'),t.WC.L1,16);
inner(ref('IN','N'),ref(main,'t1'),t.WC.N,16);
const peInput=t.terminal(earth[0].id,'k0'),peSource=t.terminal('IN','PE'),peGutter=panel.x+PWidth()-14;
inner(ref('IN','PE'),ref(earth[0],'k0'),t.WC.PE,16,[{x:peSource.x,y:panel.y+190},{x:peGutter,y:panel.y+190},{x:peGutter,y:peInput.y}]);
function PWidth(){return t.PANEL.width;}
for(let row=0;row<3;row++){
 const y=rails[row].y,origin=t.originOf(rcd[row]);
 const feedL=row?ref(rcd[row-1],'tL'):ref(main,'b0');
 const feedN=row?ref(rcd[row-1],'tN'):ref(main,'b1');
 const l=t.terminal(rcd[row].id,'tL'),n=t.terminal(rcd[row].id,'tN');
 const fromL=t.terminal(feedL.devId,feedL.key),fromN=t.terminal(feedN.devId,feedN.key);
 const feedPath=(p,x,header,lower)=>row
  ?[{x:p.x,y:rails[row-1].y-header},{x,y:rails[row-1].y-header},{x,y:y-header},{x:header===190?l.x:n.x,y:y-header}]
  :[{x:p.x,y:y+lower},{x,y:y+lower},{x,y:y-header},{x:header===190?l.x:n.x,y:y-header}];
 inner(feedL,ref(rcd[row],'tL'),t.WC.L1,10,feedPath(fromL,panel.x+163,190,180));
 inner(feedN,ref(rcd[row],'tN'),t.WC.N,10,feedPath(fromN,panel.x+177,175,195));
 const first=circuits.find(c=>c.row===row).breaker,firstTerm=t.terminal(first.id,'t0');
 inner(ref(rcd[row],'bL'),ref(first,'t0'),t.WC.L1,10,[{x:l.x,y:y+155},{x:panel.x+580,y:y+155},{x:panel.x+580,y:y-185},{x:firstTerm.x,y:y-185}]);
 const nb=t.terminal(neutral[row].id,'k0'),rcdN=t.terminal(rcd[row].id,'bN');
 inner(ref(rcd[row],'bN'),ref(neutral[row],'k0'),t.WC.N,10,[{x:rcdN.x,y:y+180},{x:panel.x+590,y:y+180},{x:panel.x+590,y:y-155},{x:nb.x,y:y-155}]);
 if(row){
  const prev=t.terminal(earth[row-1].id,'k5'),current=t.terminal(earth[row].id,'k0');
  inner(ref(earth[row-1],'k5'),ref(earth[row],'k0'),t.WC.PE,10,[{x:peGutter,y:prev.y},{x:peGutter,y:current.y}]);
 }
}
const rooms=[
 {name:'Щитовая',socket:[1830,2150],light:[1830,850],sw:[1830,1450]},
 {name:'Прихожая',socket:[2780,2150],light:[3070,850],sw:[2780,1420]},
 {name:'Спальня',socket:[4300,2150],light:[5480,850],sw:[4260,1450]},
 {name:'Кухня',socket:[7950,1300],light:[7280,850],sw:[6030,1000]},
 {name:'Ванная',socket:[8620,1420],light:[9100,850],sw:[8500,1100]},
 {name:'Подсобка',socket:[10520,2150],light:[11000,850],sw:[10520,1400]}
];
const lamps=[],switches=[],sockets=[];
rooms.forEach((r,i)=>{
 sockets.push(dev('outlet','XS'+(i+1),{x:r.socket[0],y:r.socket[1],customName:'Розеточный блок · '+r.name}));
 lamps.push(dev('bulb','EL'+(i+1),{x:r.light[0],y:r.light[1],ratedPower:10,customName:'Лампа 10 Вт · '+r.name}));
 switches.push(dev('wallSwitch','SA'+(i+1),{x:r.sw[0],y:r.sw[1],gangs:1,switchOn1:true,customName:'Свет · '+r.name}));
});
const appliances={
 split:dev('split','E1',{x:4400,y:850,ratedPower:1500,applianceOn:false,customName:'Кондиционер спальни · 1,5 кВт'}),
 fridge:dev('fridge','E2',{x:6050,y:1400,ratedPower:300,applianceOn:false,customName:'Холодильник кухни · 0,3 кВт'}),
 stove:dev('stove','E3',{x:6640,y:1850,ratedPower:7000,applianceOn:false,customName:'Плита кухни · 7 кВт'}),
 washer:dev('washer','E4',{x:8620,y:1850,ratedPower:2200,applianceOn:false,customName:'Стиральная машина · 2,2 кВт'}),
 boiler:dev('boiler','E5',{x:11000,y:1600,ratedPower:2000,applianceOn:false,customName:'Бойлер подсобки · 2 кВт'})
};
const nUsed=[1,1,1],peUsed=[1,1,1];
function route(a,b,c,kind,ordinal=0){
 const p=t.terminal(a.devId,a.key),q=t.terminal(b.devId,b.key),offset={L:0,N:6,PE:12}[kind];
 const trunk=275+c.index*22+offset+ordinal*2,gutter=panel.x-45-c.index*6-offset/3;
 const source=s.devices.find(d=>d.id===a.devId),pts=[];
 if(source&&source.rail){
  const row=Number(source.rail.split(':')[1]),cy=rails[row].y;
  if(p.entrySide==='left'||p.entrySide==='right'){
   const x=peGutter;pts.push({x,y:p.y},{x,y:cy-205-ordinal*3});
  }else pts.push({x:p.x,y:p.entrySide==='bottom'?cy+175+ordinal*4:cy-205-ordinal*3});
  pts.push({x:gutter,y:pts.at(-1).y},{x:gutter,y:trunk});
 }else pts.push({x:p.x,y:trunk});
 pts.push({x:q.x,y:trunk},{x:q.x,y:q.y-70});
 return wire(a,b,kind==='PE'?t.WC.PE:kind==='N'?t.WC.N:t.WC.L1,c.section,pts,c.tag+' · '+c.name+' · '+kind);
}
for(const c of circuits){
 const loads=c.loadType==='lighting'?lamps.slice(c.row===0?0:3,c.row===0?3:6)
  :c.loadType.startsWith('socket')?[sockets[Number(c.loadType.slice(6))]]:[appliances[c.loadType]];
 if(c.loadType==='lighting'){
  const base=c.row===0?0:3;
  loads.forEach((lamp,i)=>{
   const sw=switches[base+i],from=i?ref(switches[base+i-1],'L'):ref(c.breaker,'b0');
   route(from,ref(sw,'L'),c,'L',i);
   const a=ref(sw,'O1'),b=ref(lamp,'L'),p=t.terminal(sw.id,'O1'),q=t.terminal(lamp.id,'L');
   wire(a,b,t.WC.L1,c.section,[{x:p.x,y:770},{x:q.x,y:770},{x:q.x,y:q.y-60}],c.tag+' · Фаза после выключателя');
   route(ref(neutral[c.row],nKeys[nUsed[c.row]++]),ref(lamp,'N'),c,'N',i);
  });
 }else for(const load of loads){
  route(ref(c.breaker,'b0'),ref(load,'L'),c,'L');
  route(ref(neutral[c.row],nKeys[nUsed[c.row]++]),ref(load,'N'),c,'N');
  route(ref(earth[c.row],'k'+peUsed[c.row]++),ref(load,'PE'),c,'PE');
 }
 c.consumerIds=loads.map(d=>d.id);
}
s.nextId=next;
const name='Бытовой монтаж — собранный щит 63 А';
const preset=t.schemeSnapshot(name);preset.id='household-mounted-63a';
preset.description='Учебный ввод 220 В 63 А; 13 групп, 3 УЗО 63 А / 30 мА; шесть розеточных блоков, шесть ламп, пять бытовых приборов.';
preset.design={supplyV:220,incomerA:63,circuits:circuits.map(({breaker,...c})=>Object.assign(c,{breakerId:breaker.id})),rcdIds:rcd.map(d=>d.id),neutralIds:neutral.map(d=>d.id),earthIds:earth.map(d=>d.id),mainId:main.id};
delete preset.view;
const file=name+'.ad-scheme.json';
const data={format:'ad-trainer-scheme',version:1,exported:new Date().toISOString(),preset};
fs.writeFileSync(path.join(dir,file),JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'household-mounted-catalog-entry.json'),JSON.stringify({file,modified:Date.now(),data},null,2));
console.log(JSON.stringify({file,devices:s.devices.length,wires:s.wires.length,circuits:circuits.length,neutralPorts:nUsed,earthPorts:peUsed}));
