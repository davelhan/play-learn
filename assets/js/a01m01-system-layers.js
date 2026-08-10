const $=id=>document.getElementById(id);

const S={phase:0,traceIndex:0,faults:new Set(),transferRun:false,lessonNext:null};
const PH=[
  {name:'HOOK',goal:'Découvrir pourquoi une intention de mission ne peut pas piloter directement des moteurs.',action:'Essaie le raccourci : envoie directement la phrase de mission aux moteurs.',watch:['Les moteurs sont alimentés','La mission est compréhensible pour un humain','Les moteurs ne savent pas interpréter la phrase']},
  {name:'TRACE',goal:'Suivre la transformation d’une même intention couche après couche.',action:'Traite la couche active, puis lis son INPUT et son OUTPUT avant de descendre.',watch:['Le sens général de la mission reste le même','La forme de l’information change à chaque couche','La dernière couche agit réellement sur le monde']},
  {name:'COMPARE',goal:'Voir que retirer des fonctions différentes arrête la chaîne à des endroits différents.',action:'Exécute les deux expériences contrôlées et compare jusqu’où l’information descend.',watch:['Sans état utilisable, aucun mouvement fiable ne peut être planifié','Sans contrôle temps réel, un plan peut exister sans être exécuté','Une panne visible en bas peut avoir une cause plus haut']},
  {name:'TRANSFER',goal:'Vérifier que la même architecture peut servir une nouvelle mission.',action:'Charge une nouvelle tâche et observe quelles représentations changent sans changer l’architecture.',watch:['Les six rôles restent identiques','Le contenu des messages change avec la mission','L’architecture est réutilisable']},
  {name:'COMPLETE',goal:'Verrouiller le modèle mental des six couches.',action:'Mission terminée.',watch:['Mission → Behavior → State → Motion → Control → Physical action']}
];

const LAYERS={
  1:{name:'TASK AUTONOMY / BEHAVIOR',input:'GOAL + CONSTRAINTS: case must reach Station B',output:'SUBGOALS: approach → grasp → carry → place',readout:'APPROACH · GRASP · CARRY · PLACE',idea:'La couche comportement transforme un résultat attendu en séquence d’actions.'},
  2:{name:'PERCEPTION / STATE ESTIMATION',input:'SUBGOALS + sensor measurements',output:'USABLE STATE: case pose · Station B pose · robot state · obstacles',readout:'WORLD + BODY STATE VALID',idea:'Le robot doit disposer d’un état exploitable avant de calculer comment bouger.'},
  3:{name:'MOTION GENERATION / PLANNING',input:'SUBGOALS + usable state',output:'DESIRED MOTION: base path + arm / hand trajectory',readout:'PATH + TRAJECTORY READY',idea:'Le planning transforme un objectif en mouvement géométriquement réalisable.'},
  4:{name:'REAL-TIME CONTROL',input:'DESIRED MOTION + current state',output:'FAST CORRECTIONS: joint targets · torque / motor commands',readout:'MOTOR COMMANDS STREAMING',idea:'Le contrôle compare en continu ce qui est désiré à ce qui se passe réellement.'},
  5:{name:'PHYSICAL PLANT / ENERGY',input:'MOTOR COMMANDS + available energy',output:'PHYSICAL ACTION: force → contact → body and case move',readout:'CASE DELIVERED',idea:'La dernière couche est physique : énergie, actuateurs, mécanique et contacts produisent le mouvement réel.'}
};

const HINTS=[
  'Le raccourci est volontaire. Demande-toi si un moteur sait ce que signifie “Station B”.',
  'Ne cherche pas à mémoriser les noms. Lis surtout comment l’OUTPUT d’une couche devient l’INPUT de la suivante.',
  'Les deux expériences gardent beaucoup de choses saines. Compare seulement l’endroit où la chaîne s’arrête.',
  'La nouvelle tâche change le contenu, pas les six fonctions fondamentales du système.',
  'Relis la chaîne comme une phrase : définir → décider → savoir → planifier → corriger → agir.'
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
    'Tu viens d’observer la première frontière du système : une mission décrit un résultat. Les actuateurs ont besoin de commandes physiques beaucoup plus spécifiques. Entre les deux, plusieurs fonctions doivent transformer l’information.',
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
      'Le robot n’a jamais changé d’objectif. Ce qui a changé est la représentation : objectif → comportement → état utilisable → mouvement désiré → corrections temps réel → action physique.',
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
    'Une nouvelle tâche a produit de nouveaux comportements, états, mouvements et commandes, mais les six fonctions du système sont restées les mêmes. C’est précisément l’intérêt d’une architecture fonctionnelle.',
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