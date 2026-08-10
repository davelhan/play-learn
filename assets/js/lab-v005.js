const $=id=>document.getElementById(id);

const phases=[
 {name:"HOOK",goal:"Observe the failure before attempting a fix."},
 {name:"DISCOVER",goal:"Tilt the body and compare the physical angle with the IMU measurement."},
 {name:"MANIPULATE",goal:"Disable and restore the IMU to isolate what the sensor contributes."},
 {name:"CONNECT",goal:"Repair the missing information path from the IMU to State Estimation."},
 {name:"CAUSE / EFFECT",goal:"Reduce stale sensor timing and watch the estimate recover."},
 {name:"GUIDED TEST",goal:"Verify the repaired sensing-to-control chain with a standing test."},
 {name:"TRANSFER",goal:"Repair a different downstream timing fault without blaming the IMU."},
 {name:"COMPLETE",goal:"Lock the orientation stack into the persistent robot."}
];

const copy=[
 {
  instruction:`<b>Collect evidence first.</b><br>Run the initial test. Do not change any component yet.`,
  next:"CLICK ▶ RUN INITIAL TEST"
 },
 {
  instruction:`<b>Now inspect the measurement.</b><br>Drag the torso left past -8° and right past +8°. Compare ACTUAL BODY ANGLE with IMU RAW.`,
  next:"DRAG THE TORSO LEFT AND RIGHT"
 },
 {
  instruction:`<b>Break the measurement on purpose.</b><br>Switch the IMU OFF, observe what disappears, then switch it back ONLINE.`,
  next:"SWITCH IMU OFF → THEN ONLINE"
 },
 {
  instruction:`<b>The IMU works, but the estimator receives nothing.</b><br>Connect the yellow IMU output to the estimator socket. Drag it, or click the plug then the socket.`,
  next:"CONNECT IMU → STATE ESTIMATOR"
 },
 {
  instruction:`<b>The estimate exists, but it is stale.</b><br>Reduce SENSOR DATA AGE to <b>30 ms or less</b>. Watch State Confidence and Estimated Angle.`,
  next:"SET SENSOR DATA AGE ≤ 30 ms"
 },
 {
  instruction:`<b>Verify the repair.</b><br>The chain should now be coherent. Run STAND TEST and hold for 30 seconds.`,
  next:"CLICK ▶ RUN STAND TEST"
 },
 {
  instruction:`<b>New failure, different layer.</b><br>State Estimation is healthy. Reduce CONTROL LATENCY to <b>35 ms or less</b>, then run STAND TEST again.`,
  next:"SET CONTROL LATENCY ≤ 35 ms → RUN TEST"
 },
 {
  instruction:`<b>Mission complete.</b><br>You repaired two different faults by following evidence through the system chain.`,
  next:"ORIENTATION STACK INSTALLED"
 }
];

const coachHints=[
 "The first test is only evidence collection. The motors are online; the missing body orientation is the useful clue.",
 "Move the torso far enough in both directions. ACTUAL BODY ANGLE exists whether a sensor works or not; IMU RAW is the measurement.",
 "With the IMU OFF, the body still has a physical angle, but the raw measurement disappears. Restore it after observing the difference.",
 "The IMU says RAW DATA OK while the estimator says NO INPUT. That means the missing link is between those two blocks.",
 "A sensor can be correct but late. Move Sensor data age toward 30 ms or below and watch State Confidence rise.",
 "A usable standing chain requires measurement → estimate → control → motors. Your diagnostics should show no sensing/timing flag.",
 "Do not touch the IMU. State Confidence is healthy. The red/late clue is now in Control Response.",
 "You have now distinguished sensing, estimation and control by their failure signatures."
];

const state={
 phase:0,angle:0,imuOn:true,connected:false,sensorDelay:85,controlDelay:18,
 draggedLeft:false,draggedRight:false,sawOff:false,sawOnAfterOff:false,
 connectorSelected:false,testRuns:0,guidedPassed:false,transferPassed:false,
 transitioning:false,conceptShown:false
};

let draggingRobot=false,draggingPlug=false,startX=0,startAngle=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const normalizedBar=a=>clamp(50+a*2.2,4,96);

function estimatedAngle(){
 if(!state.imuOn||!state.connected)return null;
 const quality=clamp(1-state.sensorDelay/150,.15,.97);
 return state.angle*quality;
}
function stateConfidence(){
 if(!state.imuOn||!state.connected)return 0;
 return Math.round(clamp(105-state.sensorDelay*1.05,8,100));
}
function controlResponse(){return Math.round(clamp(112-state.controlDelay*1.1,10,100));}
function balanceMargin(){return Math.round(clamp(.58*stateConfidence()+.42*controlResponse()-Math.abs(state.angle)*1.2,0,100));}
function standPass(){return state.imuOn&&state.connected&&state.sensorDelay<=30&&state.controlDelay<=35;}

