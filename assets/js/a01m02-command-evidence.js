const $=id=>document.getElementById(id);
const PHASES=[
  {name:'HOOK',goal:'Send a valid task downward and watch it reach the physical plant.',action:'Send the planned mission into the architecture.',watch:['The command changes form as it moves downward','No evidence is returning yet','The world is initially clear']},
  {name:'COMMAND FLOW',goal:'Follow the downward command path one layer at a time.',action:'Pulse the command through each remaining layer. Read the message before moving on.',watch:['Mission intent becomes behavior','Behavior becomes desired motion','Desired motion becomes real-time control']},
  {name:'DISTURBANCE',goal:'See what happens when reality changes but evidence cannot return.',action:'Start execution with EVIDENCE RETURN still OFF.',watch:['The physical world changes first','Upper layers keep believing the old state','A valid old command becomes wrong']},
  {name:'EVIDENCE RETURN',goal:'Let reality travel back upward.',action:'Enable EVIDENCE RETURN, then pulse the new information upward one layer at a time.',watch:['Contact/status becomes a usable state','The motion plan is invalidated','Behavior learns it cannot continue']},
  {name:'CLOSED LOOP',goal:'Use returned evidence to create a new command.',action:'Replan from the updated state and send the corrected command downward.',watch:['Evidence changes the decision','A new command descends','The robot completes the task on a new path']},
  {name:'TRANSFER',goal:'Apply the same two-way logic to a different physical fault.',action:'Follow a thermal derate upward, then watch a reduced-speed command travel back down.',watch:['Fault/status travels upward','Planning changes because available torque changed','The response command travels downward']}
];
const COMMANDS=[
 'MISSION: case → Station C',
 'BEHAVIOR: pick → carry → place',
 'STATE TARGET: case held, route clear',
 'MOTION: walk route A while carrying',
 'CONTROL: track planned joints / balance',
 'ACTUATION: apply joint torque'
];
const EVIDENCE=[
 'MISSION: alternate route still satisfies goal',
 'BEHAVIOR STATUS: current route cannot continue',
 'STATE: obstacle blocks route A',
 'PLAN STATUS: route A invalid',
 'CONTROL STATUS: forward motion blocked',
 'CONTACT: unexpected obstruction'
];
const S={phase:0,cmdIndex:0,evIndex:5,evidenceOn:false,busy:false,transferStep:0};

