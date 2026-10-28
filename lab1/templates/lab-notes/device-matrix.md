# Device test matrix (R13, rubric: Multi-platform delivery and platform-specific adaptation)

Feeds README section 4. Copy at W1 and add a row per device in W2, W3 and the between-labs weeks.
Rules: at least 3 device/browser classes (Expert needs 4: for example phone mono, phone stereo or headset, desktop). Test on the **live HTTPS URL**. Date every row. Mark what you did not test as "not tested". A partial result with a cause is better than a silent pass.

Result key: **pass** = the mode works and the task can be finished; **partial** = works with a named problem; **not tested** = not tried.
Mode reached: mono / stereo / WebXR.
FPS: median from the on-page FPS readout over 30 s (note the readout is a developer tool; switch it off for screenshots meant for the README if you prefer).
Size: first-load transfer from `delivery.md` (same build).

| Device | Browser (version) | Date | Mode reached | Result (pass / partial / not tested) | Screenshot (file in `docs/`) | FPS | Size | Notes (cause, workaround) |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |

## Per-row checks (tick per device)

| Device | Capability path correct (R2) | Look-around (R3) | Stereo toggle under 2 s (R4) | Gaze-only completes (R5) | Input badge correct (R6) |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Hand input on Quest

Hand pinch on Quest Browser: tested / not tested. If tested: input-mode badge showed "hand" (Y/N), activation worked (Y/N), date.

## Example row (delete this line)

`Pixel (model) | Chrome (version) | 2026-xx-xx | stereo | partial | docs/pixel-stereo.png | 41 | 6.2 MB | WebXR button absent; mono and stereo worked`
