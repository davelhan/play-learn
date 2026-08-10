const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* QA3: robust guided mission. No hidden progression conditions. */
const Q={
 phase:0, angle:0, imu:true, connected:false, sensor:85, control:18,
 left:false,right:false,off:false,onAgain:false,stand1:false,stand2:false,
 dragging:false,startX:0,startAngle:0,busy:false
};

const PH=[
 ["HOOK","Observe the failure before attempting a fix.","Run the initial test. Do not change anything yet.","RUN INITIAL TEST"],
 ["DISCOVER","Compare physical orientation with the IMU measurement.","Move the body to -12° and +12°. Use the buttons or drag the torso.","TILT LEFT, THEN RIGHT"],
 ["MANIPULATE","Isolate what the IMU contributes.","Switch the IMU OFF, observe the signal loss, then restore it ONLINE.","IMU OFF, THEN ONLINE"],
 ["CONNECT","Repair the missing information path.","The IMU is healthy but State Estimation has NO INPUT. Connect them.","CONNECT IMU → ESTIMATOR"],
 ["CAUSE / EFFECT","Make the estimate timely enough to use.","Reduce SENSOR DATA AGE to 30 ms or less.","SENSOR DATA AGE ≤ 30 ms"],
 ["GUIDED TEST","Verify the repaired sensing chain.","Run STAND TEST.","RUN STAND TEST"],
 ["TRANSFER","Repair a different downstream fault.","State Estimation is healthy. Reduce CONTROL LATENCY to 35 ms or less, then test.","CONTROL LATENCY ≤ 35 ms → TEST"],
 ["COMPLETE","Orientation stack validated.","You diagnosed sensing, estimation and control as different layers.","ORIENTATION STACK INSTALLED"]
];

function injectQAUI(){
 const s=document.createElement("style");
 s.textContent=`
 .qa-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
 .qa-actions button{flex:1;min-width:92px;background:#172129;color:#eef4f7;border:1px solid #38505d}
 .qa-actions button.primary-action{background:#8ff0c9;color:#07120e;border-color:#8ff0c9;font-weight:900}
 .qa-actions button:disabled{opacity:.3}
 .qa-note{font-size:9px;color:#8e9ba6;margin-top:8px;line-height:1.4}
 .qa-active{box-shadow:0 0 0 1px #8ff0c9,0 0 22px #8ff0c91e!important}
 .robot{scale:.88;transform-origin:50% 100%}
 .grab-label{left:76px!important;top:150px!important;width:118px;text-align:center;color:#8ff0c9!important}
 .failure-stamp{right:28px!important;top:24px!important}
 @media(max-width:900px){.robot{scale:.78}}
 `;
 document.head.appendChild(s);
 let box=$("taskStatus");
 if(box&&!$("qaActions")){
   const d=document.createElement("div"); d.id="qaActions"; d.className="qa-actions"; box.appendChild(d);
   const n=document.createElement("div"); n.id="qaNote"; n.className="qa-note"; box.appendChild(n);
 }
}

function confidence(){return (!Q.imu||!Q.connected)?0:Math.round(clamp(105-Q.sensor*1.05,8,100))}
function response(){return Math.round(clamp(112-Q.control*1.1,10,100))}
function estimate(){if(!Q.imu||!Q.connected)return null;return Q.angle*clamp(1-Q.sensor/150,.15,.97)}
function norm(a){return clamp(50+a*2.2,4,96)}
function pass(){return Q.imu&&Q.connected&&Q.sensor<=30&&Q.control<=35}

function signalUI(){
 $("actualAngle").textContent=Q.angle.toFixed(1)+"°"; $("actualBar").style.width=norm(Q.angle)+"%";
 if(Q.imu){$("imuAngle").textContent=Q.angle.toFixed(1)+"°";$("imuAngle").className="";$("imuBar").style.width=norm(Q.angle)+"%"}
 else{$("imuAngle").textContent="NO SIGNAL";$("imuAngle").className="bad";$("imuBar").style.width="4%"}
 const e=estimate();
 if(e===null){$("estimatedAngle").textContent="UNKNOWN";$("estimatedAngle").className="bad";$("estimateBar").style.width="4%"}
 else{$("estimatedAngle").textContent=e.toFixed(1)+"°";$("estimatedAngle").className="";$("estimateBar").style.width=norm(e)+"%"}
 $("stateConfidence").textContent=confidence()+"%"; $("controlResponse").textContent=response()+"%";
 $("balanceMargin").textContent=Math.round(clamp(.58*confidence()+.42*response()-Math.abs(Q.angle),0,100))+"%";
 $("delayValue").textContent=Q.sensor+" ms"; $("controlDelayValue").textContent=Q.control+" ms";
 $("imuPower").textContent=Q.imu?"ONLINE":"OFFLINE"; $("imuPower").className="toggle "+(Q.imu?"on":"off");
 $("imuNodeState").textContent=Q.imu?"RAW DATA OK":"OFFLINE";
 $("estNodeState").textContent=!Q.connected?"NO INPUT":Q.sensor>30?"STALE · "+Q.sensor+" ms":"STATE VALID";
 $("controlNodeState").textContent=confidence()<50?"WAITING FOR STATE":Q.control>35?"LATE · "+Q.control+" ms":"TRACKING";
 $("robot").style.transform=`translateX(-50%) rotate(${Q.angle}deg)`;
 $("systemLog").textContent=[
  "SYSTEM LIVE","IMU ........... "+(Q.imu?"ONLINE":"OFFLINE"),
  "IMU→EST ...... "+(Q.connected?"CONNECTED":"OPEN CIRCUIT"),
  "DATA AGE ...... "+(Q.connected?Q.sensor+" ms":"N/A"),
  "STATE CONF .... "+confidence()+"%","CONTROL RESP .. "+response()+"%",
  !Q.imu?"FLAG .......... SENSOR OFFLINE":!Q.connected?"FLAG .......... STATE INPUT MISSING":Q.sensor>30?"FLAG .......... SENSOR DATA STALE":Q.control>35?"FLAG .......... CONTROL RESPONSE LATE":"FLAGS ......... NONE"
 ].join("\n");
}

