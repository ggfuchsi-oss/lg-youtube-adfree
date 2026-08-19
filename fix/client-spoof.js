/* client-spoof.js - flawless #462 attempt: rewrite the /youtubei/v1/player
 * request to the embedded-TV client (TVHTML5_SIMPLY_EMBEDDED_PLAYER), which
 * YouTube serves ad-free WITHOUT the server-side throttle/enforcement. Keeps
 * everything else (cpn, params, videoId) intact so Cobalt still plays it. */
(function(){
  if(window.__cspoof__)return; window.__cspoof__=true;
  var of=window.fetch;
  window.fetch=function(res,init){
    try{
      var url=(res&&res.url)||String(res);
      if(/youtubei\/v1\/player(\?|$)/.test(url) && init && init.body){
        var q=JSON.parse(init.body);
        if(q.context && q.context.client){
          q.context.client.clientName='TVHTML5_SIMPLY_EMBEDDED_PLAYER';
          q.context.client.clientVersion='2.0';
          // embedded client needs an embed referer context
          q.context.thirdParty = { embedUrl: 'https://www.youtube.com/' };
          init=Object.assign({},init,{body:JSON.stringify(q)});
          console.info('[cspoof] rewrote player client -> tv_embedded');
          return of.call(this,res,init);
        }
      }
    }catch(e){ console.warn('[cspoof] skip', e); }
    return of.apply(this,arguments);
  };
  console.info('[client-spoof] active');
})();
