import fs from 'fs';
import path from 'path';

const combined = fs.readFileSync('5A ,5B.svg', 'utf8');
const regex = /inkscape:label="([^"]+)"/g;
const labels = [];
let m;
while ((m = regex.exec(combined)) !== null) {
  labels.push(m[1]);
}

console.log('Total labels:', labels.length);
const nonNumeric = labels.filter(l => !/^\d+[A-Za-z]?$/.test(l));
console.log('Non-numeric labels:', nonNumeric);
