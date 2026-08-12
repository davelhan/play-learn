/* QA5 hotfix 3 — final redesign for 07.04 thermal allocation. */
(()=>{
const Q=(id,patch)=>PLAYLEARN_QA3_PATCH(id,Object.assign({},PLAYLEARN_QA3_PATCHES[id]||{},patch));
Q('07.04',{
 title:'HEAT & COOLING',
 concept:'Thermal design can spend package mass on passive heat spreading or electrical power on active cooling. Airflow blockage weakens the active path, so the best allocation changes even though heat generation does not.',
 scenario:'The actuator dissipates fixed heat. Allocate heatsink mass and cooling power inside one thermal-system budget.',
 conditions:[
  {key:'loss',label:'HEAT GENERATION',value:180,unit:'W'},
  {key:'blockage',label:'AIRFLOW BLOCKAGE',value:0,unit:''},
  {key:'thermalBudget',label:'THERMAL SYSTEM BUDGET',value:1.5,unit:'units'},
  {key:'tempLimit',label:'MAX SURFACE TEMPERATURE',value:62,unit:'°C'}
 ],
 controls:[
  {key:'sinkMass',label:'PASSIVE HEATSINK MASS',kind:'range',min:.2,max:2,step:.1,base:.7,unit:'kg'},
  {key:'fanPower',label:'ACTIVE COOLING POWER',kind:'range',min:5,max:80,step:5,base:30,unit:'W'}
 ],
 metrics:[
  {label:'PASSIVE THERMAL RESISTANCE',expr:'.48/(1+1.8*sinkMass)',unit:'K/W'},
  {label:'EFFECTIVE ACTIVE COOLING',expr:'1+(fanPower/45)*max(.05,1-blockage)',unit:'×'},
  {label:'SURFACE TEMP',expr:'30+loss*(.48/(1+1.8*sinkMass))/(1+(fanPower/45)*max(.05,1-blockage))',unit:'°C',good:'v<s.tempLimit'},
  {label:'THERMAL SYSTEM COST',expr:'sinkMass+fanPower/60',unit:'units',good:'v<=s.thermalBudget'}
 ],
 goal:'30+loss*(.48/(1+1.8*sinkMass))/(1+(fanPower/45)*max(.05,1-blockage))<tempLimit && sinkMass+fanPower/60<=thermalBudget',
 goalText:'Keep temperature below the limit by allocating finite budget between passive mass and active cooling power.',
 disturbance:{label:'AIR INLET 75% BLOCKED',set:{blockage:.75}},
 transferGoal:'30+loss*(.48/(1+1.8*sinkMass))/(1+(fanPower/45)*max(.05,1-blockage))<tempLimit && sinkMass+fanPower/60<=thermalBudget',
 transferText:'Airflow efficiency fell enough to invalidate the nominal allocation. Rebalance passive mass and active power inside the same budget.'
});
})();