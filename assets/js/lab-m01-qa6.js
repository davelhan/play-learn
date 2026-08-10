const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const S={
  phase:0, angle:0, imuOn:true, connected:false, sensorDelay:85, controlDelay:18,
  minAngle:0,maxAngle:0,sawOff:false,sawBack:false,sawStale:true,sawFresh:false,
  standPassed:false,transferPassed:false,drag:false,startX:0,startAngle:0,
  lessonOpen:false,lessonNext:null,coachUse:{},transferSensorTouched:false,transferControlTouched:false
};

const PH=[
 {name:'HOOK',goal:'Voir la panne sans supposer sa cause.',action:'Lance le test une fois.',watch:['Les moteurs restent ONLINE','BODY ORIENTATION reste UNKNOWN']},
 {name:'DISCOVER',goal:'Séparer la réalité physique de la mesure.',action:'Fais pencher le robot à gauche puis à droite en le faisant glisser.',watch:['BODY ANGLE change avec le corps','IMU RAW suit le même mouvement','ESTIMATE reste UNKNOWN']},
 {name:'ISOLATE',goal:'Comprendre ce que fait réellement l’IMU.',action:'Garde le corps incliné. Coupe IMU power, observe, puis rallume-le.',watch:['Le corps garde son angle quand l’IMU est OFF','IMU RAW disparaît','La mesure revient quand l’IMU repasse ONLINE']},
 {name:'TRACE',goal:'Voir où la mesure doit aller ensuite.',action:'Lis les rôles des blocs à droite. RAW DATA est disponible, mais STATE ESTIMATOR indique NO INPUT. Le lien cassé est maintenant signalé : clique directement dessus pour le réparer.',watch:['IMU = MEASURES BODY MOTION','STATE ESTIMATOR = BUILDS A USABLE BODY STATE','Après réparation, ESTIMATED ANGLE apparaît']},
 {name:'TIMING',goal:'Comprendre pourquoi une bonne mesure peut être inutilisable.',action:'Le corps reste incliné. Fais varier Sensor data age. Compare BODY ANGLE, ESTIMATED ANGLE et State confidence.',watch:['Avec des données anciennes, l’estimation est pauvre','En rendant les données plus fraîches, l’estimation se rapproche du corps','State confidence passe d’un état faible à un état sain']},
 {name:'VERIFY',goal:'Vérifier la chaîne complète.',action:'Lance STAND TEST.',watch:['Measure → Estimate → Control → Motors fonctionne comme une chaîne']},
 {name:'TRANSFER',goal:'Distinguer une panne de contrôle d’une panne de sensing.',action:'Nouvelle panne : State confidence est sain mais Control response est mauvais. Les deux réglages de timing sont accessibles. Change une variable à la fois et regarde quel diagnostic elle influence.',watch:['Sensor data age agit surtout sur State confidence','Control latency agit sur Control response','Le bon diagnostic doit redevenir sain avant le test']},
 {name:'COMPLETE',goal:'Verrouiller le modèle mental.',action:'Mission terminée.',watch:['Physical state ≠ measurement ≠ estimate ≠ control']}
];

const HINTS=[
 ['Le test initial sert seulement à collecter des indices. Un composant vert est aussi une information.'],
 ['Regarde les trois cartes sous le robot pendant que tu le déplaces. Deux changent ensemble ; la troisième reste inconnue.'],
 ['Couper l’IMU ne peut pas supprimer l’orientation physique du robot. Cela supprime uniquement sa mesure.'],
 ['Tu n’as rien à deviner ici : le lien cassé est volontairement visible. Lis simplement ce que fait chaque bloc, puis clique sur BROKEN DATA LINK.'],
 ['Il n’y a pas de nombre magique à mémoriser. Cherche le moment où l’estimation devient proche de la réalité et où la confiance devient saine.'],
 ['Le test vérifie maintenant tout ce que tu viens de construire.'],
 ['Si tu modifies Sensor data age et que Control response reste mauvais, cette variable n’agit pas sur le bon étage. Essaie l’autre timing.'],
 ['Tu peux maintenant relire la chaîne de droite comme une phrase : mesurer → estimer → décider → agir.']
];

