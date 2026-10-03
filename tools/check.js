/* Проверка исходников и всех регрессий без запуска браузера: node tools/check.js */
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {spawnSync}=require('child_process');
const root=path.join(__dirname,'..');
let failures=0;
function verify(name,read){
  try{read();console.log('OK '+name);}
  catch(error){failures++;console.error('FAIL '+name+': '+error.message);}
}
verify('синтаксис app.js и каталога',function(){
  for(const file of ['app.js','presets/catalog.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
});
verify('ссылки index.html и идентификаторы элементов',function(){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  if(new Set(ids).size!==ids.length)throw new Error('повторяющиеся id');
  for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)){
    if(!fs.existsSync(path.join(root,match[1])))throw new Error('отсутствует '+match[1]);
  }
  for(const match of app.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)/g)){
    if(!ids.includes(match[1]))throw new Error('нет элемента '+match[1]);
  }
  for(const match of app.matchAll(/(?:src|href)="(assets\/[^"']+)"/g)){
    if(!fs.existsSync(path.join(root,match[1])))throw new Error('отсутствует '+match[1]);
  }
});
const files=fs.readdirSync(__dirname).filter(file=>/^test-.*\.js$/.test(file)).sort();
for(const file of files){
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:root,stdio:'inherit',timeout:30000});
  if(result.error||result.status!==0){failures++;console.error('FAIL '+file+(result.error?': '+result.error.message:''));}
}
console.log(failures?'Не пройдено проверок: '+failures:'Все проверки пройдены ('+files.length+' наборов тестов).');
process.exitCode=failures?1:0;
