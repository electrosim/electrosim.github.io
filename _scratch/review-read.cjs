const fs = require('fs');
const path = process.argv[2];
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const start = Number(process.argv[3] || 1);
const end = Number(process.argv[4] || lines.length);
for(let i=start-1; i<Math.min(end,lines.length);i++) console.log(`${i+1}: ${lines[i]}`);
