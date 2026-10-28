# Platform adaptations (R12, Q2)

Feeds README section 5 (and the FPS numbers in section 6). Copy at W2; fill all four rows by the end of the between-labs weeks.
Rule: at least 3 are required, 4 reach Expert. Each needs a stated reason, the code location, and a before/after number (or, at minimum, a written observation). If a change did not help, record that: it is still evidence.

Method for FPS: same device, same scene position, 30 s each, median of the on-page FPS readout. The starter's `adapt.js` is controlled by URL parameters (for example `?pr=1` for pixel ratio) so you can compare without editing code; the parameters are `?pr=` (pixel ratio), `?fb=` (headset framebuffer scale) and `?fov=` (foveation), this starter's own convention (see the header of `src/adapt.js`).

| # | Adaptation | Reason (which platform, which problem) | Change (file and what) | FPS or observation before | FPS or observation after | Device and date |
|---|---|---|---|---|---|---|
| 1 | Pixel-ratio cap | Phone screens with devicePixelRatio of 3 or more render many more pixels than they need | `src/adapt.js` / `renderer.setPixelRatio(...)` |  |  |  |
| 2 | iOS motion-permission flow | iOS Safari needs `DeviceOrientationEvent.requestPermission()` from a user gesture on HTTPS | `src/look.js` `requestPermission()`, called from the Start button |  |  |  |
| 3 | Headset resolution or foveation | Quest Browser: trade sharpness for frame rate (`setFoveation`, framebuffer scale) | `src/adapt.js` |  |  |  |
| 4 | Your own (for example landscape lock and wake lock in stereo, smaller textures, audio start after gesture) |  |  |  |  |  |

Row 1-3 are suggestions from the assignment; replace any row with a better one from your own testing. If you cannot test row 3 (no headset), say "not tested" and use a different adaptation.

## Summary sentence per adaptation (paste into README)

1.
2.
3.
4.
