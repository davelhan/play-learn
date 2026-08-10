const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* QA5 pedagogical rebuild: the player manipulates variables, not solution buttons. */
const S={
 phase:0,lean:0,speed:.6,payload:0,foot:22,
 leanMin:0,leanMax:0,footMin:22,footMax:22,recoveryMin:999,recoveryMax:-999,
 speedMin:.6,speedMax:.6,targetMin:999,targetMax:-999,
 guidedPassed:false,transferPassed:false,busy:false,drag:false,sx:0,sf:0,coachUses:{}
};
const PH=[
 {name:'HOOK',goal:'Observe the failure without blaming a healthy system.',question:'Run the walk once. Which systems stay healthy when the robot falls?'},
 {name:'DISCOVER',goal:'See how mass position changes support.',question:'Move BODY LEAN through a range. What happens to the yellow CoM marker and the support margin?'},
 {name:'MANIPULATE',goal:'Discover what a new foot contact changes.',question:'Move the next foot through different positions. Which placement increases recovery margin?'},
 {name:'CAUSE / EFFECT',goal:'See why one foot placement cannot fit every motion.',question:'Change walking speed through a useful range. What happens to the recovery zone?'},
 {name:'NAME IT',goal:'Attach engineering vocabulary to observed behavior.',question:'You have already manipulated the phenomenon. Now name the relationships you used.'},
 {name:'GUIDED WALK',goal:'Combine body state, speed and foot placement.',question:'Build a configuration that looks recoverable, then test it. Use the visual margins as evidence.'},
 {name:'TRANSFER',goal:'Adapt when mass distribution changes.',question:'A fixed payload has shifted the body. Sensors are still healthy. Adapt the motion without removing the payload.'},
 {name:'COMPLETE',goal:'Lock dynamic balance basics.',question:'You transferred the same balance logic to a changed mass distribution.'}
];
const HINTS={
 0:['Check the right panel: sensing, estimation and control remain healthy.'],
 1:['Change only BODY LEAN first. Watch the yellow marker and support margin together.','The point is to see a relationship, not to reach a particular number.'],
 2:['Change only NEXT FOOT POSITION. Watch recovery margin while everything else stays fixed.','Try positions on both sides of the violet recovery zone.'],
 3:['Hold the foot still and vary speed. Watch the violet recovery zone move.','Faster motion generally requires a more forward recovery step in this training model.'],
 4:['The vocabulary comes after the experience.'],
 5:['Use the green support area, yellow CoM marker, violet recovery zone and recovery margin together.','A successful setup does not require one exact number; it requires a coherent relationship.'],
 6:['The payload is an external condition, so you cannot remove it. Compare CoM position and recovery zone with your previous setup.','Adjust body lean, speed and next foot placement until the margins recover.'],
 7:['Mission complete.']
};

function cm(){return S.lean+S.payload*.55+S.speed*8;}
function target(){return 20+S.speed*42+Math.max(0,S.payload)*.45;}
function error(){return Math.abs(S.foot-target());}
function support(){return Math.round(clamp(88-Math.abs(cm())*2,0,100));}
function recovery(){return Math.round(clamp(100-error()*3-Math.abs(S.lean)*.6,0,100));}
function good(){return error()<=9&&support()>=38&&recovery()>=62&&S.speed>=.35&&S.speed<=1.05;}
function stageX(v){return clamp(40+v*.5,14,86);}
function footX(v){return clamp(40+v*.5,18,88);}

