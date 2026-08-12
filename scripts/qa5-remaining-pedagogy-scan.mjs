import fs from 'fs';
import vm from 'vm';

// Load current QA patches exactly as the browser does.
globalThis.PLAYLEARN_QA3_PATCHES={};
globalThis.PLAYLEARN_QA3_PATCH=(id,p)=>PLAYLEARN_QA3_PATCHES[id]=p;
for(const a of ['02','03','04','05','06','07','08','09','10']){
  vm.runInThisContext(fs.readFileSync(`assets/js/qa3/mission-qa3-act${a}.js`,'utf8'),{filename:`act${a}`});
}
const apply=m=>PLAYLEARN_QA3_PATCHES[m.id]?Object.assign({},m,PLAYLEARN_QA3_PATCHES[m.id]):m;
const representative=new Set(['02.04','03.02','04.03','05.04','06.03','07.03','08.04','09.02','10.01']);

function evalExpr(expr,s){
  return Function('s',`with(s){const abs=Math.abs,min=Math.min,max=Math.max,sqrt=Math.sqrt,sin=Math.sin,cos=Math.cos,exp=Math.exp,pi=Math.PI;return (${expr});}`)(s);
}
function metricGood(rule,v,s){
  if(!rule)return null;
  return !!Function('v','s',`with(s){return (${rule});}`)(v,s);
}
function refs(m,expr){
  return (m.controls||[]).filter(c=>new RegExp(`\\b${c.key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`).test(expr||''));
}
function values(c){
  if(c.kind==='select')return c.options.map(o=>o.value);
  const n=Math.round((c.max-c.min)/c.step)+1;
  if(n<=13)return Array.from({length:n},(_,i)=>+(c.min+i*c.step).toFixed(10));
  const pts=[c.min,c.min+(c.max-c.min)*.1,c.min+(c.max-c.min)*.25,c.min+(c.max-c.min)*.5,c.min+(c.max-c.min)*.75,c.min+(c.max-c.min)*.9,c.max,c.base];
  return [...new Set(pts.map(v=>Math.max(c.min,Math.min(c.max,Math.round(v/c.step)*c.step))).map(v=>+v.toFixed(10)))].sort((a,b)=>a-b);
}
function baseState(m,set={}){
  const s={}; for(const c of m.conditions||[])s[c.key]=c.value; for(const c of m.controls||[])s[c.key]=c.base; Object.assign(s,set); return s;
}
function sampleStates(m,expr,set={}){
  const cs=refs(m,expr), grids=cs.map(values), s=baseState(m,set), out=[]; let visited=0;
  const cap=120000;
  function rec(i){
    if(visited>=cap)return;
    if(i===cs.length){visited++; let ok=false; try{ok=!!evalExpr(expr,s)}catch{} if(ok)out.push({...s}); return;}
    for(const v of grids[i]){s[cs[i].key]=v;rec(i+1);if(visited>=cap)return;}
  }
  rec(0); return {states:out,controls:cs,visited,capped:visited>=cap};
}
function extremeLabel(c,v){
  if(c.kind!=='range')return null;
  const span=c.max-c.min, eps=Math.max(c.step||0,span*.02);
  if(Math.abs(v-c.min)<=eps)return 'MIN'; if(Math.abs(v-c.max)<=eps)return 'MAX'; return null;
}
function analyzePhase(m,label,expr,set={}){
  const {states,controls,visited,capped}=sampleStates(m,expr,set), issues=[];
  if(!states.length){issues.push({kind:'NO_SOLUTION',detail:`${label}: no sampled passing state (${visited}${capped?'+':''} tested)`});return issues;}
  // A visible red metric inside a valid state is suspicious. Report metric + witness.
  for(const mm of m.metrics||[]){
    if(!mm.good)continue;
    const witness=states.find(s=>{let v;try{v=Number(evalExpr(mm.expr,s));return !metricGood(mm.good,v,s)}catch{return false}});
    if(witness){
      let v;try{v=Number(evalExpr(mm.expr,witness))}catch{v=NaN}
      issues.push({kind:'PASS_WITH_RED_METRIC',detail:`${label}: ${mm.label} can fail (${Number.isFinite(v)?v.toFixed(3):'n/a'}) while completion goal passes`});
    }
  }
  // Flag if every passing solution pins a referenced range control to one edge region.
  for(const c of controls.filter(x=>x.kind==='range')){
    const vals=states.map(s=>Number(s[c.key])); const span=c.max-c.min;
    const lo=c.min+span*.12, hi=c.max-span*.12;
    if(vals.every(v=>v<=lo))issues.push({kind:'EXTREME_ONLY',detail:`${label}: ${c.label} only passes near MIN in sampled solutions`});
    if(vals.every(v=>v>=hi))issues.push({kind:'EXTREME_ONLY',detail:`${label}: ${c.label} only passes near MAX in sampled solutions`});
  }
  // Direct all-min / all-max cheese witness for referenced continuous controls.
  const ranges=controls.filter(c=>c.kind==='range');
  for(const dir of ['MIN','MAX']){
    if(!ranges.length)continue;
    const s=baseState(m,set);
    for(const c of controls){
      if(c.kind==='range')s[c.key]=dir==='MIN'?c.min:c.max;
      else if(c.kind==='select')s[c.key]=c.base;
    }
    let ok=false;try{ok=!!evalExpr(expr,s)}catch{}
    if(ok)issues.push({kind:'ALL_EXTREME_PASSES',detail:`${label}: setting all referenced range controls to ${dir} passes`});
  }
  return issues;
}

