/* Prototype P02 QA5.2 — simple visual swing-leg mapping.
   This is intentionally NOT an IK solver. The prototype teaches foot-placement
   relationships, not leg kinematics. Keep the silhouette coherent and map the
   abstract Next foot position to a limited hip swing only.
   Prototype state, scoring and pedagogy are untouched.
*/
(()=>{
  const leg=document.getElementById('swingLeg');
  const foot=document.getElementById('swingFoot');
  const slider=document.getElementById('footPosition');
  if(!leg||!foot||!slider)return;

  /* Visible product naming: this is a validated vertical slice, not campaign 01.02. */
  document.title='PLAY//LEARN — Prototype P02';
  const meta=document.querySelector('meta[name="description"]');
  if(meta)meta.setAttribute('content','PLAY//LEARN Robotics Prototype P02 — Dynamic Balance');
  const missionId=document.querySelector('.mission-id');
  if(missionId)missionId.textContent='ROBOTICS · VALIDATED PROTOTYPE P02 · BUILD QA5.2';
  const introKicker=document.querySelector('.intro-copy .kicker');
  if(introKicker)introKicker.textContent='PROTOTYPE P02 · DYNAMIC BALANCE';
  const start=document.getElementById('startBtn');
  if(start)start.textContent='START PROTOTYPE';
  const completeModal=document.getElementById('completeModal');
  if(completeModal){
    const kicker=completeModal.querySelector('.kicker');
    if(kicker)kicker.textContent='PROTOTYPE COMPLETE';
    const links=completeModal.querySelectorAll('.complete-actions a');
    if(links[1])links[1].textContent='REPLAY PROTOTYPE P01';
  }

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  leg.style.display='';
  leg.style.transformOrigin='50% 6%';

  function desiredTransform(){
    const value=Number(slider.value||22);
    const delta=value-22;
    const angle=clamp(-delta*0.22,-15,8);
    return `rotate(${angle.toFixed(2)}deg)`;
  }

  let applying=false;
  function apply(){
    if(applying)return;
    applying=true;
    const t=desiredTransform();
    if(leg.style.transform!==t)leg.style.transform=t;
    applying=false;
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(apply));
  observer.observe(leg,{attributes:true,attributeFilter:['style']});

  ['input','change'].forEach(evt=>{
    slider.addEventListener(evt,()=>requestAnimationFrame(apply));
    document.getElementById('bodyLean')?.addEventListener(evt,()=>requestAnimationFrame(apply));
    document.getElementById('speed')?.addEventListener(evt,()=>requestAnimationFrame(apply));
  });

  ['runTestBtn','startBtn','conceptContinue'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',()=>requestAnimationFrame(apply));
  });

  foot.addEventListener('pointermove',()=>requestAnimationFrame(apply));
  foot.addEventListener('pointerup',()=>requestAnimationFrame(apply));

  apply();
})();
