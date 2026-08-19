/* net-probe.js - capture what triggers the anti-adblock enforcement.
 * Logs a rolling buffer of fetch/XHR (url, method, status) + flags ad/stats/
 * player/backoff-related traffic and response keys. When the error overlay
 * appears, it timestamps it so we can see the request that preceded it.
 * Dump with: lgtv eval youtube "window.__np_dump()" */
(function(){
  if (window.__np__) return; window.__np__ = true;
  var LOG=[]; window.__np_log=LOG;
  function rec(o){ o.t=Math.round(performance.now()); LOG.push(o); if(LOG.length>200)LOG.shift(); }
  function interesting(u){ return /player|ad_break|pagead|get_midroll|stats\/(ads|qoe|playback|watchtime)|refresh|youtubei\/v1\/(player|next|log_event)|ptracking|generate_204|atr|interstitial/i.test(u); }
  function keys(txt){ try{var j=JSON.parse(txt);var picked={};['playabilityStatus','adPlacements','playerAds','adSlots','streamingData','reload','backoff','serverAbConfig','responseContext','error','messageRenderer','qrCodeRenderer'].forEach(function(k){ if(deepHas(j,k))picked[k]=1;}); return Object.keys(picked);}catch(e){return null;} }
  function deepHas(o,k,d){ d=d||0; if(d>6||!o||typeof o!=='object')return false; if(k in o)return true; for(var x in o){ if(deepHas(o[x],k,d+1))return true;} return false; }
  var of=window.fetch;
  window.fetch=function(res,init){
    var url=(res&&res.url)||String(res); var m=(init&&init.method)||(res&&res.method)||'GET';
    var p=of.apply(this,arguments);
    if(interesting(url)){
      p.then(function(r){ var e={url:url.slice(0,120),m:m,status:r.status};
        r.clone().text().then(function(t){ e.rkeys=keys(t); e.len=t.length; rec(e); }).catch(function(){rec(e);});
      }).catch(function(err){ rec({url:url.slice(0,120),m:m,err:String(err).slice(0,40)}); });
    }
    return p;
  };
  // mark when the enforcement error appears
  var seen=false;
  setInterval(function(){
    var up=/Fehler ist aufgetreten|went wrong|error occurred/i.test((document.querySelector('yt-unified-overlay-stage,ytlr-overlay-section-renderer')||{}).textContent||'');
    if(up&&!seen){ seen=true; rec({EVENT:'ERROR_OVERLAY_SHOWN'}); }
    if(!up)seen=false;
  },500);
  window.__np_dump=function(){ return JSON.stringify(LOG.slice(-60)); };
  console.info('[net-probe] active; dump via window.__np_dump()');
})();
/* --- player-capture add-on: grab full /youtubei/v1/player req+resp --- */
(function(){
  if (window.__pc__) return; window.__pc__=true; window.__pc=[];
  var of=window.fetch;
  window.fetch=function(res,init){
    var url=(res&&res.url)||String(res);
    var p=of.apply(this,arguments);
    if(/youtubei\/v1\/player(\?|$)/.test(url)){
      var reqBody=null; try{reqBody=init&&init.body?String(init.body):null;}catch(e){}
      p.then(function(r){ r.clone().text().then(function(t){
        window.__pc.push({url:url.slice(0,80), reqBody:reqBody?reqBody.slice(0,4000):null, resp:t}); if(window.__pc.length>3)window.__pc.shift();
      });});
    }
    return p;
  };
  window.__pc_dump=function(){
    return JSON.stringify((window.__pc||[]).map(function(e){
      var client=null, ads=null; try{var rq=JSON.parse(e.reqBody); client=rq.context&&rq.context.client;}catch(x){}
      var status=null,hasAds=false,ab=false; try{var j=JSON.parse(e.resp); status=j.playabilityStatus&&j.playabilityStatus.status; hasAds=!!(j.adPlacements||j.playerAds||j.adSlots); ab=!!(j.responseContext&&j.responseContext.serviceTrackingParams); }catch(x){}
      return {url:e.url, client:client, respStatus:status, hasAds:hasAds, respLen:e.resp.length};
    }));
  };
  console.info('[player-capture] active; dump via window.__pc_dump()');
})();
