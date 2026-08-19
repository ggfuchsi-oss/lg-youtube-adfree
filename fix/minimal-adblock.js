/* minimal-adblock.js - inject into the STOCK youtube app. Strips ad renderers
 * from every JSON response (the uBO-style prune) and nothing else. Tests whether
 * stock-app-identity + light adblock survives past 2min (vs the broken mod app). */
(function(){
  if(window.__mab__)return; window.__mab__=true;
  var KILL=['adPlacements','playerAds','adSlots','adSlotRenderer','qrCodeRenderer'];
  function scrub(o){ if(!o||typeof o!=='object')return o;
    if(Array.isArray(o)){for(var i=o.length-1;i>=0;i--)scrub(o[i]);return o;}
    for(var k in o){ if(KILL.indexOf(k)>=0){try{delete o[k];}catch(e){}} else scrub(o[k]); } return o; }
  var op=JSON.parse; JSON.parse=function(){return scrub(op.apply(this,arguments));};
  console.info('[minimal-adblock] active on stock app');
})();
