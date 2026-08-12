import fs from 'fs';
import vm from 'vm';

globalThis.PLAYLEARN_QA3_PATCHES={};
globalThis.PLAYLEARN_QA3_PATCH=(id,p)=>PLAYLEARN_QA3_PATCHES[id]=p;
for(const a of ['02','03','04','05','06','07','08','09','10']){
  const p=`assets/js/qa3/mission-qa3-act${a}.js`;
  vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});
}
const get=id=>{
  const act=id.split('.')[0];
  const base=JSON.parse(fs.readFileSync(`data/missions-act-${act}.json`,'utf8')).missions.find(m=>m.id===id);
  return Object.assign({},base,PLAYLEARN_QA3_PATCHES[id]||{});
};
const errors=[];
const check=(ok,msg)=>{if(!ok)errors.push(msg)};

const m302=get('03.02');
check(m302.controls.some(c=>c.key==='motor'&&c.kind==='select'),'03.02 must use a discrete MOTOR FAMILY choice');
check(!m302.controls.some(c=>['motorTorque','motorSpeed'].includes(c.key)),'03.02 must not expose free independent motor torque/speed sliders');
check(/massBudget/.test(m302.goal),'03.02 goal must include the motor mass budget');

const m403=get('04.03');
check(!m403.metrics.some(x=>/CAPTURE POINT/i.test(x.label)),'04.03 must not expose the exact numeric capture-point answer as a metric');
check(/recovery region/i.test(m403.goalText),'04.03 should direct the learner to the spatial recovery region');

const m504=get('05.04');
check(/processQ\*measureR\/\(processQ\+measureR\)<1/.test(m504.goal),'05.04 nominal goal must bound estimator uncertainty width');
check(/processQ\*measureR\/\(processQ\+measureR\)<1/.test(m504.transferGoal),'05.04 transfer goal must bound estimator uncertainty width');
check(/processQ>measureR/.test(m504.transferGoal),'05.04 slip transfer must change model weighting, not only flip a mode');

const m603=get('06.03');
check(m603.conditions.some(c=>c.key==='minPerformance'),'06.03 must impose a useful-performance floor');
check(/minPerformance/.test(m603.goal)&&/minPerformance/.test(m603.transferGoal),'06.03 pass logic must include useful performance');

const m703=get('07.03');
check(m703.conditions.some(c=>c.key==='budget'),'07.03 must impose a finite hardware budget');
check(m703.controls.some(c=>c.key==='regenShare'),'07.03 must expose regen/mechanical braking allocation');
check(/budget/.test(m703.goal)&&/regenShare/.test(m703.goal),'07.03 goal must couple power routing with the hardware budget');

const m902=get('09.02');
check(m902.conditions.some(c=>c.key==='minSpeed'),'09.02 must impose minimum useful operating speed');
check(/speed>=minSpeed/.test(m902.goal)&&/speed>=minSpeed/.test(m902.transferGoal),'09.02 cannot be solved by slowing arbitrarily toward zero');

const m1001=get('10.01');
check(m1001.metrics.some(x=>/UNDERCLAIM/i.test(x.label)),'10.01 must penalize underclaim as well as overclaim');
check(/abs\(claim-/.test(m1001.goal),'10.01 must match claim strength to supported evidence, not merely cap overclaim');

console.log(`QA4_REPRESENTATIVE_ERRORS=${errors.length}`);
for(const e of errors)console.error('FAIL:',e);
if(errors.length)process.exitCode=1;
