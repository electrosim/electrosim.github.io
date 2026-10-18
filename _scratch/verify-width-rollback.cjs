const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const t=require('../tools/sandbox').load().api;
assert.equal(t.TYPES.km1.modules,3);assert.equal(t.TYPES.kk1.modules,3);
assert.deepEqual(Array.from(t.termDefs('km1').filter(p=>/^a/.test(p.key)),p=>p.dx),[59.75,97.75,59.75,97.75]);
const root=path.resolve(__dirname);
for(const name of ['contactor-alignment-fixture.cjs','contactor-alignment-app.js','contactor-alignment.html','contactor-alignment.png','din-alignment-results.txt']){
 const target=path.resolve(root,name);assert.equal(path.dirname(target),root);
 if(fs.existsSync(target))fs.unlinkSync(target);
}
console.log('Previous widths and auxiliary terminal positions restored; temporary width-change previews removed.');
