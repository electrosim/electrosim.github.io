/* Включение бытового прибора без питания: жёлтая кнопка и нижнее предупреждение. */
const assert=require('assert');
const {load}=require('./sandbox');
for(const type of ['split','fridge','washer','boiler','stove']){
  for(const pointerType of ['mouse','touch']){
    const e=load({interactive:true,mobile:pointerType==='touch'}),t=e.api,s=t.state;
    s.power=true;s.motors=[];s.relays=[];s.wires=[];s.special.inbox=true;
    s.panels[0].inletVoltage=220;
    const d={id:1,type,x:100,y:100,tag:'E1',applianceOn:false,ratedPower:t.TYPES[type].defaultPower};
    s.devices=[d];
    const matrix={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this;}};
    e.els.scene.getScreenCTM=()=>matrix;e.els.world.getScreenCTM=()=>matrix;
    const body=e.makeEl('g');body.classList.add('dev');body.dataset.id='1';body.parentNode=e.els.deviceLayer;
    const button=e.makeEl('g');button.setAttribute('data-appliance-toggle','1');button.parentNode=body;
    const label=e.makeEl('text');label.parentNode=button;
    function tap(){
      e.pointer(label,'pointerdown',{pointerType,pointerId:1,button:0,clientX:180,clientY:180});
      e.pointer(label,'pointerup',{pointerType,pointerId:1,button:0,clientX:180,clientY:180});
      e.runTimers(0);
    }
    t.renderAll();tap();
    assert.equal(d.applianceOn,true,type+': кнопка включена');
    assert(t.deviceInner(type,d).includes('fill="#f2c94c"'),type+': жёлтый цвет');
    assert(e.els.toast.textContent.includes('Нет напряжения'));
    assert.equal(e.els.toast.className,'show warning');
    e.runTimers(3400);assert.equal(e.els.toast.className,'');
    tap();assert.equal(d.applianceOn,false);
    assert(!t.deviceInner(type,d).includes('fill="#f2c94c"'));
    assert.equal(e.els.toast.className,'','выключение не показывает предупреждение');
    s.wires=['L','N','PE'].map((key,i)=>({id:i+1,a:{devId:'IN',key:key==='L'?'L1':key},b:{devId:1,key}}));
    t.renderAll();tap();
    assert.equal(d.applianceOn,true);
    assert(t.deviceInner(type,d).includes('fill="#9db5aa"'),'при питании кнопка зелёная');
    assert.equal(e.els.toast.className,'','при питании предупреждения нет');
    s.wires=[];t.renderAll();
    assert(t.deviceInner(type,d).includes('fill="#f2c94c"'),'после потери питания кнопка жёлтая');
    console.log('OK '+type+' '+pointerType+': без питания, плашка, выключение, питание и его потеря.');
  }
}
