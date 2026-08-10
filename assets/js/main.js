async function loadCampaign(){
  const host=document.getElementById('acts');
  try{
    const data=await fetch('./data/campaign.json').then(r=>r.json());
    host.innerHTML=data.acts.map(a=>`
      <article class="act">
        <div class="act-num">${String(a.id).padStart(2,'0')}</div>
        <div>
          <small>ACT ${String(a.id).padStart(2,'0')}</small>
          <h3>${a.title}</h3>
          <p>${a.focus}</p>
          <div class="unlock"><b>BUILD UNLOCK</b> · ${a.build}</div>
        </div>
      </article>`).join('');
  }catch(e){
    host.innerHTML='<p>Campaign data unavailable.</p>';
  }
}
loadCampaign();
