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
 {name:'DISCOVER',goal:'Separate physical reality from measurement.',action:'Lean the robot left and right by dragging it.',watch:['BODY ANGLE changes with the body','IMU RAW follows the same motion','ESTIMATE remains UNKNOWN']},
 {name:'ISOLATE',goal:'Understand what the IMU actually does.',action:'Keep the body tilted. Turn IMU power off, observe, then turn it back on.',watch:['The body keeps its angle when the IMU is OFF','IMU RAW disappears','The measurement returns when the IMU comes back ONLINE']},
 {name:'TRACE',goal:'See where the measurement must go next.',action:'Read the roles of the blocks on the right. RAW DATA is available, but STATE ESTIMATOR shows NO INPUT. The broken link is now highlighted: click it directly to repair it.',watch:['IMU = MEASURES BODY MOTION','STATE ESTIMATOR = BUILDS A USABLE BODY STATE','After the repair, ESTIMATED ANGLE appears']},
 {name:'TIMING',goal:'Understand why a good measurement can still be unusable.',action:'Keep the body tilted. Vary Sensor data age. Compare BODY ANGLE, ESTIMATED ANGLE and State confidence.',watch:['With old data, the estimate is poor','With fresher data, the estimate moves closer to the body state','State confidence moves from weak to healthy']},
 {name:'VERIFY',goal:'Verify the complete chain.',action:'Run STAND TEST.',watch:['Measure → Estimate → Control → Motors works as a chain']},
 {name:'TRANSFER',goal:'Distinguish a control failure from a sensing failure.',action:'New failure: State confidence is healthy but Control response is poor. Both timing controls are available. Change one variable at a time and see which diagnostic it influences.',watch:['Sensor data age agit surtout sur State confidence','Control latency agit sur Control response','Le bon diagnostic doit redevenir sain avant le test']},
 {name:'COMPLETE',goal:'Lock in the mental model.',action:'Mission complete.',watch:['Physical state ≠ measurement ≠ estimate ≠ control']}
];

const HINTS=[
 ['The initial test only collects clues. A green component is also information.'],
 ['Watch the three cards below the robot as you move it. Two change together; the third remains unknown.'],
 ['Couper l’IMU ne peut pas supprimer l’orientation physique du robot. Cela supprime uniquement sa mesure.'],
 ['There is nothing to guess here: the broken link is deliberately visible. Read what each block does, then click BROKEN DATA LINK.'],
 ['There is no magic number to memorize. Look for the point where the estimate approaches reality and confidence becomes healthy.'],
 ['The test now verifies everything you just built.'],
 ['If you change Sensor data age and Control response stays poor, that variable is not acting on the failing layer. Try the other timing control.'],
 ['You can now read the chain on the right like a sentence: measure → estimate → decide → act.']
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
      $('resultBox').innerHTML='<strong>NEW FAILURE</strong><span>State confidence remains healthy. Control response is now poor. Change one variable at a time and observe what moves.</span>';
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
        'A system failure does not mean everything is broken. Follow the information.',
        1
      );
    },650);
    return;
  }

  if(![5,6].includes(S.phase))return;

  if(ready()){
    $('failureStamp').classList.add('hidden');S.angle=0;
    $('resultBox').className='result pass';
    $('resultBox').innerHTML='<strong>TEST PASSED · 30.0 s</strong><span>The chain now delivers a usable state to sufficiently fast control.</span>';

    if(S.phase===5){
      S.standPassed=true;renderWatch();
      setTimeout(()=>{
        showLesson(
          'The robot stands when measurement, estimation and control are all usable.',
          'Final behavior depends on the entire chain, not a single component.',
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
    $('resultBox').innerHTML=`<strong>TEST FAILED</strong><span>${parts.join(' · ')||'The chain remains inconsistent'}.</span>`;
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
      'BODY ANGLE et IMU RAW bougent ensemble. ESTIMATE remains UNKNOWN.',
      'The body has a physical state. The IMU produces a measurement of that state. A measurement is not yet a state usable by control.',
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
      'When the IMU is OFF, BODY ANGLE still exists but IMU RAW disappears.',
      'The IMU does not create the robot’s orientation: it is a sensor. It measures a physical reality that exists independently of it.',
      3
    ),350);
  }
};

function repairLink(){
  if(S.phase!==3||S.lessonOpen||S.connected)return;
  S.connected=true;$('imuLink').classList.add('connected');
  render();
  setTimeout(()=>showLesson(
    'As soon as the link is repaired, ESTIMATED ANGLE appears.',
    'The State Estimator receives the sensor measurement and builds a body state usable by control. But that state can still be poor quality.',
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
      'With fresher data, ESTIMATED ANGLE approaches BODY ANGLE and State confidence becomes healthy.',
      'A correct measurement can be too old to be useful. Control needs a sufficiently current state.',
      null
    ),350);
    setTimeout(()=>{
      $('conceptText').textContent='You have now built the complete model: the body has a physical state; the IMU measures it; the State Estimator turns measurements into a usable state; the Balance Controller then decides how to correct the body.';
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
    $('resultBox').innerHTML='<strong>OBSERVATION</strong><span>You changed Sensor data age: State confidence changes, but Control response remains poor. You are not on the failing layer.</span>';
  }
});
$('controlDelay').addEventListener('change',()=>{
  if(S.phase!==6||S.lessonOpen)return;
  $('resultBox').className='result neutral';
  $('resultBox').innerHTML='<strong>OBSERVATION</strong><span>Control latency directly changes Control response. That was the faulty layer in this new failure.</span>';
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
