import fs from 'fs';
import vm from 'vm';

// Load current mission patches exactly as the browser does.
globalThis.PLAYLEARN_QA3_PATCHES={};
globalThis.PLAYLEARN_QA3_PATCH=(id,p)=>PLAYLEARN_QA3_PATCHES[id]=p;
for(const a of ['02','03','04','05','06','07','08','09','10']){
  vm.runInThisContext(fs.readFileSync(`assets/js/qa3/mission-qa3-act${a}.js`,'utf8'),{filename:`act${a}`});
}
vm.runInThisContext(fs.readFileSync('assets/js/qa5/mission-qa5-reworks.js','utf8'),{filename:'qa5-reworks'});
vm.runInThisContext(fs.readFileSync('assets/js/qa5/mission-qa5-hotfix-1.js','utf8'),{filename:'qa5-hotfix-1'});
const apply=m=>PLAYLEARN_QA3_PATCHES[m.id]?Object.assign({},m,PLAYLEARN_QA3_PATCHES[m.id]):m;
const representative=new Set(['02.04','03.02','04.03','05.04','06.03','07.03','08.04','09.02','10.01']);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

function evalExpr(expr,s){return Function('s',`with(s){const abs=Math.abs,min=Math.min,max=Math.max,sqrt=Math.sqrt,sin=Math.sin,cos=Math.cos,exp=Math.exp,pi=Math.PI;return (${expr});}`)(s)}
function metricGood(rule,v,s){if(rule==null)return null;return!!Function('v','s',`with(s){return (${rule});}`)(v,s)}
function metricRule(mm,phase,gateIndex=0){
  if(phase==='TRANSFER'&&own(mm,'goodTransfer'))return mm.goodTransfer;
  if(phase==='APPLY'&&own(mm,'goodApply'))return mm.goodApply;
  if(phase==='GATE'&&own(mm,'goodGate')){
    if(Array.isArray(mm.goodGate))return mm.goodGate[gateIndex]??null;
    if(mm.goodGate&&typeof mm.goodGate==='object')return mm.goodGate[gateIndex]??mm.goodGate.default??null;
    return mm.goodGate;
  }
  return mm.good;
}
function refs(m,expr){return(m.controls||[]).filter(c=>new RegExp(`\\b${c.key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`).test(expr||''))}
function values(c){if(c.kind==='select')return c.options.map(o=>o.value);const n=Math.round((c.max-c.min)/c.step)+1;if(n<=13)return Array.from({length:n},(_,i)=>+(c.min+i*c.step).toFixed(10));const pts=[c.min,c.min+(c.max-c.min)*.1,c.min+(c.max-c.min)*.25,c.min+(c.max-c.min)*.5,c.min+(c.max-c.min)*.75,c.min+(c.max-c.min)*.9,c.max,c.base];return[...new Set(pts.map(v=>Math.max(c.min,Math.min(c.max,Math.round(v/c.step)*c.step))).map(v=>+v.toFixed(10)))].sort((a,b)=>a-b)}
function baseState(m,set={}){const s={};for(const c of m.conditions||[])s[c.key]=c.value;for(const c of m.controls||[])s[c.key]=c.base;Object.assign(s,set);return s}
function sampleStates(m,expr,set={}){const cs=refs(m,expr),grids=cs.map(values),s=baseState(m,set),out=[];let visited=0;const cap=180000;function rec(i){if(visited>=cap)return;if(i===cs.length){visited++;let ok=false;try{ok=!!evalExpr(expr,s)}catch{}if(ok)out.push({...s});return}for(const v of grids[i]){s[cs[i].key]=v;rec(i+1);if(visited>=cap)return}}rec(0);return{states:out,controls:cs,visited,capped:visited>=cap}}
function analyzePhase(m,label,phase,expr,set={},gateIndex=0){const{states,controls,visited,capped}=sampleStates(m,expr,set),issues=[];if(!states.length){issues.push({kind:'NO_SOLUTION',detail:`${label}: no sampled passing state (${visited}${capped?'+':''} tested)`});return issues}
  for(const mm of m.metrics||[]){const rule=metricRule(mm,phase,gateIndex);if(rule==null)continue;const witness=states.find(s=>{try{return!metricGood(rule,Number(evalExpr(mm.expr,s)),s)}catch{return false}});if(witness){let v;try{v=Number(evalExpr(mm.expr,witness))}catch{v=NaN}issues.push({kind:'PASS_WITH_RED_METRIC',detail:`${label}: ${mm.label} can fail active target (${Number.isFinite(v)?v.toFixed(3):'n/a'}) while completion passes`})}}
  for(const c of controls.filter(x=>x.kind==='range')){const vals=states.map(s=>Number(s[c.key])),span=c.max-c.min,lo=c.min+span*.12,hi=c.max-span*.12;if(vals.every(v=>v<=lo))issues.push({kind:'EXTREME_ONLY',detail:`${label}: ${c.label} only passes near MIN in sampled solutions`});if(vals.every(v=>v>=hi))issues.push({kind:'EXTREME_ONLY',detail:`${label}: ${c.label} only passes near MAX in sampled solutions`})}
  const ranges=controls.filter(c=>c.kind==='range');for(const dir of ['MIN','MAX']){if(!ranges.length)continue;const s=baseState(m,set);for(const c of controls){if(c.kind==='range')s[c.key]=dir==='MIN'?c.min:c.max;else if(c.kind==='select')s[c.key]=c.base}let ok=false;try{ok=!!evalExpr(expr,s)}catch{}if(ok)issues.push({kind:'ALL_EXTREME_PASSES',detail:`${label}: setting all referenced range controls to ${dir} passes`})}
  return issues}

