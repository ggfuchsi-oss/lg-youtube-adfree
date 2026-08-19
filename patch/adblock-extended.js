/**
 * Standalone YouTube TV ad blocker for webOS.
 *
 * WHY THIS EXISTS (instead of the webpack bundle):
 * On this TV the webpack-built userScript.js executes top-to-bottom (verified
 * with prepended/appended probes) but its modules never take effect -- no
 * exception, no unhandled rejection, JSON.parse simply stays unpatched. That is
 * a webpack async-module-runtime problem. Plain scripts inject and run fine, so
 * this reimplements just the ad blocking in dependency-free ES5.
 *
 * Chromium 79 (webOS 6): no optional chaining, no ??, no let/const/arrow.
 */
(function () {
  'use strict';

  var stats = { calls: 0, stripped: 0 };

  // A/B TEST: when false, hook+count but strip NOTHING. Used to prove whether
  // the playback QR error comes from our stripping or is independent of it.
  var ENABLED = true;

  // ---- helpers ------------------------------------------------------------

  var AD_KEYS = [
    'adSlotRenderer',
    'tvMastheadRenderer',
    'mastheadAdRenderer',
    'mastheadAdPrimaryVideoRenderer',
    'promotedSparklesWebRenderer',
    'promotedVideoRenderer',
    'compactPromotedVideoRenderer',
    'promotedSparklesTextSearchRenderer',
    'carouselAdRenderer',
    'displayAdRenderer',
    'inFeedAdLayoutRenderer',
    'adsControlFlowOpportunityReceivedCommand',
    'brandVideoShelfRenderer',
    'adPlacementRenderer'
  ];

  function hasAdBadge(o) {
    // BADGE_STYLE_TYPE_ADS is what marks a "Sponsored"/"Gesponsert" tile, and
    // it survives YouTube's frequent renderer renames.
    if (!o || typeof o !== 'object') return false;
    var candidates = [o];
    for (var k in o) {
      if (o[k] && typeof o[k] === 'object') candidates.push(o[k]);
    }
    for (var i = 0; i < candidates.length; i++) {
      var badges = candidates[i].badges;
      if (!badges || !badges.length) continue;
      for (var j = 0; j < badges.length; j++) {
        var b = badges[j];
        if (b && b.metadataBadgeRenderer &&
            b.metadataBadgeRenderer.style === 'BADGE_STYLE_TYPE_ADS') {
          return true;
        }
      }
    }
    return false;
  }

  function isAdItem(item) {
    if (!item || typeof item !== 'object') return false;
    for (var i = 0; i < AD_KEYS.length; i++) {
      if (Object.prototype.hasOwnProperty.call(item, AD_KEYS[i])) return true;
    }
    return hasAdBadge(item);
  }

  // Don't descend into these: large, never contain ad cards, and walking them
  // on watch-page player responses is a needless main-thread cost.
  var SKIP = {
    captionTracks: 1, adaptiveFormats: 1, formats: 1,
    streamingData: 1, thumbnails: 1, heatmap: 1
  };

  function strip(node, depth) {
    if (!node || typeof node !== 'object' || depth > 12) return;

    if (Object.prototype.toString.call(node) === '[object Array]') {
      for (var i = node.length - 1; i >= 0; i--) {
        if (isAdItem(node[i])) {
          node.splice(i, 1);
          stats.stripped++;
        } else {
          strip(node[i], depth + 1);
        }
      }
      return;
    }

    for (var k in node) {
      if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
      if (SKIP[k]) continue;
      strip(node[k], depth + 1);
    }
  }

  // ---- the hook -----------------------------------------------------------

  var origParse = JSON.parse;
  JSON.parse = function () {
    var r = origParse.apply(this, arguments);
    try {
      stats.calls++;
      if (ENABLED && r && typeof r === 'object') {
        // Video ads (pre/mid-roll).
        if (r.adPlacements) { delete r.adPlacements; stats.stripped++; }
        if (r.playerAds) { delete r.playerAds; stats.stripped++; }
        if (r.adSlots) { delete r.adSlots; stats.stripped++; }

        // Feed/search/home ad cards.
        if (r.contents) strip(r.contents, 0);
        if (r.entries) strip(r.entries, 0);
        if (r.onResponseReceivedActions) strip(r.onResponseReceivedActions, 0);
        if (r.continuationContents) strip(r.continuationContents, 0);
      }
    } catch (e) {
      // Never let ad-stripping break page JSON parsing.
    }
    return r;
  };

  // ---- tiny on-screen status (debug only; remove once verified) -----------

  function status() {
    try {
      var d = document.getElementById('ytab-status');
      if (!d) {
        d = document.createElement('div');
        d.id = 'ytab-status';
        d.style.cssText =
          'position:fixed;bottom:0;right:0;z-index:2147483647;' +
          'background:rgba(0,0,0,0.75);color:#0f0;font:14px monospace;padding:4px 8px';
        (document.body || document.documentElement).appendChild(d);
      }
      d.textContent = 'adblock[' + (ENABLED ? 'ON' : 'OFF') + ']: parsed ' + stats.calls + ' / stripped ' + stats.stripped;
    } catch (e) {}
  }
  var n = 0;
  var t = setInterval(function () { status(); if (++n > 120) clearInterval(t); }, 1000);
})();
