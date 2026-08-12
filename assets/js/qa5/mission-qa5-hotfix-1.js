/* QA5 regression hotfix 1 — preserve pedagogy while fixing real/discrete QA boundaries. */
(()=>{
const Q=(id,patch)=>PLAYLEARN_QA3_PATCH(id,Object.assign({},PLAYLEARN_QA3_PATCHES[id]||{},patch));

{
 const p=PLAYLEARN_QA3_PATCHES['03.06'];
 const gates=p.gateCases.map((g,i)=>i===2?Object.assign({},g,{set:Object.assign({},g.set,{minUsefulSpeed:3})}):g);
 Q('03.06',{gateCases:gates});
}

{
 const p=PLAYLEARN_QA3_PATCHES['05.05'];
 Q('05.05',{disturbance:Object.assign({},p.disturbance,{set:Object.assign({},p.disturbance.set,{maxClear:.85})})});
}

{
 const p=PLAYLEARN_QA3_PATCHES['07.06'];
 const conditions=[...(p.conditions||[]),{key:'fixedArchitectureCost',label:'FIXED BUS / BUFFER OVERHEAD',value:2,unit:'units'}];
 const metrics=p.metrics.map(mm=>mm.label==='ARCHITECTURE COST'?Object.assign({},mm,{goodGate:['v<=s.architectureBudget','v<=s.architectureBudget','v<=s.architectureBudget',null],statusGate:{3:'N/A · FIXED OVERHEAD CARRIED'}}):mm);
 metrics.push({label:'THERMAL / ENERGY CASE COST',expr:'1.8*energy+.25*coolBoost+fixedArchitectureCost',unit:'units',good:null,goodGate:[null,null,null,'v<=s.architectureBudget'],statusGate:{0:'N/A',1:'N/A',2:'N/A',3:'CASE BUDGET OK'}});
 const gates=p.gateCases.map((g,i)=>i===3?Object.assign({},g,{set:Object.assign({},g.set,{fixedArchitectureCost:2}),goal:'mode=="RETURN" && 65-(temp-coolBoost)>8 && energy*max(soc-.15,0)*1000>dock*.7 && 1.8*energy+.25*coolBoost+fixedArchitectureCost<=architectureBudget'}):g);
 Q('07.06',{conditions,metrics,gateCases:gates});
}
})();
