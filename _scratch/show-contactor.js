/* Выгружает разметку пускателя (и реле на нём) в отдельные SVG для отрисовки. */
const fs = require('fs');
const path = require('path');
const { load } = require('../tools/sandbox');
const s = load({ interactive: false });
const W = 157.5, H = 246, PAD = 34;

function wrap(inner, w, h, pad) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-pad) + ' ' + (-pad) + ' ' + (w + pad * 2) + ' ' + (h + pad * 2) + '">'
    + '<rect x="' + (-pad) + '" y="' + (-pad) + '" width="' + (w + pad * 2) + '" height="' + (h + pad * 2) + '" fill="#eef1f4"/>'
    + inner + '</svg>';
}
function station(inner, x, label) {
  return '<g transform="translate(' + x + ',0)">' + inner + '</g>'
    + '<text x="' + (x + W / 2) + '" y="' + (H + 26) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#5b6470" font-family="Segoe UI,Arial">' + label + '</text>';
}

const off = s.api.deviceInner('km1', { id: 4, coil: false, tag: 'KM1' });
const on = s.api.deviceInner('km1', { id: 4, coil: true, coilAnim: false, tag: 'KM1' });
const relay = s.api.deviceInner('kk1', { attached: true, tripped: false, set: 25, tag: 'KK1' });

const dx = W + PAD + 26;
const svg = wrap(
  station(off, 0, 'отключён') +
  station(on, dx, 'включён (катушка под напряжением)') +
  station(off + '<g transform="translate(0,' + (H - 74) + ')">' + relay + '</g>', dx * 2, 'с тепловым реле KK1'),
  W + dx * 2, H, PAD);
fs.writeFileSync(path.join(__dirname, 'km.svg'), svg, 'utf8');
console.log('km.svg: ' + svg.length + ' символов');
