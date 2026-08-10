/* M02 QA5.2 — visual-only two-segment swing-leg IK.
   Keeps mission logic/scoring untouched. Replaces the rigid-leg visual with
   a simple hip → knee → ankle chain driven by Next foot position.
*/
(()=>{
  const robot=document.getElementById('robot');
  const legacyLeg=document.getElementById('swingLeg');
  const foot=document.getElementById('swingFoot');
  const slider=document.getElementById('footPosition');
  if(!robot||!legacyLeg||!foot||!slider)return;

  robot.appendChild(foot);
  legacyLeg.style.display='none';

  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 270 420');
  svg.setAttribute('aria-hidden','true');
  Object.assign(svg.style,{position:'absolute',left:'0',top:'0',width:'270px',height:'420px',overflow:'visible',pointerEvents:'none',zIndex:'6'});

  const makeLine=(width,stroke)=>{
    const l=document.createElementNS(ns,'line');
    l.setAttribute('stroke',stroke);l.setAttribute('stroke-width',String(width));l.setAttribute('stroke-linecap','round');
    svg.appendChild(l);return l;
  };
  const thigh=makeLine(30,'#78858f');
  const shin=makeLine(28,'#75828c');
  const knee=document.createElementNS(ns,'circle');
  knee.setAttribute('r','16');knee.setAttribute('fill','#707d87');svg.appendChild(knee);
  robot.appendChild(svg);

  Object.assign(foot.style,{position:'absolute',width:'62px',height:'22px',margin:'0',top:'0',left:'0',zIndex:'12',transform:'none',transformOrigin:'50% 50%',cursor:'ew-resize',pointerEvents:'auto'});

  const HIP={x:171,y:239};
  const L1=82,L2=76;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function solveKnee(fx,fy){
    let dx=fx-HIP.x,dy=fy-HIP.y;
    let r=Math.hypot(dx,dy)||1;
    const maxR=L1+L2-0.5,minR=Math.abs(L1-L2)+0.5;
    const rr=clamp(r,minR,maxR);
    const ux=dx/r,uy=dy/r;
    if(rr!==r){fx=HIP.x+ux*rr;fy=HIP.y+uy*rr;dx=fx-HIP.x;dy=fy-HIP.y;r=rr;}
    const a=(L1*L1-L2*L2+r*r)/(2*r);
    const h=Math.sqrt(Math.max(0,L1*L1-a*a));
    const px=HIP.x+a*(dx/r),py=HIP.y+a*(dy/r);
    const perpX=-dy/r,perpY=dx/r;
    const sign=dx>=0?1:-1;
    return {x:px+sign*h*perpX,y:py+sign*h*perpY,fx,fy};
  }

  function apply(){
    const value=Number(slider.value||22);
    const dx=clamp((value-22)*1.05,-74,74);
    const desiredX=HIP.x+dx;
    const desiredY=394-Math.abs(dx)*0.45;
    const p=solveKnee(desiredX,desiredY);

    thigh.setAttribute('x1',HIP.x);thigh.setAttribute('y1',HIP.y);thigh.setAttribute('x2',p.x);thigh.setAttribute('y2',p.y);
    shin.setAttribute('x1',p.x);shin.setAttribute('y1',p.y);shin.setAttribute('x2',p.fx);shin.setAttribute('y2',p.fy);
    knee.setAttribute('cx',p.x);knee.setAttribute('cy',p.y);

    foot.style.left=`${p.fx-31}px`;
    foot.style.top=`${p.fy-9}px`;
    foot.style.transform=`rotate(${clamp(-dx*.035,-3,3)}deg)`;
  }

  ['input','change'].forEach(evt=>slider.addEventListener(evt,()=>requestAnimationFrame(apply)));
  foot.addEventListener('pointermove',()=>requestAnimationFrame(apply));
  foot.addEventListener('pointerup',()=>requestAnimationFrame(apply));
  document.getElementById('runTestBtn')?.addEventListener('click',()=>requestAnimationFrame(apply));
  document.getElementById('startBtn')?.addEventListener('click',()=>requestAnimationFrame(apply));

  apply();
})();
