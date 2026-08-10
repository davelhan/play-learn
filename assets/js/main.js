const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function missionRow(m){
  const next=m.status==='NEXT TO BUILD';
  return `<div class="roadmap-mission ${next?'next':''}">
    <div class="roadmap-id">${esc(m.id)}</div>
    <div class="roadmap-copy">
      <b>${esc(m.title)}</b>
      <span>${esc(m.type)}</span>
      ${m.description?`<p>${esc(m.description)}</p>`:''}
    </div>
    <div class="roadmap-status">${esc(m.status)}</div>
  </div>`;
}

function actCard(a){
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
          <span class="act-status ${isNext?'next':'locked'}">${esc(a.status)}</span>
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
    const data=await fetch('./data/campaign.json?v=map-20260810').then(r=>{
      if(!r.ok)throw new Error('Campaign data unavailable');
      return r.json();
    });
    host.innerHTML=data.acts.map(actCard).join('');
    if(prototypes)prototypes.innerHTML=data.validated_prototypes.map(prototypeCard).join('<div class="mission-arrow" aria-hidden="true">→</div>');
  }catch(e){
    host.innerHTML='<p>Campaign data unavailable.</p>';
    if(prototypes)prototypes.innerHTML='<p>Prototype data unavailable.</p>';
  }
}

loadCampaign();
