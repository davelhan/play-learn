/* PLAY//LEARN — QA hotfix: preserve native click-hold-drag on shared range controls.
   Root cause: setControl() rebuilt #controls on every input event, replacing the active
   <input type="range"> while the pointer was still down. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
    #controls input[type="range"]{cursor:grab;touch-action:pan-y;height:26px}
    #controls input[type="range"]:active{cursor:grabbing}
    #controls input[type="range"]::-webkit-slider-thumb{cursor:grab}
    #controls input[type="range"]:active::-webkit-slider-thumb{cursor:grabbing}
    #controls input[type="range"]::-moz-range-thumb{cursor:grab}
    #controls input[type="range"]:active::-moz-range-thumb{cursor:grabbing}
  `;
  document.head.appendChild(style);

  // Reuse the engine's state/validation functions, but do NOT rebuild the slider DOM
  // while a range input is being dragged. Select controls can still be rebuilt safely.
  setControl=function(key,v){
    const c=controlByKey(key);
    if(!c)return;
    STATE.values[key]=v;

    if(c.kind==='select'){
      STATE.seen[key]??=new Set([STATE.initial[key]]);
      STATE.seen[key].add(v);
      markInteraction(key,v);
      renderControls();
      renderAll();
      return;
    }

    const rr=STATE.ranges[key];
    if(rr){rr.min=Math.min(rr.min,v);rr.max=Math.max(rr.max,v)}
    markInteraction(key,v);

    // Update only the live value label. Keeping the same <input> node alive preserves
    // browser pointer capture, so click + hold + drag remains continuous.
    const valueEl=document.getElementById('cv-'+key);
    if(valueEl)valueEl.textContent=valueText(c,v);

    renderAll();
  };
})();
