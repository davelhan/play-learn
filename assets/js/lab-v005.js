const $=id=>document.getElementById(id);
const phases = [
 {name:"HOOK", goal:"Observe the failure before attempting a fix."},
 {name:"DISCOVER", goal:"Tilt the robot and observe what the IMU actually measures."},
 {name:"MANIPULATE", goal:"Disable and restore the IMU to isolate its effect."},
 {name:"CONNECT", goal:"Repair the information path from IMU to State Estimation."},
 {name:"CAUSE / EFFECT", goal:"Reduce stale sensor timing and watch estimate confidence recover."},
 {name:"GUIDED TEST", goal:"Pass the standing test with a coherent sensing-to-control chain."},
 {name:"TRANSFER", goal:"Diagnose a different failure without blaming the IMU automatically."},
 {name:"COMPLETE", goal:"Lock the orientation stack into the persistent robot."}
];
const state = {
 phase:0, angle:0, imuOn:true, connected:false, sensorDelay:85, controlDelay:18,
 draggedLeft:false, draggedRight:false, sawOff:false, sawOnAfterOff:false,
 testRuns:0, fails:0, guidedPassed:false, transferInjected:false, transferPassed:false
};
const instructions = [
 `<b>Run the failure.</b><br>Don't repair anything yet. Watch what fails and what remains healthy.`,
 `<b>Grab the torso and tilt it left and right.</b><br>Watch ACTUAL BODY ANGLE, IMU RAW and ESTIMATED ANGLE. Your job is only to observe.`,
 `<b>Break the sensor on purpose.</b><br>Turn the IMU OFF, tilt the robot again, then restore it. Notice exactly which signal disappears.`,
 `<b>The IMU is producing data, but State Estimation receives none.</b><br>Drag the yellow connector into the estimator socket to repair the information path.`,
 `<b>Data has arrived — but it is old.</b><br>Change SENSOR DATA AGE while you tilt the robot. Watch the estimated state become more trustworthy as timing improves.`,
 `<b>Now prove the system works.</b><br>Keep the IMU online, the path connected and sensor data fresh enough, then run STAND TEST.`,
 `<b>New fault injected.</b><br>The orientation estimate is healthy, but the robot still reacts too late. Inspect the system and repair the new bottleneck without touching the IMU.`,
 `<b>Mission complete.</b><br>The orientation stack is now part of your persistent robot.`
];
const coachHints = [
 "The first test is evidence collection. Notice that the motors are online while the base orientation is unavailable.",
 "The IMU is a measurement source. Move the body first; don't worry about terminology yet. Make the raw value change in both directions.",
 "Turn the IMU off while the robot is tilted. Which displayed value vanishes immediately, and which physical value still exists?",
 "The sensor itself is healthy. Follow the information path: raw measurement has to reach the estimator before control can use it.",
 "A measurement can be correct but too old. Compare the sensor data age with how closely the estimated angle follows the actual body angle.",
 "For the stand test you need a usable chain: sensor → estimator → controller → motors. Use the diagnostics rather than guessing.",
 "The estimator now reports high confidence. So don't repair sensing again. Look downstream at CONTROL RESPONSE and its timing.",
 "You have demonstrated the concept in two different failure modes. That's why the game upgrades mastery."
];

let draggingRobot=false, draggingPlug=false, startX=0, startAngle=0;

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function normalizedBar(angle){return clamp(50 + angle*2.2,4,96)}

