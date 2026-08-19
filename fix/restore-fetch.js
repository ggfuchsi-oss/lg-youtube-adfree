/* restore-fetch.js - bisect test: bypass the mod's window.fetch wrapper by
 * grabbing a pristine native fetch from a fresh iframe. If playback now survives
 * past ~2min, the mod's hooks/fetch.ts is the culprit killing the stream. */
(function(){
  if(window.__nf__)return; window.__nf__=true;
  try{
    var f=document.createElement('iframe');
    f.style.cssText='position:absolute;width:0;height:0;border:0;left:-9999px';
    (document.body||document.documentElement).appendChild(f);
    var native=f.contentWindow.fetch;
    if(native){ window.fetch=native.bind(window); window.__nf_iframe=f;
      console.info('[restore-fetch] window.fetch -> native (mod fetch hook bypassed)'); }
    else console.warn('[restore-fetch] no iframe fetch');
  }catch(e){ console.warn('[restore-fetch] fail', e); }
})();
