const fs=require('fs'),path=require('path'),cp=require('child_process');
const dir=path.join(__dirname,'..','tools');
const results=fs.readdirSync(dir).filter(f=>/^test-.*\.js$/.test(f)).map(f=>{
  const r=cp.spawnSync(process.execPath,['-r',path.join(__dirname,'review-preload.cjs'),path.join(dir,f)],{encoding:'utf8'});
  return {file:f,status:r.status,stdout:r.stdout,stderr:r.stderr};
});
fs.writeFileSync(path.join(__dirname,'review-suite-results.json'),JSON.stringify(results,null,2));
for(const r of results)console.log(`${r.status===0?'PASS':'FAIL'} ${r.file}${r.status===0?'':'\n'+(r.stderr||r.stdout).slice(0,1300)}`);
console.log(JSON.stringify({pass:results.filter(r=>r.status===0).length,fail:results.filter(r=>r.status!==0).length}));
