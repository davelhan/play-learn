const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* QA5 PEDAGOGY RULES
   - no solution buttons
   - only system controls are manipulated
   - prompts ask questions, not exact target values
   - progress is earned by observed cause/effect
   - transfer permits wrong diagnosis and gives evidence
*/
const M={
 phase:0, angle:0, imuOn:true, connected:false, sensorDelay:85, controlDelay:18,
 minAngle:0,maxAngle:0,sawSensorOff:false,sawSensorBack:false,plugSelected:false,
 standPassed:false,transferPassed:false,busy:false,coachUses:{},drag:false,startX:0,startAngle:0
};

const PH=[
 {name:'HOOK',goal:'Collect evidence from the failure.',question:'Run the failure once. What is healthy, and what information is missing?'},
 {name:'DISCOVER',goal:'Separate physical state from measurement.',question:'Move the body. Which displayed signal follows the physical angle, and which value is still unavailable?'},
 {name:'ISOLATE',goal:'Prove what the sensor contributes.',question:'Interrupt the orientation sensor briefly. Which value disappears? Which one still exists physically?'},
 {name:'TRACE',goal:'Find where information stops.',question:'The sensor reports raw data, but the estimate is still unknown. Follow the information path and repair the break.'},
 {name:'TIMING',goal:'Discover why correct data can still be unusable.',question:'The path is connected, but the estimate lags behind the body. Experiment with data age until the estimate becomes trustworthy.'},
 {name:'VERIFY',goal:'Test the complete sensing-to-control chain.',question:'You have an orientation estimate. Does the robot now remain standing?'},
 {name:'TRANSFER',goal:'Diagnose a different failure without repeating the previous fix.',question:'The state estimate is healthy, but the robot reacts late. Which layer is now limiting the response?'},
 {name:'COMPLETE',goal:'Lock the orientation stack.',question:'You distinguished physical state, measurement, estimation and control by their failure signatures.'}
];

const HINTS={
 0:['Read the right panel before changing anything. Green systems are evidence too.'],
 1:['Drag the torso through a visible range and compare ACTUAL BODY ANGLE with IMU RAW.','The important comparison is not the number itself; it is which values change together.'],
 2:['Use the IMU power control as an experiment, not as a repair.','When the sensor is off, the body still has an angle even if the measurement disappears.'],
 3:['Compare RAW DATA OK with NO INPUT. Those two statements can both be true.','Select the sensor output, then the estimator input.'],
 4:['Keep the body tilted while changing data age so you can see estimate error.','You are looking for a transition from stale/low-confidence to usable state, not a magic number.'],
 5:['Run the test. The result is now your evidence.'],
 6:['Do not assume the last fault has returned. Compare State confidence with Control response.','Both timing controls are available. Change the one that improves the bad diagnostic.'],
 7:['Mission complete.']
};

function confidence(){return (!M.imuOn||!M.connected)?0:Math.round(clamp(105-M.sensorDelay*1.05,8,100));}
function response(){return Math.round(clamp(112-M.controlDelay*1.1,10,100));}
function estimate(){if(!M.imuOn||!M.connected)return null;return M.angle*clamp(1-M.sensorDelay/150,.15,.97);}
function norm(a){return clamp(50+a*2.2,4,96);}
function standReady(){return M.imuOn&&M.connected&&confidence()>=72&&response()>=72;}

function injectInvestigationUI(){
 const host=$('instruction');
 if(!host||$('investigation'))return;
 const box=document.createElement('div');
 box.id='investigation';box.className='investigation';
 box.innerHTML=`<div class="investigation-label">INVESTIGATION</div><div id="investigationQuestion" class="investigation-question"></div><div class="evidence-label">EVIDENCE</div><div id="evidenceList" class="evidence-list"></div>`;
 host.after(box);
 const old=$('taskStatus'); if(old) old.classList.add('hidden');
}

function evidence(items){
 $('evidenceList').innerHTML=items.map(([t,d])=>`<div class="evidence ${d?'captured':''}"><i>${d?'✓':'·'}</i><span>${t}</span></div>`).join('');
}

