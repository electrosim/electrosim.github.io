const assert=require('assert/strict'),{load}=require('./sandbox');
const t=load({interactive:true}).api;
function segments(d){
 let p;const out=[];
 for(const cmd of d.match(/[MLQC][^MLQC]*/g)||[]){const n=cmd.slice(1).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number),q=[];for(let i=0;i<n.length;i+=2)q.push({x:n[i],y:n[i+1]});if(cmd[0]==='M'){p=q[0];continue;}out.push([p,...q]);p=q.at(-1);}
 return out;
}
function tangent(seg,end){const p=seg[end?seg.length-1:0];for(let i=end?seg.length-2:1;end?i>=0:i<seg.length;i+=end?-1:1){const dx=(seg[i].x-p.x)*(end?-1:1),dy=(seg[i].y-p.y)*(end?-1:1),len=Math.hypot(dx,dy);if(len>1e-7)return [dx/len,dy/len];}return null;}
function smooth(d,label){
 assert(!/NaN|Infinity/.test(d),label);const parts=segments(d);
 for(let i=1;i<parts.length;i++){const a=tangent(parts[i-1],true),b=tangent(parts[i],false);if(a&&b)assert(a[0]*b[0]+a[1]*b[1]>1-2e-6,label+': острый стык '+i);}
 return parts;
}
for(const shape of ['straight','orthogonal','smooth','arc','s'])for(const sectionMm2 of [.5,2.5,35]){
 for(const side of ['top','bottom','left','right']){
  const a={x:100,y:100,entrySide:side,entryInset:18},b={x:420,y:430,entrySide:side,entryInset:18};
  for(const pts of [[],[{x:140,y:-20},{x:400,y:-20},{x:400,y:400}]]){
   const wr={shape,sectionMm2,pts};smooth(t.wirePathD(a,b,wr),shape+' '+side);smooth(t.wirePathD(b,a,wr),shape+' обратно '+side);
  }
 }
}
for(const shape of ['straight','orthogonal']){
 const a={x:100,y:100,entrySide:'top',entryInset:18},b={x:400,y:100,entrySide:'top',entryInset:18},wr={shape};
 const d=t.wirePathD(a,b,wr),parts=smooth(d,shape+' как на снимке');
 const edgeY=a.y-a.entryInset,firstEnd=parts[0].at(-1);
 assert(Math.abs(edgeY-firstEnd.y-24)<1e-7,'прямой участок от корпуса ровно две манжеты');
 assert(parts.some(p=>p.length===4),'есть плавные скругления на поворотах');
}
for(const shape of ['straight','orthogonal','smooth'])smooth(t.wirePathD({x:0,y:0},{x:180,y:90},{shape,pts:[{x:90,y:0},{x:90,y:90}]}),'свободная трасса '+shape);
console.log('Скругления: плавные касательные всех пяти форм, четыре стороны, три сечения, ручные точки, оба порядка и прямой участок 24 — OK.');

// Обратный подход: первая дуга имеет реальный радиус и уходит в сторону.
for(const shape of ['smooth','straight','orthogonal','arc','s'])for(const side of ['top','bottom','left','right'])for(const reversed of [false,true]){
 const v={top:[0,-1],bottom:[0,1],left:[-1,0],right:[1,0]}[side];
 const p={x:300,y:300,entrySide:side,entryInset:18};
 const q={x:p.x-v[0]*280,y:p.y-v[1]*280};
 const parts=smooth(reversed?t.wirePathD(q,p,{shape}):t.wirePathD(p,q,{shape}),shape+' обратный подход '+side);
 const turn=reversed?parts.at(-2):parts[1];
 assert(turn.length>=3,'после прямого участка есть дуга');
 if(shape==='smooth'||shape==='straight'||shape==='orthogonal'){
  const curve=reversed?turn.slice().reverse():turn;
  assert(curve.length===4,'разворот начинается кубической дугой');
  let minRadius=Infinity;
  for(let j=0;j<=40;j++){
   const u=j/40,z=1-u,[a,b,c,d]=curve;
   const dx=3*z*z*(b.x-a.x)+6*z*u*(c.x-b.x)+3*u*u*(d.x-c.x);
   const dy=3*z*z*(b.y-a.y)+6*z*u*(c.y-b.y)+3*u*u*(d.y-c.y);
   const ddx=6*z*(c.x-2*b.x+a.x)+6*u*(d.x-2*c.x+b.x);
   const ddy=6*z*(c.y-2*b.y+a.y)+6*u*(d.y-2*c.y+b.y);
   const curvature=Math.abs(dx*ddy-dy*ddx)/Math.pow(dx*dx+dy*dy,1.5);
   if(curvature>0)minRadius=Math.min(minRadius,1/curvature);
  }
  assert(minRadius>8,'разворот не сжимается в острый перегиб: R='+minRadius);
  const delta=curve.at(-1);const lateral=(delta.x-p.x)*(-v[1])+(delta.y-p.y)*v[0];
  assert(Math.abs(lateral)>8,'есть боковое место для разворота '+shape+' '+side+' '+reversed+' lateral='+lateral);
 }
}
console.log('Обратный подход: четыре стороны, пять форм, оба конца и измерение радиуса — OK.');
