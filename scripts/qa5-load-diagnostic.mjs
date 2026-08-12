import { chromium } from 'playwright';
const BASE=process.env.QA_BASE_URL||'http://127.0.0.1:8000';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000});
const errors=[];
page.on('pageerror',e=>errors.push('PAGEERROR '+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text())});
await page.goto(`${BASE}/campaign/mission.html?m=02.04`,{waitUntil:'networkidle',timeout:15000});
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({
  introVisible:!document.getElementById('intro')?.classList.contains('hidden'),
  loadErrorVisible:!document.getElementById('loadError')?.classList.contains('hidden'),
  loadErrorText:document.getElementById('loadErrorText')?.textContent||'',
  startDisplay:getComputedStyle(document.getElementById('startBtn')).display,
  startRect:document.getElementById('startBtn')?.getBoundingClientRect().toJSON?.()||null,
  missionId:document.getElementById('missionId')?.textContent||'',
  scripts:[...document.scripts].map(s=>s.src.split('/').pop())
}));
console.log(JSON.stringify({state,errors},null,2));
await browser.close();
if(!state.introVisible||state.loadErrorVisible||errors.length)process.exit(1);
