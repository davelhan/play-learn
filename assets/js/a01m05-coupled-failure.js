const $=id=>document.getElementById(id);
const PHASES=[
 {name:'BASELINE',goal:'Prove that the nominal mission works with positive margins.',action:'Run the mission before adding any stress condition.',watch:['All subsystems report healthy','Time margin is positive','Actuation margin is positive']},
 {name:'ISOLATE',goal:'Test each operating condition by itself.',action:'Run Condition A, B and C one at a time. Do not combine them yet.',watch:['Detour alone remains feasible','Payload alone remains feasible','Thermal derate alone remains feasible']},
 {name:'COUPLE',goal:'Combine conditions that were acceptable separately.',action:'Combine all three tested conditions and observe the system margins.',watch:['No component changes to FAILED','The same margins shrink together','The mission becomes infeasible']},
 {name:'EXPLORE',goal:'Search the operating envelope instead of guessing a broken part.',action:'Move the pace from slow to fast. Try to make both Time and Actuation margins positive.',watch:['Slower motion protects actuation reserve','Faster motion protects the deadline','There is no overlap with the current requirements']},
 {name:'DECIDE',goal:'Identify which requirement can be escalated without violating the mission or safety.',action:'Select a requirement on the right, then propose a change.',watch:['Payload delivery is the core outcome','Blocked corridor avoidance is a hard safety constraint','The deadline can be escalated']},
 {name:'VERIFY',goal:'Verify the same healthy architecture after the approved requirement change.',action:'Choose a pace with positive margins, then run the revised mission.',watch:['No hardware was replaced','The requirement set is now feasible','The mission succeeds with positive reserve']}
];
const S={phase:0,tested:new Set(),active:new Set(),pace:.72,deadline:52,selectedReq:null,exploredLow:false,exploredHigh:false};