function checklist(){
 let items=[];
 if(Q.phase===0)items=[["Run initial test",false]];
 if(Q.phase===1)items=[["Tilt to -12°",Q.left],["Tilt to +12°",Q.right]];
 if(Q.phase===2)items=[["Switch IMU OFF",Q.off],["Restore IMU ONLINE",Q.onAgain]];
 if(Q.phase===3)items=[["Connect IMU to estimator",Q.connected]];
 if(Q.phase===4)items=[["Sensor data age ≤ 30 ms",Q.sensor<=30]];
 if(Q.phase===5)items=[["Pass STAND TEST",Q.stand1]];
 if(Q.phase===6)items=[["Control latency ≤ 35 ms",Q.control<=35],["Pass STAND TEST",Q.stand2]];
 if(Q.phase===7)items=[["Orientation stack installed",true]];
 $("taskChecklist").innerHTML=items.map(([t,d])=>`<div class="check-item ${d?"done":""}"><i>${d?"✓":"○"}</i><span>${t}</span></div>`).join("");
}

function button(label,fn,primary=false,disabled=false){
 const b=document.createElement("button"); b.type="button"; b.textContent=label;
 if(primary)b.classList.add("primary-action"); b.disabled=disabled; b.onclick=fn; return b;
}
function actions(){
 const a=$("qaActions"); if(!a)return; a.innerHTML="";
 const note=$("qaNote"); note.textContent="";
 if(Q.phase===0)a.append(button("▶ RUN INITIAL TEST",runTest,true));
 if(Q.phase===1){
   a.append(button("TILT LEFT -12°",()=>setAngle(-12),!Q.left));
   a.append(button("TILT RIGHT +12°",()=>setAngle(12),Q.left&&!Q.right));
   note.textContent="You can also drag the torso. Both directions must be observed.";
 }
 if(Q.phase===2){
   a.append(button(Q.imu?"SWITCH IMU OFF":"RESTORE IMU ONLINE",toggleIMU,true));
   note.textContent=Q.off&&!Q.onAgain?"Now restore the same sensor and compare the signals.":"Observe which value disappears while the physical angle still exists.";
 }
 if(Q.phase===3){a.append(button("CONNECT IMU → ESTIMATOR",connect,true));note.textContent="This is the broken information path shown in the right panel."}
 if(Q.phase===4){a.append(button("SET TO 30 ms",()=>setSensor(30),true,Q.sensor<=30));note.textContent="You can also use the slider."}
 if(Q.phase===5)a.append(button("▶ RUN STAND TEST",runTest,true));
 if(Q.phase===6){if(Q.control>35)a.append(button("SET CONTROL TO 35 ms",()=>setControl(35),true));else a.append(button("▶ RUN STAND TEST",runTest,true));}
}

function render(){
 const [n,g,ins,next]=PH[Q.phase];
 $("phaseName").textContent=n;$("phaseGoal").textContent=g;$("instruction").innerHTML="<b>"+ins+"</b>";
 $("nextActionTitle").textContent=next;$("phaseCount").textContent=String(Q.phase+1).padStart(2,"0")+" / 08";
 $("progressFill").style.width=(Q.phase/7*100)+"%";
 $("sensorDelayControl").classList.toggle("locked",Q.phase!==4);
 $("controlDelayControl").classList.toggle("locked",Q.phase!==6);
 $("imuPowerControl").classList.toggle("locked",Q.phase!==2);
 $("runTestBtn").disabled=![0,5,6].includes(Q.phase);
 $("runTestBtn").textContent=Q.phase===0?"▶ RUN INITIAL TEST":"▶ RUN STAND TEST";
 $("grab-label").classList.toggle("hidden",Q.phase!==1);
 document.querySelectorAll(".qa-active").forEach(x=>x.classList.remove("qa-active"));
 if(Q.phase===1)$("robot").classList.add("qa-active");
 if(Q.phase===2)$("imuPowerControl").classList.add("qa-active");
 if(Q.phase===3)$("imuLink").classList.add("qa-active");
 if(Q.phase===4)$("sensorDelayControl").classList.add("qa-active");
 if(Q.phase===6)$("controlDelayControl").classList.add("qa-active");
 checklist();actions();signalUI();
}

