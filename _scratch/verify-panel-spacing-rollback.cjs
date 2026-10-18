const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const t=require('../tools/sandbox').load().api;
assert.equal(t.PANEL.firstRail,360);assert.equal(t.PANEL.pitch,400);assert.equal(t.PANEL.baseHeight,720);
const root=path.resolve(__dirname);
for(const name of ['panel-spacing-fixture.cjs','panel-spacing-app.js','panel-spacing.html','panel-spacing.png','din-spacing-results.txt']){
 const target=path.resolve(root,name);assert.equal(path.dirname(target),root);
 if(fs.existsSync(target))fs.unlinkSync(target);
}
console.log('Previous panel dimensions restored; temporary spacing-change previews removed.');
