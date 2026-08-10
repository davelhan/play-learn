const $=id=>document.getElementById(id);

const phases=[
 {name:"HOOK",goal:"Observe the walking failure and confirm which systems are already healthy."},
 {name:"DISCOVER",goal:"Move the body relative to the stance foot and watch the center-of-mass projection."},
 {name:"MANIPULATE",goal:"Drag the next foot and see how a new support location changes recovery margin."},
 {name:"CAUSE / EFFECT",goal:"Change forward speed and watch the useful recovery zone move farther ahead."},
 {name:"NAME IT",goal:"Connect the phenomenon to Center of Mass, Support and Foot Placement."},
 {name:"GUIDED WALK",goal:"Place the next foot inside the useful recovery zone and pass the 10-meter walk."},
 {name:"TRANSFER",goal:"Carry an offset payload and adapt the step instead of blaming sensing."},
 {name:"COMPLETE",goal:"Lock Dynamic Balance Basics into the persistent robot."}
];

const instructions=[
 `<b>Run the initial walk.</b><br>Before changing anything, confirm that orientation, state confidence and control response are healthy.`,
 `<b>Shift the body.</b><br>Use BODY LEAN and watch the yellow CoM marker move relative to the green support area.`,
 `<b>Create a new support.</b><br>Drag the swing foot horizontally. Watch recovery margin improve when the new foot is placed where the moving body can be caught.`,
 `<b>Speed changes the problem.</b><br>Increase FORWARD SPEED. The recovery zone moves ahead because a faster body needs a more forward step in this simplified training model.`,
 `<b>You have already used the concepts.</b><br>Now the game gives names to what you observed.`,
 `<b>Walk 10 meters.</b><br>Set a realistic speed and place the swing foot inside the recovery zone, then run the test.`,
 `<b>New context: payload.</b><br>The IMU and estimator remain healthy. A load shifts the body's mass. Adapt body lean and foot placement, then retest.`,
 `<b>Mission complete.</b><br>Dynamic balance is now part of your persistent robot.`
];

const hints=[
 "Do not start with the IMU. State confidence is already 96%. First collect evidence from the failed walk.",
 "The yellow marker is the ground projection of the body's combined center of mass in this training model. Move BODY LEAN in both directions.",
 "The current stance foot can only support a limited region. A step creates a new support region. Drag the right foot toward the violet recovery zone.",
 "Keep foot position fixed, change only speed, and watch the recovery zone shift. One variable at a time makes causality easier to see.",
 "Static support and dynamic recovery are related but not identical. The next foot matters because the body is moving.",
 "You do not need a perfect number. You need a coherent relationship between speed, body state and where the foot lands.",
 "The new load changes mass distribution. Sensing still reports the state correctly; the plan must adapt to the changed state.",
 "The same state-estimation knowledge has now survived a different mission context. That's how mastery grows."
];

const S={
 phase:0,
 lean:0,
 speed:.6,
 payload:0,
 foot:22,
 initialSeen:false,
 leanLeft:false,
 leanRight:false,
 footMoved:false,
 speedLowSeen:false,
 speedHighSeen:false,
 guidedPassed:false,
 transferInjected:false,
 transferPassed:false,
 testRuns:0
};

