import fs from 'fs';
import path from 'path';

const root=process.argv[2]||'data';
const files=[2,3,4,5,6,7,8,9,10].map(a=>path.join(root,`missions-act-${String(a).padStart(2,'0')}.json`));
const allowed=new Set(['abs','min','max','sqrt','sin','cos','exp','pi','Math','true','false','v','s']);
const stringValues=['RECOVER','CONTROLLED_FALL','IMU_ONLY','PROPRIO_FUSED','FULL_FUSION','EXECUTE','FILTER','FALLBACK','PATROL','RETURN','STOP','HOLD','RELEASE','PROCEED'];

function evalExpr(expr,s){
  return Function('s',`with(s){const abs=Math.abs,min=Math.min,max=Math.max,sqrt=Math.sqrt,sin=Math.sin,cos=Math.cos,exp=Math.exp,pi=Math.PI;return (${expr});}`)(s);
}
function ids(expr){
  return [...new Set((expr.match(/[A-Za-z_][A-Za-z0-9_]*/g)||[]).filter(x=>!allowed.has(x)&&!stringValues.includes(x)))];
}
function samples(c){
  if(c.kind==='select')return c.options.map(o=>o.value);
  const snap=x=>Math.min(c.max,Math.max(c.min,c.min+Math.round((x-c.min)/c.step)*c.step));
  const vals=[c.min,c.base,c.max];
  for(let i=1;i<7;i++)vals.push(snap(c.min+(c.max-c.min)*i/7));
  return [...new Set(vals)].map(Number);
}
function solvable(m,expr,set={}){
  const s={};
  for(const c of m.conditions||[])s[c.key]=c.value;
  Object.assign(s,set);
  const cs=m.controls||[],grids=cs.map(samples);
  let tries=0,ok=false;
  function rec(i){
    if(ok||tries>60000)return;
    if(i===cs.length){tries++;try{if(evalExpr(expr,s))ok=true}catch{}return;}
    for(const val of grids[i]){s[cs[i].key]=val;rec(i+1);if(ok)return;}
  }
  rec(0);
  if(ok)return true;
  for(let k=0;k<30000;k++){
    for(const c of cs){
      if(c.kind==='select')s[c.key]=c.options[Math.floor(Math.random()*c.options.length)].value;
      else s[c.key]=Math.min(c.max,c.min+Math.floor(Math.random()*((c.max-c.min)/c.step+1))*c.step);
    }
    tries++;
    try{if(evalExpr(expr,s))return true}catch{}
  }
  return false;
}

let missions=[],errors=[],warnings=[];
for(const f of files){
  const d=JSON.parse(fs.readFileSync(f,'utf8'));
  missions.push(...d.missions);
}
const seen=new Set();
for(const m of missions){
  if(seen.has(m.id))errors.push(`${m.id}: duplicate id`);
  seen.add(m.id);
  const condKeys=(m.conditions||[]).map(x=>x.key),ctrlKeys=(m.controls||[]).map(x=>x.key),keys=new Set([...condKeys,...ctrlKeys]);
  if(keys.size!==condKeys.length+ctrlKeys.length)errors.push(`${m.id}: duplicate condition/control key`);
  if(!ctrlKeys.length)errors.push(`${m.id}: no player controls`);
  for(const c of m.controls){
    if(c.kind==='select'){
      if(!c.options?.length)errors.push(`${m.id}/${c.key}: select has no options`);
      if(!c.options.some(o=>o.value===c.base))errors.push(`${m.id}/${c.key}: base not in options`);
    }else if(!(c.min<c.max))errors.push(`${m.id}/${c.key}: bad range`);
  }
  const exprs=[m.goal,m.transferGoal,...(m.metrics||[]).map(x=>x.expr),...(m.gateCases||[]).map(x=>x.goal)].filter(Boolean);
  for(const e of exprs){
    for(const id of ids(e))if(!keys.has(id))errors.push(`${m.id}: expression references unknown '${id}' in ${e}`);
    try{
      const s={};for(const c of m.conditions||[])s[c.key]=c.value;for(const c of m.controls||[])s[c.key]=c.base;evalExpr(e,s);
    }catch(err){errors.push(`${m.id}: expression error ${e} :: ${err.message}`);}
  }
  if(m.gateCases){
    for(const [i,g] of m.gateCases.entries()){
      const relevant=ctrlKeys.filter(k=>new RegExp(`\\b${k}\\b`).test(g.goal));
      if(!relevant.length)errors.push(`${m.id} gate ${i+1}: goal has no controllable variable`);
      if(!solvable(m,g.goal,g.set||{}))errors.push(`${m.id} gate ${i+1}: no solution found`);
    }
  }else{
    const rel=ctrlKeys.filter(k=>new RegExp(`\\b${k}\\b`).test(m.goal));
    if(!rel.length)errors.push(`${m.id}: apply goal has no controllable variable`);
    if(!solvable(m,m.goal))errors.push(`${m.id}: apply goal no solution found`);
    if(m.disturbance&&m.transferGoal){
      const rel2=ctrlKeys.filter(k=>new RegExp(`\\b${k}\\b`).test(m.transferGoal));
      if(!rel2.length)errors.push(`${m.id}: transfer goal has no controllable variable`);
      if(!solvable(m,m.transferGoal,m.disturbance.set||{}))errors.push(`${m.id}: transfer goal no solution found`);
    }
  }
  for(const k of Object.keys((m.disturbance||{}).set||{}))if(ctrlKeys.includes(k))errors.push(`${m.id}: disturbance directly edits player control '${k}'`);
  for(const g of m.gateCases||[])for(const k of Object.keys(g.set||{}))if(ctrlKeys.includes(k))errors.push(`${m.id}: gate case directly edits player control '${k}'`);
  const suspicious=['target','intent','confidence','age','unc','slip','severity','attack','soc','mu','gyroBias','visionErr','imuErr'];
  for(const k of suspicious)if(ctrlKeys.includes(k))warnings.push(`${m.id}: suspicious exogenous control '${k}'`);
}
if(missions.length!==51)errors.push(`expected 51 missions, got ${missions.length}`);
console.log(`MISSIONS ${missions.length} · ERRORS ${errors.length} · WARNINGS ${warnings.length}`);
if(warnings.length)console.log('WARNINGS\n'+warnings.join('\n'));
if(errors.length){console.error('ERRORS\n'+errors.join('\n'));process.exit(1);}
console.log('QA PASS');
