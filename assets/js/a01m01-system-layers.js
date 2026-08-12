const $=id=>document.getElementById(id);

const S={phase:0,traceIndex:0,faults:new Set(),transferRun:false,lessonNext:null};
const PH=[
  {name:'HOOK',goal:'Discover why mission intent cannot directly drive motors.',action:'Try the shortcut: send the mission sentence directly to the motors.',watch:['The motors are powered','The mission is understandable to a human','The motors cannot interpret the sentence']},
  {name:'TRACE',goal:'Follow how the same intent is transformed layer by layer.',action:'Process the active layer, then read its INPUT and OUTPUT before moving down.',watch:['The overall mission intent stays the same','The form of the information changes at every layer','The final layer acts on the physical world']},
  {name:'COMPARE',goal:'See how removing different functions stops the chain at different points.',action:'Run both controlled experiments and compare how far the information travels.',watch:['Without a usable state, no reliable motion can be planned','Without real-time control, a plan can exist without being executed','A visible downstream failure can have an upstream cause']},
  {name:'TRANSFER',goal:'Verify that the same architecture can serve a new mission.',action:'Load a new task and observe which representations change without changing the architecture.',watch:['The six roles stay the same','Message content changes with the mission','The architecture is reusable']},
  {name:'COMPLETE',goal:'Lock in the six-layer mental model.',action:'Mission complete.',watch:['Mission → Behavior → State → Motion → Control → Physical action']}
];

const LAYERS={
  1:{name:'TASK AUTONOMY / BEHAVIOR',input:'GOAL + CONSTRAINTS: case must reach Station B',output:'SUBGOALS: approach → grasp → carry → place',readout:'APPROACH · GRASP · CARRY · PLACE',idea:'The behavior layer transforms an expected outcome into a sequence of actions.'},
  2:{name:'PERCEPTION / STATE ESTIMATION',input:'SUBGOALS + sensor measurements',output:'USABLE STATE: case pose · Station B pose · robot state · obstacles',readout:'WORLD + BODY STATE VALID',idea:'The robot needs a usable state before it can compute how to move.'},
  3:{name:'MOTION GENERATION / PLANNING',input:'SUBGOALS + usable state',output:'DESIRED MOTION: base path + arm / hand trajectory',readout:'PATH + TRAJECTORY READY',idea:'Planning transforms a goal into geometrically feasible motion.'},
  4:{name:'REAL-TIME CONTROL',input:'DESIRED MOTION + current state',output:'FAST CORRECTIONS: joint targets · torque / motor commands',readout:'MOTOR COMMANDS STREAMING',idea:'Control continuously compares desired motion with what is actually happening.'},
  5:{name:'PHYSICAL PLANT / ENERGY',input:'MOTOR COMMANDS + available energy',output:'PHYSICAL ACTION: force → contact → body and case move',readout:'CASE DELIVERED',idea:'The final layer is physical: energy, actuators, mechanics and contacts produce real motion.'}
};

const HINTS=[
  'The shortcut is deliberate. Ask yourself whether a motor knows what “Station B” means.',
  'Do not try to memorize the names. Focus on how one layer’s OUTPUT becomes the next layer’s INPUT.',
  'Both experiments keep many things healthy. Compare only where the chain stops.',
  'The new task changes the content, not the six fundamental system functions.',
  'Read the chain like a sentence: define → decide → know → plan → correct → act.'
];

function renderWatch(){
  const items=PH[S.phase].watch;
  let seen=[false,false,false];
  if(S.phase===0)seen=[true,true,false];
  if(S.phase===1)seen=[S.traceIndex>=2,S.traceIndex>=3,S.traceIndex>=5];
  if(S.phase===2)seen=[S.faults.has('perception'),S.faults.has('control'),S.faults.size===2];
  if(S.phase>=3)seen=[S.transferRun,S.transferRun,S.transferRun];
  $('watchList').innerHTML=items.map((t,i)=>`<div class="watch-item ${seen[i]?'seen':''}"><i>${seen[i]?'✓':'○'}</i><span>${t}</span></div>`).join('');
}

function renderPhase(){
  const p=PH[S.phase];
  $('phaseName').textContent=p.name;
  $('phaseGoal').textContent=p.goal;
  $('actionText').textContent=p.action;
  $('phaseCount').textContent=String(S.phase+1).padStart(2,'0')+' / 05';
  $('progressFill').style.width=(S.phase/4*100)+'%';
  renderWatch();
}

function setReadout(id,text,live=true){const el=$(id);el.textContent=text;el.classList.toggle('live',live);}
function log(lines){$('log').textContent=lines.join('\n');}
function result(type,title,text){$('result').className='result '+type;$('result').innerHTML=`<b>${title}</b><span>${text}</span>`;}

