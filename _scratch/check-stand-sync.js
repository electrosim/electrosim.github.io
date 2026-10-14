/* Сверка собранного stand-1file.html с текущими модульными исходниками. */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
const stand = fs.readFileSync(path.join(dir, 'stand-1file.html'), 'utf8');
const index = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
const cat = fs.readFileSync(path.join(dir, 'presets', 'catalog.js'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

const bundle = cat + '\n' + js;
let expected = index.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>');
expected = expected.replace('<script src="presets/catalog.js"></script>', '');
expected = expected.replace('<script src="app.js"></script>', '<script>\n' + bundle + '\n</script>');

console.log('stand-1file.html:', stand.length, 'символов');
console.log('ожидаемая сборка:', expected.length, 'символов');
console.log('файлы совпадают:', stand === expected ? 'ДА' : 'НЕТ');
if (stand !== expected) {
  let at = 0;
  while (at < stand.length && at < expected.length && stand[at] === expected[at]) at++;
  console.log('первое расхождение на позиции ' + at + ':');
  console.log('  в файле: ' + JSON.stringify(stand.slice(Math.max(0, at - 70), at + 70)));
  console.log('  ожидалось: ' + JSON.stringify(expected.slice(Math.max(0, at - 70), at + 70)));
}
console.log('app.js содержит исходный пускатель:', /Магнитный пускатель KMI-22510/.test(js) ? 'ДА' : 'НЕТ');
console.log('stand содержит исходный пускатель:', /Магнитный пускатель KMI-22510/.test(stand) ? 'ДА' : 'НЕТ');
process.exit(stand === expected ? 0 : 1);
