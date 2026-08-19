/* qr-filter.js v2 - handle youtube-webos #462 anti-adblock enforcement.
 * Real selectors from the live DOM: the error dialog is a ytlr overlay stage
 * containing "Ein Fehler ist aufgetreten" + ytlr-...-qr-code-renderer, and the
 * <video> gets reset (currentTime 0). Hiding won't resume -> we AUTO-RETRY. */
(function () {
  if (window.__qrfix2__) return; window.__qrfix2__ = true;

  // strip merch/shop QR renderers from JSON (harmless, removes on-screen merch QR)
  var KILL = ['qrCodeRenderer','shoppingOverlayRenderer','merchandiseShelfRenderer'];
  function scrub(o){ if(!o||typeof o!=='object')return o;
    if(Array.isArray(o)){for(var i=o.length-1;i>=0;i--)scrub(o[i]);return o;}
    for(var k in o){ if(KILL.indexOf(k)>=0){try{delete o[k];}catch(e){}} else scrub(o[k]); } return o; }
  var op=JSON.parse; JSON.parse=function(){return scrub(op.apply(this,arguments));};

  var lastRetry = 0;
  function isErrorUp(){
    // the enforcement dialog text (DE + EN), scoped to the overlay stage
    var stage = document.querySelector('yt-unified-overlay-stage, ytlr-overlay-section-renderer');
    if(!stage) return false;
    var t = (stage.textContent||'');
    return /Fehler ist aufgetreten|went wrong|error occurred|try again|noch einmal/i.test(t)
        && !!document.querySelector('[class*="qr-code-renderer"], ytlr-redux-connect-ytlr-qr-code-renderer');
  }
  function retry(){
    var now=Date.now(); if(now-lastRetry<4000) return; lastRetry=now;
    // press Enter to activate the focused "try again" item
    ['keydown','keyup'].forEach(function(type){
      document.dispatchEvent(new KeyboardEvent(type,{key:'Enter',keyCode:13,which:13,bubbles:true}));
    });
    console.info('[qr-filter] enforcement error -> auto-retry sent');
  }
  function tick(){ if(isErrorUp()) retry(); }
  new MutationObserver(tick).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(tick,1500);
  console.info('[qr-filter v2] active');
})();
