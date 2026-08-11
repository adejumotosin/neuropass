window.NPEngine = (() => {
  const D = window.NeuroPassData;
  const dayMs = 86400000;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const dateOnly = d => new Date(`${d}T12:00:00`);
  const isoDate = d => {
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  };
  const addDays = (d, n) => { const x = dateOnly(d); x.setDate(x.getDate()+n); return isoDate(x); };

  function getTrack(id){ return D.tracks.find(t => t.id === id) || D.tracks[0]; }

  function trackDay(user){
    if (user?.trackStart) {
      const start=dateOnly(user.trackStart).getTime();
      return Math.max(1, Math.floor((Date.now() - start)/dayMs)+1);
    }
    if (Number.isFinite(user?.currentDay)) return Math.max(1,user.currentDay);
    return 1;
  }

  function fullCycles(daysElapsed){
    if (daysElapsed >= 30) return 4;
    if (daysElapsed >= 14) return 3;
    if (daysElapsed >= 7) return 2;
    if (daysElapsed >= 3) return 1;
    return 0;
  }

  function projectGuarantee({daysElapsed, avgDailyHours, compliance=100, mockScore=null, baseline=150, selectedTrackId='elite'}){
    const selected = getTrack(selectedTrackId);
    const days = clamp(Number(daysElapsed)||1, 1, 365);
    const hours = clamp(Number(avgDailyHours)||0, 0, 12);
    const cycles = fullCycles(days);

    // Anchor exact source-documented examples before general interpolation.
    let guarantee;
    let limitingFactor = 'volume';
    if (days >= 180 && hours >= 5) { guarantee = 395; limitingFactor = 'neither'; }
    else if (days >= 180 && hours <= 1.6) { guarantee = 270; limitingFactor = 'daily commitment'; }
    else if (days >= 90 && hours >= 3.5) { guarantee = 330 + Math.min(65, Math.floor((days-90) * .72 + Math.max(0,hours-3.5)*8)); limitingFactor = days >= 120 ? 'volume and calendar time' : 'neither'; }
    else if (days >= 60 && hours >= 4.8) { guarantee = 313 + Math.min(17, Math.floor((days-60) * .55)); limitingFactor = 'spaced repetition cycles'; }
    else {
      const eligible = D.tracks.filter(t => days >= t.days && hours >= t.hours);
      if (eligible.length) {
        const base = eligible[eligible.length-1];
        guarantee = base.guaranteed;
        limitingFactor = base.id === selected.id ? 'neither' : (days < selected.days ? 'calendar time' : 'daily commitment');
        const next = D.tracks[D.tracks.indexOf(base)+1];
        if (next && hours > base.hours) {
          const dayProgress = clamp((days-base.days)/(next.days-base.days),0,1);
          const hourProgress = clamp((hours-base.hours)/(next.hours-base.hours),0,1);
          guarantee += Math.floor((next.guaranteed-base.guaranteed) * Math.min(dayProgress, hourProgress) * .65);
        }
      } else {
        const progress = clamp((days/30)*.45 + (hours/1.5)*.55, 0, 1);
        guarantee = Math.round(baseline + (180-baseline)*progress);
      }
    }

    // A lower rolling compliance should affect the active projection without falsely erasing earned work.
    if (compliance < 80) guarantee -= Math.round((80-compliance) * .7);
    guarantee = clamp(Math.round(guarantee), 100, 395);

    let projected = guarantee + 18;
    if (Number.isFinite(mockScore)) projected = Math.round(guarantee * .48 + mockScore * .52 + 12);
    projected = clamp(projected, guarantee, 400);

    const selectedCeiling = selected.guaranteed;
    return {
      guaranteed: guarantee,
      projected,
      cycles,
      limitingFactor,
      selectedCeiling,
      modelVersion:'heuristic-v1.0',
      isModelEstimate:true,
      explanation:`Current guarantee uses ${days} calendar days, about ${hours.toFixed(1)} study hours per active day, ${cycles} spaced repetition cycles, and ${Math.round(compliance)}% rolling compliance. The current limiting factor is ${limitingFactor}.`
    };
  }

  function complianceStatus({rollingAverage, consecutiveBelow70=0, daysRemaining=99}){
    if (daysRemaining <= 14) return {id:'crisis', label:'Crisis Mode protected', tone:'warning', paused:false, action:'Survival Mode is available. The guarantee is not paused in the final 2 weeks.'};
    if (consecutiveBelow70 >= 3) return {id:'paused', label:'Paused, not voided', tone:'danger', paused:true, action:'A senior coach recovery plan is required.'};
    if (consecutiveBelow70 === 2) return {id:'risk', label:'At risk', tone:'warning', paused:false, action:'A human touchpoint should be triggered now.'};
    if (consecutiveBelow70 === 1) return {id:'warning', label:'Still active', tone:'warning', paused:false, action:'Catch-up sessions should be added automatically.'};
    if (rollingAverage >= 80) return {id:'active', label:'Fully active', tone:'success', paused:false, action:'Normal progression.'};
    return {id:'watch', label:'Active, recovery needed', tone:'warning', paused:false, action:'Use the recovery plan to raise rolling compliance.'};
  }

  function spacedDates(taughtDate, examDate=null){
    const dates = [3,7,14,30].map((n,i)=>({cycle:i+1,due:addDays(taughtDate,n),intervalDays:n}));
    if (examDate) {
      let cursor = dateOnly(addDays(taughtDate,60));
      const end = dateOnly(examDate);
      let cycle = 5;
      while (cursor <= end && dates.length < 18) {
        dates.push({cycle:cycle++,due:isoDate(cursor),intervalDays:30});
        cursor.setDate(cursor.getDate()+30);
      }
    }
    return dates;
  }

  function updateMistake(existing, correct, now=isoDate(new Date())){
    const item = existing ? {...existing} : {wrongCount:0, consecutiveCorrect:0};
    if (correct) {
      item.consecutiveCorrect = (item.consecutiveCorrect||0)+1;
      item.nextDue = item.consecutiveCorrect >= 3 ? null : addDays(now, 2);
      item.mastered = item.consecutiveCorrect >= 3;
    } else {
      item.wrongCount = (item.wrongCount||0)+1;
      item.consecutiveCorrect = 0;
      item.nextDue = addDays(now, item.wrongCount === 1 ? 3 : 2);
      item.mastered = false;
    }
    item.lastAnswerAt = now;
    return item;
  }

  function mockPhase(day){
    if (day <= 20) return {phase:1,name:'Foundation',cadence:'Weekly, Sunday'};
    if (day <= 50) return {phase:2,name:'Build',cadence:'Weekly, Sunday'};
    if (day <= 75) return {phase:3,name:'Strengthen',cadence:'Every 4 to 5 days'};
    return {phase:4,name:'Polish',cadence: day <= 90 ? 'Every 3 to 4 days' : 'Admin-configurable Phase 4 cadence'};
  }

  function detectRisks(state){
    const risks=[];
    const checks=(state.checkInHistory||[]).slice(-4);
    if (checks.length===4 && checks.every(x=>['tired','stressed'].includes(x.state))) risks.push({type:'burnout',title:'Repeated low-energy check-ins',detail:'Tired or stressed was selected four sessions in a row.',response:'Insert a rest day and notify the opted-in accountability partner.'});
    const mocks=(state.mockHistory||[]).slice(-3);
    if (mocks.length>=3 && Math.max(...mocks.map(x=>x.score))-Math.min(...mocks.map(x=>x.score)) <= 8) risks.push({type:'plateau',title:'Mock score plateau',detail:'Recent mock scores have moved by 8 points or less.',response:'Switch the primary learning method and review weak topics.'});
    return risks;
  }

  function avgHoursFromState(state){
    const day = Math.max(1, trackDay(state.user));
    return (state.minutesStudied || 0) / 60 / day;
  }

  return { getTrack, trackDay, fullCycles, projectGuarantee, complianceStatus, spacedDates, updateMistake, mockPhase, detectRisks, avgHoursFromState, addDays, isoDate, clamp };
})();