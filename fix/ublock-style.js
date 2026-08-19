/* ublock-style.js - stop RIPPING OUT ads (which trips #462 detection); instead
 * let the ad break flow normally and AUTO-SKIP the ad (mute + jump to end).
 * Mimics uBO's "don't trip detection" behavior. */
(function(){
  if(window.__ubs__)return; window.__ubs__=true;

  // 1) turn OFF the mod's aggressive ad-stripping so the ad-break request is made
  try{
    var K='ytaf-configuration';
    var c=JSON.parse(localStorage.getItem(K)||'{}');
    c.enableAdBlock=false;               // let ads through at the data layer
    localStorage.setItem(K,JSON.stringify(c));
    console.info('[ubs] disabled data-layer ad stripping (enableAdBlock=false)');
  }catch(e){console.warn('[ubs] cfg',e);}

  // 2) auto-skip ads at the player layer: while an ad is playing, mute + seek to end
  function adPlaying(){
    // leanback marks ad mode on the player; check common signals
    var p=document.querySelector('#movie_player, .html5-video-player, ytlr-watch');
    if(p && /(^|\s)ad-(showing|interrupting)(\s|$)/.test(p.className||'')) return true;
    // fallback: an ad badge / skip element present
    return !!document.querySelector('[class*="ad-badge"],[class*="-ad-"],.ytp-ad-skip-button,[class*="skip-ad"],[class*="AdText"]');
  }
  var v=null;
  setInterval(function(){
    v=document.querySelector('video'); if(!v)return;
    if(adPlaying()){
      try{
        v.muted=true;
        // click a skip button if present
        var sk=document.querySelector('.ytp-ad-skip-button,[class*="skip-ad"] button,[class*="skip"][role="button"]');
        if(sk){ sk.click(); }
        // otherwise jump the ad to its end
        if(isFinite(v.duration)&&v.duration>0&&v.currentTime<v.duration-0.3){ v.currentTime=v.duration; }
      }catch(e){}
    }
  },300);
  console.info('[ublock-style] active');
})();
