/* PLAY//LEARN — preserve the successful scene until the learner explicitly leaves or replays. */
(()=>{
  const modal=document.getElementById('completeModal');
  if(!modal)return;
  const card=modal.querySelector('.modal-card');
  const host=document.querySelector('#game .center-panel')||document.querySelector('#game')||document.querySelector('main');
  if(!card||!host)return;

  modal.classList.add('completion-inline-source');

  const inline=document.createElement('section');
  inline.id='inlineCompletion';
  inline.className='completion-inline hidden';
  inline.setAttribute('aria-live','polite');
  inline.setAttribute('aria-label','Mission complete');

  const note=document.createElement('p');
  note.className='completion-hold-note';
  note.textContent='Mission terminée. Le résultat reste visible : inspecte la scène aussi longtemps que tu veux, puis rejoue ou retourne à la Campaign Map quand tu le décides.';

  const actions=card.querySelector('.complete-actions');
  if(actions)card.insertBefore(note,actions); else card.appendChild(note);
  inline.appendChild(card);

  const reflection=host.querySelector('#reflection');
  if(reflection&&reflection.parentElement===host)reflection.insertAdjacentElement('afterend',inline);
  else host.appendChild(inline);

  const sync=()=>{
    const complete=!modal.classList.contains('hidden');
    inline.classList.toggle('hidden',!complete);
    document.body.classList.toggle('mission-complete-preserved',complete);
  };
  new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['class']});
  sync();
})();