let draggingFoot=false, startX=0, startFoot=0;

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function cmPos(){
 // Fictional training coordinate, centimeters relative to stance center
 return S.lean + S.payload*.55 + S.speed*8;
}
function targetPos(){
 // Simplified dynamic recovery target
 return 20 + S.speed*42 + Math.max(0,S.payload)*.45;
}
function placementError(){
 return Math.abs(S.foot-targetPos());
}
function supportMargin(){
 return Math.round(clamp(88-Math.abs(cmPos())*2.0,0,100));
}
function recoveryMargin(){
 const err=placementError();
 return Math.round(clamp(100-err*3.0-Math.abs(S.lean)*.6,0,100));
}
function pass(){
 const maxErr=S.phase===6?9:8;
 return placementError()<=maxErr && supportMargin()>=35 && S.speed>=.35 && S.speed<=1.05;
}
function stageX(cm){
 // Map cm to percent, stance around 40%
 return clamp(40 + cm*.5,14,86);
}
function footX(pos){
 return clamp(40 + pos*.5,18,88);
}
function render(){
 $("leanValue").textContent=`${S.lean>0?"+":""}${S.lean} cm`;
 $("speedValue").textContent=`${S.speed.toFixed(1)} m/s`;
 $("payloadValue").textContent=`${S.payload>0?"+":""}${S.payload} cm`;

 const cm=cmPos(), target=targetPos(), err=placementError();
 $("comValue").textContent=`${cm>=0?"+":""}${cm.toFixed(0)} cm`;
 $("placementError").textContent=`${err.toFixed(0)} cm`;
 $("supportMetric").textContent=`${supportMargin()}%`;
 $("recoveryMetric").textContent=`${recoveryMargin()}%`;
 $("targetMetric").textContent=`${err.toFixed(0)} cm`;

 $("comProjection").style.left=`${stageX(cm)}%`;
 $("captureArea").style.left=`${footX(target)}%`;
 $("stepTarget").style.left=`${footX(target)}%`;

 $("comBar").style.width=`${clamp(50+cm,4,96)}%`;
 $("placementBar").style.width=`${clamp(100-err*2.3,4,100)}%`;
 $("placementBar").style.background=err<=8?"var(--mint)":err<=18?"var(--warn)":"var(--bad)";

 // Move swing leg roughly with foot placement
 const px=(S.foot-22)*1.15;
 $("swingLeg").style.transform=`translateX(${px}px) rotate(${clamp(px*.06,-8,12)}deg)`;

 $("payloadBlock").classList.toggle("hidden",S.phase<6);
 $("payloadBlock").style.transform=`translateX(${S.payload*.5}px)`;

 const log=[
   "WALK SYSTEM",
   "IMU ........... HEALTHY",
   "STATE CONF .... 96%",
   "CONTROL RESP .. 91%",
   `CoM PROJ ....... ${cm>=0?"+":""}${cm.toFixed(0)} cm`,
   `STEP TARGET .... +${target.toFixed(0)} cm`,
   `FOOT ACTUAL .... +${S.foot.toFixed(0)} cm`,
   `RECOVERY ....... ${recoveryMargin()}%`
 ];
 if(err>18) log.push("FLAG .......... FOOT PLAN MISALIGNED");
 else if(supportMargin()<35) log.push("FLAG .......... SUPPORT MARGIN LOW");
 else log.push("FLAGS ......... NONE");
 $("systemLog").textContent=log.join("\n");

 if(S.phase>=2){
   $("planningCard").querySelector("small").textContent=err<=8?"ADAPTED":"NEEDS UPDATE";
   $("planningCard").className=`state-card ${err<=8?"healthy":"warning"}`;
 }

 updateContinue();
}

function updateContinue(){
 let ok=false;
 if(S.phase===0) ok=S.initialSeen;
 if(S.phase===1) ok=S.leanLeft&&S.leanRight;
 if(S.phase===2) ok=S.footMoved;
 if(S.phase===3) ok=S.speedLowSeen&&S.speedHighSeen;
 if(S.phase===4) ok=true;
 if(S.phase===5) ok=S.guidedPassed;
 if(S.phase===6) ok=S.transferPassed;
 if(S.phase===7) ok=true;
 $("continueBtn").disabled=!ok;
}

function phaseUI(){
 const p=phases[S.phase];
 $("phaseName").textContent=p.name;
 $("phaseGoal").textContent=p.goal;
 $("phaseCount").textContent=`${String(S.phase+1).padStart(2,"0")} / 08`;
 $("progressFill").style.width=`${(S.phase/7)*100}%`;
 $("instruction").innerHTML=instructions[S.phase];

 $("torsoControl").classList.toggle("locked",S.phase<1);
 $("speedControl").classList.toggle("locked",S.phase<3);
 $("payloadControl").classList.toggle("locked",S.phase<6);

 if(S.phase===0) $("runTestBtn").textContent="▶ RUN INITIAL WALK";
 else if(S.phase===6) $("runTestBtn").textContent="▶ RUN PAYLOAD WALK";
 else $("runTestBtn").textContent="▶ RUN WALK TEST";

 render();
}

