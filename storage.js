window.NPStore = (() => {
  const KEY='neuropass.v1.state';
  const clone = x => JSON.parse(JSON.stringify(x));
  let state;
  const listeners=new Set();

  function load(){
    try { state=JSON.parse(localStorage.getItem(KEY)) || window.NeuroPassData.makeDemoState(); }
    catch { state=window.NeuroPassData.makeDemoState(); }
    if (!state.checkInHistory) state.checkInHistory=[];
    if (!state.waitlist) state.waitlist=[];
    return state;
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); listeners.forEach(fn=>fn(state)); return state; }
  function get(){ return state || load(); }
  function set(next){ state=next; return save(); }
  function patch(fn){ const next=clone(get()); fn(next); state=next; return save(); }
  function reset(){ state=window.NeuroPassData.makeDemoState(); return save(); }
  function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }

  function queueOffline(action){
    patch(s=>{ s.offline.pendingSync=(s.offline.pendingSync||0)+1; s.offline.queue=s.offline.queue||[]; s.offline.queue.push({...action,queuedAt:new Date().toISOString()}); });
  }
  function flushQueue(){
    if (!navigator.onLine) return;
    patch(s=>{ s.offline.queue=[]; s.offline.pendingSync=0; s.offline.lastSync=new Date().toISOString(); });
  }

  // IndexedDB is used for downloaded study packs. LocalStorage remains the demo state cache.
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
  window.addEventListener('online', flushQueue);
  return {get,set,patch,reset,subscribe,queueOffline,flushQueue,savePack,getPack};
})();
