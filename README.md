# lg-youtube-adfree

Extended adblock filters for the YouTube Cobalt app on rooted LG webOS TVs.

Based on [UltraHDR/youtube-webos-cobalt](https://github.com/UltraHDR/youtube-webos-cobalt) (2023). Their project patches Cobalt to inject adblock JS; we extended their filters to cover 2026 ad patterns.

## What it does
- Patches the **store** YouTube app (`youtube.leanback.v4`) in-place on the TV.
- Removes skippable ads, overlay ads, and UI ad cards.
- Adds SponsorBlock-style segment skipping via a userscript.
- Self-healing guard (`/var/lib/webosbrew/init.d/98-ytx-guard`) re-applies the patch if LG updates revert it.

## Realistic ceiling (honest)
- **Server-stitched in-stream video ads (SSAI) cannot be removed client-side.** A Premium subscription is required for those.
- Occasional 2026 ad variants may still slip through; filters are updated ad-hoc.
- The store YouTube is Cobalt Evergreen (SB API 12); our filters run inside Cobalt's JS runtime (Chromium 79).

## Install
1. Root your TV + install Homebrew Channel.
2. Apply the Cobalt patch using UltraHDR's `youtube-webos-cobalt` method.
3. Append our `patch/adblock-extended.js` filters to `content/web/adblock/adblockMain.js`.
4. Reboot (or run the guard script).

See `patch/` for the in-place patch script.

## Repo layout
- `patch/` — in-place installer + our extended ES5 adblock filters.
- `src/rex-youtubetv/` — an alternative ReVanced-style proxy app (less effective; included for reference).
- `fix/` — experimental userscript filters (QR-code filter, uBlock-style, etc.).

## Credits
- [UltraHDR/youtube-webos-cobalt](https://github.com/UltraHDR/youtube-webos-cobalt) — the Cobalt patch base (2023).
- webOS Homebrew / RootMyTV — rooting + boot infrastructure.

## License
MIT for our additions (`patch/`, `fix/`, `src/rex-youtubetv/`). Upstream UltraHDR base is their own license.