function showLesson(title,observation,chain,next){
  S.lessonNext=next;
  $('lessonTitle').textContent=title;
  $('lessonObservation').textContent=observation;
  $('lessonChain').textContent=chain;
  $('lessonModal').classList.remove('hidden');
}

$('lessonContinue').onclick=()=>{
  $('lessonModal').classList.add('hidden');
  const next=S.lessonNext;S.lessonNext=null;
  if(next==='trace')beginTrace();
  if(next==='compare')beginCompare();
  if(next==='complete')finishMission();
};

function directFailure(){
  $('state5').textContent='UNREADABLE COMMAND';
  document.querySelector('[data-index="5"]').classList.add('active');
  $('inputMessage').textContent='“Move inspection case to Station B.”';
  $('outputMessage').textContent='ERROR: no actuator-level command';
  setReadout('rAction','NONE',false);
  result('fail','SHORTCUT FAILED','The motors are powered, but a mission sentence is not a motor command.');
  log(['TASK RECEIVED','MOTORS ........ POWERED','DIRECT INPUT ... HIGH-LEVEL TEXT','EXECUTION ...... REJECTED']);
  renderWatch();
  $('mainAction').disabled=true;
  setTimeout(()=>showLesson(
    'INTENT IS NOT ACTION.',
    'You just observed the first system boundary: a mission describes an outcome. Actuators need much more specific physical commands. Several functions must transform the information between the two.',
    'MISSION INTENT → ? → ? → ? → ? → PHYSICAL ACTION',
    'trace'
  ),500);
}

function resetStackVisual(){
  document.querySelectorAll('.layer').forEach((el,i)=>{
    el.classList.remove('active','processed');
    if(i>0)el.classList.add('locked');
  });
  document.querySelector('[data-index="0"]').classList.remove('locked');
  document.querySelector('[data-index="0"]').classList.add('processed');
  for(let i=1;i<=4;i++){$('name'+i).textContent='UNKNOWN LAYER';$('state'+i).textContent='WAITING';}
  $('state5').textContent='MOTORS POWERED';
  document.querySelector('[data-index="5"]').classList.add('locked');
  setReadout('rBehavior','—',false);setReadout('rState','—',false);setReadout('rMotion','—',false);setReadout('rControl','—',false);setReadout('rAction','NONE',false);
  $('.world');
}

function beginTrace(){
  S.phase=1;S.traceIndex=1;
  resetStackVisual();
  const next=document.querySelector('[data-index="1"]');next.classList.remove('locked');next.classList.add('active');
  $('inputMessage').textContent='GOAL: inspection case must reach Station B';
  $('outputMessage').textContent='Run this layer to see how the message changes.';
  $('mainAction').disabled=false;$('mainAction').textContent='PROCESS ACTIVE LAYER';
  result('neutral','TRACE READY','Read the input, process one layer, then read the output before continuing.');
  log(['FUNCTIONAL TRACE','MISSION ......... DEFINED','NEXT LAYER ...... ACTIVE']);
  renderPhase();
}

function processLayer(){
  if(S.phase!==1)return;
  const i=S.traceIndex,d=LAYERS[i];
  const layer=document.querySelector(`[data-index="${i}"]`);
  layer.classList.remove('active','locked');layer.classList.add('processed');
  if(i<5)$('name'+i).textContent=d.name;
  $('state'+i).textContent=i===5?'ACTION EXECUTED':'OUTPUT READY';
  $('inputMessage').textContent=d.input;$('outputMessage').textContent=d.output;
  $('keyIdea').textContent=d.idea;
  if(i===1)setReadout('rBehavior',d.readout);
  if(i===2)setReadout('rState',d.readout);
  if(i===3){setReadout('rMotion',d.readout);$('motionPath').classList.add('visible');}
  if(i===4)setReadout('rControl',d.readout);
  if(i===5){setReadout('rAction',d.readout);document.querySelector('.world').classList.add('executed');}
  result('pass',d.name,d.output);
  log(['TRACE RUNNING',`LAYER ${String(i+1).padStart(2,'0')} ....... PROCESSED`,`OUTPUT ......... ${d.readout}`]);
  renderWatch();

  if(i<5){
    S.traceIndex++;
    const next=document.querySelector(`[data-index="${S.traceIndex}"]`);next.classList.remove('locked');next.classList.add('active');
    $('mainAction').textContent='PROCESS NEXT LAYER';
  }else{
    $('mainAction').disabled=true;
    setTimeout(()=>showLesson(
      'ONE TASK BECAME SIX REPRESENTATIONS.',
      'The robot never changed its goal. What changed was the representation: goal → behavior → usable state → desired motion → real-time corrections → physical action.',
      'MISSION → BEHAVIOR → STATE → MOTION → CONTROL → PHYSICAL PLANT',
      'compare'
    ),650);
  }
}

