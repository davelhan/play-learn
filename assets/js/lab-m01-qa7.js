/* Mission 01 QA7
   Loaded after QA6.
   Keeps the QA6 learning flow, but prevents the final successful action
   from jumping straight to the mission-complete modal.
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

    // Prevent accidental double-click completion. The player still decides when to continue.
    window.setTimeout(() => {
      lessonContinue.disabled = false;
      lessonContinue.textContent = 'COMPLETE MISSION';
    }, 1400);

    lessonContinue.onclick = finishMission;
    setFocus();

    window.setTimeout(() => {
      lessonCard.scrollIntoView({behavior:'smooth', block:'nearest'});
    }, 80);
  }

  testButton.onclick = function(event){
    // Only intercept the final transfer verification when the chain is actually healthy.
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

    // Deliberate pedagogical beat: no automatic mission-complete screen.
    window.setTimeout(showFinalReflection, 450);
  };
})();