function estimatedAngle(){
 if(!state.imuOn || !state.connected) return null;
 const quality=clamp(1-state.sensorDelay/150,.15,.97);
 return state.angle*quality;
}
function stateConfidence(){
 if(!state.imuOn || !state.connected) return 0;
 return Math.round(clamp(105-state.sensorDelay*1.05,8,100));
}
function controlResponse(){
 return Math.round(clamp(112-state.controlDelay*1.1,10,100));
}
function balanceMargin(){
 const sc=stateConfidence(), cr=controlResponse();
 return Math.round(clamp(.58*sc + .42*cr - Math.abs(state.angle)*1.2,0,100));
}
function standPass(){
 return state.imuOn && state.connected && state.sensorDelay<=30 && state.controlDelay<=35;
}
function updateSignals(){
 $("actualAngle").textContent=`${state.angle.toFixed(1)}°`;
 $("actualBar").style.width=`${normalizedBar(state.angle)}%`;

 if(state.imuOn){
   $("imuAngle").textContent=`${state.angle.toFixed(1)}°`;
   $("imuAngle").className="";
   $("imuBar").style.width=`${normalizedBar(state.angle)}%`;
   $("imuBar").style.background="var(--mint)";
 }else{
   $("imuAngle").textContent="NO SIGNAL";
   $("imuAngle").className="bad";
   $("imuBar").style.width="4%";
   $("imuBar").style.background="var(--bad)";
 }
 const est=estimatedAngle();
 if(est===null){
   $("estimatedAngle").textContent="UNKNOWN";
   $("estimatedAngle").className="bad";
   $("estimateBar").style.width="4%";
   $("estimateBar").style.background="var(--bad)";
 }else{
   $("estimatedAngle").textContent=`${est.toFixed(1)}°`;
   $("estimatedAngle").className="";
   $("estimateBar").style.width=`${normalizedBar(est)}%`;
   $("estimateBar").style.background=state.sensorDelay<=30?"var(--mint)":"var(--warn)";
 }
 $("stateConfidence").textContent=`${stateConfidence()}%`;
 $("controlResponse").textContent=`${controlResponse()}%`;
 $("balanceMargin").textContent=`${balanceMargin()}%`;

 $("imuNodeState").textContent=state.imuOn?"RAW DATA OK":"OFFLINE";
 $("imuNodeState").className=state.imuOn?"ok":"bad";
 if(!state.connected){
   $("estNodeState").textContent="NO INPUT";
   $("estNodeState").className="bad";
 }else if(state.sensorDelay>30){
   $("estNodeState").textContent=`STALE · ${state.sensorDelay} ms`;
   $("estNodeState").className="";
 }else{
   $("estNodeState").textContent="STATE VALID";
   $("estNodeState").className="ok";
 }
 if(stateConfidence()<50){
   $("controlNodeState").textContent="WAITING FOR STATE";
   $("controlNodeState").className="";
 }else if(state.controlDelay>35){
   $("controlNodeState").textContent=`LATE · ${state.controlDelay} ms`;
   $("controlNodeState").className="bad";
 }else{
   $("controlNodeState").textContent="TRACKING";
   $("controlNodeState").className="ok";
 }

 $("delayValue").textContent=`${state.sensorDelay} ms`;
 $("controlDelayValue").textContent=`${state.controlDelay} ms`;

 const log=[];
 log.push("SYSTEM LIVE");
 log.push(`IMU ........... ${state.imuOn?"ONLINE":"OFFLINE"}`);
 log.push(`IMU→EST ...... ${state.connected?"CONNECTED":"OPEN CIRCUIT"}`);
 log.push(`DATA AGE ...... ${state.connected?state.sensorDelay+" ms":"N/A"}`);
 log.push(`STATE CONF .... ${stateConfidence()}%`);
 log.push(`CONTROL RESP .. ${controlResponse()}%`);
 if(!state.imuOn) log.push("FLAG .......... SENSOR OFFLINE");
 else if(!state.connected) log.push("FLAG .......... STATE INPUT MISSING");
 else if(state.sensorDelay>30) log.push("FLAG .......... SENSOR DATA STALE");
 else if(state.controlDelay>35) log.push("FLAG .......... CONTROL RESPONSE LATE");
 else log.push("FLAGS ......... NONE");
 $("systemLog").textContent=log.join("\n");

 $("robot").style.transform=`translateX(-50%) rotate(${state.angle}deg)`;
}