function setFocus(ids=[]){
 document.querySelectorAll('.focus-target').forEach(el=>el.classList.remove('focus-target'));
 ids.forEach(id=>{const el=$(id);if(el)el.classList.add('focus-target');});
}
function toast(text){
 const t=$("phaseToast");t.textContent=text;t.classList.remove('hidden');
 clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.add('hidden'),1100);
}
function checklist(items){
 $("taskChecklist").innerHTML=items.map(([label,done])=>`<div class="check-item ${done?'done':''}"><i>${done?'✓':'○'}</i><span>${label}</span></div>`).join('');
}

function updateSignals(){
 $("actualAngle").textContent=`${state.angle.toFixed(1)}°`;
 $("actualBar").style.width=`${normalizedBar(state.angle)}%`;
 if(state.imuOn){
  $("imuAngle").textContent=`${state.angle.toFixed(1)}°`;$("imuAngle").className="";
  $("imuBar").style.width=`${normalizedBar(state.angle)}%`;$("imuBar").style.background="var(--mint)";
 }else{
  $("imuAngle").textContent="NO SIGNAL";$("imuAngle").className="bad";$("imuBar").style.width="4%";$("imuBar").style.background="var(--bad)";
 }
 const est=estimatedAngle();
 if(est===null){
  $("estimatedAngle").textContent="UNKNOWN";$("estimatedAngle").className="bad";$("estimateBar").style.width="4%";$("estimateBar").style.background="var(--bad)";
 }else{
  $("estimatedAngle").textContent=`${est.toFixed(1)}°`;$("estimatedAngle").className="";
  $("estimateBar").style.width=`${normalizedBar(est)}%`;$("estimateBar").style.background=state.sensorDelay<=30?"var(--mint)":"var(--warn)";
 }
 $("stateConfidence").textContent=`${stateConfidence()}%`;
 $("controlResponse").textContent=`${controlResponse()}%`;
 $("balanceMargin").textContent=`${balanceMargin()}%`;
 $("imuNodeState").textContent=state.imuOn?"RAW DATA OK":"OFFLINE";$("imuNodeState").className=state.imuOn?"ok":"bad";
 if(!state.connected){$("estNodeState").textContent="NO INPUT";$("estNodeState").className="bad";}
 else if(state.sensorDelay>30){$("estNodeState").textContent=`STALE · ${state.sensorDelay} ms`;$("estNodeState").className="";}
 else{$("estNodeState").textContent="STATE VALID";$("estNodeState").className="ok";}
 if(stateConfidence()<50){$("controlNodeState").textContent="WAITING FOR STATE";$("controlNodeState").className="";}
 else if(state.controlDelay>35){$("controlNodeState").textContent=`LATE · ${state.controlDelay} ms`;$("controlNodeState").className="bad";}
 else{$("controlNodeState").textContent="TRACKING";$("controlNodeState").className="ok";}
 $("delayValue").textContent=`${state.sensorDelay} ms`;$("controlDelayValue").textContent=`${state.controlDelay} ms`;
 const log=["SYSTEM LIVE",`IMU ........... ${state.imuOn?'ONLINE':'OFFLINE'}`,`IMU→EST ...... ${state.connected?'CONNECTED':'OPEN CIRCUIT'}`,`DATA AGE ...... ${state.connected?state.sensorDelay+' ms':'N/A'}`,`STATE CONF .... ${stateConfidence()}%`,`CONTROL RESP .. ${controlResponse()}%`];
 if(!state.imuOn)log.push("FLAG .......... SENSOR OFFLINE");
 else if(!state.connected)log.push("FLAG .......... STATE INPUT MISSING");
 else if(state.sensorDelay>30)log.push("FLAG .......... SENSOR DATA STALE");
 else if(state.controlDelay>35)log.push("FLAG .......... CONTROL RESPONSE LATE");
 else log.push("FLAGS ......... NONE");
 $("systemLog").textContent=log.join("\n");
 $("robot").style.transform=`translateX(-50%) rotate(${state.angle}deg)`;
}