function renderPhase(){
 const p=PHASES[S.phase];$('phaseName').textContent=p.name;$('phaseGoal').textContent=p.goal;$('actionText').textContent=p.action;$('phaseCount').textContent=`${String(S.phase+1).padStart(2,'0')} / 06`;$('progressFill').style.width=`${S.phase/5*100}%`;
 $('watchList').innerHTML=p.watch.map((t,i)=>`<div class="watch-item ${watchSeen(i)?'seen':''}"><i>${watchSeen(i)?'✓':'○'}</i><span>${t}</span></div>`).join('');
}
function watchSeen(i){
 if(S.phase===0)return false;
 if(S.phase===1)return S.tested.size>i;
 if(S.phase===2)return i<2;
 if(S.phase===3)return [S.exploredLow,S.exploredHigh,S.exploredLow&&S.exploredHigh][i];
 if(S.phase===4)return S.selectedReq!==null&&i===2;
 return false;
}
function model(){
 const detour=S.active.has('detour'),payload=S.active.has('payload'),thermal=S.active.has('thermal');
 const timeUsed=20+16/S.pace+(detour?9:0)+(payload?4:0);
 const time=S.deadline-timeUsed;
 const act=48-(payload?12:0)-(thermal?18:0)-S.pace*22;
 const energy=34-(detour?7:0)-(payload?6:0)-(thermal?2:0)-S.pace*8;
 return {time,act,energy,feasible:time>=0&&act>=0&&energy>=0,timeUsed};
}
function pct(v){return Math.max(4,Math.min(100,50+v*2));}
function updateMargins(){
 const m=model();
 const vals=[['timeMargin','timeBar',m.time,' s'],['actMargin','actBar',m.act,'%'],['energyMargin','energyBar',m.energy,'%']];
 vals.forEach(([id,bar,v,suffix])=>{const el=$(id),card=el.closest('.margin-card');el.textContent=`${v>=0?'+':''}${Math.round(v)}${suffix}`;$(bar).style.width=`${pct(v)}%`;card.classList.toggle('negative',v<0);});
 $('feasibility').className=`feasibility ${m.feasible?'good':'bad'}`;$('feasibility').innerHTML=m.feasible?'<b>FEASIBLE</b><span>Current conditions leave positive system margin.</span>':'<b>INFEASIBLE</b><span>At least one system margin is negative.</span>';
 $('paceValue').textContent=S.pace.toFixed(2)+'×';
 if(S.phase===3){
   S.exploredLow ||= S.pace<=.58;S.exploredHigh ||= S.pace>=.94;
   if(S.exploredLow&&S.exploredHigh){S.phase=4;configure();}
 }
 if(S.phase===5)$('mainAction').disabled=!m.feasible;
 return m;
}
function result(kind,title,text){$('result').className=`result ${kind}`;$('result').innerHTML=`<b>${title}</b><span>${text}</span>`;}
function log(lines){$('log').textContent=lines.join('\n');}
function showReflection(saw,why,next){$('reflectionSaw').textContent=saw;$('reflectionWhy').textContent=why;$('reflection').classList.remove('hidden');$('reflectionContinue').onclick=()=>{$('reflection').classList.add('hidden');S.phase=next;configure();};}
function configure(){
 renderPhase();
 document.querySelectorAll('.stress-card').forEach(b=>b.disabled=S.phase!==1);
 document.querySelectorAll('.requirement-list button').forEach(b=>b.disabled=S.phase!==4);
 $('pace').disabled=!(S.phase===3||S.phase===5);
 $('combineBtn').disabled=!(S.phase===1&&S.tested.size===3);
 $('requestChange').disabled=!(S.phase===4&&S.selectedReq!==null);
 if(S.phase===0){$('mainAction').disabled=false;$('mainAction').textContent='RUN BASELINE';$('mainAction').onclick=runBaseline;}
 if(S.phase===1){$('mainAction').disabled=true;$('mainAction').textContent='TEST CONDITIONS ABOVE';S.active.clear();updateStressVisual();updateMargins();}
 if(S.phase===2){$('mainAction').disabled=true;$('mainAction').textContent='COMBINED TEST FAILED';}
 if(S.phase===3){$('mainAction').disabled=true;$('mainAction').textContent='EXPLORE THE PACE RANGE';}
 if(S.phase===4){$('mainAction').disabled=true;$('mainAction').textContent='ESCALATE A REQUIREMENT';}
 if(S.phase===5){$('mainAction').textContent='RUN REVISED MISSION';$('mainAction').onclick=verifyMission;updateMargins();}
}
function runBaseline(){
 S.active.clear();updateStressVisual();const m=updateMargins();result('pass','BASELINE PASSED',`Mission completes in ${Math.round(m.timeUsed)} s with positive time and actuation margins.`);log(['SUBSYSTEMS ...... HEALTHY','CONDITIONS ....... NOMINAL','MISSION .......... PASS','SYSTEM MARGIN .... POSITIVE']);showReflection('The nominal mission succeeds and every subsystem is healthy.','This gives you a trusted baseline before introducing new conditions.',1);
}
function updateStressVisual(){document.querySelectorAll('.stress-card').forEach(b=>{b.classList.toggle('tested',S.tested.has(b.dataset.stress));b.classList.toggle('active',S.active.has(b.dataset.stress));});}
function testStress(kind){
 if(S.phase!==1)return;S.active=new Set([kind]);S.tested.add(kind);updateStressVisual();const m=updateMargins();const names={detour:'DETOUR ALONE',payload:'PAYLOAD ALONE',thermal:'DERATE ALONE'};result('pass',names[kind],`Still feasible: time ${m.time>=0?'+':''}${Math.round(m.time)} s · actuation ${m.act>=0?'+':''}${Math.round(m.act)}%.`);log(['SUBSYSTEMS ...... HEALTHY',`ACTIVE CONDITION . ${kind.toUpperCase()}`,'MISSION .......... PASS','SYSTEM MARGIN .... POSITIVE']);$('combineBtn').disabled=S.tested.size!==3;renderPhase();
}
function combine(){
 if(S.phase!==1||S.tested.size!==3)return;S.active=new Set(['detour','payload','thermal']);updateStressVisual();const m=updateMargins();S.phase=2;renderPhase();result('fail','COUPLED FAILURE',`All subsystems remain healthy, but combined margins are time ${Math.round(m.time)} s and actuation ${Math.round(m.act)}%.`);log(['SUBSYSTEMS ...... HEALTHY','CONDITIONS ....... A + B + C','MISSION .......... FAIL','ROOT CAUSE ....... NO SINGLE FAULT']);setTimeout(()=>showReflection('Each condition passed alone. Together, the mission has no comfortable operating margin.','The failure belongs to the coupled system, not to one broken component.',3),350);
}
function selectRequirement(req){if(S.phase!==4)return;S.selectedReq=req;document.querySelectorAll('.requirement-list button').forEach(b=>b.classList.toggle('selected',b.dataset.req===req));$('requestChange').disabled=false;}
function proposeChange(){
 if(S.phase!==4)return;const req=S.selectedReq;if(!req)return;
 if(req==='payload')showReq('WRONG LEVEL TO CHANGE','The 12 kg case is the mission outcome. Reducing it would change what the mission is supposed to accomplish.','Keep the mission outcome; look for a constraint that can be renegotiated.');
 else if(req==='route')showReq('SAFETY CONSTRAINT STAYS HARD','The direct corridor is physically blocked. Removing obstacle avoidance would make the requirement set easier by accepting an unsafe path.','Safety constraints are not margin to spend.');
 else showReq('ESCALATION APPROVED','The 52 s target is a service-level requirement, not the core delivery outcome or the safety constraint. Engineering evidence shows the current set is infeasible.','Deadline revised: 52 s → 70 s. The architecture and hardware remain unchanged.',true);
}
function showReq(title,text,evidence,approved=false){$('reqTitle').textContent=title;$('reqText').textContent=text;$('reqEvidence').textContent=evidence;$('requirementModal').classList.remove('hidden');$('reqContinue').onclick=()=>{$('requirementModal').classList.add('hidden');if(approved){S.deadline=70;$('deadlineRequirement').textContent='COMPLETE ≤ 70 s';$('deadlineTag').textContent='DEADLINE 70 s';S.phase=5;result('neutral','REQUIREMENT UPDATED','Find a pace that leaves both Time and Actuation margins positive.');log(['CHANGE REQUEST ... APPROVED','DEADLINE ......... 70 s','HARDWARE ......... UNCHANGED','VERIFY ........... REQUIRED']);configure();}};}
function verifyMission(){
 const m=updateMargins();if(!m.feasible)return;result('pass','MISSION PASSED',`Revised mission completes in ${Math.round(m.timeUsed)} s with +${Math.round(m.time)} s time and +${Math.round(m.act)}% actuation reserve.`);$('world').classList.add('complete');log(['SUBSYSTEMS ...... HEALTHY','REQUIREMENTS ..... FEASIBLE','MISSION .......... PASS','SYSTEM MARGIN .... POSITIVE']);localStorage.setItem('playlearn_a01m05_complete','true');setTimeout(()=>$('completeModal').classList.remove('hidden'),650);
}

