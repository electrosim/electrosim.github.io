/* Закрытые категории не создают графику; повторное открытие использует кэш. */
const assert=require('assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{load}=require('./sandbox');
const e=load({interactive:true,mobile:true,width:390,height:664}),t=e.api;
assert.equal(t.trayPreviewCache.size,0,'запуск не собирает ни одного скрытого рисунка');
assert(!/<(?:svg|img)\b/.test(e.els.tray.innerHTML),'до открытия меню лоток содержит только карточки и места под превью');
for(const type of Object.keys(t.STOCK))assert(e.els.tray.innerHTML.includes('data-type="'+type+'"'),'карточка доступна для поиска: '+type);

const menu={open:false},category=e.makeEl('details'),item=e.makeEl('div'),placeholder=e.makeEl('span');
e.els.tray.closest=()=>menu;category.open=false;item.classList.add('tray-item');item.dataset.type='tp';placeholder.parentNode=item;
let pending=[placeholder],writes=0,rendered='';
category.querySelectorAll=()=>pending;
Object.defineProperty(placeholder,'outerHTML',{set(value){writes++;rendered=value;pending=[];}});
t.hydrateTrayCategory(category);assert.equal(writes,0);
menu.open=true;t.hydrateTrayCategory(category);assert.equal(writes,0,'закрытая категория не создаёт рисунок');
menu.open=false;category.open=true;t.hydrateTrayCategory(category);assert.equal(writes,0,'закрытое меню не создаёт рисунок');
menu.open=true;t.hydrateTrayCategory(category);assert.equal(writes,1);assert(rendered.startsWith('<img'));
const cachedCount=t.trayPreviewCache.size;
t.hydrateTrayCategory(category);assert.equal(writes,1,'повторное открытие сохраняет готовое превью');
assert.equal(t.trayPreviewCache.size,cachedCount);

function raster(type,special){
  const markup=t.trayPreviewMarkup(type,special),key=t.trayRasterKey(type,special),asset=e.window.ELECTROSIM_TRAY_PREVIEWS[key];
  assert(asset,'готовая миниатюра: '+key);
  assert(markup.includes('class="mini tray-raster"'),'лоток использует простой PNG: '+key);
  assert(!markup.includes('data:image/svg')&&!markup.includes('<svg'),'SVG не разбирается при показе: '+key);
  assert(markup.includes('src="'+asset.src+'"'));
  const file=path.join(__dirname,'..',asset.src),png=fs.readFileSync(file);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','файл является PNG: '+key);
  assert.equal(png.readUInt32BE(20),222,'высота готовой миниатюры 74 px × 3: '+key);
  assert.equal(asset.sourceHash,createHash('sha256').update(t.trayPreviewSvg(type,special)).digest('hex'),'рисунок изменился: пересоздайте миниатюры node tools/build-tray-previews.js ('+key+')');
  return markup;
}
for(const type of Object.keys(t.STOCK)){
  const markup=raster(type,null),count=t.trayPreviewCache.size;
  assert(markup.includes('draggable="false"'),'браузер не перехватывает перенос: '+type);
  assert.equal(t.trayPreviewMarkup(type,null),markup);assert.equal(t.trayPreviewCache.size,count,'повторное получение не создаёт копии: '+type);
}
for(const special of ['conduit','clamp','motor','dcmotor','pushbutton','multimeter'])raster(null,special);
raster(null,'panel');
for(const voltage of [220,380]){
  t.state.panels[0].inletVoltage=voltage;
  Object.assign(t.state.specialProps.inbox,{ratedVoltage:voltage,frequency:50});
  t.state.special.inbox=false;
  for(const special of ['panel','inbox']){
    raster(null,special);assert(t.trayPreviewSvg(null,special).includes('assets/high-voltage-warning.png'),'знак опасности включён в готовый рисунок: '+special);
  }
}
for(const poles of [1,2,3])for(let count=1;count<=Math.floor(t.SLOTS/poles);count++){
  Object.assign(t.combTraySettings,{combPoles:poles,combCount:count});raster('comb',null);
}
Object.assign(t.combTraySettings,{combPoles:1,combCount:3});
const oldComb=t.trayPreviewMarkup('comb',null);
t.combTraySettings.combCount=8;
assert.notEqual(t.trayPreviewMarkup('comb',null),oldComb,'изменение количества зубьев обновляет превью гребёнки');
const oldInbox=t.trayPreviewMarkup(null,'inbox');
t.state.specialProps.inbox={...t.state.specialProps.inbox,ratedVoltage:220};
t.state.panels[0].inletVoltage=220;
assert.notEqual(t.trayPreviewMarkup(null,'inbox'),oldInbox,'напряжение ввода обновляет рисунок вместо старого кэша');
t.state.specialProps.inbox.frequency=60;
const custom=t.trayPreviewMarkup(null,'inbox');
assert(custom.startsWith('<svg')&&custom.includes('60 Гц'),'нестандартные параметры ввода не подменяются готовой картинкой');
assert.equal(t.trayPreviewMarkup('tp',null),rendered,'изменение настроек ввода не меняет кэш обычного прибора');
console.log('Превью лотка: отложенное создание, кэш, неизменные рисунки, локальные ресурсы и обновление настроек — OK.');