function renderEvidence(){
 if(M.phase===0)evidence([['Initial failure observed',false],['Motors remain online',true],['Base orientation unavailable',true]]);
 if(M.phase===1)evidence([['Body explored in both directions',M.minAngle<-6&&M.maxAngle>6],['IMU raw follows body angle',M.minAngle<-6&&M.maxAngle>6],['Estimated angle remains unavailable',true]]);
 if(M.phase===2)evidence([['Physical body angle survives sensor shutdown',M.sawSensorOff],['IMU raw disappears when sensor is off',M.sawSensorOff],['Measurement returns after sensor restore',M.sawSensorBack]]);
 if(M.phase===3)evidence([['IMU output is healthy',M.imuOn],['Estimator input is missing',!M.connected],['Information path repaired',M.connected]]);
 if(M.phase===4)evidence([['Estimate exists',estimate()!==null],['State confidence recovered',confidence()>=72],['Estimate follows body closely enough',confidence()>=72]]);
 if(M.phase===5)evidence([['Sensing chain ready',standReady()],['30-second stand verified',M.standPassed]]);
 if(M.phase===6)evidence([['State confidence remains healthy',confidence()>=72],['Control response recovered',response()>=72],['Transfer stand verified',M.transferPassed]]);
 if(M.phase===7)evidence([['Measurement distinguished from physical state',true],['Estimation distinguished from sensing',true],['Control fault distinguished from sensing fault',true]]);
}

function renderSignals(){
 $('actualAngle').textContent=M.angle.toFixed(1)+'°';$('actualBar').style.width=norm(M.angle)+'%';
 if(M.imuOn){$('imuAngle').textContent=M.angle.toFixed(1)+'°';$('imuAngle').className='';$('imuBar').style.width=norm(M.angle)+'%';$('imuBar').style.background='var(--mint)';}
 else{$('imuAngle').textContent='NO SIGNAL';$('imuAngle').className='bad';$('imuBar').style.width='4%';$('imuBar').style.background='var(--bad)';}
 const est=estimate();
 if(est===null){$('estimatedAngle').textContent='UNKNOWN';$('estimatedAngle').className='bad';$('estimateBar').style.width='4%';$('estimateBar').style.background='var(--bad)';}
 else{$('estimatedAngle').textContent=est.toFixed(1)+'°';$('estimatedAngle').className='';$('estimateBar').style.width=norm(est)+'%';$('estimateBar').style.background=confidence()>=72?'var(--mint)':'var(--warn)';}
 $('stateConfidence').textContent=confidence()+'%';$('controlResponse').textContent=response()+'%';$('balanceMargin').textContent=Math.round(clamp(.58*confidence()+.42*response()-Math.abs(M.angle),0,100))+'%';
 $('delayValue').textContent=M.sensorDelay+' ms';$('controlDelayValue').textContent=M.controlDelay+' ms';
 $('imuPower').textContent=M.imuOn?'ONLINE':'OFFLINE';$('imuPower').className='toggle '+(M.imuOn?'on':'off');
 $('imuNodeState').textContent=M.imuOn?'RAW DATA OK':'OFFLINE';$('imuNodeState').className=M.imuOn?'ok':'bad';
 if(!M.connected){$('estNodeState').textContent='NO INPUT';$('estNodeState').className='bad';}
 else if(confidence()<72){$('estNodeState').textContent='STATE LOW CONFIDENCE';$('estNodeState').className='';}
 else{$('estNodeState').textContent='STATE VALID';$('estNodeState').className='ok';}
 if(confidence()<50){$('controlNodeState').textContent='WAITING FOR STATE';$('controlNodeState').className='';}
 else if(response()<72){$('controlNodeState').textContent='RESPONSE LATE';$('controlNodeState').className='bad';}
 else{$('controlNodeState').textContent='TRACKING';$('controlNodeState').className='ok';}
 $('robot').style.transform=`translateX(-50%) rotate(${M.angle}deg)`;
 $('systemLog').textContent=[
  'SYSTEM LIVE',`IMU ........... ${M.imuOn?'ONLINE':'OFFLINE'}`,`IMU→EST ...... ${M.connected?'CONNECTED':'OPEN CIRCUIT'}`,
  `DATA AGE ...... ${M.connected?M.sensorDelay+' ms':'N/A'}`,`STATE CONF .... ${confidence()}%`,`CONTROL RESP .. ${response()}%`,
  !M.imuOn?'FLAG .......... SENSOR OFFLINE':!M.connected?'FLAG .......... STATE INPUT MISSING':confidence()<72?'FLAG .......... ESTIMATE NOT TRUSTWORTHY':response()<72?'FLAG .......... CONTROL RESPONSE LATE':'FLAGS ......... NONE'
 ].join('\n');
}

