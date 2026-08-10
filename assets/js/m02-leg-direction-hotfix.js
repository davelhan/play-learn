/* M02 QA5.2 — simple visual swing-leg mapping.
   This is intentionally NOT an IK solver. The mission teaches foot-placement
   relationships, not leg kinematics. Keep the silhouette coherent and map the
   abstract Next foot position to a limited hip swing only.
   Mission state, scoring and pedagogy are untouched.
*/
(()=>{
  const leg=document.getElementById('swingLeg');
  const foot=document.getElementById('swingFoot');
  const slider=document.getElementById('footPosition');
  if(!leg||!foot||!slider)return;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  // Ensure the original DOM silhouette is used. No re-parenting, no SVG limbs.
  leg.style.display='';
  leg.style.transformOrigin='50% 6%';

  function desiredTransform(){
    const value=Number(slider.value||22);
    const delta=value-22;

    // CSS positive rotation makes a downward leg move visually left.
    // Therefore forward/right foot placement uses a negative angle.
    // Clamp hard so the robot always keeps a believable silhouette.
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

  // The main mission render writes its own legacy transform. Re-apply this
  // visual mapping afterwards whenever the style changes.
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
