// Review-only DOM adapter. No production files or electrical formulas are changed.
const Module = require('module');
const fs = require('fs');
const original = Module._extensions['.js'];
Module._extensions['.js'] = function(mod, filename) {
  if (!filename.endsWith(require('path').join('tools','sandbox.js'))) return original(mod,filename);
  let src=fs.readFileSync(filename,'utf8');
  src=src.replace('querySelector(){ return null; }', "querySelector(selector){ return selector && (selector.startsWith('[data-conduit-act=') || selector === '[data-act=\"unconduit\"]') ? makeEl('button') : null; }");
  src=src.replace('state:state, TYPES:TYPES, STOCK:STOCK, DCM:DCM,',
    'state:state, TYPES:TYPES, STOCK:STOCK, DCM:DCM, updateCoils:updateCoils, updateOvervoltageDamage:updateOvervoltageDamage, updateTimeRelays:updateTimeRelays, resistiveLoads:resistiveLoads, nominalResistance:nominalResistance, motorInertiaTick:motorInertiaTick, motorSpeedByFormula:motorSpeedByFormula, vfdInputState:vfdInputState,');
  mod._compile(src,filename);
};