function next(p,msg){if(Q.busy)return;Q.busy=true;if(msg){$("resultBox").className="result pass";$("resultBox").innerHTML=`<strong>${msg}</strong><span>Next step loaded automatically.</span>`}setTimeout(()=>{Q.phase=p;Q.busy=false;render()},350)}
function setAngle(v){Q.angle=v;if(v<=-8)Q.left=true;if(v>=8)Q.right=true;render();if(Q.left&&Q.right)setTimeout(()=>next(2,"MEASUREMENT OBSERVED"),220)}
function toggleIMU(){if(Q.phase!==2)return;Q.imu=!Q.imu;if(!Q.imu)Q.off=true;if(Q.imu&&Q.off)Q.onAgain=true;render();if(Q.off&&Q.onAgain)setTimeout(()=>next(3,"SENSOR CONTRIBUTION ISOLATED"),220)}
function connect(){if(Q.phase!==3)return;Q.connected=true;$("imuLink").classList.add("connected");render();setTimeout(()=>next(4,"INFORMATION PATH RESTORED"),220)}
function setSensor(v){Q.sensor=+v;$("sensorDelay").value=Q.sensor;render();if(Q.phase===4&&Q.sensor<=30)setTimeout(showConcept,300)}
function setControl(v){Q.control=+v;$("controlDelay").value=Q.control;render()}

function showConcept(){if(Q.busy)return;Q.busy=true;$("conceptTitle").textContent="STATE ESTIMATION";$("conceptText").textContent="The IMU provides a measurement. State Estimation turns measurements into a usable estimate of the robot's state. A healthy sensor can still fail to help if its data is disconnected or too old.";$("conceptReveal").classList.remove("hidden")}
$("conceptContinue").onclick=()=>{$("conceptReveal").classList.add("hidden");Q.busy=false;Q.phase=5;render()};

function runTest(){
 if(Q.phase===0){Q.angle=15;$("failureStamp").classList.remove("hidden");$("resultBox").className="result fail";$("resultBox").innerHTML="<strong>TEST FAILED · 2.84 s</strong><span>Motors are online, but BASE ORIENTATION is unavailable.</span>";signalUI();setTimeout(()=>next(1,"FAILURE CAPTURED"),450);return}
 if(![5,6].includes(Q.phase))return;
 if(pass()){
   $("failureStamp").classList.add("hidden");Q.angle=0;$("resultBox").className="result pass";$("resultBox").innerHTML="<strong>TEST PASSED · 30.0 s</strong><span>Measurement, estimate, control and motors are coherent.</span>";
   if(Q.phase===5){Q.stand1=true;render();setTimeout(()=>{Q.phase=6;Q.control=68;$("controlDelay").value=68;render();$("resultBox").className="result neutral";$("resultBox").innerHTML="<strong>NEW FAULT INJECTED</strong><span>State Estimation remains healthy. CONTROL RESPONSE is now late.</span>"},600)}
   else{Q.stand2=true;render();setTimeout(()=>{Q.phase=7;render();localStorage.setItem("playlearn_rbt01_complete","true");$("completeModal").classList.remove("hidden")},600)}
 }else{$("failureStamp").classList.remove("hidden");$("resultBox").className="result fail";$("resultBox").innerHTML="<strong>TEST FAILED</strong><span>Follow the highlighted next action. No guessing required.</span>";render()}
}

function startMission(){$("intro").classList.add("hidden");$("game").classList.remove("hidden");render()}
injectQAUI();
$("startBtn").onclick=startMission;$("runTestBtn").onclick=runTest;$("imuPower").onclick=toggleIMU;
$("sensorDelay").oninput=e=>setSensor(e.target.value);$("controlDelay").oninput=e=>setControl(e.target.value);
$("coachBtn").onclick=()=>{$("coachText").textContent=PH[Q.phase][2];$("coachPanel").classList.remove("hidden")};$("closeCoach").onclick=()=>$("coachPanel").classList.add("hidden");$("resetBtn").onclick=()=>location.reload();
const robot=$("robot");robot.addEventListener("pointerdown",e=>{if(Q.phase!==1)return;Q.dragging=true;Q.startX=e.clientX;Q.startAngle=Q.angle;robot.setPointerCapture(e.pointerId)});robot.addEventListener("pointermove",e=>{if(!Q.dragging)return;setAngle(clamp(Q.startAngle+(e.clientX-Q.startX)*.12,-22,22))});robot.addEventListener("pointerup",()=>Q.dragging=false);
$("plug").onclick=()=>{if(Q.phase===3)connect()};$("socket").onclick=()=>{if(Q.phase===3)connect()};
render();