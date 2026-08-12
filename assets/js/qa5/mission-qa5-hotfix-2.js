/* QA5 regression hotfix 2 — final trade-off tightening and phase semantics. */
(()=>{
const Q=(id,patch)=>PLAYLEARN_QA3_PATCH(id,Object.assign({},PLAYLEARN_QA3_PATCHES[id]||{},patch));

// 03.04 — max cooling is no longer a free nominal optimum.
{
 const p=PLAYLEARN_QA3_PATCHES['03.04'];
 const conditions=p.conditions.map(c=>c.key==='packageBudget'?Object.assign({},c,{value:3.5}):c);
 Q('03.04',{conditions});
}

// 03.06 — each Gate case now has a meaningful window, and motor mass remains an architecture constraint.
{
 const p=PLAYLEARN_QA3_PATCHES['03.06'];
 const conditions=[...(p.conditions||[]),{key:'minOutputTorque',label:'MIN AGILITY OUTPUT TORQUE',value:40,unit:'N·m'}];
 const metrics=p.metrics.map(mm=>mm.label==='MOTOR MASS'?Object.assign({},mm,{goodGate:'v<=s.massBudget'}):mm);
 const gates=p.gateCases.map((g,i)=>{
   if(i===0)return Object.assign({},g,{set:Object.assign({},g.set,{loadMass:7.5}),goal:'.9*ratio*(motor=="FAST"?6:motor=="BALANCED"?9:13)>1.2*(loadMass*9.81*.35+loadMass*.35*.35*3) && (motor=="FAST"?.9:motor=="BALANCED"?1.3:2.1)<=massBudget'});
   if(i===1)return Object.assign({},g,{goal:'.9*ratio*(motor=="FAST"?6:motor=="BALANCED"?9:13)>minOutputTorque && (motor=="FAST"?70:motor=="BALANCED"?50:34)/ratio>minUsefulSpeed && (motor=="FAST"?.0007:motor=="BALANCED"?.0012:.002)*ratio*ratio<.14 && (motor=="FAST"?.9:motor=="BALANCED"?1.3:2.1)<=massBudget'});
   if(i===2)return Object.assign({},g,{goal:'.9*ratio*(motor=="FAST"?6:motor=="BALANCED"?9:13)>(loadMass*9.81*.35+loadMass*.35*.35*3) && (loadMass*9.81*.35+loadMass*.35*.35*3)**2*duty/(((motor=="FAST"?4:motor=="BALANCED"?6.5:10)*ratio)**2*cooling)<.3 && (motor=="FAST"?70:motor=="BALANCED"?50:34)/ratio>minUsefulSpeed && (motor=="FAST"?.0007:motor=="BALANCED"?.0012:.002)*ratio*ratio<.14 && (motor=="FAST"?.9:motor=="BALANCED"?1.3:2.1)<=massBudget'});
   if(i===3)return Object.assign({},g,{goal:'speed>=minUsefulSpeed && (loadMass*9.81*.35+loadMass*.35*.35*3)*speed<powerLimit && (loadMass*9.81*.35+loadMass*.35*.35*3)**2*duty/(((motor=="FAST"?4:motor=="BALANCED"?6.5:10)*ratio)**2*cooling)<1.5 && (motor=="FAST"?.9:motor=="BALANCED"?1.3:2.1)<=massBudget'});
   return g;
 });
 Q('03.06',{conditions,metrics,gateCases:gates});
}

// 05.03 — degraded fusion has its own accepted uncertainty target.
{
 const p=PLAYLEARN_QA3_PATCHES['05.03'];
 const metrics=p.metrics.map(mm=>{
   if(mm.label==='FUSED 1σ')return Object.assign({},mm,{goodTransfer:'v<1.30',statusTransfer:'DEGRADED · ACCEPTED < 1.30°'});
   if(mm.label==='IMU WEIGHT')return Object.assign({},mm,{goodTransfer:'v>.85 && v<.95'});
   if(mm.label==='VISION WEIGHT')return Object.assign({},mm,{goodTransfer:'v>.05',statusTransfer:'SMALL BACKUP WEIGHT RETAINED'});
   return mm;
 });
 Q('05.03',{metrics});
}

// 06.05 — stale AI evidence is intentionally bad world state; authority decision is the target.
{
 const p=PLAYLEARN_QA3_PATCHES['06.05'];
 const metrics=p.metrics.map(mm=>{
   if(mm.label==='WATCHDOG MARGIN')return Object.assign({},mm,{goodTransfer:null,statusTransfer:'WORLD FAULT · COMMAND STALE'});
   if(mm.label==='SAFE PROPOSAL')return Object.assign({},mm,{goodTransfer:null,statusTransfer:'WORLD FAULT · DO NOT EXECUTE'});
   if(mm.label==='AUTHORITY CORRECT')return Object.assign({},mm,{goodTransfer:'v>.5'});
   return mm;
 });
 Q('06.05',{metrics});
}

// 07.02 — transfer metric cards now represent the same low-SoC reserve definition as the goal.
{
 const p=PLAYLEARN_QA3_PATCHES['07.02'];
 const metrics=p.metrics.map(mm=>{
   if(mm.label==='STORED ENERGY')return Object.assign({},mm,{goodTransfer:'v>.25',statusTransfer:'LOW SOC · MINIMUM USABLE ENERGY'});
   if(mm.label==='RESERVE ENERGY')return Object.assign({},mm,{expr:'voltage*capacity*max(soc-.15,0)/1000',good:'v>.35',goodTransfer:'v>.15'});
   return mm;
 });
 Q('07.02',{metrics});
}

// 07.04 — passive and active cooling now compete inside a genuinely binding package budget.
{
 const p=PLAYLEARN_QA3_PATCHES['07.04'];
 const conditions=p.conditions.map(c=>c.key==='thermalBudget'?Object.assign({},c,{value:2.6}):c);
 Q('07.04',{conditions});
}
})();