const missions=[];
for(let a=2;a<=10;a++){
  const raw=JSON.parse(fs.readFileSync(`data/missions-act-${String(a).padStart(2,'0')}.json`,'utf8'));
  for(const m0 of raw.missions){const m=apply(m0); if(!representative.has(m.id))missions.push(m);}
}
const rows=[];
for(const m of missions){
  const issues=[];
  if(m.gateCases){
    let cond={};
    for(const g of m.gateCases){Object.assign(cond,g.set||{});issues.push(...analyzePhase(m,`GATE ${g.name}`,g.goal,cond));}
  } else {
    issues.push(...analyzePhase(m,'APPLY',m.goal,{}));
    if(m.disturbance&&m.transferGoal)issues.push(...analyzePhase(m,'TRANSFER',m.transferGoal,m.disturbance.set||{}));
  }
  rows.push({id:m.id,title:m.title,issues});
}
const flagged=rows.filter(r=>r.issues.length);
const counts={missions:rows.length,flagged:flagged.length,clean:rows.length-flagged.length,issues:flagged.reduce((n,r)=>n+r.issues.length,0)};
const md=[
  '# QA5 Remaining Shared-Engine Pedagogy Scan','',
  `Scanned **${counts.missions}** remaining shared-engine missions.`,
  `Raw heuristic result: **${counts.clean} clean · ${counts.flagged} flagged · ${counts.issues} flags**.`,'',
  '> Flags are candidates, not verdicts. PASS_WITH_RED_METRIC can be legitimate when a metric is informational; EXTREME_ONLY can be legitimate when the engineering lesson is explicitly a hard minimum/maximum. Manual triage is required.','',
  '| Mission | Raw flags |','|---|---|',
  ...rows.map(r=>`| ${r.id} ${r.title} | ${r.issues.length?r.issues.map(x=>`${x.kind}: ${x.detail}`).join('<br>'):'—'} |`)
].join('\n');
fs.mkdirSync('qa5',{recursive:true});
fs.writeFileSync('qa5/qa5-shared-scan.json',JSON.stringify({counts,rows},null,2));
fs.writeFileSync('qa5/QA5_SHARED_RAW_SCAN.md',md);
console.log(JSON.stringify(counts));