function injectUI(){
 const host=$('instruction');if(!$('investigation')){
  const box=document.createElement('div');box.id='investigation';box.className='investigation';
  box.innerHTML='<div class="investigation-label">INVESTIGATION</div><div id="investigationQuestion" class="investigation-question"></div><div class="evidence-label">EVIDENCE</div><div id="evidenceList" class="evidence-list"></div>';host.after(box);
 }
 $('continueBtn').classList.add('hidden');
 const tool=document.querySelector('.tool-section');
 if(tool&&!$('footControl')){
  const d=document.createElement('div');d.id='footControl';d.className='range-control locked';
  d.innerHTML='<label><span>Next foot position</span><b id="footValue">+22 cm</b></label><input id="footPosition" type="range" min="-10" max="90" value="22">';
  tool.insertBefore(d,$('speedControl'));
 }
 $('payload').disabled=true;
 $('stanceFoot').textContent='STANCE FOOT';$('swingFoot').textContent='SWING FOOT';
}
function evidence(items){$('evidenceList').innerHTML=items.map(([t,d])=>`<div class="evidence ${d?'captured':''}"><i>${d?'✓':'·'}</i><span>${t}</span></div>`).join('');}
function renderEvidence(){
 if(S.phase===0)evidence([['Orientation estimate stays valid',true],['Control remains tracking',true],['Walking still fails',false]]);
 if(S.phase===1)evidence([['CoM explored across a visible range',S.leanMax-S.leanMin>=16],['Support margin changed with mass position',S.leanMax-S.leanMin>=16]]);
 if(S.phase===2)evidence([['Foot placement explored',S.footMax-S.footMin>=18],['Recovery margin changed substantially',S.recoveryMax-S.recoveryMin>=22]]);
 if(S.phase===3)evidence([['Slow and faster motion compared',S.speedMax-S.speedMin>=.45],['Recovery target moved with speed',S.targetMax-S.targetMin>=14]]);
 if(S.phase===4)evidence([['Center of Mass observed',true],['Support relationship observed',true],['Foot placement relationship observed',true]]);
 if(S.phase===5)evidence([['Recovery margin is strong',recovery()>=62],['Support margin is usable',support()>=38],['10 m walk verified',S.guidedPassed]]);
 if(S.phase===6)evidence([['Payload remains fixed',S.payload!==0],['Mass distribution compensated',support()>=38],['Recovery restored',recovery()>=62],['Payload walk verified',S.transferPassed]]);
 if(S.phase===7)evidence([['Healthy sensing was not misdiagnosed',true],['Foot placement adapted to motion',true],['Balance strategy adapted to payload',true]]);
}
function signals(){
 $('leanValue').textContent=(S.lean>0?'+':'')+S.lean+' cm';$('speedValue').textContent=S.speed.toFixed(1)+' m/s';$('payloadValue').textContent=(S.payload>0?'+':'')+S.payload+' cm';$('footValue').textContent=(S.foot>0?'+':'')+Math.round(S.foot)+' cm';
 $('comValue').textContent=(cm()>=0?'+':'')+cm().toFixed(0)+' cm';$('placementError').textContent=error().toFixed(0)+' cm';$('supportMetric').textContent=support()+'%';$('recoveryMetric').textContent=recovery()+'%';$('targetMetric').textContent=error().toFixed(0)+' cm';
 $('comProjection').style.left=stageX(cm())+'%';$('captureArea').style.left=footX(target())+'%';$('comBar').style.width=clamp(50+cm(),4,96)+'%';$('placementBar').style.width=clamp(100-error()*2.3,4,100)+'%';$('placementBar').style.background=error()<=9?'var(--mint)':error()<=18?'var(--warn)':'var(--bad)';
 const px=(S.foot-22)*1.15;$('swingLeg').style.transform=`translateX(${px}px) rotate(${clamp(px*.06,-8,12)}deg)`;$('payloadBlock').classList.toggle('hidden',S.phase<6);$('payloadBlock').style.transform=`translateX(${S.payload*.5}px)`;
 $('planningCard').querySelector('small').textContent=good()?'PLAN COHERENT':error()<=18?'CLOSE':'NEEDS UPDATE';$('planningCard').className='state-card '+(good()?'healthy':'warning');
 $('systemLog').textContent=['WALK SYSTEM','IMU ........... HEALTHY','STATE CONF .... 96%','CONTROL RESP .. 91%',`CoM PROJ ....... ${cm().toFixed(0)} cm`,`RECOVERY ZONE .. ${target().toFixed(0)} cm`,`FOOT ACTUAL .... ${S.foot.toFixed(0)} cm`,`SUPPORT ........ ${support()}%`,`RECOVERY ....... ${recovery()}%`,good()?'FLAGS ......... NONE':error()>18?'FLAG .......... FOOT PLAN MISALIGNED':support()<38?'FLAG .......... SUPPORT MARGIN LOW':'FLAG .......... RECOVERY MARGIN LOW'].join('\n');
}
function render(){
 const p=PH[S.phase];$('phaseName').textContent=p.name;$('phaseGoal').textContent=p.goal;$('instruction').innerHTML='<b>'+p.question+'</b>';$('investigationQuestion').textContent=p.question;$('phaseCount').textContent=String(S.phase+1).padStart(2,'0')+' / 08';$('progressFill').style.width=(S.phase/7*100)+'%';
 $('torsoControl').classList.toggle('locked',![1,5,6].includes(S.phase));$('footControl').classList.toggle('locked',![2,5,6].includes(S.phase));$('speedControl').classList.toggle('locked',![3,5,6].includes(S.phase));$('payloadControl').classList.add('locked');
 $('runTestBtn').disabled=![0,5,6].includes(S.phase);$('runTestBtn').textContent=S.phase===0?'▶ RUN INITIAL WALK':S.phase===6?'▶ RUN PAYLOAD WALK':'▶ RUN WALK TEST';
 renderEvidence();signals();
}
function phaseTo(n,msg){if(S.busy)return;S.busy=true;if(msg){$('resultBox').className='result pass';$('resultBox').innerHTML=`<strong>${msg}</strong><span>You observed a relationship. A new variable is now available.</span>`;}setTimeout(()=>{S.phase=n;S.busy=false;render();if(n===4)showConcept();},650);}
function showConcept(){$('conceptTitle').textContent='CENTER OF MASS + SUPPORT + FOOT PLACEMENT';$('conceptText').textContent="Le Center of Mass résume où agit la masse combinée du robot. Le support actuel limite où cette masse peut être tenue. En marche, le prochain pied crée un nouveau support. La vitesse et la distribution de masse changent donc l'endroit où ce nouveau support devient utile.";$('conceptReveal').classList.remove('hidden');}
$('conceptContinue').onclick=()=>{$('conceptReveal').classList.add('hidden');S.phase=5;S.lean=0;S.speed=.6;S.foot=22;$('bodyLean').value=0;$('speed').value=60;$('footPosition').value=22;render();};