function updatePhaseUI(){
 const p=phases[state.phase];
 $("phaseName").textContent=p.name;
 $("phaseGoal").textContent=p.goal;
 $("phaseCount").textContent=`${String(state.phase+1).padStart(2,"0")} / 08`;
 $("progressFill").style.width=`${(state.phase/7)*100}%`;
 $("instruction").innerHTML=instructions[state.phase];
 $("continueBtn").disabled=true;
 $("runTestBtn").disabled=false;

 $("sensorDelayControl").classList.toggle("locked", state.phase<4);
 $("controlDelayControl").classList.toggle("locked", state.phase<6);

 if(state.phase===0){
   $("runTestBtn").textContent="▶ RUN INITIAL TEST";
 }else{
   $("runTestBtn").textContent="▶ RUN STAND TEST";
 }

 if(state.phase===1 && state.draggedLeft && state.draggedRight) $("continueBtn").disabled=false;
 if(state.phase===2 && state.sawOff && state.sawOnAfterOff) $("continueBtn").disabled=false;
 if(state.phase===3 && state.connected) $("continueBtn").disabled=false;
 if(state.phase===4 && state.sensorDelay<=30) $("continueBtn").disabled=false;
 if(state.phase===5 && state.guidedPassed) $("continueBtn").disabled=false;
 if(state.phase===6 && state.transferPassed) $("continueBtn").disabled=false;
 if(state.phase===7){
   $("continueBtn").textContent="MISSION COMPLETE";
   $("continueBtn").disabled=false;
 }
 updateSignals();
}

function advance(){
 if(state.phase===0){
   state.phase=1;
 }else if(state.phase===1){
   state.phase=2;
 }else if(state.phase===2){
   state.phase=3;
 }else if(state.phase===3){
   showConcept(
     "STATE ESTIMATION",
     "L'IMU fournit une mesure. Le State Estimator transforme des mesures imparfaites et datées en un état utilisable par le contrôle. Tu viens de constater qu'un capteur peut parfaitement fonctionner alors que le robot ne sait toujours pas où il est."
   );
   return;
 }else if(state.phase===4){
   state.phase=5;
 }else if(state.phase===5){
   state.phase=6;
   injectTransfer();
 }else if(state.phase===6){
   state.phase=7;
 }else if(state.phase===7){
   localStorage.setItem("playlearn_rbt01_complete","true");
   $("completeModal").classList.remove("hidden");
   return;
 }
 updatePhaseUI();
}

function showConcept(title,text){
 $("conceptTitle").textContent=title;
 $("conceptText").textContent=text;
 $("conceptReveal").classList.remove("hidden");
}
$("conceptContinue").onclick=()=>{
 $("conceptReveal").classList.add("hidden");
 state.phase=4;
 updatePhaseUI();
};

function runTest(){
 state.testRuns++;
 $("failureStamp").classList.add("hidden");
 let pass=false, reason="";
 if(state.phase===0){
   pass=false;
   reason="The motors can produce force, but the controller has no usable body orientation.";
 }else{
   pass=standPass();
   if(!state.imuOn) reason="No IMU measurement reaches the state pipeline.";
   else if(!state.connected) reason="IMU raw data exists, but the estimator receives nothing.";
   else if(state.sensorDelay>30) reason="The orientation estimate is too stale for reliable balance.";
   else if(state.controlDelay>35) reason="The state estimate is healthy, but corrective control arrives too late.";
   else reason="Measurement, estimate, control and physical response are coherent.";
 }
 if(pass){
   $("resultBox").className="result pass";
   $("resultBox").innerHTML=`<strong>TEST PASSED · 30.0 s</strong><span>${reason}</span>`;
   state.angle=0;
   if(state.phase===5) state.guidedPassed=true;
   if(state.phase===6) state.transferPassed=true;
 }else{
   state.fails++;
   $("resultBox").className="result fail";
   $("resultBox").innerHTML=`<strong>TEST FAILED · ${(2.2+Math.random()*1.7).toFixed(2)} s</strong><span>${reason}</span>`;
   $("failureStamp").classList.remove("hidden");
   state.angle=state.angle>=0?15:-15;
 }
 updatePhaseUI();
 if(state.phase===0){
   setTimeout(()=>{
     $("continueBtn").disabled=false;
   },300);
 }
}

