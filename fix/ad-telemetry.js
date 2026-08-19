/* ad-telemetry.js - #3 recon: with ads ENABLED, capture every ad-confirmation
 * request YouTube fires while a real ad plays, so we can replay them later while
 * hiding the ad (= invisible AND undetected). */
(function(){
  if(window.__adt__)return; window.__adt__=true; window.__adt_log=[];
  // let a real ad actually play so its telemetry fires
  try{var K='ytaf-configuration';var c=JSON.parse(localStorage.getItem(K)||'{}');c.enableAdBlock=false;localStorage.setItem(K,JSON.stringify(c));}catch(e){}
  var AD=/pagead|doubleclick|googleadservices|googlesyndication|\/api\/stats\/ads|\/pcs\/|activeview|ptracking|\/aclk|\/pagead\/interaction|ad_break|adunit|\/csi_204|adformat|get_midroll|\/pagead\/conversion|\/pagead\/viewthroughconversion|\/ad_status|\/interstitial|\/get_ads/i;
  var of=window.fetch;
  window.fetch=function(res,init){
    try{ var url=(res&&res.url)||String(res); var m=(init&&init.method)||'GET';
      if(AD.test(url)){ window.__adt_log.push({url:url, m:m, body:(init&&init.body)?String(init.body).slice(0,300):null, t:Math.round(performance.now())}); }
    }catch(e){}
    return of.apply(this,arguments);
  };
  // also hook sendBeacon (ads often confirm via navigator.sendBeacon)
  if(navigator.sendBeacon){ var ob=navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon=function(url,data){ try{ if(AD.test(String(url))) window.__adt_log.push({beacon:String(url), t:Math.round(performance.now())}); }catch(e){} return ob(url,data); }; }
  // XHR too
  var ox=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,url){ try{ if(AD.test(String(url))) window.__adt_log.push({xhr:String(url), m:m, t:Math.round(performance.now())}); }catch(e){} return ox.apply(this,arguments); };
  window.__adt_dump=function(){ return JSON.stringify(window.__adt_log.slice(-80)); };
  console.info('[ad-telemetry] active (adblock OFF for this session); play a video with an ad');
})();
