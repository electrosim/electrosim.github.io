const fs=require('fs'),path=require('path'),{load}=require('../tools/sandbox');
const t=load().api,s=t.state;s.power=false;s.devices=[];s.relays=[];s.motors=[];s.pushbuttons=[];s.wires=[];
s.devices=[{id:1,type:'klemma',x:450,y:600,tag:'XN1'},{id:2,type:'pebus',x:700,y:600,tag:'XPE1'},
 {id:3,type:'mcb1',x:280,y:600,tag:'QF1'},{id:4,type:'mcb1',x:870,y:600,tag:'QF2'}];
s.wires=[{id:1,a:{devId:3,key:'t0'},b:{devId:1,key:'k0'},shape:'orthogonal',sectionMm2:2.5,color:t.WC.N},
 {id:2,a:{devId:1,key:'k5'},b:{devId:3,key:'b0'},shape:'orthogonal',sectionMm2:2.5,color:t.WC.N},
 {id:3,a:{devId:4,key:'t0'},b:{devId:2,key:'k0'},shape:'orthogonal',sectionMm2:2.5,color:t.WC.PE},
 {id:4,a:{devId:2,key:'k5'},b:{devId:4,key:'b0'},shape:'orthogonal',sectionMm2:2.5,color:t.WC.PE}];
const preset=t.schemeSnapshot('Проверка стороны подключения');preset.view={x:160,y:490,w:920,h:750};
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'app.js'),'utf8');
fs.writeFileSync(path.join(__dirname,'bus-side-app.js'),src.replace(/\}\)\(\);\s*$/,`applyPreset(${JSON.stringify(preset)});openProperties({kind:'device',id:1});\n})();`));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/">').replace('src="app.js"','src="_scratch/bus-side-app.js"');
fs.writeFileSync(path.join(__dirname,'bus-side.html'),html);
console.log('Browser fixture: _scratch/bus-side.html');
