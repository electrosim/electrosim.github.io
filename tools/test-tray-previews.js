/* Закрытые категории не создают графику; повторное открытие использует кэш. */
const assert=require('assert/strict'),{load}=require('./sandbox');
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

function svgFromImage(markup){
  const src=markup.match(/src="data:image\/svg\+xml;charset=utf-8,([^"]+)"/);assert(src,'самодостаточная SVG-картинка');
  const svg=decodeURIComponent(src[1]);assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert(!/<image\b/.test(svg),'картинка не запрашивает вложенные внешние файлы');return svg;
}
for(const type of Object.keys(t.STOCK)){
  const markup=t.trayPreviewMarkup(type,null),count=t.trayPreviewCache.size,svg=svgFromImage(markup);
  assert(markup.includes('draggable="false"'),'браузер не перехватывает перенос: '+type);
  assert(svg.includes(t.deviceInner(type,type==='comb'?t.combTraySettings:{})),'рисунок прибора сохранён: '+type);
  assert.equal(t.trayPreviewMarkup(type,null),markup);assert.equal(t.trayPreviewCache.size,count,'повторное получение не создаёт копии: '+type);
}
for(const special of ['conduit','clamp','motor','dcmotor','pushbutton','multimeter'])svgFromImage(t.trayPreviewMarkup(null,special));
t.state.special.inbox=false;
for(const special of ['panel','inbox']){
  const markup=t.trayPreviewMarkup(null,special);assert(markup.startsWith('<svg'));
  assert(markup.includes('assets/high-voltage-warning.png'),'локальный знак опасности остаётся видимым: '+special);
}
const oldComb=t.trayPreviewMarkup('comb',null);
t.combTraySettings.combCount=8;
assert.notEqual(t.trayPreviewMarkup('comb',null),oldComb,'изменение количества зубьев обновляет превью гребёнки');
const oldInbox=t.trayPreviewMarkup(null,'inbox');
t.state.specialProps.inbox={...t.state.specialProps.inbox,ratedVoltage:220};
t.state.panels[0].inletVoltage=220;
assert.notEqual(t.trayPreviewMarkup(null,'inbox'),oldInbox,'напряжение ввода обновляет рисунок вместо старого кэша');
assert.equal(t.trayPreviewMarkup('tp',null),rendered,'изменение настроек ввода не меняет кэш обычного прибора');
console.log('Превью лотка: отложенное создание, кэш, неизменные рисунки, локальные ресурсы и обновление настроек — OK.');
