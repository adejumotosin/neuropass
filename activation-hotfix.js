(() => {
  const Store=window.NPStore;
  const D=window.NeuroPassData;
  if(!Store || !D) return;

  const originalDurations=new Map((D.lessons||[]).map(l=>[l.id,l.duration]));
  function applyEnergyMode(state){
    const low=state?.today?.mode==='low';
    (D.lessons||[]).forEach(l=>{
      const original=originalDurations.get(l.id) || l.duration;
      l.duration=low?Math.min(15,original):original;
    });
  }
  Store.subscribe(applyEnergyMode);
  applyEnergyMode(Store.get());

  let activationPending=false;
  const feelLabels={tired:'Tired',stressed:'Stressed',okay:'Okay',good:'Good',focused:'Focused'};

  function closeModal(){ document.querySelector('.modal-backdrop')?.remove(); }

  function showActivation(feel){
    const state=Store.get();
    const sess=(state.today?.sessions||[]).find(x=>x.id==='day1_activation');
    if(!sess) return;
    const low=state.today?.mode==='low';
    const backdrop=document.createElement('div');
    backdrop.className='modal-backdrop';
    backdrop.innerHTML=`<div class="modal" role="dialog" aria-modal="true">
      <span class="eyebrow">Day 1 activation</span>
      <h2>${low?'Keep today small.':'Set one small goal for today.'}</h2>
      <p>Your calibration is complete. Day 1 Activation is a short planning and warm-up step, not a subject lesson.</p>
      <div class="grid two" style="margin-top:16px">
        <div class="metric"><div class="metric-label">Current energy</div><div class="metric-value" style="font-size:1.35rem">${feelLabels[feel]||'Checked in'}</div></div>
        <div class="metric"><div class="metric-label">Activation length</div><div class="metric-value" style="font-size:1.35rem">${sess.duration||10} min</div></div>
      </div>
      ${low?'<div class="callout info" style="margin-top:16px"><strong>Low Energy Mode is active</strong><p>Your next subject session will be capped at 15 minutes today.</p></div>':''}
      <div class="field" style="margin-top:16px"><label>One small goal for today</label><input id="activationGoalHotfix" autocomplete="off" placeholder="Example: finish one English lesson"></div>
      <div class="modal-actions"><button class="btn secondary" id="cancelActivationHotfix">Not now</button><button class="btn primary" id="finishActivationHotfix">Complete activation</button></div>
    </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal();});
    backdrop.querySelector('#cancelActivationHotfix').onclick=closeModal;
    backdrop.querySelector('#finishActivationHotfix').onclick=async()=>{
      const goal=backdrop.querySelector('#activationGoalHotfix').value.trim() || 'Complete one short NeuroPass session.';
      Store.patch(s=>{
        s.today.microGoal=goal;
        const current=s.today.sessions.find(x=>x.id==='day1_activation');
        if(current)current.status='done';
        const next=s.today.sessions.find(x=>!['done','rest'].includes(x.status));
        if(next)next.status='next';
        s.sessionsCompleted=(s.sessionsCompleted||0)+1;
        s.minutesStudied=(s.minutesStudied||0)+(sess.duration||10);
        s.user.xp=(s.user.xp||0)+10;
      });
      closeModal();
      try{ await Store.syncNow(); }catch(err){ console.error(err); }
      location.hash='home';
      location.reload();
    };
  }

  document.addEventListener('click',e=>{
    const start=e.target.closest?.('[data-start-session],#startNext');
    if(start){
      const state=Store.get();
      const id=start.dataset?.startSession || (start.id==='startNext'?state.today?.sessions?.find(x=>x.status!=='done')?.id:null);
      activationPending=id==='day1_activation';
      return;
    }

    const feel=e.target.closest?.('[data-feel]');
    if(feel && activationPending){
      e.preventDefault();
      e.stopImmediatePropagation();
      activationPending=false;
      const value=feel.dataset.feel;
      Store.patch(s=>{
        s.today.emotionalState=value;
        s.checkInHistory=s.checkInHistory||[];
        s.checkInHistory.push({state:value,date:new Date().toISOString()});
        if(value==='tired')s.today.mode='low';
        if(value==='focused')s.today.mode='power';
      });
      applyEnergyMode(Store.get());
      closeModal();
      showActivation(value);
    }
  },true);
})();