function renderChecklist(){
 switch(state.phase){
  case 0: checklist([["Run the initial failure test",state.testRuns>0]]);break;
  case 1: checklist([["Tilt left past -8°",state.draggedLeft],["Tilt right past +8°",state.draggedRight]]);break;
  case 2: checklist([["Switch IMU OFF",state.sawOff],["Restore IMU ONLINE",state.sawOnAfterOff]]);break;
  case 3: checklist([["Connect IMU output to estimator input",state.connected]]);break;
  case 4: checklist([["Sensor data age ≤ 30 ms",state.sensorDelay<=30]]);break;
  case 5: checklist([["Pass 30-second STAND TEST",state.guidedPassed]]);break;
  case 6: checklist([["Control latency ≤ 35 ms",state.controlDelay<=35],["Pass STAND TEST",state.transferPassed]]);break;
  case 7: checklist([["Orientation Stack installed",true]]);break;
 }
}

function renderPhase(){
 const p=phases[state.phase],c=copy[state.phase];
 $("phaseName").textContent=p.name;$("phaseGoal").textContent=p.goal;
 $("phaseCount").textContent=`${String(state.phase+1).padStart(2,'0')} / 08`;
 $("progressFill").style.width=`${(state.phase/7)*100}%`;
 $("instruction").innerHTML=c.instruction;$("nextActionTitle").textContent=c.next;
 $("sensorDelayControl").classList.toggle('locked',state.phase!==4);
 $("controlDelayControl").classList.toggle('locked',state.phase!==6);
 $("imuPowerControl").classList.toggle('locked',state.phase!==2);
 $("connectHint").classList.toggle('hidden',state.phase!==3||state.connected);
 $("grab-label").classList?.toggle?.('hidden',state.phase!==1);

 $("runTestBtn").disabled=![0,5,6].includes(state.phase);
 $("runTestBtn").textContent=state.phase===0?'▶ RUN INITIAL TEST':'▶ RUN STAND TEST';

 if(state.phase===0)setFocus(['runTestBtn']);
 else if(state.phase===1)setFocus(['robot']);
 else if(state.phase===2)setFocus(['imuPowerControl']);
 else if(state.phase===3)setFocus(state.connectorSelected?['socket']:['imuLink']);
 else if(state.phase===4)setFocus(['sensorDelayControl']);
 else if(state.phase===5)setFocus(['runTestBtn']);
 else if(state.phase===6)setFocus(state.controlDelay<=35?['runTestBtn']:['controlDelayControl']);
 else setFocus([]);
 renderChecklist();updateSignals();
}

function gotoPhase(n,msg){
 if(state.transitioning)return;
 state.transitioning=true;
 if(msg)toast(msg);
 setTimeout(()=>{state.phase=n;state.transitioning=false;renderPhase();},650);
}

function showConcept(){
 if(state.conceptShown)return;
 state.conceptShown=true;
 $("conceptTitle").textContent="STATE ESTIMATION";
 $("conceptText").textContent="L'IMU fournit une mesure. Le State Estimator transforme des mesures imparfaites et datées en un état utilisable par le contrôle. Tu viens d'observer trois choses différentes : un capteur peut être coupé, une connexion peut manquer, et des données correctes peuvent être trop anciennes.";
 $("conceptReveal").classList.remove('hidden');
}
$("conceptContinue").onclick=()=>{$("conceptReveal").classList.add('hidden');state.phase=5;renderPhase();};

function connectEstimator(){
 if(state.phase!==3||state.connected)return;
 state.connected=true;state.connectorSelected=false;
 $("imuLink").classList.add('connected');$("plug").style.top="";
 renderPhase();gotoPhase(4,"CONNECTION RESTORED");
}

function injectTransfer(){
 state.controlDelay=68;$("controlDelay").value=68;
 $("resultBox").className="result neutral";
 $("resultBox").innerHTML="<strong>NEW FAULT INJECTED</strong><span>State confidence is healthy. The next clue is downstream in CONTROL RESPONSE.</span>";
 updateSignals();
}

