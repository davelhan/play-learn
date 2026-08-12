/* PLAY//LEARN QA4 — visual evidence for representative pedagogy fixes. */
(()=>{
 const prior=renderDomainVisual;
 const bars=(label,items)=>{const b=visualBase(label);b.insertAdjacentHTML('beforeend',`<div class="viz-center">${items.join('')}</div>`);return b};
 const chip=(label,value,cls='')=>vchips([[`${label} · ${value}`,cls]]);
 renderDomainVisual=function(){
  const id=STATE.mission.id;
  if(id==='03.02'){
   const motor=vs('motor','FAST'),ratio=vv('ratio',8);
   const mt=motor==='FAST'?6:motor==='BALANCED'?9:13;
   const ms=motor==='FAST'?70:motor==='BALANCED'?50:34;
   const mj=motor==='FAST'?.0007:motor==='BALANCED'?.0012:.0020;
   const mass=motor==='FAST'?.9:motor==='BALANCED'?1.3:2.1;
   const ot=.9*ratio*mt,os=ms/ratio,ri=mj*ratio*ratio;
   return bars('MOTOR FAMILY → TRANSMISSION',[chip('MOTOR',motor),vpair(`${vfmt(mt,1)} N·m · ${vfmt(ms,0)} rad/s`,'→',`${ratio}:1`,`fixed motor package · ${vfmt(mass,1)} kg`),vbar('OUTPUT TORQUE',ot,0,110,`${vfmt(ot,1)} / ${vfmt(vv('torqueReq',45),0)} N·m`),vbar('OUTPUT SPEED',os,0,18,`${vfmt(os,1)} / ${vfmt(vv('speedReq',3.5),1)} rad/s`),vbar('REFLECTED INERTIA',ri,0,.25,`${vfmt(ri,3)} kg·m²`),vbar('MOTOR MASS',mass,0,2.4,`${vfmt(mass,1)} / ${vfmt(vv('massBudget',1.4),1)} kg`)]);
  }
  if(id==='04.03'){
   const box=visualBase('SPATIAL RECOVERY REGION'),cp=vv('vel',.65)/Math.sqrt(9.81/vv('height',.9)),step=vv('step',.2),left=vp(cp,0,.65),width=12;
   box.insertAdjacentHTML('beforeend',`<div class="ground-track"><span class="capture" style="left:${Math.max(0,left-width/2)}%;width:${width}%;opacity:.75">RECOVERY ZONE</span><span class="foot" style="left:${vp(step,0,.65)}%">FOOT</span></div><div class="viz-caption">Place the foot inside the highlighted recovery zone · FOOT ${vfmt(step,2)} m</div>`);
   return box;
  }
  if(id==='05.04'){
   const mode=vs('contactModel','RIGID_CONTACT'),q=vv('processQ',.8),r=vv('measureR',.7),cov=q*r/(q+r),bias=(mode==='RIGID_CONTACT'?vv('slip',.02):.25*vv('slip',.02))*r/(q+r)*100,ni=vv('innovation',.015)/Math.sqrt(q+r);
   return bars('PREDICT → COMPARE → UPDATE',[chip('CONTACT MODEL',mode,mode==='SLIP_AWARE'?'good':''),vbar('ESTIMATE BIAS',bias,0,8,`${vfmt(bias,2)} cm`),vbar('NORMALIZED INNOVATION',ni,0,.2,vfmt(ni,3)),vbar('UNCERTAINTY WIDTH',cov,0,1.5,vfmt(cov,2)),vpair(`ALLOW MODEL DRIFT ${vfmt(q,1)}`,'↔',`MEASUREMENT CAUTION ${vfmt(r,1)}`)]);
  }
  if(id==='06.03'){
   const f=vv('freq',10),a=vv('amplitude',60),delay=vv('delay',6),phase=360*f*delay/1000,demand=a*f/12,perf=a*f/20,bw=Math.max(0,30-.55*delay)-f;
   return bars('USEFUL MOTION INSIDE CONTROL ENVELOPE',[vbar('USEFUL MOTION SCORE',perf,0,80,`${vfmt(perf,1)} / ${vfmt(vv('minPerformance',35),0)}`),vbar('DELAY PHASE',phase,0,110,`${vfmt(phase,0)}°`),vbar('ACTUATOR DEMAND',demand,0,120,`${vfmt(demand,0)}%`),vbar('BANDWIDTH HEADROOM',bw,-10,30,`${vfmt(bw,1)} Hz`)]);
  }
  if(id==='07.03'){
   const regen=vv('regen',3500),share=vv('regenShare',.8),limit=vv('limit',2500),dump=vv('dump',1500),soc=vv('soc',.75),accept=limit*Math.max(.15,1.25-soc),toRegen=regen*share,excess=Math.max(0,toRegen-accept-dump),cost=limit/2000+dump/2000;
   return bars('BRAKING POWER ROUTING',[vpair(`BRAKING ${vfmt(regen/1000,1)} kW`,'→',`REGEN ${vfmt(share*100,0)}%`,`mechanical brake ${vfmt((1-share)*100,0)}%`),vbar('BATTERY ACCEPT',accept,0,5000,`${vfmt(accept,0)} W`),vbar('BUFFER / DUMP',dump,0,5000,`${vfmt(dump,0)} W`),vbar('UNMANAGED EXCESS',excess,0,2500,`${vfmt(excess,0)} W`),vbar('HARDWARE COST',cost,0,6,`${vfmt(cost,2)} / ${vfmt(vv('budget',4),0)} units`)]);
  }
  if(id==='09.02'){
   const speed=vv('speed',1.1),decel=vv('decel',2),lat=vv('latency',.12),zone=vv('stopZone',.55),dist=speed*lat+speed*speed/(2*Math.min(decel,vv('maxDecel',2.4)));
   return bars('FAST ENOUGH · SAFE ENOUGH',[vbar('OPERATING SPEED',speed,.1,2.2,`${vfmt(speed,2)} / min ${vfmt(vv('minSpeed',1),2)} m/s`),vbar('STOP DISTANCE',dist,0,1,`${vfmt(dist,2)} / zone ${vfmt(zone,2)} m`),vbar('CONTROLLED DECEL',decel,.5,5,`${vfmt(decel,1)} / max ${vfmt(vv('maxDecel',2.4),1)} m/s²`)]);
  }
  if(id==='10.01'){
   const supported=.65*vv('quality',.65)+.35*vv('independence',.55),claim=vv('claim',.8),over=Math.max(0,claim-supported),under=Math.max(0,supported-claim);
   return bars('CLAIM ↔ EVIDENCE',[vbar('SUPPORTED CONFIDENCE',supported*100,0,100,`${vfmt(supported*100,1)}%`),vbar('YOUR CLAIM',claim*100,0,100,`${vfmt(claim*100,1)}%`),vbar('OVERCLAIM',over*100,0,40,`${vfmt(over*100,1)}%`),vbar('UNDERCLAIM',under*100,0,40,`${vfmt(under*100,1)}%`)]);
  }
  return prior();
 };
})();
