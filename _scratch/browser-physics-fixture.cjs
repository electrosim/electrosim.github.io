// Browser-only integration fixture using the current application source.
const fs=require('fs'),path=require('path'),{load}=require('../tools/sandbox');
const t=load().api,s=t.state;s.power=true;s.motors[0].load=100;s.devices=[];s.relays=[];s.wires=[];
for(let i=0;i<3;i++)s.wires.push({id:i+1,a:{devId:'IN',key:'L'+(i+1)},b:{devId:s.motors[0].id,key:['U1','V1','W1'][i]}});
const preset=t.schemeSnapshot('Проверка номинального режима'),panel=t.motorInstrumentPosition(s.motors[0]);
preset.view={x:panel.x-15,y:panel.y-40,w:680,h:1900};
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const app=src.replace(/\}\)\(\);\s*$/,`applyPreset(${JSON.stringify(preset)});\n})();`);
fs.writeFileSync(path.join(__dirname,'browser-physics-app.js'),app);
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/">');
html=html.replace('src="app.js"','src="_scratch/browser-physics-app.js"');
fs.writeFileSync(path.join(__dirname,'browser-physics.html'),html);
console.log('Browser fixture: _scratch/browser-physics.html');
