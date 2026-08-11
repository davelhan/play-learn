import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const customRoutes = [
  ['01.01','/campaign/act-01/01-01-system-layers.html'],
  ['01.02','/campaign/act-01/01-02-command-evidence.html'],
  ['01.03','/campaign/act-01/01-03-trace-broken.html'],
  ['01.04','/campaign/act-01/01-04-build-architecture.html'],
  ['01.05','/campaign/act-01/01-05-coupled-failure.html'],
  ['01.06','/campaign/act-01/01-06-architecture-gate.html'],
  ['02.01','/campaign/act-02/02-01-frames-poses.html'],
  ['02.02','/campaign/act-02/02-02-joint-axes.html'],
  ['02.03','/campaign/act-02/02-03-forward-inverse-kinematics.html']
];
const batchIds=[];
for(let act=2;act<=10;act++){
  const start=act===2?4:1;
  for(let m=start;m<=6;m++) batchIds.push(`${String(act).padStart(2,'0')}.${String(m).padStart(2,'0')}`);
}

function evalExpr(expr,s){
  return Function('s',`with(s){const abs=Math.abs,min=Math.min,max=Math.max,sqrt=Math.sqrt,sin=Math.sin,cos=Math.cos,exp=Math.exp,pi=Math.PI;return (${expr});}`)(s);
}
function valsFor(c){
  if(c.kind==='select') return c.options.map(o=>o.value);
  const out=new Set([c.min,c.base,c.max]);
  const n=20;
  for(let i=1;i<n;i++){
    const raw=c.min+(c.max-c.min)*i/n;
    const v=Math.min(c.max,Math.max(c.min,c.min+Math.round((raw-c.min)/c.step)*c.step));
    out.add(Number(v.toFixed(10)));
  }
  return [...out];
}
function findCombo(m,expr,conditionOverrides={},want=true,differentFrom=null){
  const s={};
  for(const c of m.conditions||[]) s[c.key]=c.value;
  Object.assign(s,conditionOverrides);
  const controls=m.controls||[];
  const grids=controls.map(valsFor);
  let found=null, tries=0;
  function rec(i){
    if(found||tries>80000)return;
    if(i===controls.length){
      tries++;
      let ok=false; try{ok=!!evalExpr(expr,s)===want}catch{return}
      if(!ok)return;
      if(differentFrom){
        const keys=controls.map(c=>c.key);
        const changed=keys.some(k=>String(s[k])!==String(differentFrom[k]));
        if(!changed)return;
      }
      found={}; for(const c of controls)found[c.key]=s[c.key]; return;
    }
    for(const v of grids[i]){s[controls[i].key]=v;rec(i+1);if(found)return}
  }
  rec(0);
  return found;
}
function relevantKeys(m,expr){
  return (m.controls||[]).map(c=>c.key).filter(k=>new RegExp(`\\b${k}\\b`).test(expr||''));
}
async function setControl(page,c,val){
  if(c.kind==='select'){
    const btn=page.locator(`.choice-buttons button[data-key="${c.key}"][data-value="${String(val)}"]`);
    await btn.click();
  } else {
    const inp=page.locator(`#controls input[data-key="${c.key}"]`);
    await inp.evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},val);
  }
}
async function exerciseKey(page,c,startValue){
  if(c.kind==='select'){
    const alt=c.options.find(o=>String(o.value)!==String(startValue))?.value;
    if(alt!==undefined) await setControl(page,c,alt);
  }else{
    const span=c.max-c.min;
    let alt=Math.abs(startValue-c.min)>span*.08?c.min:c.max;
    await setControl(page,c,alt);
  }
}
async function dragRanges(page,label){
  const ranges=page.locator('input[type="range"]');
  const count=await ranges.count();
  const issues=[];
  for(let i=0;i<count;i++){
    const r=ranges.nth(i);
    if(!await r.isVisible())continue;
    const before=await r.inputValue();
    const box=await r.boundingBox();
    if(!box||box.width<20){issues.push(`range ${i}: no usable bounding box`);continue;}
    const handle=await r.elementHandle();
    const x1=box.x+box.width*.25, x2=box.x+box.width*.78, y=box.y+box.height/2;
    await page.mouse.move(x1,y); await page.mouse.down();
    await page.mouse.move(x2,y,{steps:12});
    const connectedDuring=await handle.evaluate(el=>el.isConnected);
    await page.mouse.up();
    const after=await r.inputValue().catch(()=>null);
    if(!connectedDuring)issues.push(`range ${i}: DOM node replaced during drag`);
    if(after===before||after===null)issues.push(`range ${i}: value did not change on click-hold-drag (${before} -> ${after})`);
  }
  return {count,issues};
}
async function pageBaseChecks(page,id){
  const errs=[];
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if(overflow>4) errs.push(`horizontal overflow ${overflow}px at 1440px viewport`);
  const start=page.locator('#startBtn');
  if(await start.count() && await start.isVisible()) await start.click();
  await page.waitForTimeout(60);
  return errs;
}
async function testCustom(browser,id,route){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const js=[]; page.on('pageerror',e=>js.push(String(e))); page.on('console',m=>{if(m.type()==='error')js.push(m.text())});
  const result={id,kind:'custom',status:'PASS',issues:[]};
  try{
    const resp=await page.goto(BASE+route,{waitUntil:'networkidle',timeout:20000});
    if(!resp||!resp.ok()) result.issues.push(`HTTP ${resp?.status()}`);
    result.issues.push(...await pageBaseChecks(page,id));
    const drag=await dragRanges(page,id); result.rangeCount=drag.count; result.issues.push(...drag.issues);
    if(await page.locator('#mainAction').count()){
      const btn=page.locator('#mainAction');
      if(await btn.isVisible() && await btn.isEnabled()) await btn.click().catch(()=>{});
      await page.waitForTimeout(80);
    }
    if(js.length)result.issues.push(...js.map(x=>'JS: '+x));
  }catch(e){result.issues.push('EXCEPTION: '+e.message)}
  if(result.issues.length) result.status=result.issues.some(x=>/HTTP|EXCEPTION|JS:|DOM node replaced|did not change/.test(x))?'BLOCKER':'MINOR';
  await page.close(); return result;
}
async function testBatch(browser,id,m){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const js=[]; page.on('pageerror',e=>js.push(String(e))); page.on('console',m=>{if(m.type()==='error')js.push(m.text())});
  const result={id,kind:'batch',status:'PASS',issues:[],phases:[]};
  try{
    const resp=await page.goto(`${BASE}/campaign/mission.html?m=${id}`,{waitUntil:'networkidle',timeout:20000});
    if(!resp||!resp.ok())result.issues.push(`HTTP ${resp?.status()}`);
    result.issues.push(...await pageBaseChecks(page,id));
    if(!await page.locator('#game').isVisible())result.issues.push('game did not open');
    if(!await page.locator('#conditions').count()||!await page.locator('#controls').count())result.issues.push('world/control separation missing');

    const drag=await dragRanges(page,id); result.rangeCount=drag.count; result.issues.push(...drag.issues);
    // Finish EXPLORE using real controls.
    for(const c of m.controls||[]){
      if(c.kind==='select'){
        const opts=c.exploreAll?c.options:c.options.slice(0,Math.min(2,c.options.length));
        for(const o of opts)await setControl(page,c,o.value);
      }else{
        await setControl(page,c,c.min); await setControl(page,c,c.max);
      }
    }
    const exploreBtn=page.locator('#mainAction');
    if(!await exploreBtn.isEnabled())result.issues.push('EXPLORE soft-lock after all controls exercised');
    else {await exploreBtn.click(); await page.locator('#reflectionContinue').click(); result.phases.push('EXPLORE');}

    if(m.gateCases){
      const cond={}; for(const c of m.conditions||[])cond[c.key]=c.value;
      for(let gi=0;gi<m.gateCases.length;gi++){
        const g=m.gateCases[gi]; Object.assign(cond,g.set||{});
        const fail=findCombo(m,g.goal,cond,false); const pass=findCombo(m,g.goal,cond,true);
        if(!fail||!pass){result.issues.push(`gate ${gi+1}: browser solver missing fail/pass`);break;}
        for(const c of m.controls){if(c.key in fail)await setControl(page,c,fail[c.key]);}
        const req=relevantKeys(m,g.goal); for(const k of req){const c=m.controls.find(x=>x.key===k);if(c)await exerciseKey(page,c,fail[k]);}
        for(const c of m.controls){if(c.key in pass)await setControl(page,c,pass[c.key]);}
        if(!await exploreBtn.isEnabled())result.issues.push(`gate ${gi+1}: soft-lock after fail→pass`);
        else {await exploreBtn.click(); await page.locator('#reflectionContinue').click();result.phases.push(`GATE${gi+1}`);}
      }
    }else{
      // APPLY: force failure, exercise relevant decisions, rebuild pass.
      const fail=findCombo(m,m.goal,{},false), pass=findCombo(m,m.goal,{},true);
      if(!fail||!pass)result.issues.push('APPLY browser solver missing fail/pass');
      else{
        for(const c of m.controls)if(c.key in fail)await setControl(page,c,fail[c.key]);
        for(const k of relevantKeys(m,m.goal)){const c=m.controls.find(x=>x.key===k);if(c)await exerciseKey(page,c,fail[k]);}
        for(const c of m.controls)if(c.key in pass)await setControl(page,c,pass[c.key]);
        if(!await exploreBtn.isEnabled())result.issues.push('APPLY soft-lock after fail→pass');
        else {await exploreBtn.click(); if(m.disturbance){await page.locator('#reflectionContinue').click();result.phases.push('APPLY');}else result.phases.push('APPLY');}
      }
      if(m.disturbance&&m.transferGoal){
        const cond=m.disturbance.set||{};
        const phaseStart={}; for(const c of m.controls)phaseStart[c.key]=await page.locator(`#controls input[data-key="${c.key}"]`).count()?Number(await page.locator(`#controls input[data-key="${c.key}"]`).inputValue()):null;
        let passT=findCombo(m,m.transferGoal,cond,true,phaseStart)||findCombo(m,m.transferGoal,cond,true);
        if(!passT)result.issues.push('TRANSFER browser solver missing pass');
        else{
          for(const k of relevantKeys(m,m.transferGoal)){const c=m.controls.find(x=>x.key===k);if(c)await exerciseKey(page,c,phaseStart[k]);}
          for(const c of m.controls)if(c.key in passT)await setControl(page,c,passT[c.key]);
          if(!await exploreBtn.isEnabled())result.issues.push('TRANSFER soft-lock after adaptation');
          else {await exploreBtn.click();result.phases.push('TRANSFER');}
        }
      }
    }
    if(js.length)result.issues.push(...js.map(x=>'JS: '+x));
  }catch(e){result.issues.push('EXCEPTION: '+e.message)}
  if(result.issues.length)result.status=result.issues.some(x=>/HTTP|EXCEPTION|JS:|soft-lock|DOM node replaced|did not change|missing/.test(x))?'BLOCKER':'MINOR';
  await page.close(); return result;
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const [id,route] of customRoutes){console.log('QA3 custom',id);results.push(await testCustom(browser,id,route));}
for(const id of batchIds){
  const act=id.split('.')[0]; const data=JSON.parse(fs.readFileSync(`data/missions-act-${act}.json`,'utf8')); const m=data.missions.find(x=>x.id===id);
  if(!m){results.push({id,kind:'batch',status:'BLOCKER',issues:['mission definition missing']});continue;}
  console.log('QA3 batch',id);results.push(await testBatch(browser,id,m));
}
await browser.close();
const summary={total:results.length,pass:results.filter(r=>r.status==='PASS').length,minor:results.filter(r=>r.status==='MINOR').length,blocker:results.filter(r=>r.status==='BLOCKER').length};
fs.writeFileSync('qa3-browser-results.json',JSON.stringify({summary,results},null,2));
let md=`# QA3 Browser Interaction Report\n\nTotal **${summary.total}** · PASS **${summary.pass}** · MINOR **${summary.minor}** · BLOCKER **${summary.blocker}**\n\n| Mission | Kind | Status | Range sliders | Issues |\n|---|---|---:|---:|---|\n`;
for(const r of results)md+=`| ${r.id} | ${r.kind} | ${r.status} | ${r.rangeCount??0} | ${(r.issues||[]).join('; ').replace(/\|/g,'/')} |\n`;
fs.writeFileSync('qa3-browser-results.md',md);
console.log(summary);
if(summary.blocker)process.exitCode=1;