function confidence(){
  if(!S.imuOn||!S.connected)return 0;
  return Math.round(clamp(105-S.sensorDelay*1.05,8,100));
}
function response(){return Math.round(clamp(112-S.controlDelay*1.1,10,100));}
function estimate(){
  if(!S.imuOn||!S.connected)return null;
  const q=clamp(1-S.sensorDelay/150,.15,.97);
  return S.angle*q;
}
function norm(a){return clamp(50+a*2.2,4,96);}
function balance(){return Math.round(clamp(.58*confidence()+.42*response()-Math.abs(S.angle),0,100));}
function ready(){return S.imuOn&&S.connected&&confidence()>=72&&response()>=72;}

function seenState(){
  const both=S.minAngle<-7&&S.maxAngle>7;
  if(S.phase===0)return [false,true,true];
  if(S.phase===1)return [both,both,true];
  if(S.phase===2)return [S.sawOff,S.sawOff,S.sawBack];
  if(S.phase===3)return [true,true,S.connected];
  if(S.phase===4)return [S.sawStale,S.sawFresh,S.sawFresh];
  if(S.phase===5)return [S.standPassed];
  if(S.phase===6)return [S.transferSensorTouched,S.transferControlTouched,response()>=72&&confidence()>=72];
  return [true];
}

function renderWatch(){
  const arr=PH[S.phase].watch, seen=seenState();
  $('watchList').innerHTML=arr.map((t,i)=>`<div class="watch-item ${seen[i]?'seen':''}"><i>${seen[i]?'✓':'○'}</i><span>${t}</span></div>`).join('');
}

function clearFocus(){
  document.querySelectorAll('.layer-focus,.attention,.repairable').forEach(el=>{
    el.classList.remove('layer-focus','attention','repairable');
  });
}
function setFocus(){
  clearFocus();
  if(S.lessonOpen)return;
  if(S.phase===0)$('runTestBtn').classList.add('layer-focus');
  if(S.phase===1){$('robot').classList.add('layer-focus');$('physicalSignal').classList.add('attention');$('measurementSignal').classList.add('attention');}
  if(S.phase===2){$('imuPowerControl').classList.add('layer-focus');$('physicalSignal').classList.add('attention');$('measurementSignal').classList.add('attention');}
  if(S.phase===3){$('imuLink').classList.add('repairable');$('imuNode').classList.add('layer-focus');$('estimatorNode').classList.add('layer-focus');}
  if(S.phase===4){$('sensorDelayControl').classList.add('layer-focus');$('physicalSignal').classList.add('attention');$('estimateSignal').classList.add('attention');}
  if(S.phase===5)$('runTestBtn').classList.add('layer-focus');
  if(S.phase===6){$('stateConfidence').closest('.metric').classList.add('layer-focus');$('controlResponse').closest('.metric').classList.add('layer-focus');}
}