function updateRanges(){
 S.leanMin=Math.min(S.leanMin,S.lean);S.leanMax=Math.max(S.leanMax,S.lean);S.footMin=Math.min(S.footMin,S.foot);S.footMax=Math.max(S.footMax,S.foot);S.recoveryMin=Math.min(S.recoveryMin,recovery());S.recoveryMax=Math.max(S.recoveryMax,recovery());S.speedMin=Math.min(S.speedMin,S.speed);S.speedMax=Math.max(S.speedMax,S.speed);S.targetMin=Math.min(S.targetMin,target());S.targetMax=Math.max(S.targetMax,target());
}
function setLean(v){S.lean=+v;updateRanges();render();if(S.phase===1&&S.leanMax-S.leanMin>=16)setTimeout(()=>phaseTo(2,'MASS / SUPPORT RELATIONSHIP OBSERVED'),450);}
function setFoot(v){S.foot=clamp(+v,-10,90);updateRanges();$('footPosition').value=S.foot;render();if(S.phase===2&&S.footMax-S.footMin>=18&&S.recoveryMax-S.recoveryMin>=22)setTimeout(()=>phaseTo(3,'FOOT PLACEMENT EFFECT OBSERVED'),450);}
function setSpeed(v){S.speed=+v;updateRanges();render();if(S.phase===3&&S.speedMax-S.speedMin>=.45&&S.targetMax-S.targetMin>=14)setTimeout(()=>phaseTo(4,'SPEED / RECOVERY RELATIONSHIP OBSERVED'),450);}
function run(){
 $('fallStamp').classList.add('hidden');
 if(S.phase===0){$('fallStamp').classList.remove('hidden');$('resultBox').className='result fail';$('resultBox').innerHTML='<strong>TEST FAILED · STEP 3</strong><span>Orientation estimate and control remain healthy. The foot plan does not adapt to the moving body.</span>';setTimeout(()=>phaseTo(1,'FAILURE EVIDENCE CAPTURED'),650);return;}
 if(![5,6].includes(S.phase))return;
 if(good()){$('resultBox').className='result pass';$('resultBox').innerHTML='<strong>TEST PASSED · 10.0 m</strong><span>The next contact creates useful support for the moving body.</span>';if(S.phase===5){S.guidedPassed=true;renderEvidence();setTimeout(()=>{S.phase=6;S.payload=22;$('payload').value=22;signals();$('fallStamp').classList.remove('hidden');$('resultBox').className='result fail';$('resultBox').innerHTML='<strong>PAYLOAD ADDED · PREVIOUS SETUP FAILS</strong><span>Sensing is still healthy. The fixed load shifted mass distribution; adapt the motion without removing it.</span>';render();},900);}else{S.transferPassed=true;renderEvidence();setTimeout(()=>{S.phase=7;render();localStorage.setItem('playlearn_rbt02_complete','true');$('completeModal').classList.remove('hidden');},850);}}
 else{$('fallStamp').classList.remove('hidden');$('resultBox').className='result fail';let why=error()>18?'The foot lands too far from the useful recovery zone.':support()<38?'The CoM leaves too little current support margin.':recovery()<62?'The configuration still has weak recovery margin.':'The motion is outside the useful training range.';$('resultBox').innerHTML=`<strong>TEST FAILED</strong><span>${why}</span>`;render();}
}

injectUI();
$('startBtn').onclick=()=>{$('intro').classList.add('hidden');$('game').classList.remove('hidden');render();};$('runTestBtn').onclick=run;$('bodyLean').oninput=e=>setLean(+e.target.value);$('footPosition').oninput=e=>setFoot(+e.target.value);$('speed').oninput=e=>setSpeed(+e.target.value/100);
$('payload').oninput=()=>{};
$('coachBtn').onclick=()=>{const n=S.coachUses[S.phase]||0,arr=HINTS[S.phase]||['Observe the evidence.'];$('coachText').textContent=arr[Math.min(n,arr.length-1)];S.coachUses[S.phase]=n+1;$('coachPanel').classList.remove('hidden');};$('closeCoach').onclick=()=>$('coachPanel').classList.add('hidden');$('resetBtn').onclick=()=>location.reload();
const foot=$('swingFoot');foot.addEventListener('pointerdown',e=>{if(![2,5,6].includes(S.phase))return;S.drag=true;S.sx=e.clientX;S.sf=S.foot;foot.setPointerCapture(e.pointerId);});foot.addEventListener('pointermove',e=>{if(!S.drag)return;setFoot(S.sf+(e.clientX-S.sx)*.28);});foot.addEventListener('pointerup',()=>S.drag=false);
render();
