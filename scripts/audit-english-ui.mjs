import fs from 'fs';
import path from 'path';

// English-only UI guard. Keep this deliberately conservative: flag reliable French
// signals without treating English words such as "observe", "change", "visible",
// "origin" or "axes" as French.
const roots=['index.html','campaign','assets/js','data'];
const exts=new Set(['.html','.js','.json']);
const files=[];
function walk(p){
  if(!fs.existsSync(p))return;
  const st=fs.statSync(p);
  if(st.isDirectory())for(const n of fs.readdirSync(p))walk(path.join(p,n));
  else if(exts.has(path.extname(p)))files.push(p);
}
roots.forEach(walk);

const accent=/[àâçéèêëîïôùûüÿœæ]/i;
const frenchSignals=[
  /\bCette fois\b/,/\bLe robot\b/,/\bLes moteurs\b/,/\bLe corps\b/,/\bLa mesure\b/,/\bLa chaîne\b/,/\bLe contrôle\b/,/\bLa mission\b/,
  /\bTu (?:as|peux|dois|viens|vas|n['’])/i,/\bIl faut\b/i,/\bCela\b/,/\bAucun(?:e)?\b/,
  /\bune panne\b/i,/\bun système\b/i,/\bune mesure\b/i,/\bdes données\b/i,/\bles données\b/i,/\bles fonctions\b/i,
  /\ble monde\b/i,/\bla réalité\b/i,/\bl['’]évidence\b/i,/\bl['’]information\b/i,/\bl['’]estimation\b/i,
  /\bn['’](?:a|est)\b/i,/\bqu['’](?:il|elle|un|une)\b/i,/\bc['’]est\b/i,/\bd['’]abord\b/i,
  /\best faible\b/i,/\breste sain\b/i,/\bagit (?:sur|surtout)\b/i,/\bavant le test\b/i,/\baprès réparation\b/i,
  /\bmission terminée\b/i,/\bretourne à\b/i,/\brejoue\b/i
];

let hits=0;
for(const f of files){
  const lines=fs.readFileSync(f,'utf8').split(/\r?\n/);
  lines.forEach((line,i)=>{
    if(accent.test(line)||frenchSignals.some(r=>r.test(line))){
      hits++;
      console.log(`${f}:${i+1}: ${line.trim().slice(0,500)}`);
    }
  });
}
console.log(`FRENCH_UI_HITS=${hits}`);
if(hits)process.exitCode=2;
