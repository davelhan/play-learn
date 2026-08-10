/* Prototype P01 QA7
   Loaded after QA6.
   Keeps the QA6 learning flow, but prevents the final successful action
   from jumping straight to the prototype-complete modal.
*/
(() => {
  const testButton = document.getElementById('runTestBtn');
  const lessonCard = document.getElementById('lessonCard');
  const lessonObservation = document.getElementById('lessonObservation');
  const lessonMeaning = document.getElementById('lessonMeaning');
  const lessonContinue = document.getElementById('lessonContinue');
  const resultBox = document.getElementById('resultBox');
  const failureStamp = document.getElementById('failureStamp');
  const completeModal = document.getElementById('completeModal');

  /* Visible product naming: this is a validated vertical slice, not campaign 01.01. */
  document.title = 'PLAY//LEARN — Prototype P01';
  const meta = document.querySelector('meta[name="description"]');
  if(meta) meta.setAttribute('content','PLAY//LEARN Robotics Prototype P01 — Orientation Stack');
  const missionId = document.querySelector('.mission-id');
  if(missionId) missionId.textContent = 'ROBOTICS · VALIDATED PROTOTYPE P01 · BUILD QA7';
  const introKicker = document.querySelector('.intro-copy .kicker');
  if(introKicker) introKicker.textContent = 'PROTOTYPE P01 · ORIENTATION STACK';
  const start = document.getElementById('startBtn');
  if(start) start.textContent = 'START PROTOTYPE';
  if(completeModal){
    const kicker = completeModal.querySelector('.kicker');
    if(kicker) kicker.textContent = 'PROTOTYPE COMPLETE';
    const links = completeModal.querySelectorAll('.complete-actions a');
    if(links[1]) links[1].textContent = 'OPEN PROTOTYPE P02 →';
  }

  if(!testButton || !lessonCard || !lessonContinue) return;

  const qa6RunTest = testButton.onclick;

  function finishMission(){
    lessonCard.classList.add('hidden');
    lessonCard.classList.remove('final-reflection');
    S.lessonOpen = false;
    S.lessonNext = null;
    S.phase = 7;
    render();
    localStorage.setItem('playlearn_rbt01_complete','true');
    completeModal.classList.remove('hidden');
  }

  function showFinalReflection(){
    S.lessonOpen = true;
    S.lessonNext = null;

    lessonObservation.textContent =
      'State confidence est resté sain. Modifier Sensor data age n’a pas réparé la panne. En réduisant Control latency, Control response est redevenu sain et le robot a tenu debout.';

    lessonMeaning.textContent =
      'Deux chutes peuvent avoir des causes différentes. Tu n’as pas répété la solution précédente : tu as suivi les diagnostics jusqu’à la couche réellement en défaut — le contrôle.';

    lessonCard.classList.remove('hidden');
    lessonCard.classList.add('final-reflection');

    lessonContinue.disabled = true;
    lessonContinue.textContent = 'READ THE RESULT…';

    window.setTimeout(() => {
      lessonContinue.disabled = false;
      lessonContinue.textContent = 'COMPLETE PROTOTYPE';
    }, 1400);

    lessonContinue.onclick = finishMission;
    setFocus();

    window.setTimeout(() => {
      lessonCard.scrollIntoView({behavior:'smooth', block:'nearest'});
    }, 80);
  }

  testButton.onclick = function(event){
    if(S.phase !== 6 || S.lessonOpen || !ready()){
      return qa6RunTest.call(this,event);
    }

    failureStamp.classList.add('hidden');
    S.angle = 0;
    S.transferPassed = true;

    resultBox.className = 'result pass';
    resultBox.innerHTML =
      '<strong>TEST PASSED · 30.0 s</strong><span>La nouvelle panne est réparée. Avant de terminer, relis ce que ton dernier changement vient de démontrer.</span>';

    renderSignals();
    renderWatch();

    window.setTimeout(showFinalReflection, 450);
  };
})();