document.querySelectorAll('.stress-card').forEach(b=>b.onclick=()=>testStress(b.dataset.stress));$('combineBtn').onclick=combine;document.querySelectorAll('.requirement-list button').forEach(b=>b.onclick=()=>selectRequirement(b.dataset.req));$('requestChange').onclick=proposeChange;
$('pace').oninput=e=>{if(!(S.phase===3||S.phase===5))return;S.pace=Number(e.target.value)/100;updateMargins();renderPhase();};
$('startBtn').onclick=()=>{$('intro').classList.add('hidden');$('game').classList.remove('hidden');configure();updateMargins();};$('resetBtn').onclick=()=>location.reload();$('replayBtn').onclick=()=>location.reload();
$('coachBtn').onclick=()=>{const h=['First establish a clean baseline.','Test A, B and C separately. A coupled failure only means something if the isolated cases are understood.','Notice the word HEALTHY at the top. Stop hunting for a red component.','Try a very slow pace, then a very fast one. Watch which margin each extreme helps.','Separate mission outcome, safety constraint and service target. They do not have equal authority.','After the deadline changes, you still need to choose a feasible operating point.'];$('coachText').textContent=h[S.phase];$('coachPanel').classList.remove('hidden');};$('closeCoach').onclick=()=>$('coachPanel').classList.add('hidden');
configure();updateMargins();