function injectTransfer(){
 state.controlDelay=68;
 $("controlDelay").value=68;
 $("resultBox").className="result neutral";
 $("resultBox").innerHTML="<strong>NEW FAULT INJECTED</strong><span>State confidence remains healthy. Something downstream is now late.</span>";
 updateSignals();
}

// Robot tilt interaction
const stage=$("stage"), robot=$("robot");
robot.addEventListener("pointerdown",e=>{
 if(state.phase<1) return;
 draggingRobot=true; startX=e.clientX; startAngle=state.angle; robot.setPointerCapture(e.pointerId);
});
robot.addEventListener("pointermove",e=>{
 if(!draggingRobot)return;
 state.angle=clamp(startAngle+(e.clientX-startX)*.13,-22,22);
 if(state.angle<-8) state.draggedLeft=true;
 if(state.angle>8) state.draggedRight=true;
 updatePhaseUI();
});
robot.addEventListener("pointerup",()=>draggingRobot=false);

// IMU power
$("imuPower").onclick=()=>{
 if(state.phase<2) return;
 state.imuOn=!state.imuOn;
 $("imuPower").textContent=state.imuOn?"ONLINE":"OFFLINE";
 $("imuPower").className=`toggle ${state.imuOn?"on":"off"}`;
 if(!state.imuOn) state.sawOff=true;
 if(state.imuOn && state.sawOff) state.sawOnAfterOff=true;
 updatePhaseUI();
};

// Sensor timing
$("sensorDelay").oninput=e=>{
 if(state.phase<4)return;
 state.sensorDelay=+e.target.value;
 updatePhaseUI();
};
$("controlDelay").oninput=e=>{
 if(state.phase<6)return;
 state.controlDelay=+e.target.value;
 updatePhaseUI();
};

// Drag plug to socket
const plug=$("plug"), socket=$("socket");
plug.addEventListener("pointerdown",e=>{
 if(state.phase!==3 || state.connected)return;
 draggingPlug=true; plug.setPointerCapture(e.pointerId); plug.style.cursor="grabbing";
});
plug.addEventListener("pointermove",e=>{
 if(!draggingPlug)return;
 const link=$("imuLink").getBoundingClientRect();
 let y=clamp(e.clientY-link.top,8,link.height-8);
 plug.style.top=`${y-8}px`;
});
plug.addEventListener("pointerup",e=>{
 if(!draggingPlug)return;
 draggingPlug=false;plug.style.cursor="grab";
 const sr=socket.getBoundingClientRect();
 const dist=Math.hypot(e.clientX-(sr.left+sr.width/2),e.clientY-(sr.top+sr.height/2));
 if(dist<55){
   state.connected=true;
   $("imuLink").classList.add("connected");
   plug.style.top="";
 }else{
   plug.style.top="11px";
 }
 updatePhaseUI();
});

// Coach
$("coachBtn").onclick=()=>{
 $("coachText").textContent=coachHints[state.phase];
 $("coachPanel").classList.remove("hidden");
};
$("closeCoach").onclick=()=>$("coachPanel").classList.add("hidden");

// Buttons
$("runTestBtn").onclick=runTest;
$("continueBtn").onclick=advance;
$("startBtn").onclick=()=>{
 $("intro").classList.add("hidden");
 $("game").classList.remove("hidden");
 updatePhaseUI();
};
$("resetBtn").onclick=()=>location.reload();

updateSignals();
