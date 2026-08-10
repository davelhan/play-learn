const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

/* Keep the native details +/- control out of the grid flow on every viewport. */
const campaignMapFix=document.createElement('style');
campaignMapFix.textContent='.act summary{position:relative;padding-right:62px!important}.act summary:after{position:absolute!important;right:20px;top:50%;transform:translateY(-50%)}';
document.head.appendChild(campaignMapFix);

function applyProgress(data,progress){
  if(progress){
    (data.acts||[]).forEach(a=>{
      const ap=progress.acts?.[String(a.id)];
      if(ap)Object.assign(a,ap);
      (a.missions||[]).forEach(m=>{
        const mp=progress.missions?.[m.id];
        if(mp)Object.assign(m,mp);
      });
    });
  }
  const act1=data.acts?.[0];
  const m0101=act1?.missions?.find(m=>m.id==='01.01');
  const m0102=act1?.missions?.find(m=>m.id==='01.02');
  if(m0101&&localStorage.getItem('playlearn_a01m01_complete')==='true')m0101.status='COMPLETED';
  if(m0102&&localStorage.getItem('playlearn_a01m02_complete')==='true')m0102.status='COMPLETED';
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
  const isActive=a.status==='ACTIVE';
  const isNext=a.status==='NEXT TO DESIGN';
  const refs=(a.prototype_refs||[]).map(r=>`<span class="prototype-ref">REFERENCE · ${esc(r)}</span>`).join('');
  return `<article class="act">
    <details ${a.open?'open':''}>
      <summary>
        <div class="act-num">${String(a.id).padStart(2,'0')}</div>
        <div class="act-copy">
          <small>ACT ${String(a.id).padStart(2,'0')}</small>
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.focus)}</p>
        </div>
        <div class="act-meta">
          ${refs}
          <span class="act-status ${isActive?'active':isNext?'next':'locked'}">${esc(a.status)}</span>
        </div>
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
    <div class="mission-card-top">
      <div class="mission-number prototype-number">${esc(p.id)}</div>
      <div class="mission-status validated">VALIDATED</div>
    </div>
    <div class="mission-card-copy">
      <p class="mission-domain">${esc(p.focus)}</p>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.subtitle)}</p>
      <p class="prototype-map">CURRICULUM REFERENCE · ${esc(p.maps_to)}</p>
    </div>
    <a class="button primary mission-start" href="${esc(p.url)}">OPEN ${esc(p.id)}</a>
  </article>`;
}

async function loadCampaign(){
  const host=document.getElementById('acts');
  const prototypes=document.getElementById('prototypeGrid');
  try{
    const [data,progress]=await Promise.all([
      fetch('./data/campaign.json?v=map-20260810').then(r=>{if(!r.ok)throw new Error('Campaign data unavailable');return r.json();}),
      fetch('./data/campaign-progress.json?v=0102-20260810').then(r=>r.ok?r.json():null).catch(()=>null)
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
