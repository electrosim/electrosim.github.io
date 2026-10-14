const assert=require('assert/strict'),{load}=require('./sandbox');
function fixture(mobile){
  const e=load({interactive:true,mobile:!!mobile,width:1280,height:720});
  function matrix(world){
    const v=e.api.touchView(),a=Math.min(1280/v.w,720/v.h);
    const x=(e.els.scene.getAttribute('preserveAspectRatio')||'').startsWith('xMin')?0:(1280-v.w*a)/2;
    const tx=x-v.x*a,ty=720-v.h*a-v.y*a+(world?200*a:0);
    return {a,b:0,c:0,d:a,e:tx,f:ty,inverse(){return {a:1/a,b:0,c:0,d:1/a,e:-tx/a,f:-ty/a};}};
  }
  e.els.scene.getScreenCTM=()=>matrix(false);e.els.world.getScreenCTM=()=>matrix(true);
  const box=e.makeEl('div');box.classList.add('motor-load-control','motor-instrument-panel');box.parentNode=e.els.motorLayer;
  const readout=e.makeEl('b');readout.parentNode=box;
  const slider=e.makeEl('input');slider.classList.add('motor-load');slider.dataset.mid='M1';slider.value='65';slider.parentNode=box;
  return {e,box,readout,slider};
}
for(const part of ['box','readout','slider']){
  const f=fixture(false),e=f.e,start={...e.api.touchView()},load=e.api.state.motors[0].load;
  e.pointer(f[part],'pointerdown',{pointerType:'mouse',button:1,clientX:500,clientY:300});
  e.pointer(e.window.document,'pointermove',{pointerType:'mouse',button:1,clientX:450,clientY:320});
  e.pointer(e.window.document,'pointerup',{pointerType:'mouse',button:1,clientX:450,clientY:320});
  assert(Math.abs(e.api.touchView().x-start.x-50/(720/start.h))<1e-6,part+': зажатое колесо переносит экран');
  assert.equal(e.api.state.motors[0].load,load,part+': панорамирование не меняет нагрузку');
  const width=e.api.touchView().w;
  const wheel=e.pointer(f[part],'wheel',{pointerType:'mouse',deltaY:-120,clientX:500,clientY:300});
  assert(wheel.defaultPrevented);assert(e.api.touchView().w<width,part+': колесо масштабирует');
}
for(const part of ['box','readout']){
  const f=fixture(true),e=f.e,start={...e.api.touchView()};
  e.pointer(f[part],'pointerdown',{pointerId:1,clientX:500,clientY:300});
  e.pointer(e.window.document,'pointermove',{pointerId:1,clientX:450,clientY:320});e.runFrames();
  assert(e.api.touchView().x>start.x,part+': палец переносит экран');
  e.pointer(e.window.document,'pointerup',{pointerId:1,clientX:450,clientY:320});
  const width=e.api.touchView().w;
  e.pointer(f[part],'pointerdown',{pointerId:1,clientX:400,clientY:300});
  e.pointer(f[part],'pointerdown',{pointerId:2,clientX:600,clientY:300});
  e.pointer(e.window.document,'pointermove',{pointerId:2,clientX:700,clientY:300});e.runFrames();
  assert(e.api.touchView().w<width,part+': два пальца масштабируют');
  e.pointer(e.window.document,'pointerup',{pointerId:2,clientX:700,clientY:300});
  e.pointer(e.window.document,'pointerup',{pointerId:1,clientX:400,clientY:300});assert.equal(e.api.touchPointers.size,0);
}
const f=fixture(true),start={...f.e.api.touchView()};
f.e.pointer(f.slider,'pointerdown',{pointerId:1,clientX:500,clientY:300});
assert.equal(f.e.api.touchPointers.size,0,'регулятор не запускает перенос поля');
f.slider.dispatchEvent({type:'input',bubbles:true});assert.equal(f.e.api.state.motors[0].load,65);
for(const key of ['x','y','w','h'])assert.equal(f.e.api.touchView()[key],start[key],'регулятор меняет только нагрузку');
console.log('Приборная панель: зажатое колесо, масштабирование, перенос пальцем, pinch и регулятор нагрузки — проверки пройдены.');