const missions=[];for(let a=2;a<=10;a++){const raw=JSON.parse(fs.readFileSync(`data/missions-act-${String(a).padStart(2,'0')}.json`,'utf8'));for(const m0 of raw.missions){const m=apply(m0);if(!representative.has(m.id))missions.push(m)}}
const rows=[];for(const m of missions){const issues=[];if(m.gateCases){let cond={};for(let i=0;i<m.gateCases.length;i++){const g=m.gateCases[i];Object.assign(cond,g.set||{});issues.push(...analyzePhase(m,`GATE ${g.name}`,'GATE',g.goal,cond,i))}}else{issues.push(...analyzePhase(m,'APPLY','APPLY',m.goal,{}));if(m.disturbance&&m.transferGoal)issues.push(...analyzePhase(m,'TRANSFER','TRANSFER',m.transferGoal,m.disturbance.set||{}))}rows.push({id:m.id,title:m.title,issues})}
const flagged=rows.filter(r=>r.issues.length),counts={missions:rows.length,flagged:flagged.length,clean:rows.length-flagged.length,issues:flagged.reduce((n,r)=>n+r.issues.length,0)};
const md=['# QA5 Remaining Shared-Engine Pedagogy Scan','',`Scanned **${counts.missions}** remaining shared-engine missions against the QA5 definitions.`,`Raw heuristic result: **${counts.clean} clean · ${counts.flagged} flagged · ${counts.issues} flags**.`,'','> Flags remain candidates rather than verdicts. The scanner now respects phase-specific metric targets and explicit N/A semantics.','', '| Mission | Raw flags |','|---|---|',...rows.map(r=>`| ${r.id} ${r.title} | ${r.issues.length?r.issues.map(x=>`${x.kind}: ${x.detail}`).join('<br>'):'—'} |`)].join('\n');
fs.mkdirSync('qa5',{recursive:true});fs.writeFileSync('qa5/qa5-shared-scan.json',JSON.stringify({counts,rows},null,2));fs.writeFileSync('qa5/QA5_SHARED_RAW_SCAN.md',md);console.log(JSON.stringify(counts));