function runTest(){
 if(![0,5,6].includes(state.phase))return;
 state.testRuns++;$("failureStamp").classList.add('hidden');
 if(state.phase===0){
  $("resultBox").className="result fail";
  $("resultBox").innerHTML="<strong>TEST FAILED · 2.84 s</strong><span>Motors are online, but BASE ORIENTATION is unavailable. <b>NEXT: drag the torso left and right.</b></span>";
  $("failureStamp").classList.remove('hidden');state.angle=15;renderChecklist();updateSignals();
  gotoPhase(1,"FAILURE CAPTURED — INSPECT THE SENSOR");return;
 }
 const pass=standPass();
 let reason=!state.imuOn?"IMU measurement is unavailable.":!state.connected?"The estimator receives no IMU data.":state.sensorDelay>30?"Sensor data is still too stale.":state.controlDelay>35?"The estimate is healthy, but control response is late.":"Measurement, estimate, control and motor response are coherent.";
 if(pass){
  $("resultBox").className="result pass";$("resultBox").innerHTML=`<strong>TEST PASSED · 30.0 s</strong><span>${reason}</span>`;state.angle=0;
  if(state.phase===5){state.guidedPassed=true;renderChecklist();setTimeout(()=>{state.phase=6;injectTransfer();renderPhase();toast("NEW FAILURE — DIFFERENT LAYER");},900);}
  else if(state.phase===6){state.transferPassed=true;renderChecklist();setTimeout(()=>{state.phase=7;renderPhase();localStorage.setItem('playlearn_rbt01_complete','true');$("completeModal").classList.remove('hidden');},900);}
 }else{
  $("resultBox").className="result fail";$("resultBox").innerHTML=`<strong>TEST FAILED</strong><span>${reason}</span>`;$("failureStamp").classList.remove('hidden');state.angle=state.angle>=0?15:-15;renderPhase();
 }
}

// Robot tilt
const robot=$("robot");
robot.addEventListener('pointerdown',e=>{if(state.phase!==1)return;draggingRobot=true;startX=e.clientX;startAngle=state.angle;robot.setPointerCapture(e.pointerId);});
robot.addEventListener('pointermove',e=>{if(!draggingRobot)return;state.angle=clamp(startAngle+(e.clientX-startX)*.13,-22,22);if(state.angle<-8)state.draggedLeft=true;if(state.angle>8)state.draggedRight=true;renderChecklist();updateSignals();if(state.draggedLeft&&state.draggedRight&&!state.transitioning)gotoPhase(2,"IMU MEASUREMENT OBSERVED");});
robot.addEventListener('pointerup',()=>draggingRobot=false);

// IMU power
$("imuPower").onclick=()=>{if(state.phase!==2)return;state.imuOn=!state.imuOn;$("imuPower").textContent=state.imuOn?'ONLINE':'OFFLINE';$("imuPower").className=`toggle ${state.imuOn?'on':'off'}`;if(!state.imuOn)state.sawOff=true;if(state.imuOn&&state.sawOff)state.sawOnAfterOff=true;renderChecklist();updateSignals();if(state.sawOff&&state.sawOnAfterOff&&!state.transitioning)gotoPhase(3,"SENSOR ROLE ISOLATED");};

// Timing controls
$("sensorDelay").oninput=e=>{if(state.phase!==4)return;state.sensorDelay=+e.target.value;renderPhase();if(state.sensorDelay<=30&&!state.conceptShown){toast("STATE CONFIDENCE RECOVERED");setTimeout(showConcept,650);}};
$("controlDelay").oninput=e=>{if(state.phase!==6)return;state.controlDelay=+e.target.value;renderPhase();};

// Connector: drag OR click-click
const plug=$("plug"),socket=$("socket");
plug.addEventListener('click',e=>{if(state.phase!==3||state.connected)return;e.stopPropagation();state.connectorSelected=true;plug.classList.add('selected');renderPhase();});
socket.addEventListener('click',()=>{if(state.phase===3&&state.connectorSelected)connectEstimator();});
plug.addEventListener('pointerdown',e=>{if(state.phase!==3||state.connected)return;draggingPlug=true;plug.setPointerCapture(e.pointerId);plug.style.cursor='grabbing';});
plug.addEventListener('pointermove',e=>{if(!draggingPlug)return;const link=$("imuLink").getBoundingClientRect();let y=clamp(e.clientY-link.top,8,link.height-8);plug.style.top=`${y-8}px`;});
plug.addEventListener('pointerup',e=>{if(!draggingPlug)return;draggingPlug=false;plug.style.cursor='grab';const sr=socket.getBoundingClientRect();const dist=Math.hypot(e.clientX-(sr.left+sr.width/2),e.clientY-(sr.top+sr.height/2));if(dist<65)connectEstimator();else plug.style.top='11px';});

// Coach / main buttons
$("coachBtn").onclick=()=>{$("coachText").textContent=coachHints[state.phase];$("coachPanel").classList.remove('hidden');};
$("closeCoach").onclick=()=>$("coachPanel").classList.add('hidden');
$("runTestBtn").onclick=runTest;
$("startBtn").onclick=()=>{$("intro").classList.add('hidden');$("game").classList.remove('hidden');renderPhase();};
$("resetBtn").onclick=()=>{const progressed=state.phase>0||state.testRuns>0;if(!progressed||window.confirm('Reset this mission and lose the current attempt?'))location.reload();};

updateSignals();
