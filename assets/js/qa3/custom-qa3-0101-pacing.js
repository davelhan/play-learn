/* QA3 polish — 01.01 final transfer is observed layer-by-layer before review. */
(()=>{if(!location.pathname.includes('01-01-system-layers'))return;
runTransfer=function(){
  S.transferRun=true;$('mainAction').disabled=true;$('mainAction').textContent='WATCH THE SAME ARCHITECTURE ADAPT';
  const seq=[
    ['rBehavior','SEARCH → APPROACH → INSPECT → STOP'],
    ['rState','ZONE C + OBSTACLE STATE VALID'],
    ['rMotion','SAFE PATH + STOP POINT READY'],
    ['rControl','MOTOR COMMANDS TRACKING'],
    ['rAction','INSPECTION EXECUTED']
  ];
  setReadout('rBehavior','—',false);setReadout('rState','—',false);setReadout('rMotion','—',false);setReadout('rControl','—',false);setReadout('rAction','NONE',false);
  $('inputMessage').textContent='NEW MISSION: inspect Zone C and stop if blocked';$('outputMessage').textContent='Watch the content change while the six roles stay fixed.';
  result('neutral','TRANSFER RUNNING','One new mission is being transformed through the same architecture.');
  log(['NEW TASK ......... ACTIVE','ARCHITECTURE ..... UNCHANGED','REPRESENTATIONS .. UPDATING']);
  let i=0;const timer=setInterval(()=>{const [id,text]=seq[i];setReadout(id,text);if(id==='rMotion')$('motionPath').classList.add('visible');i++;renderWatch();if(i>=seq.length){clearInterval(timer);$('outputMessage').textContent='Same six roles; every downstream message adapted to the new goal.';result('pass','TRANSFER OBSERVED','The architecture stayed the same while the information inside every layer changed.');$('keyIdea').textContent='Functional architecture describes reusable roles. A different mission changes the content flowing through the stack, not the existence of the stack itself.';log(['TRANSFER RUN','MISSION ......... CHANGED','SIX ROLES ....... UNCHANGED','EXECUTION ....... COMPLETE','NEXT ............ REVIEW']);$('mainAction').disabled=false;$('mainAction').textContent='REVIEW WHAT CHANGED';}},240);
};
})();