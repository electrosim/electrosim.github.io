const cp=require('child_process'),fs=require('fs'),path=require('path');
const r=cp.spawnSync(process.execPath,['tools/check.js'],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:120000});
const output=(r.stdout||'')+(r.stderr||'');fs.writeFileSync(path.join(__dirname,'check-after-fixes.txt'),output);
const lines=output.split(/\r?\n/);const selected=new Set();
lines.forEach((line,i)=>{if(/FAIL|Error|Assertion|actual:|expected:|ПРОВАЛ|Не пройдено|Все проверки пройдены \(/i.test(line))for(let j=Math.max(0,i-2);j<Math.min(lines.length,i+7);j++)selected.add(j);});
console.log([...selected].sort((a,b)=>a-b).map(j=>lines[j]).join('\n'));console.log('exit='+r.status);if(r.error)console.log(r.error);process.exitCode=r.status||0;
