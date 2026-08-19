// sponsorblock-lite for YouTube TV (youtube.com/tv) — client-side ad skip.
// Injected by the bundled proxy into the YouTube TV web client.
// NOTE: only skippable/overlay ads can be removed client-side; SSAI
// server-stitched in-stream ads are part of the video stream and cannot be
// removed here (that needs an account with Premium or a patched client).
(function () {
  "use strict";

  const SKIP_SELECTORS = [
    "button.ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".video-ad .skip-ad-button",
    '[aria-label*="Skip"]',
  ];

  function clickSkip() {
    for (const sel of SKIP_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) { el.click(); return true; }
    }
    // YouTube TV renders a "Skip Ads" button as a text button.
    const txt = Array.prototype.slice.call(
      document.querySelectorAll("button, div[role='button']")
    ).filter((b) => /skip ads?/i.test(b.textContent || ""));
    if (txt.length) { txt[0].click(); return true; }
    return false;
  }

  function hideAds() {
    const ads = document.querySelectorAll(
      ".ytp-ad-overlay, .video-ad, .ad-container, .ad-showing, [class*='ad-']"
    );
    ads.forEach((a) => { a.style.display = "none"; });
    if (document.querySelector(".ad-showing")) {
      const v = document.querySelector("video");
      if (v) {
        try {
          v.muted = true;
          if (v.duration) v.currentTime = Math.max(v.currentTime, v.duration - 0.2);
        } catch (e) {}
      }
    }
  }

  function loop() {
    try { clickSkip(); hideAds(); } catch (e) {}
  }

  const obs = new MutationObserver(loop);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(loop, 500);
  loop();
  console.log("[rex-youtube-mod] sponsorblock-lite active");
})();
