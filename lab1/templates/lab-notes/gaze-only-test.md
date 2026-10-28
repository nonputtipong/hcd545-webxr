# Gaze-only completion test (R5, R10, R11; rubric: Accessible interaction)

Feeds README sections 3 and 7 and the oral demo (0-2 min).
Copy at W3. Repeat on the final build.

Rule: after pressing Start, complete the whole experience with **no controller, no touch, no key press**. A tap on Start is allowed. If you need any other input in a mode, that mode is not gaze-only complete: write what blocked you.

## 1. Targets and size

At least 4 distinct interactive targets. Angular size = 2 x atan(size / (2 x distance)), in degrees, using the target's smallest dimension and the default viewing distance. In the console, `hcd.angularSize(obj)` gives it if your starter includes the helper (confirm in `CHANGELOG-alignment.md`); otherwise calculate by hand. Requirement: 3 degrees or more at default Size setting.

| # | Target (label in `userData.target.label`) | Size (m) | Distance (m) | Angular size (deg) | 3 deg or more (Y/N) |
|---|---|---|---|---|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
| 4 |  |  |  |  |  |

## 2. Completion by mode

Cell: Y (activated by gaze), N (could not), or note. Add a row per target.

| Target | Mono (phone or desktop) | Stereo (phone) | WebXR (headset or emulator) |
|---|---|---|---|
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |
| 4 |  |  |  |
| Pause / Exit reachable by gaze at any time |  |  |  |
| Settings panel reachable by gaze |  |  |  |
| Whole task completed gaze-only (Y/N) |  |  |  |
| Time to complete (s) |  |  |  |
| Device and date |  |  |  |

## 3. Dwell checks

| Check | Result |
|---|---|
| Progress ring fills while looking | |
| Look away: ring resets | |
| After activation, no repeat for the re-arm delay (`REARM` in `gaze.js`) | |
| Audio confirmation and visual confirmation both occur | |
| Sound muted: task still completable | |
| Dwell adjustable from 0.8 s to 2.5 s (3D buttons), value shown | |
| Dwell setting survives a reload | |

## 4. Problems found (what blocked gaze-only, what you changed)

1.
2.
