/* PLAY//LEARN QA5 — phase-aware metric semantics.
   A metric can define goodApply / goodTransfer / goodGate and statusApply / statusTransfer / statusGate.
   Explicit null means the metric is evidence but is not a target in that phase. */
(()=>{
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function phaseRule(mm){
  if(STATE.mission?.gateCases){
    if(own(mm,'goodGate')){
      if(Array.isArray(mm.goodGate))return mm.goodGate[STATE.gateIndex]??null;
      if(mm.goodGate&&typeof mm.goodGate==='object')return mm.goodGate[STATE.gateIndex]??mm.goodGate.default??null;
      return mm.goodGate;
    }
    return mm.good;
  }
  if(STATE.phase===1&&own(mm,'goodApply'))return mm.goodApply;
  if(STATE.phase>=2&&own(mm,'goodTransfer'))return mm.goodTransfer;
  return mm.good;
}
function phaseStatus(mm,pass,rule){
  let custom=null;
  if(STATE.mission?.gateCases){
    const s=mm.statusGate;
    custom=Array.isArray(s)?s[STATE.gateIndex]:(s&&typeof s==='object'?s[STATE.gateIndex]??s.default:s);
  }else if(STATE.phase===1)custom=mm.statusApply;
  else if(STATE.phase>=2)custom=mm.statusTransfer;
  if(rule==null)return custom||'LIVE EVIDENCE · NOT A TARGET';
  if(pass===true)return custom||'MARGIN OK';
  if(pass===false)return'OUTSIDE TARGET';
  return custom||'LIVE EVIDENCE';
}
getMetrics=function(){return STATE.mission.metrics.map(mm=>{const v=Number(evalExpr(mm.expr)),rule=phaseRule(mm);return{...mm,value:v,activeRule:rule,pass:rule==null?null:metricGood(rule,v)}})};
renderMetrics=function(){const metrics=getMetrics();$('metrics').innerHTML=metrics.map(mm=>{const cls=mm.pass===true?'good':mm.pass===false?'bad':'neutral';return`<div class="metric-card ${cls}"><span>${mm.label}</span><b>${metricValueText(mm,mm.value)}</b><small>${phaseStatus(mm,mm.pass,mm.activeRule)}</small></div>`}).join('');return metrics};
})();