function renderSignals(){
  $('actualAngle').textContent=S.angle.toFixed(1)+'°';
  $('actualBar').style.width=norm(S.angle)+'%';

  if(S.imuOn){
    $('imuAngle').textContent=S.angle.toFixed(1)+'°';$('imuAngle').className='';
    $('imuBar').style.width=norm(S.angle)+'%';$('imuBar').style.background='var(--mint)';
  }else{
    $('imuAngle').textContent='NO SIGNAL';$('imuAngle').className='bad';
    $('imuBar').style.width='4%';$('imuBar').style.background='var(--bad)';
  }

  const est=estimate();
  if(est===null){
    $('estimatedAngle').textContent='UNKNOWN';$('estimatedAngle').className='bad';
    $('estimateBar').style.width='4%';$('estimateBar').style.background='var(--bad)';
  }else{
    $('estimatedAngle').textContent=est.toFixed(1)+'°';$('estimatedAngle').className='';
    $('estimateBar').style.width=norm(est)+'%';$('estimateBar').style.background=confidence()>=72?'var(--mint)':'var(--warn)';
  }

  $('stateConfidence').textContent=confidence()+'%';
  $('controlResponse').textContent=response()+'%';
  $('balanceMargin').textContent=balance()+'%';
  $('delayValue').textContent=S.sensorDelay+' ms';
  $('controlDelayValue').textContent=S.controlDelay+' ms';
  $('imuPower').textContent=S.imuOn?'ONLINE':'OFFLINE';
  $('imuPower').className='toggle '+(S.imuOn?'on':'off');

  $('imuNodeState').textContent=S.imuOn?'RAW DATA OK':'OFFLINE';
  $('imuNodeState').className=S.imuOn?'ok':'bad';

  if(!S.connected){
    $('estNodeState').textContent='NO INPUT';$('estNodeState').className='bad';
  }else if(confidence()<72){
    $('estNodeState').textContent='STATE LOW CONFIDENCE';$('estNodeState').className='';
  }else{
    $('estNodeState').textContent='STATE VALID';$('estNodeState').className='ok';
  }

  if(confidence()<50){
    $('controlNodeState').textContent='WAITING FOR STATE';$('controlNodeState').className='';
  }else if(response()<72){
    $('controlNodeState').textContent='RESPONSE LATE';$('controlNodeState').className='bad';
  }else{
    $('controlNodeState').textContent='TRACKING';$('controlNodeState').className='ok';
  }

  $('robot').style.transform=`translateX(-50%) rotate(${S.angle}deg)`;
  $('systemLog').textContent=[
    'SYSTEM LIVE',
    `IMU ........... ${S.imuOn?'ONLINE':'OFFLINE'}`,
    `IMU→EST ...... ${S.connected?'CONNECTED':'OPEN CIRCUIT'}`,
    `DATA AGE ...... ${S.connected?S.sensorDelay+' ms':'N/A'}`,
    `STATE CONF .... ${confidence()}%`,
    `CONTROL RESP .. ${response()}%`,
    !S.imuOn?'FLAG .......... SENSOR OFFLINE':
    !S.connected?'FLAG .......... STATE INPUT MISSING':
    confidence()<72?'FLAG .......... ESTIMATE NOT TRUSTWORTHY':
    response()<72?'FLAG .......... CONTROL RESPONSE LATE':
    'FLAGS ......... NONE'
  ].join('\n');
}

function render(){
  const p=PH[S.phase];
  $('phaseName').textContent=p.name;
  $('phaseGoal').textContent=p.goal;
  $('instruction').innerHTML=`<div class="phase-brief">${p.goal}</div>`;
  $('investigationAction').textContent=p.action;
  $('phaseCount').textContent=String(S.phase+1).padStart(2,'0')+' / 08';
  $('progressFill').style.width=(S.phase/7*100)+'%';

  $('imuPowerControl').classList.toggle('locked',S.phase!==2);
  $('sensorDelayControl').classList.toggle('locked',![4,6].includes(S.phase));
  $('controlDelayControl').classList.toggle('locked',S.phase!==6);

  $('runTestBtn').disabled=![0,5,6].includes(S.phase)||S.lessonOpen;
  $('runTestBtn').textContent=S.phase===0?'▶ RUN INITIAL TEST':'▶ RUN STAND TEST';
  $('grab-label').classList.toggle('hidden',S.phase!==1);

  renderWatch();renderSignals();setFocus();
}

function showLesson(observation,meaning,nextPhase,delay=900){
  S.lessonOpen=true;S.lessonNext=nextPhase;
  $('lessonObservation').textContent=observation;
  $('lessonMeaning').textContent=meaning;
  $('lessonCard').classList.remove('hidden');
  $('lessonContinue').disabled=true;
  setFocus();
  setTimeout(()=>$('lessonContinue').disabled=false,delay);
}

