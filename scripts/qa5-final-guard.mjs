import fs from 'fs';
import vm from 'vm';

globalThis.PLAYLEARN_QA3_PATCHES={};
globalThis.PLAYLEARN_QA3_PATCH=(id,p)=>PLAYLEARN_QA3_PATCHES[id]=p;
for(const a of ['02','03','04','05','06','07','08','09','10'])vm.runInThisContext(fs.readFileSync(`assets/js/qa3/mission-qa3-act${a}.js`,'utf8'));
for(const f of ['mission-qa5-reworks.js','mission-qa5-hotfix-1.js','mission-qa5-hotfix-2.js','mission-qa5-hotfix-3.js'])vm.runInThisContext(fs.readFileSync(`assets/js/qa5/${f}`,'utf8'));

function raw(id){const a=id.slice(0,2);return JSON.parse(fs.readFileSync(`data/missions-act-${a}.json`,'utf8')).missions.find(m=>m.id===id)}
function mission(id){return Object.assign({},raw(id),PLAYLEARN_QA3_PATCHES[id]||{})}
function hasControl(m,key,kind){const c=(m.controls||[]).find(x=>x.key===key);return!!c&&(!kind||c.kind===kind)}
function hasCondition(m,key){return(m.conditions||[]).some(x=>x.key===key)}
function includesAll(s,parts){return parts.every(x=>(s||'').includes(x))}
const checks=[];const ok=(id,name,test)=>checks.push({id,name,pass:!!test});

let m=mission('03.01');ok('03.01','task payload/acceleration are imposed, not player sliders',!hasControl(m,'mass')&&!hasControl(m,'alpha')&&hasCondition(m,'mass')&&hasCondition(m,'alpha')&&hasCondition(m,'minReach'));
m=mission('03.04');ok('03.04','fixed task torque + actuator package + finite package budget',hasCondition(m,'taskTorque')&&hasCondition(m,'packageBudget')&&hasControl(m,'actuator','select')&&hasControl(m,'cooling','range')&&includesAll(m.goal,['taskTorque','packageBudget']));
m=mission('03.06');ok('03.06','Gate inherits motor family, mass and useful-speed constraints',hasControl(m,'motor','select')&&hasCondition(m,'massBudget')&&hasCondition(m,'minUsefulSpeed')&&m.gateCases?.length===4&&m.gateCases.every(g=>g.goal.includes('motor'))&&m.gateCases.some(g=>g.goal.includes('minUsefulSpeed')));
m=mission('04.04');ok('04.04','gait preserves useful speed and finite swing effort',hasCondition(m,'minSpeed')&&hasCondition(m,'maxSwingCost')&&includesAll(m.goal,['minSpeed','maxSwingCost'])&&includesAll(m.transferGoal,['minSpeed','maxSwingCost']));
m=mission('05.05');ok('05.05','uncertainty planning is bounded by corridor and throughput',hasCondition(m,'maxClear')&&hasCondition(m,'minSpeed')&&includesAll(m.goal,['maxClear','minSpeed'])&&includesAll(m.transferGoal,['maxClear','minSpeed']));
m=mission('06.04');ok('06.04','real-time loops retain functional rate floors after disturbance',hasCondition(m,'minInner')&&hasCondition(m,'minOuter')&&includesAll(m.goal,['minInner','minOuter','cpuBudget'])&&includesAll(m.transferGoal,['minInner','minOuter','cpuBudget']));
m=mission('06.06');ok('06.06','real-time Gate inherits functional rate floors',hasCondition(m,'minInner')&&hasCondition(m,'minOuter')&&m.gateCases?.some(g=>includesAll(g.goal,['minInner','minOuter','cpuBudget'])));
m=mission('07.02');ok('07.02','battery sizing has mass/complexity budgets and low-SoC reserve',hasCondition(m,'massBudget')&&hasCondition(m,'complexityBudget')&&includesAll(m.goal,['massBudget','complexityBudget'])&&includesAll(m.transferGoal,['massBudget','complexityBudget','max(soc-.15'])));
m=mission('07.04');ok('07.04','thermal design trades passive mass versus active power under one budget',hasControl(m,'sinkMass','range')&&hasControl(m,'fanPower','range')&&!hasControl(m,'rth')&&hasCondition(m,'thermalBudget')&&includesAll(m.goal,['sinkMass','fanPower','thermalBudget'])&&includesAll(m.transferGoal,['sinkMass','fanPower','thermalBudget']));
m=mission('07.06');ok('07.06','energy Gate uses a shared architecture budget',hasCondition(m,'architectureBudget')&&m.gateCases?.length===4&&m.gateCases.every(g=>g.goal.includes('architectureBudget')));
m=mission('08.02');ok('08.02','tactile transfer preserves conformity and grasp authority',hasControl(m,'tension','range')&&hasControl(m,'compliance','range')&&includesAll(m.transferGoal,['compliance/(compliance+.4)','tension*(1-.25*compliance)','tactile'])) ;
m=mission('09.06');ok('09.06','safety Gate preserves throughput, lifecycle and V&V budgets',hasCondition(m,'minSpeed')&&hasCondition(m,'lifecycleBudget')&&hasCondition(m,'testBudget')&&m.gateCases?.some(g=>g.goal.includes('minSpeed'))&&m.gateCases?.some(g=>g.goal.includes('lifecycleBudget'))&&m.gateCases?.some(g=>g.goal.includes('testBudget')));

const failed=checks.filter(x=>!x.pass);console.log(`QA5_FINAL_GUARD=${checks.length-failed.length}/${checks.length}`);for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.id} — ${c.name}`);if(failed.length)process.exit(1);
