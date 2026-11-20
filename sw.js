/* TRIDENT // STANDBY — offline service worker */
const V='trident-v5', TILES='trident-tiles', FONTS='trident-fonts';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(V);await c.addAll(SHELL);
  try{const r=await fetch('radio-chatter.mp3');if(r.ok)await c.put('radio-chatter.mp3',r);}catch(_){} // optional file
  self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(![V,TILES,FONTS].includes(k))await caches.delete(k);await self.clients.claim();})());});
async function trim(name,max){const c=await caches.open(name),k=await c.keys();for(let i=0;i<k.length-max;i++)await c.delete(k[i]);}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
  // App page: network first so updates arrive, cached copy when offline
  if(req.mode==='navigate'||(u.origin===location.origin&&/\/(index\.html)?$/.test(u.pathname))){
    e.respondWith((async()=>{try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),4000);const r=await fetch(req,{signal:ctl.signal});clearTimeout(t);
      if(r.ok){const c=await caches.open(V);c.put('index.html',r.clone());}return r;}
      catch(_){return (await caches.match('index.html'))||(await caches.match('./'))||Response.error();}})());return;}
  // Satellite tiles: cache as you browse (limited)
  if(/arcgisonline\.com$/.test(u.hostname)){e.respondWith((async()=>{const hit=await caches.match(req);if(hit)return hit;
      try{const r=await fetch(req);if(r.ok){const c=await caches.open(TILES);c.put(req,r.clone());trim(TILES,600);}return r;}catch(_){return Response.error();}})());return;}
  // Fonts: stale-while-revalidate
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith((async()=>{const c=await caches.open(FONTS),hit=await c.match(req);
      const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r;}).catch(()=>hit);return hit||net;})());return;}
  // Everything else on this site: cache first
  if(u.origin===location.origin){e.respondWith((async()=>{const hit=await caches.match(req,{ignoreSearch:true});if(hit)return hit;
      const r=await fetch(req);if(r.ok){const c=await caches.open(V);c.put(req,r.clone());}return r;})());}
});
