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
  note.textContent='Mission complete. Le résultat reste visible : inspecte la scène aussi longtemps que tu veux, puis rejoue ou retourne à la Campaign Map quand tu le décides.';

  const actions=card.querySelector('.complete-actions');
  if(actions)card.insertBefore(note,actions); else card.appendChild(note);
  inline.appendChild(card);

  const reflection=host.querySelector('#reflection');
  if(reflection&&reflection.parentElement===host)reflection.insertAdjacentElement('afterend',inline);
  else host.appendChild(inline);

  const frozen=new Map();
  const freezeScene=()=>{
    const game=document.getElementById('game');
    if(!game)return;
    if(document.activeElement&&game.contains(document.activeElement)&&!inline.contains(document.activeElement))document.activeElement.blur();
    game.querySelectorAll('input,button,select,textarea,[contenteditable="true"]').forEach(el=>{
      if(inline.contains(el))return;
      if(!frozen.has(el))frozen.set(el,{tabindex:el.getAttribute('tabindex'),aria:el.getAttribute('aria-disabled')});
      el.classList.add('completion-frozen-control');
      el.setAttribute('aria-disabled','true');
      el.setAttribute('tabindex','-1');
    });
  };
  const unfreezeScene=()=>{
    frozen.forEach((state,el)=>{
      el.classList.remove('completion-frozen-control');
      if(state.aria===null)el.removeAttribute('aria-disabled');else el.setAttribute('aria-disabled',state.aria);
      if(state.tabindex===null)el.removeAttribute('tabindex');else el.setAttribute('tabindex',state.tabindex);
    });
    frozen.clear();
  };

  const sync=()=>{
    const complete=!modal.classList.contains('hidden');
    inline.classList.toggle('hidden',!complete);
    document.body.classList.toggle('mission-complete-preserved',complete);
    if(complete)freezeScene();else unfreezeScene();
  };
  new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['class']});
  sync();
})();
