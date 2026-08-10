/* M02 leg-direction hotfix — visual only.
   The training coordinate increases to the right. A hanging leg rotated with a
   positive CSS angle visually leans left, so the rotation must use the opposite
   sign while translation keeps the original sign. This file does not change
   mission state, thresholds, scoring, or pedagogy. */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const leg=document.getElementById('swingLeg');
  const footSlider=document.getElementById('footPosition');
  if(!leg||!footSlider)return;

  const apply=()=>{
    const foot=Number(footSlider.value||22);
    const px=(foot-22)*1.15;
    const visualRotation=-clamp(px*.06,-8,12);
    leg.style.transform=`translateX(${px}px) rotate(${visualRotation}deg)`;
  };

  // Run after the main mission handlers so this visual correction wins.
  ['input','change'].forEach(evt=>{
    footSlider.addEventListener(evt,()=>requestAnimationFrame(apply));
    document.getElementById('bodyLean')?.addEventListener(evt,()=>requestAnimationFrame(apply));
    document.getElementById('speed')?.addEventListener(evt,()=>requestAnimationFrame(apply));
  });

  document.getElementById('swingFoot')?.addEventListener('pointermove',()=>requestAnimationFrame(apply));
  document.getElementById('runTestBtn')?.addEventListener('click',()=>requestAnimationFrame(apply));
  document.getElementById('startBtn')?.addEventListener('click',()=>requestAnimationFrame(apply));

  apply();
})();
