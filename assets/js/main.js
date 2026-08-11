const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

/* Keep the native details +/- control out of the grid flow on every viewport. */
const campaignMapFix=document.createElement('style');
campaignMapFix.textContent='.act summary{position:relative;padding-right:62px!important}.act summary:after{position:absolute!important;right:20px;top:50%;transform:translateY(-50%)}';
document.head.appendChild(campaignMapFix);

function completionKey(id){
  const parts=String(id).split('.');
  if(parts.length!==2)return null;
  return `playlearn_a${parts[0]}m${parts[1]}_complete`;
}

function applyProgress(data,progress){
  (data.acts||[]).forEach(a=>{
    const ap=progress?.acts?.[String(a.id)];
    if(ap)Object.assign(a,ap);
    (a.missions||[]).forEach(m=>{
      const mp=progress?.missions?.[m.id];
      if(mp)Object.assign(m,mp);
      const key=completionKey(m.id);
      if(key&&localStorage.getItem(key)==='true')m.status='COMPLETED';
    });
  });

  const act1=data.acts?.find(a=>a.id===1);
  const act1Complete=act1?.missions?.length===6&&act1.missions.every(m=>m.status==='COMPLETED');
  if(act1Complete){
    act1.status='COMPLETED';
    act1.open=true;
    const act2=data.acts?.find(a=>a.id===2);
    if(act2){
      act2.status='NEXT TO DESIGN';
      act2.open=true;
      const first=act2.missions?.find(m=>m.id==='02.01');
      if(first&&!first.url)first.status='NEXT TO BUILD';
    }
  }
  return data;
}

function missionRow(m){
  const completed=m.status==='COMPLETED'&&m.url;
  const playable=(m.status==='PLAYABLE'||completed)&&m.url;
  const next=m.status==='NEXT TO BUILD';
  return `<div class="roadmap-mission ${playable?'playable':''} ${completed?'completed':''} ${next?'next':''}">
    <div class="roadmap-id">${esc(m.id)}</div>
    <div class="roadmap-copy">
      <b>${esc(m.title)}</b>
      <span>${esc(m.type)}</span>
      ${m.description?`<p>${esc(m.description)}</p>`:''}
    </div>
    <div class="roadmap-status">${esc(m.status)}</div>
    ${playable?`<a class="roadmap-play" href="${esc(m.url)}">${completed?'REPLAY':'START'}</a>`:''}
  </div>`;
}

function actCard(a){
  const isComplete=a.status==='COMPLETED';
  const isActive=a.status==='ACTIVE';
  const isNext=a.status==='NEXT TO DESIGN';
  const refs=(a.prototype_refs||[]).map(r=>`<span class="prototype-ref">REFERENCE · ${esc(r)}</span>`).join('');
  const statusClass=isComplete?'complete':isActive?'active':isNext?'next':'locked';
  return `<article class="act ${isComplete?'act-complete':''}">
    <details ${a.open?'open':''}>
      <summary>
        <div class="act-num">${String(a.id).padStart(2,'0')}</div>
        <div class="act-copy">
          <small>ACT ${String(a.id).padStart(2,'0')}</small>
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.focus)}</p>
        </div>
        <div class="act-meta">${refs}<span class="act-status ${statusClass}">${esc(a.status)}</span></div>
      </summary>
      <div class="act-body">
        <div class="act-purpose"><div><b>BUILD UNLOCK</b><span> · ${esc(a.build)}</span></div><span>6 CORE MISSIONS</span></div>
        <div class="mission-list">${(a.missions||[]).map(missionRow).join('')}</div>
      </div>
    </details>
  </article>`;
}

function prototypeCard(p){
  return `<article class="mission-card prototype-card">
    <div class="mission-card-top"><div class="mission-number prototype-number">${esc(p.id)}</div><div class="mission-status validated">VALIDATED</div></div>
    <div class="mission-card-copy"><p class="mission-domain">${esc(p.focus)}</p><h3>${esc(p.title)}</h3><p>${esc(p.subtitle)}</p><p class="prototype-map">CURRICULUM REFERENCE · ${esc(p.maps_to)}</p></div>
    <a class="button primary mission-start" href="${esc(p.url)}">OPEN ${esc(p.id)}</a>
  </article>`;
}

async function loadCampaign(){
  const host=document.getElementById('acts');
  const prototypes=document.getElementById('prototypeGrid');
  try{
    const [data,progress]=await Promise.all([
      fetch('./data/campaign.json?v=map-20260810').then(r=>{if(!r.ok)throw new Error('Campaign data unavailable');return r.json();}),
      fetch('./data/campaign-progress.json?v=0106-20260811').then(r=>r.ok?r.json():null).catch(()=>null)
    ]);
    applyProgress(data,progress);
    host.innerHTML=data.acts.map(actCard).join('');
    if(prototypes)prototypes.innerHTML=data.validated_prototypes.map(prototypeCard).join('<div class="mission-arrow" aria-hidden="true">→</div>');
  }catch(e){
    host.innerHTML='<p>Campaign data unavailable.</p>';
    if(prototypes)prototypes.innerHTML='<p>Prototype data unavailable.</p>';
  }
}
loadCampaign();