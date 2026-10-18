require('./review-preload.cjs');
const {load}=require('../tools/sandbox');
const assert=require('assert/strict');
const env=load(),t=env.api,s=t.state;
let seed=126733;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}
function near(a,b,description){assert(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${description}: ${a} != ${b}`);}
for(let trial=0;trial<60;trial++){
  s.power=true;s.special.inbox=true;s.panels[0].inletVoltage=220;
  s.devices=[];s.motors=[];s.relays=[];s.pushbuttons=[];s.wires=[];
  const n=3+Math.floor(random()*7),branches=[];
  for(let j=0;j<n;j++)s.devices.push({id:100+j,type:'junction'});
  function wire(a,ak,b,bk){const id=s.wires.length+1;s.wires.push({id,a:{devId:a,key:ak},b:{devId:b,key:bk}});return id;}
  function branch(a,b){const resistance=20+Math.floor(random()*1000),id=1+branches.length;
    s.devices.push({id,type:'boiler',applianceOn:true,ratedPower:48400/resistance});
    const aw=wire(100+a,'top0',id,'L'),bw=wire(id,'N',100+b,'top0');branches.push({a,b,resistance,id,aw,bw});
  }
  for(let j=1;j<n;j++)branch(j-1,j);
  for(let k=0;k<2*n;k++){const a=Math.floor(random()*n),b=Math.floor(random()*n);if(a!==b)branch(a,b);}
  const feed=wire('IN','L1',100,'top0'),ret=wire(100+n-1,'top0','IN','N');
  // Independent star-mesh reduction of positive conductances.
  const g=Array.from({length:n},()=>Array(n).fill(0));
  for(const e of branches){g[e.a][e.b]+=1/e.resistance;g[e.b][e.a]+=1/e.resistance;}
  const alive=new Set(Array.from({length:n},(_,j)=>j));
  for(let k=1;k<n-1;k++){
    const others=[...alive].filter(j=>j!==k),total=others.reduce((sum,j)=>sum+g[k][j],0);
    for(let a=0;a<others.length;a++)for(let b=a+1;b<others.length;b++){
      const i=others[a],j=others[b],extra=g[i][k]*g[k][j]/total;g[i][j]+=extra;g[j][i]+=extra;
    }
    alive.delete(k);
  }
  const expectedCurrent=220*g[0][n-1],currents=t.clampWireCurrents(),map=t.potentialMap();
  assert(!map.conflict);near(currents[feed],expectedCurrent,'source current');near(currents[ret],expectedCurrent,'neutral current');
  const injection=Array.from({length:n},()=>({r:0,i:0}));let power=0;
  for(const e of branches){
    const a=map.pot[e.id+'/L'],b=map.pot[e.id+'/N'],u=a.r-b.r;
    near(currents[e.aw],Math.abs(u/e.resistance),'load Ohm law');near(currents[e.bw],currents[e.aw],'series continuity');
    power+=u*u/e.resistance;injection[e.a].r+=u/e.resistance;injection[e.b].r-=u/e.resistance;
  }
  for(let j=1;j<n-1;j++)near(injection[j].r,0,'junction law');near(power,220*expectedCurrent,'power balance');
}
console.log('PASS: 60 deterministic mixed passive networks; independent star-mesh reference, current continuity, Kirchhoff junction rule, Ohm law and power balance.');