$('lessonContinue').onclick=()=>{
  if($('lessonContinue').disabled)return;
  const next=S.lessonNext;
  $('lessonCard').classList.add('hidden');
  S.lessonOpen=false;S.lessonNext=null;
  if(next!==null&&next!==undefined){
    S.phase=next;
    if(next===4)S.angle=16;
    if(next===6){
      S.controlDelay=68;$('controlDelay').value=68;S.angle=10;
      $('resultBox').className='result neutral';
      $('resultBox').innerHTML='<strong>NEW FAILURE</strong><span>State confidence reste sain. Control response est maintenant mauvais. Change une variable à la fois et observe ce qui bouge.</span>';
    }
    render();
  }
};

function runTest(){
  if(S.lessonOpen)return;
  if(S.phase===0){
    S.angle=14;$('failureStamp').classList.remove('hidden');
    $('resultBox').className='result fail';
    $('resultBox').innerHTML='<strong>TEST FAILED · 2.84 s</strong><span>Les moteurs sont ONLINE, mais le robot n’a pas de BODY ORIENTATION utilisable.</span>';
    renderSignals();
    setTimeout(()=>{
      S.angle=0;S.minAngle=0;S.maxAngle=0;
      showLesson(
        'Le robot tombe alors que ses moteurs fonctionnent.',
        'Une panne système ne signifie pas que tout est cassé. Il faut suivre l’information.',
        1
      );
    },650);
    return;
  }

  if(![5,6].includes(S.phase))return;

  if(ready()){
    $('failureStamp').classList.add('hidden');S.angle=0;
    $('resultBox').className='result pass';
    $('resultBox').innerHTML='<strong>TEST PASSED · 30.0 s</strong><span>La chaîne transmet maintenant un état utilisable vers un contrôle assez rapide.</span>';

    if(S.phase===5){
      S.standPassed=true;renderWatch();
      setTimeout(()=>{
        showLesson(
          'Le robot tient debout quand mesure, estimation et contrôle sont tous utilisables.',
          'Le comportement final dépend de toute la chaîne, pas d’un seul composant.',
          6
        );
      },600);
    }else{
      S.transferPassed=true;renderWatch();
      setTimeout(()=>{
        S.phase=7;render();
        localStorage.setItem('playlearn_rbt01_complete','true');
        $('completeModal').classList.remove('hidden');
      },700);
    }
  }else{
    $('failureStamp').classList.remove('hidden');
    const parts=[];
    if(confidence()<72)parts.push('State confidence est faible');
    if(response()<72)parts.push('Control response est faible');
    $('resultBox').className='result fail';
    $('resultBox').innerHTML=`<strong>TEST FAILED</strong><span>${parts.join(' · ')||'La chaîne reste incohérente'}.</span>`;
    render();
  }
}

const robot=$('robot');
robot.addEventListener('pointerdown',e=>{
  if(S.phase!==1||S.lessonOpen)return;
  S.drag=true;S.startX=e.clientX;S.startAngle=S.angle;robot.setPointerCapture(e.pointerId);
});
robot.addEventListener('pointermove',e=>{
  if(!S.drag)return;
  S.angle=clamp(S.startAngle+(e.clientX-S.startX)*.13,-22,22);
  S.minAngle=Math.min(S.minAngle,S.angle);S.maxAngle=Math.max(S.maxAngle,S.angle);
  renderSignals();renderWatch();
});
robot.addEventListener('pointerup',()=>{
  if(!S.drag)return;S.drag=false;
  if(S.phase===1&&S.minAngle<-7&&S.maxAngle>7){
    showLesson(
      'BODY ANGLE et IMU RAW bougent ensemble. ESTIMATE reste UNKNOWN.',
      'Le corps possède un état physique. L’IMU produit une mesure de cet état. Une mesure n’est pas encore un état utilisable par le contrôle.',
      2
    );
  }
});