function render(){
 const p=PH[M.phase];$('phaseName').textContent=p.name;$('phaseGoal').textContent=p.goal;$('instruction').innerHTML='<b>'+p.question+'</b>';
 $('investigationQuestion').textContent=p.question;$('phaseCount').textContent=String(M.phase+1).padStart(2,'0')+' / 08';$('progressFill').style.width=(M.phase/7*100)+'%';
 $('imuPowerControl').classList.toggle('locked',M.phase!==2);
 $('sensorDelayControl').classList.toggle('locked',![4,6].includes(M.phase));
 $('controlDelayControl').classList.toggle('locked',M.phase!==6);
 $('runTestBtn').disabled=![0,5,6].includes(M.phase);$('runTestBtn').textContent=M.phase===0?'▶ RUN INITIAL TEST':'▶ RUN STAND TEST';
 $('grab-label').classList.toggle('hidden',M.phase!==1);
 $('connectHint').classList.toggle('hidden',M.phase!==3||M.connected);
 renderEvidence();renderSignals();
}

function phaseTo(n,message){
 if(M.busy)return;M.busy=true;
 if(message){$('resultBox').className='result pass';$('resultBox').innerHTML=`<strong>${message}</strong><span>Evidence captured. A new question is now available.</span>`;}
 setTimeout(()=>{M.phase=n;M.busy=false;if(n===4){M.angle=16;}render();},650);
}

function showConcept(){
 $('conceptTitle').textContent='STATE ESTIMATION';
 $('conceptText').textContent="Tu as distingué trois choses : l'orientation physique existe dans le monde réel ; l'IMU la mesure ; le State Estimator transforme cette mesure en un état utilisable par le contrôle. Une mesure peut exister sans atteindre l'estimateur, et une mesure correcte peut être trop ancienne pour être utile.";
 $('conceptReveal').classList.remove('hidden');
}
$('conceptContinue').onclick=()=>{$('conceptReveal').classList.add('hidden');M.phase=5;M.angle=0;render();};

function runTest(){
 if(M.phase===0){
  $('failureStamp').classList.remove('hidden');M.angle=14;
  $('resultBox').className='result fail';$('resultBox').innerHTML='<strong>TEST FAILED · 2.84 s</strong><span>Motors stayed online. BASE ORIENTATION remained unavailable.</span>';renderSignals();
  setTimeout(()=>{M.angle=0;M.minAngle=0;M.maxAngle=0;phaseTo(1,'FAILURE EVIDENCE CAPTURED');},650);return;
 }
 if(![5,6].includes(M.phase))return;
 if(standReady()){
  $('failureStamp').classList.add('hidden');M.angle=0;$('resultBox').className='result pass';$('resultBox').innerHTML='<strong>TEST PASSED · 30.0 s</strong><span>The chain now carries usable state into timely control.</span>';
  if(M.phase===5){M.standPassed=true;renderEvidence();setTimeout(()=>{M.phase=6;M.controlDelay=68;$('controlDelay').value=68;M.angle=10;$('resultBox').className='result neutral';$('resultBox').innerHTML='<strong>NEW FAILURE</strong><span>The orientation estimate remains healthy, but the robot reacts late. Investigate before changing anything.</span>';render();},850);}
  else{M.transferPassed=true;renderEvidence();setTimeout(()=>{M.phase=7;render();localStorage.setItem('playlearn_rbt01_complete','true');$('completeModal').classList.remove('hidden');},850);}
 }else{
  $('failureStamp').classList.remove('hidden');$('resultBox').className='result fail';
  const why=confidence()<72?'The state estimate is not trustworthy yet.':response()<72?'The estimate is healthy, but corrective control arrives too late.':'The chain is still incomplete.';
  $('resultBox').innerHTML=`<strong>TEST FAILED</strong><span>${why}</span>`;render();
 }
}