function renderPhase(){
 const p=PHASES[S.phase];
 $('phaseName').textContent=p.name;
 $('phaseGoal').textContent=p.goal;
 $('phaseCount').textContent=`${String(S.phase+1).padStart(2,'0')} / 06`;
 $('progressFill').style.width=`${(S.phase/5)*100}%`;
 $('actionText').textContent=p.action;
 $('watchList').innerHTML=p.watch.map(x=>`<div class="watch-item"><i>·</i><span>${x}</span></div>`).join('');
}
function clearLayerClasses(){document.querySelectorAll('.bi-layer').forEach(n=>n.classList.remove('command-live','evidence-live'));}
function setCommand(i,text,done=true){$(`cmd${i}`).textContent=text;const layer=document.querySelector(`.bi-layer[data-layer="${i}"]`);if(done)layer.classList.add('command-done');}
function setEvidence(i,text,done=true){$(`ev${i}`).textContent=text;const layer=document.querySelector(`.bi-layer[data-layer="${i}"]`);if(done)layer.classList.add('evidence-done');}
function pulseCommand(i){clearLayerClasses();document.querySelector(`.bi-layer[data-layer="${i}"]`).classList.add('command-live');setCommand(i,COMMANDS[i]);}
function pulseEvidence(i){clearLayerClasses();document.querySelector(`.bi-layer[data-layer="${i}"]`).classList.add('evidence-live');setEvidence(i,EVIDENCE[i]);}
function log(lines){$('log').textContent=lines.join('\n');}
function result(kind,title,text){$('result').className=`result ${kind}`;$('result').innerHTML=`<b>${title}</b><span>${text}</span>`;}
function showReflection(saw,why,next){
 $('reflectionSaw').textContent=saw;$('reflectionWhy').textContent=why;$('reflection').classList.remove('hidden');
 $('reflectionContinue').onclick=()=>{$('reflection').classList.add('hidden');S.phase=next;renderPhase();configureAction();};
}
function belief({physical,estimate,plan,behavior}){
 $('physicalTruth').textContent=physical;$('estimatedTruth').textContent=estimate;$('planTruth').textContent=plan;$('behaviorTruth').textContent=behavior;
 ['physicalTruth','estimatedTruth','planTruth','behaviorTruth'].forEach(id=>$(id).classList.remove('truth','conflict'));
 if(physical.includes('BLOCKED'))$('physicalTruth').classList.add('conflict'); else $('physicalTruth').classList.add('truth');
 if(estimate.includes('CLEAR')&&physical.includes('BLOCKED'))$('estimatedTruth').classList.add('conflict'); else if(!estimate.includes('—'))$('estimatedTruth').classList.add('truth');
 if(plan.includes('INVALID'))$('planTruth').classList.add('conflict'); else if(!plan.includes('—'))$('planTruth').classList.add('truth');
}
function configureAction(){
 const b=$('mainAction');b.disabled=false;
 if(S.phase===0){b.textContent='SEND MISSION COMMAND';b.onclick=startCommand;}
 if(S.phase===1){b.textContent='PULSE COMMAND ↓';b.onclick=stepCommand;}
 if(S.phase===2){b.textContent='START EXECUTION';b.onclick=runBlind;}
 if(S.phase===3){b.textContent=S.evidenceOn?'PULSE EVIDENCE ↑':'ENABLE EVIDENCE RETURN';b.onclick=S.evidenceOn?stepEvidence:enableEvidence;}
 if(S.phase===4){b.textContent='REPLAN FROM UPDATED STATE';b.onclick=replan;}
 if(S.phase===5){b.textContent='OPEN TRANSFER';b.onclick=()=>{$('transferModal').classList.remove('hidden');};}
}
function startCommand(){
 S.cmdIndex=0;pulseCommand(0);$('commandChannelState').textContent='COMMAND IN FLIGHT';
 log(['MISSION ......... SENT','COMMAND PATH .... LAYER 01','EVIDENCE RETURN . OFF','WORLD ........... CLEAR']);
 result('pass','MISSION ACCEPTED','The high-level goal exists, but the body still has no executable command.');
 setTimeout(()=>showReflection('The mission exists at the top of the stack, while the physical plant still has nothing useful to execute.','A high-level goal must be transformed as it moves downward.',1),450);
}
function stepCommand(){
 if(S.busy)return;S.busy=true;S.cmdIndex++;if(S.cmdIndex>5){S.busy=false;return;}pulseCommand(S.cmdIndex);
 $('commandChannelState').textContent=`LAYER ${String(S.cmdIndex+1).padStart(2,'0')}`;
 log(['MISSION ......... ACTIVE',`COMMAND PATH .... LAYER ${String(S.cmdIndex+1).padStart(2,'0')}`,'EVIDENCE RETURN . OFF','WORLD ........... CLEAR']);
 const last=S.cmdIndex===5;result('pass',last?'COMMAND REACHED BODY':'COMMAND TRANSFORMED',COMMANDS[S.cmdIndex]);
 setTimeout(()=>{S.busy=false;if(last)showReflection('The same mission became behavior, state target, motion and finally an actuator-level command.','Commands move toward the physical plant, becoming more specific as they descend.',2);},360);
}
function runBlind(){
 $('world').classList.add('blocked');$('obstacle').classList.remove('hidden');$('worldStatus').textContent='WORLD: ROUTE A BLOCKED';
 belief({physical:'ROUTE A BLOCKED',estimate:'ROUTE A CLEAR',plan:'VALID',behavior:'EXECUTING'});setEvidence(5,'CONTACT: HIGH / MOTION BLOCKED',false);
 log(['EXECUTION ....... STARTED','CONTACT ......... BLOCKED','EVIDENCE RETURN . OFF','UPPER STATE ..... STILL CLEAR']);
 result('fail','REALITY CHANGED','The body is blocked, but the upper architecture still believes Route A is clear.');
 $('keyIdea').textContent='Without returned evidence, a controller or planner can keep acting on a state that is already false.';
 setTimeout(()=>showReflection('The physical world says BLOCKED while the estimated state still says CLEAR.','Reality can change after a command is sent. A one-way architecture becomes blind.',3),500);
}
function enableEvidence(){
 S.evidenceOn=true;$('evidenceToggle').classList.remove('off');$('evidenceToggle').classList.add('on');$('evidenceToggle').textContent='ON';
 $('mainAction').textContent='PULSE EVIDENCE ↑';$('mainAction').onclick=stepEvidence;S.evIndex=5;pulseEvidence(5);
 log(['CONTACT ......... BLOCKED','EVIDENCE RETURN . ON','RETURN PATH ..... LAYER 06','UPPER STATE ..... UPDATING']);result('pass','RETURN CHANNEL OPEN','Physical evidence can now travel upward.');
}
function stepEvidence(){
 if(S.busy)return;S.busy=true;if(S.evIndex===5)S.evIndex=4;else S.evIndex--;if(S.evIndex<0){S.busy=false;return;}pulseEvidence(S.evIndex);
 if(S.evIndex<=4)belief({physical:'ROUTE A BLOCKED',estimate:S.evIndex<=2?'ROUTE A BLOCKED':'UPDATING',plan:S.evIndex<=3?'INVALID':'VALID',behavior:S.evIndex<=1?'CANNOT CONTINUE':'EXECUTING'});
 log(['WORLD ........... ROUTE A BLOCKED','EVIDENCE RETURN . ON',`RETURN PATH ..... LAYER ${String(S.evIndex+1).padStart(2,'0')}`,S.evIndex<=3?'PLAN ............ INVALID':'PLAN ............ VALID']);
 result('pass','EVIDENCE MOVED UP',EVIDENCE[S.evIndex]);const done=S.evIndex===0;
 setTimeout(()=>{S.busy=false;if(done){$('conceptModal').classList.remove('hidden');$('mainAction').disabled=true;}},360);
}
$('conceptContinue').onclick=()=>{$('conceptModal').classList.add('hidden');S.phase=4;renderPhase();configureAction();};
function replan(){
 result('pass','NEW DECISION','Returned evidence changes the plan. Route B is selected.');$('keyIdea').textContent='Closed-loop behavior is not “command once and hope”. Evidence changes the next command.';
 let i=0;const sequence=[['cmd0','MISSION: case → Station C'],['cmd1','BEHAVIOR: use alternate route B'],['cmd2','STATE TARGET: obstacle avoided'],['cmd3','MOTION: walk route B'],['cmd4','CONTROL: track revised motion'],['cmd5','ACTUATION: execute revised command']];
 const timer=setInterval(()=>{clearLayerClasses();const id=sequence[i][0],idx=Number(id.slice(3));$(id).textContent=sequence[i][1];document.querySelector(`.bi-layer[data-layer="${idx}"]`).classList.add('command-live');i++;
   if(i>=sequence.length){clearInterval(timer);$('world').classList.remove('blocked');$('world').classList.add('recovered');$('worldStatus').textContent='WORLD: TASK COMPLETE';$('obstacle').classList.add('hidden');
    belief({physical:'TASK COMPLETE',estimate:'TASK COMPLETE',plan:'ROUTE B COMPLETE',behavior:'SUCCESS'});log(['REPLAN .......... ROUTE B','COMMAND PATH .... COMPLETE','TASK ............ SUCCESS','LOOP ............ CLOSED']);
    result('pass','TASK COMPLETE','Evidence returned upward, changed the decision, and a corrected command traveled back down.');
    setTimeout(()=>showReflection('The obstacle generated evidence upward. That evidence changed planning. A new command then traveled downward.','The architecture is a loop between intention and reality, not a one-way pipeline.',5),550);}},300);
}
function resetTransfer(){S.transferStep=0;$('transferAction').textContent='RUN RETURN FLOW';$('transferExplanation').classList.add('hidden');$('transferExplanation').textContent='';}
$('transferAction').onclick=()=>{
 if(S.transferStep===0){S.transferStep=1;$('transferExplanation').classList.remove('hidden');$('transferExplanation').innerHTML='<b>UPWARD:</b> Motor temperature / available torque is status evidence. It must reach state, planning and behavior before the robot can adapt.';$('transferAction').textContent='RUN RESPONSE FLOW';}
 else if(S.transferStep===1){S.transferStep=2;$('transferExplanation').innerHTML='<b>DOWNWARD:</b> Planning chooses a slower motion. The revised motion/control command then travels back toward the actuators.';$('transferAction').textContent='READ & COMPLETE 01.02';}
 else{$('transferModal').classList.add('hidden');$('completeModal').classList.remove('hidden');localStorage.setItem('playlearn_a01m02_complete','true');}
};
$('evidenceToggle').onclick=()=>{if(S.phase!==3)return;if(!S.evidenceOn)enableEvidence();};
$('startBtn').onclick=()=>{$('intro').classList.add('hidden');$('game').classList.remove('hidden');renderPhase();configureAction();};
$('resetBtn').onclick=()=>location.reload();$('replayBtn').onclick=()=>location.reload();
$('coachBtn').onclick=()=>{const hints=['First watch only the direction of the command. It becomes more specific as it moves toward hardware.','Read the command on each layer before pulsing again. The content changes, but the direction stays downward.','Compare PHYSICAL WORLD with ESTIMATED STATE. They disagree because evidence return is still off.','Do not jump to replanning yet. First let the new physical information travel upward.','The key moment is the turn: evidence went up, then a revised command comes back down.','Thermal derating is a different event, but the architecture still uses the same two directions.'];$('coachText').textContent=hints[S.phase];$('coachPanel').classList.remove('hidden');};
$('closeCoach').onclick=()=>$('coachPanel').classList.add('hidden');
renderPhase();configureAction();resetTransfer();