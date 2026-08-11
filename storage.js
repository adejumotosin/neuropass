window.NPStore = (() => {
  const KEY='neuropass.v1.state';
  const clone = x => JSON.parse(JSON.stringify(x));
  let state;
  let remoteUserId=null;
  let syncTimer=null;
  let applyingRemote=false;
  const listeners=new Set();

  function load(){
    try { state=JSON.parse(localStorage.getItem(KEY)) || window.NeuroPassData.makeFreshState(); }
    catch { state=window.NeuroPassData.makeFreshState(); }
    if (!state.checkInHistory) state.checkInHistory=[];
    if (!state.waitlist) state.waitlist=[];
    if (state.demoMode === undefined) state.demoMode=false;
    return state;
  }
  function save(){
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach(fn=>fn(state));
    scheduleRemoteSync();
    return state;
  }
  function get(){ return state || load(); }
  function set(next){ state=next; return save(); }
  function patch(fn){ const next=clone(get()); fn(next); state=next; return save(); }
  function reset(){ state=window.NeuroPassData.makeFreshState(); return save(); }
  function resetDemo(){ state=window.NeuroPassData.makeDemoState(); state.demoMode=true; return save(); }
  function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }

  function queueOffline(action){
    patch(s=>{ s.offline.pendingSync=(s.offline.pendingSync||0)+1; s.offline.queue=s.offline.queue||[]; s.offline.queue.push({...action,queuedAt:new Date().toISOString()}); });
  }
  async function flushQueue(){
    if (!navigator.onLine) return false;
    if(remoteUserId) await syncNow();
    patch(s=>{ s.offline.queue=[]; s.offline.pendingSync=0; s.offline.lastSync=new Date().toISOString(); });
    return true;
  }

  function scheduleRemoteSync(){
    if(applyingRemote || !remoteUserId || !navigator.onLine || !window.NPSupabase) return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>syncNow().catch(console.error),700);
  }

  async function syncNow(){
    if(!remoteUserId || !navigator.onLine || !window.NPSupabase) return false;
    const payload=clone(get());
    payload.authenticated=true;
    payload.demoMode=false;
    const {error}=await window.NPSupabase.from('student_state_snapshots').upsert({student_id:remoteUserId,state:payload,updated_at:new Date().toISOString()},{onConflict:'student_id'});
    if(error) throw error;
    state.offline=state.offline||{};
    state.offline.lastSync=new Date().toISOString();
    state.offline.pendingSync=0;
    localStorage.setItem(KEY,JSON.stringify(state));
    return true;
  }

  function isDemoOrForeignState(local,userId){
    if(!local) return true;
    if(local.demoMode) return true;
    if(local?.user?.id === 'student_demo') return true;
    if(local?.user?.authUserId && local.user.authUserId !== userId) return true;
    if(!local?.user?.authUserId && local.onboardingComplete) return true;
    return false;
  }

  async function attachRemoteUser(userId,{preferRemote=true}={}){
    remoteUserId=userId;
    if(!window.NPSupabase) return get();
    const {data,error}=await window.NPSupabase.from('student_state_snapshots').select('state').eq('student_id',userId).maybeSingle();
    if(error) throw error;
    if(preferRemote && data?.state && Object.keys(data.state).length){
      applyingRemote=true;
      state={...window.NeuroPassData.makeFreshState(),...data.state,authenticated:true,demoMode:false};
      state.user=state.user||{};
      state.user.authUserId=userId;
      state.user.id=userId;
      localStorage.setItem(KEY,JSON.stringify(state));
      applyingRemote=false;
      listeners.forEach(fn=>fn(state));
    } else {
      const local=get();
      if(isDemoOrForeignState(local,userId)){
        state=window.NeuroPassData.makeFreshState();
      }
      state.user=state.user||{};
      state.user.authUserId=userId;
      state.user.id=userId;
      state.authenticated=true;
      state.demoMode=false;
      localStorage.setItem(KEY,JSON.stringify(state));
      await syncNow();
    }
    return state;
  }

  function detachRemoteUser(){
    remoteUserId=null;
    clearTimeout(syncTimer);
  }

  // IndexedDB is used for downloaded study packs. LocalStorage remains the offline state cache.
  function idb(){
    return new Promise((resolve,reject)=>{
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const req=indexedDB.open('neuropass-offline',1);
      req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains('packs')) req.result.createObjectStore('packs',{keyPath:'id'}); };
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function savePack(id,data){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction('packs','readwrite'); tx.objectStore('packs').put({id,data,savedAt:new Date().toISOString()}); tx.oncomplete=()=>res(true); tx.onerror=()=>rej(tx.error); }); }
  async function getPack(id){ const db=await idb(); return new Promise((res,rej)=>{ const req=db.transaction('packs').objectStore('packs').get(id); req.onsuccess=()=>res(req.result||null); req.onerror=()=>rej(req.error); }); }

  load();
  window.addEventListener('online',()=>flushQueue().catch(console.error));
  return {get,set,patch,reset,resetDemo,subscribe,queueOffline,flushQueue,savePack,getPack,attachRemoteUser,detachRemoteUser,syncNow};
})();