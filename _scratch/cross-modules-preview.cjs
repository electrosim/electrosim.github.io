const fs=require('fs'),path=require('path'),{load}=require('../tools/sandbox');
const {api:t}=load(),s=t.state;s.power=false;s.devices=[];s.motors=[];s.relays=[];s.wires=[];
let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 400"><rect width="720" height="400" rx="14" fill="#e5ebee"/>';
svg+='<rect x="18" y="140" width="684" height="106" rx="3" fill="#bcc6cc" stroke="#8b989f"/><path d="M18 146H702 M18 154H702 M18 232H702 M18 240H702" stroke="#e8eff2" stroke-width="4"/>';
for(let x=30;x<700;x+=38)svg+='<rect x="'+x+'" y="183" width="19" height="12" rx="4" fill="#84939c" stroke="#d7e0e5"/>';
for(const [i,type] of ['crossN','crossPE'].entries()){
  const d={id:i+1,type,x:i?466:94,y:100,tag:i?'XPE1':'XN1'};s.devices.push(d);
  svg+='<g transform="translate('+d.x+' '+d.y+')">'+t.deviceInner(type,d)+'</g>';
  for(const key of ['k0','k1','k3','k7','k8','k10']){
    const p=t.terminal(d.id,key),top=p.entrySide==='top',other={x:p.x,y:top?40:350},wr={shape:'straight',sectionMm2:2.5,color:i?t.WC.PE:t.WC.N,pts:[]};
    const line=t.wirePathD(p,other,wr);svg+=t.wireStrokeGeom(line,wr.color,'wire-visible',false,t.wireVisualWidth(wr))+t.wireFerruleSvg(p,wr,line,false);
  }
}
svg+='</svg>';
fs.writeFileSync(path.join(__dirname,'cross-modules-preview.svg'),svg);
fs.writeFileSync(path.join(__dirname,'cross-modules-preview.html'),'<!doctype html><meta charset="utf-8"><title>Кросс-модули N и PE</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#f2f5f6;font:20px Segoe UI,Arial;color:#233442}main{max-width:1100px;margin:auto}header{display:grid;grid-template-columns:1fr 1fr;text-align:center;gap:36px;margin-bottom:10px}h1{font-size:23px;margin:0}p{font-size:16px;color:#60737f;margin:5px 0 15px}svg{width:100%;display:block}</style><main><header><section><h1>Нулевой кросс-модуль N</h1><p>Синее основание · 2 ряда по 4 клеммы</p></section><section><h1>Заземляющий кросс-модуль PE</h1><p>Зелёное основание · 2 ряда по 4 клеммы</p></section></header>'+svg+'</main>');
console.log('Cross-module SVG preview created');
