/* PLAY//LEARN QA3 — pedagogical rework patch loader. Loaded before mission-batch-engine.js. */
(function(root){
  const store=root.PLAYLEARN_QA3_PATCHES=root.PLAYLEARN_QA3_PATCHES||{};
  root.PLAYLEARN_QA3_PATCH=(id,patch)=>{store[id]=patch;};
  root.PLAYLEARN_QA3_APPLY=(m)=>store[m?.id]?Object.assign({},m,store[m.id]):m;
  if(typeof window==='undefined'||!window.fetch)return;
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const r=await nativeFetch(input,init);
    const u=typeof input==='string'?input:(input?.url||'');
    if(!/missions-act-\d+\.json/.test(u))return r;
    const data=await r.clone().json();
    data.version='2026-08-12-qa3-rework';
    data.missions=(data.missions||[]).map(root.PLAYLEARN_QA3_APPLY);
    return new Response(JSON.stringify(data),{status:r.status,statusText:r.statusText,headers:{'Content-Type':'application/json'}});
  };
})(globalThis);