function beginCompare(){
  S.phase=2;renderPhase();
  $('faultResult').textContent='Run both experiments.';
  $('faultModal').classList.remove('hidden');
}

function runFault(kind,button){
  S.faults.add(kind);button.classList.add('tested');
  if(kind==='perception'){
    $('faultResult').innerHTML='<b>EXPERIMENT A — NO USABLE STATE</b><br>Mission and behavior still exist, but motion planning has no reliable body/world state. The chain stops before a trustworthy trajectory can be produced.';
  }else{
    $('faultResult').innerHTML='<b>EXPERIMENT B — NO REAL-TIME CONTROL</b><br>A motion plan can exist, but no fast correction reaches the actuators. The chain stops one layer above physical execution.';
  }
  renderWatch();
  if(S.faults.size===2)$('faultContinue').classList.remove('hidden');
}

document.querySelectorAll('.fault-card').forEach(b=>b.onclick=()=>runFault(b.dataset.fault,b));
$('faultContinue').onclick=()=>{$('faultModal').classList.add('hidden');beginTransfer();};

function beginTransfer(){
  S.phase=3;S.transferRun=false;renderPhase();
  $('activeTask').textContent='INSPECT ZONE C · STOP IF PATH IS BLOCKED';
  $('inputMessage').textContent='NEW GOAL: inspect Zone C and stop if blocked';
  $('outputMessage').textContent='Same architecture. New content.';
  $('mainAction').disabled=false;$('mainAction').textContent='RUN NEW TASK THROUGH SAME STACK';
  result('neutral','TRANSFER READY','The six functions are unchanged. Watch what changes inside them.');
  document.querySelector('.world').classList.remove('executed');
  $('motionPath').classList.remove('visible');
  setReadout('rBehavior','—',false);setReadout('rState','—',false);setReadout('rMotion','—',false);setReadout('rControl','—',false);setReadout('rAction','NONE',false);
  log(['NEW TASK LOADED','ARCHITECTURE .... UNCHANGED','CONTENT ......... WAITING']);
}

function runTransfer(){
  S.transferRun=true;
  setReadout('rBehavior','SEARCH → APPROACH → INSPECT → STOP');
  setReadout('rState','ZONE C + OBSTACLE STATE VALID');
  setReadout('rMotion','SAFE PATH + STOP POINT READY');
  setReadout('rControl','MOTOR COMMANDS TRACKING');
  setReadout('rAction','INSPECTION EXECUTED');
  $('motionPath').classList.add('visible');
  $('inputMessage').textContent='NEW MISSION: inspect Zone C and stop if blocked';
  $('outputMessage').textContent='Same six roles; every downstream message adapts to the new goal.';
  result('pass','TRANSFER OBSERVED','The architecture stayed the same while the information inside every layer changed.');
  $('keyIdea').textContent='Functional architecture describes reusable roles. A different mission changes the content flowing through the stack, not the existence of the stack itself.';
  log(['TRANSFER RUN','MISSION ......... CHANGED','SIX ROLES ....... UNCHANGED','EXECUTION ....... COMPLETE']);
  renderWatch();
  $('mainAction').textContent='REVIEW WHAT CHANGED';
}

function reviewTransfer(){
  $('mainAction').disabled=true;
  showLesson(
    'ARCHITECTURE IS REUSABLE.',
    'A new task produced new behaviors, states, motions and commands, but the six system functions stayed the same. That is precisely the value of a functional architecture.',
    'DEFINE → DECIDE → KNOW → PLAN → CORRECT → ACT',
    'complete'
  );
}

function finishMission(){
  S.phase=4;renderPhase();
  localStorage.setItem('playlearn_a01m01_complete','true');
  $('completeModal').classList.remove('hidden');
}

$('mainAction').onclick=()=>{
  if(S.phase===0)directFailure();
  else if(S.phase===1)processLayer();
  else if(S.phase===3&&!S.transferRun)runTransfer();
  else if(S.phase===3&&S.transferRun)reviewTransfer();
};

$('startBtn').onclick=()=>{$('intro').classList.add('hidden');$('game').classList.remove('hidden');renderPhase();};
$('resetBtn').onclick=()=>location.reload();
$('replayBtn').onclick=()=>location.reload();
$('coachBtn').onclick=()=>{$('coachText').textContent=HINTS[S.phase]||HINTS[0];$('coachPanel').classList.remove('hidden');};
$('closeCoach').onclick=()=>$('coachPanel').classList.add('hidden');

renderPhase();