const robot=$('robot');
robot.addEventListener('pointerdown',e=>{if(M.phase!==1)return;M.drag=true;M.startX=e.clientX;M.startAngle=M.angle;robot.setPointerCapture(e.pointerId);});
robot.addEventListener('pointermove',e=>{if(!M.drag)return;M.angle=clamp(M.startAngle+(e.clientX-M.startX)*.13,-22,22);M.minAngle=Math.min(M.minAngle,M.angle);M.maxAngle=Math.max(M.maxAngle,M.angle);renderSignals();renderEvidence();});
robot.addEventListener('pointerup',()=>{M.drag=false;if(M.phase===1&&M.minAngle<-6&&M.maxAngle>6)phaseTo(2,'MEASUREMENT RELATIONSHIP OBSERVED');});

$('imuPower').onclick=()=>{
 if(M.phase!==2)return;M.imuOn=!M.imuOn;
 if(!M.imuOn)M.sawSensorOff=true;if(M.imuOn&&M.sawSensorOff)M.sawSensorBack=true;render();
 if(M.sawSensorOff&&M.sawSensorBack)setTimeout(()=>phaseTo(3,'SENSOR CONTRIBUTION ISOLATED'),450);
};

const plug=$('plug'),socket=$('socket');
let plugDrag=false;
plug.onclick=()=>{if(M.phase!==3||M.connected)return;M.plugSelected=true;plug.classList.add('selected');$('connectHint').textContent='OUTPUT SELECTED — CHOOSE INPUT';};
socket.onclick=()=>{if(M.phase===3&&M.plugSelected)connectPath();};
plug.addEventListener('pointerdown',e=>{if(M.phase!==3||M.connected)return;plugDrag=true;plug.setPointerCapture(e.pointerId);});
plug.addEventListener('pointerup',e=>{if(!plugDrag)return;plugDrag=false;const r=socket.getBoundingClientRect();const d=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));if(d<65)connectPath();});
function connectPath(){M.connected=true;M.plugSelected=false;$('imuLink').classList.add('connected');plug.classList.remove('selected');render();setTimeout(()=>phaseTo(4,'INFORMATION PATH RESTORED'),500);}

$('sensorDelay').oninput=e=>{
 if(![4,6].includes(M.phase))return;M.sensorDelay=+e.target.value;renderSignals();renderEvidence();
 if(M.phase===4&&confidence()>=72)setTimeout(()=>showConcept(),450);
};
$('controlDelay').oninput=e=>{if(M.phase!==6)return;M.controlDelay=+e.target.value;renderSignals();renderEvidence();};

$('coachBtn').onclick=()=>{
 const n=M.coachUses[M.phase]||0;const arr=HINTS[M.phase]||['Observe the evidence.'];$('coachText').textContent=arr[Math.min(n,arr.length-1)];M.coachUses[M.phase]=n+1;$('coachPanel').classList.remove('hidden');
};
$('closeCoach').onclick=()=>$('coachPanel').classList.add('hidden');
$('resetBtn').onclick=()=>location.reload();$('runTestBtn').onclick=runTest;
$('startBtn').onclick=()=>{$('intro').classList.add('hidden');$('game').classList.remove('hidden');render();};

injectInvestigationUI();render();