$('imuPower').onclick=()=>{
  if(S.phase!==2||S.lessonOpen)return;
  S.imuOn=!S.imuOn;
  if(!S.imuOn)S.sawOff=true;
  if(S.imuOn&&S.sawOff)S.sawBack=true;
  render();
  if(S.sawOff&&S.sawBack){
    setTimeout(()=>showLesson(
      'Quand l’IMU est OFF, BODY ANGLE existe toujours mais IMU RAW disparaît.',
      'L’IMU ne crée pas l’orientation du robot : c’est un capteur. Il mesure une réalité physique qui existe indépendamment de lui.',
      3
    ),350);
  }
};

function repairLink(){
  if(S.phase!==3||S.lessonOpen||S.connected)return;
  S.connected=true;$('imuLink').classList.add('connected');
  render();
  setTimeout(()=>showLesson(
    'Dès que le lien est réparé, ESTIMATED ANGLE apparaît.',
    'Le State Estimator reçoit la mesure du capteur et construit un état du corps utilisable par le contrôle. Mais cet état peut encore être de mauvaise qualité.',
    4
  ),450);
}
$('imuLink').onclick=repairLink;
$('imuLink').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();repairLink();}};

$('sensorDelay').oninput=e=>{
  if(![4,6].includes(S.phase)||S.lessonOpen)return;
  const old=S.sensorDelay;
  S.sensorDelay=+e.target.value;
  if(S.sensorDelay>=70)S.sawStale=true;
  if(confidence()>=72)S.sawFresh=true;
  if(S.phase===6&&Math.abs(S.sensorDelay-old)>0)S.transferSensorTouched=true;
  renderSignals();renderWatch();

  if(S.phase===4&&S.sawStale&&S.sawFresh){
    S.sawStale=false;
    setTimeout(()=>showLesson(
      'Avec des données plus fraîches, ESTIMATED ANGLE se rapproche de BODY ANGLE et State confidence devient sain.',
      'Une mesure correcte peut être trop ancienne pour être utile. Le contrôle a besoin d’un état suffisamment actuel.',
      null
    ),350);
    setTimeout(()=>{
      $('conceptText').textContent='Tu as maintenant construit le modèle complet : le corps possède un état physique ; l’IMU le mesure ; le State Estimator transforme les mesures en un état utilisable ; le Balance Controller décide ensuite comment corriger le corps.';
      $('conceptReveal').classList.remove('hidden');
    },1500);
  }
};

$('conceptContinue').onclick=()=>{
  $('conceptReveal').classList.add('hidden');
  $('lessonCard').classList.add('hidden');
  S.lessonOpen=false;S.lessonNext=null;S.phase=5;S.angle=0;render();
};

$('controlDelay').oninput=e=>{
  if(S.phase!==6||S.lessonOpen)return;
  S.controlDelay=+e.target.value;S.transferControlTouched=true;
  renderSignals();renderWatch();
};

$('sensorDelay').addEventListener('change',()=>{
  if(S.phase!==6||S.lessonOpen)return;
  if(response()<72){
    $('resultBox').className='result neutral';
    $('resultBox').innerHTML='<strong>OBSERVATION</strong><span>Tu as changé Sensor data age : State confidence change, mais Control response reste mauvais. Tu n’es pas sur le bon étage.</span>';
  }
});
$('controlDelay').addEventListener('change',()=>{
  if(S.phase!==6||S.lessonOpen)return;
  $('resultBox').className='result neutral';
  $('resultBox').innerHTML='<strong>OBSERVATION</strong><span>Control latency modifie directement Control response. C’est le diagnostic qui était mauvais dans cette nouvelle panne.</span>';
});

$('coachBtn').onclick=()=>{
  const n=S.coachUse[S.phase]||0;
  const arr=HINTS[S.phase]||['Observe les signaux qui changent ensemble.'];
  $('coachText').textContent=arr[Math.min(n,arr.length-1)];
  S.coachUse[S.phase]=n+1;$('coachPanel').classList.remove('hidden');
};
$('closeCoach').onclick=()=>$('coachPanel').classList.add('hidden');
$('resetBtn').onclick=()=>location.reload();
$('runTestBtn').onclick=runTest;
$('startBtn').onclick=()=>{
  $('intro').classList.add('hidden');$('game').classList.remove('hidden');render();
};

render();
