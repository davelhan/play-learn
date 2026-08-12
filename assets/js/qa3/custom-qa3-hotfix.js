/* PLAY//LEARN QA3 — bespoke mission pedagogical fixes. Loaded after each mission script. */
(()=>{
const path=location.pathname;
function style(css){const s=document.createElement('style');s.textContent=css;document.head.appendChild(s)}

// 01.03 — keep probe evidence readable, but do not paint the correct boundary as an answer before hypothesis.
if(path.includes('01-03-trace-broken')){
  style(`.probe.mismatch{border-color:rgba(255,255,255,.14)!important;background:rgba(255,255,255,.025)!important;color:inherit!important;box-shadow:none!important}.probe.mismatch::after{display:none!important}`);
  const oldOpen=openProbe;
  openProbe=function(i){oldOpen(i);const b=document.querySelector(`.probe[data-probe="${i}"]`);if(b)b.classList.remove('mismatch');};
}

// 01.04 — wrong architectures are now legal hypotheses. Run them and observe where the information contract breaks.
if(path.includes('01-04-build-architecture')){
  document.querySelectorAll('.module-card').forEach(card=>{card.classList.remove('function','implementation');const tag=card.querySelector('span');if(tag)tag.textContent='SYSTEM BLOCK';});
  style(`.module-card{border-color:rgba(255,255,255,.13)!important}.build-slot.qa-trace{box-shadow:0 0 0 2px rgba(105,255,210,.45) inset}.build-slot.qa-fail{box-shadow:0 0 0 2px rgba(255,110,110,.75) inset!important}.architecture-board.qa-running{filter:saturate(1.15)}`);
  place=function(slot,module){
    if(S.phase!==0||!module)return;
    const index=slot.dataset.slot,old=slot.dataset.module;
    if(old){const oldCard=document.querySelector(`.module-card[data-module="${old}"]`);oldCard?.classList.remove('used');delete S.placed[index];}
    const elsewhere=[...document.querySelectorAll('.build-slot')].find(x=>x!==slot&&x.dataset.module===module);
    if(elsewhere){delete S.placed[elsewhere.dataset.slot];elsewhere.dataset.module='';elsewhere.classList.remove('filled');elsewhere.querySelector('b').textContent='DROP BLOCK HERE';}
    S.placed[index]=module;slot.dataset.module=module;slot.classList.add('filled');slot.querySelector('b').textContent=NAMES[module];
    document.querySelector(`.module-card[data-module="${module}"]`)?.classList.add('used');clearSelection();
    result('neutral','HYPOTHESIS INSTALLED',`${NAMES[module]} is now in slot ${Number(index)+1}. The bench will not tell you whether it is correct until you run the trace.`);
    updateStatus();if(placedCount()===6){$('mainAction').disabled=false;$('mainAction').textContent='RUN ARCHITECTURE TRACE';$('mainAction').onclick=validateStack;}
  };
  const passStack=validateStack;
  validateStack=function(){
    if(placedCount()!==6)return;
    const slots=[...document.querySelectorAll('.build-slot')],wrong=[];S.placed&&slots.forEach((slot,i)=>{slot.classList.remove('qa-trace','qa-fail','rejected');if(slot.dataset.module!==slot.dataset.expect)wrong.push(i)});
    $('mainAction').disabled=true;document.querySelector('.architecture-board')?.classList.add('qa-running');
    let i=0;const tick=()=>{if(i>0)slots[i-1]?.classList.remove('qa-trace');if(i>=slots.length){document.querySelector('.architecture-board')?.classList.remove('qa-running');if(!wrong.length){$('mainAction').disabled=false;passStack();return;}const f=wrong[0],slot=slots[f],actual=slot.dataset.module,expected=slot.dataset.expect;slot.classList.add('qa-fail');const hardware=IMPLEMENTATION.has(actual);$('testStatus').textContent='TRACE BREAK';$('testStatus').className='bad';result('fail',`TRACE BREAKS AT SLOT ${f+1}`,hardware?`${NAMES[actual]} is real hardware, but this interface needs the functional transformation performed by ${NAMES[expected]}.`:`${NAMES[actual]} receives a representation intended for ${NAMES[expected]}. The information contract breaks here.`);$('keyIdea').textContent='A wrong architecture is useful evidence when you can run it. Rebuild from the first broken information contract, not from a red answer label.';log([`TRACE ............ FAILED`,`FIRST BREAK ...... SLOT ${f+1}`,`INSTALLED ........ ${NAMES[actual]}`,`REQUIRED ROLE .... ${NAMES[expected]}`]);$('mainAction').disabled=false;$('mainAction').textContent='REBUILD AND RETEST';$('mainAction').onclick=validateStack;return;}slots[i].classList.add('qa-trace');i++;setTimeout(tick,150);};tick();
  };
  $('mainAction').onclick=validateStack;
}

// 01.05 — remove answer-signposting and make the coupled envelope visible in the physical scene.
if(path.includes('01-05-coupled-failure')){
  const reqs=[...document.querySelectorAll('.requirement-list button')];
  reqs.forEach((b,i)=>{const s=b.querySelector('span'),sm=b.querySelector('small');if(s)s.textContent=`R${i+1} · REQUIREMENT`;if(sm)sm.textContent='Authority not classified';});
  const panel=document.createElement('div');panel.id='qa3Envelope';panel.innerHTML='<span>LIVE PHYSICAL CONSEQUENCE</span><b id="qa3Eta">ETA —</b><i><em id="qa3Run"></em><strong id="qa3Gate"></strong></i><small id="qa3Strain">Actuation reserve —</small>';
  document.querySelector('.m05-world')?.appendChild(panel);
  style(`#qa3Envelope{position:absolute;left:18px;right:18px;bottom:12px;padding:8px 10px;background:rgba(4,12,14,.88);border:1px solid rgba(105,255,210,.22);z-index:9;font:11px/1.2 monospace}#qa3Envelope>span{display:block;opacity:.55;margin-bottom:4px}#qa3Envelope>b{display:inline-block;margin-right:12px}#qa3Envelope>i{position:relative;display:block;height:8px;margin:7px 0;background:rgba(255,255,255,.08)}#qa3Envelope em{position:absolute;left:0;top:0;bottom:0;background:rgba(105,255,210,.55)}#qa3Envelope strong{position:absolute;top:-3px;bottom:-3px;width:2px;background:#fff;left:74%}#qa3Envelope small{opacity:.8}.m05-robot{transition:left .22s linear,filter .22s linear!important}`);
  const oldUpdate=updateMargins;
  updateMargins=function(){const m=oldUpdate();const eta=document.getElementById('qa3Eta'),run=document.getElementById('qa3Run'),strain=document.getElementById('qa3Strain'),robot=document.getElementById('robot');if(eta)eta.textContent=`ETA ${Math.round(m.timeUsed)} s / DEADLINE ${S.deadline} s`;if(run)run.style.width=`${Math.min(100,m.timeUsed/S.deadline*74)}%`;if(strain)strain.textContent=`ACTUATION ${m.act>=0?'+':''}${Math.round(m.act)}% · ${m.act<0?'OVER ENVELOPE':'RESERVE'}`;if(robot){robot.style.left=`${18+Math.min(72,S.pace/1.1*72)}%`;robot.style.filter=m.act<0?'drop-shadow(0 0 9px rgba(255,90,90,.8))':'none';}return m;};
  updateMargins();
}

// 01.06 — Gate should feel like proof, not a tutorial. Remove the most explicit slot hints after start.
if(path.includes('01-06-architecture-gate')){
  const oldStart=$('startBtn').onclick;$('startBtn').onclick=()=>{oldStart();document.querySelectorAll('.gate-slot span').forEach((x,i)=>x.textContent=`FUNCTION SLOT ${i+1}`);};
}

// 01.02 — reduce button-mashing: after the first manual layer, one command pulse advances two transformations while preserving readouts.
if(path.includes('01-02-command-evidence')){
  const oldStep=stepCommand;let paired=false;stepCommand=function(){oldStep();if(S.phase===1&&!paired&&S.cmdIndex===2){paired=true;setTimeout(()=>{if(S.phase===1&&!S.busy&&S.cmdIndex<5)oldStep();},430);}};
}
})();