function runTest(){
 S.testRuns++;
 $("fallStamp").classList.add("hidden");

 if(S.phase===0){
   S.initialSeen=true;
   $("resultBox").className="result fail";
   $("resultBox").innerHTML=`<strong>TEST FAILED · STEP 3</strong><span>Orientation estimate remains valid. The body moves beyond the useful support before the next foot adapts.</span>`;
   $("fallStamp").classList.remove("hidden");
   phaseUI();
   return;
 }

 const good=pass();
 if(good){
   $("resultBox").className="result pass";
   $("resultBox").innerHTML=`<strong>TEST PASSED · 10.0 m</strong><span>The new foot creates support where the moving body needs it.</span>`;
   if(S.phase===5)S.guidedPassed=true;
   if(S.phase===6)S.transferPassed=true;
 }else{
   const err=placementError();
   let why=err>8
     ?`The next foot is ${err.toFixed(0)} cm away from the useful recovery target.`
     :`Foot placement is close, but current body/support conditions still leave too little margin.`;
   $("resultBox").className="result fail";
   $("resultBox").innerHTML=`<strong>TEST FAILED · RECOVERY LOST</strong><span>${why}</span>`;
   $("fallStamp").classList.remove("hidden");
 }
 phaseUI();
}

function advance(){
 if(S.phase===0)S.phase=1;
 else if(S.phase===1)S.phase=2;
 else if(S.phase===2)S.phase=3;
 else if(S.phase===3)S.phase=4;
 else if(S.phase===4){
   showConcept();
   return;
 }else if(S.phase===5){
   S.phase=6;
   injectTransfer();
 }else if(S.phase===6)S.phase=7;
 else if(S.phase===7){
   localStorage.setItem("playlearn_rbt02_complete","true");
   $("completeModal").classList.remove("hidden");
   return;
 }
 phaseUI();
}

function showConcept(){
 $("conceptTitle").textContent="CENTER OF MASS + FOOT PLACEMENT";
 $("conceptText").textContent="Le Center of Mass (CoM) résume où se trouve la masse combinée du robot. Sa projection au sol doit rester compatible avec les contacts actuels — ou le robot doit créer un nouveau contact. En marche, le prochain pied est donc un outil de récupération : il crée un nouveau support là où le corps est en train d'aller.";
 $("conceptReveal").classList.remove("hidden");
}
$("conceptContinue").onclick=()=>{
 $("conceptReveal").classList.add("hidden");
 S.phase=5;
 phaseUI();
};

function injectTransfer(){
 S.payload=22;
 S.lean=0;
 S.speed=.65;
 // Keep prior foot position to make previous solution wrong
 $("payload").value=S.payload;
 $("bodyLean").value=S.lean;
 $("speed").value=Math.round(S.speed*100);
 $("resultBox").className="result neutral";
 $("resultBox").innerHTML=`<strong>NEW CONTEXT · OFFSET PAYLOAD</strong><span>Sensing is still healthy. The load shifts mass distribution, so your previous step is no longer optimal.</span>`;
}

// sliders
$("bodyLean").oninput=e=>{
 if(S.phase<1)return;
 S.lean=+e.target.value;
 if(S.lean<-8)S.leanLeft=true;
 if(S.lean>8)S.leanRight=true;
 render();
};
$("speed").oninput=e=>{
 if(S.phase<3)return;
 S.speed=+e.target.value/100;
 if(S.speed<.45)S.speedLowSeen=true;
 if(S.speed>1.0)S.speedHighSeen=true;
 render();
};
$("payload").oninput=e=>{
 if(S.phase<6)return;
 S.payload=+e.target.value;
 render();
};

// drag swing foot horizontally
const foot=$("swingFoot");
foot.addEventListener("pointerdown",e=>{
 if(S.phase<2)return;
 draggingFoot=true;startX=e.clientX;startFoot=S.foot;foot.setPointerCapture(e.pointerId);
});
foot.addEventListener("pointermove",e=>{
 if(!draggingFoot)return;
 S.foot=clamp(startFoot+(e.clientX-startX)*.28,-12,92);
 if(Math.abs(S.foot-22)>8)S.footMoved=true;
 render();
});
foot.addEventListener("pointerup",()=>draggingFoot=false);

// controls
$("runTestBtn").onclick=runTest;
$("continueBtn").onclick=advance;
$("coachBtn").onclick=()=>{
 $("coachText").textContent=hints[S.phase];
 $("coachPanel").classList.remove("hidden");
};
$("closeCoach").onclick=()=>$("coachPanel").classList.add("hidden");
$("resetBtn").onclick=()=>{
 const progressed=S.phase>0||S.testRuns>0;
 if(!progressed||window.confirm("Reset this mission and lose the current attempt?"))location.reload();
};
$("startBtn").onclick=()=>{
 $("intro").classList.add("hidden");
 $("game").classList.remove("hidden");
 phaseUI();
};

phaseUI();
