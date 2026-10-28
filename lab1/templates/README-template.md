Live: <URL> (commit <hash>)

<!--
HOW TO USE THIS TEMPLATE (delete this comment block before the oral)
- Copy this file to README.md at the root of your repository. Keep the top line: the URL must serve the exact commit tagged a1-final (A1 D2).
- Required length 2-4 pages (A1 D3). Tables do not count against you; padding does.
- Each section below says which lab-notes file feeds it. Paste or summarise; do not retype evidence you already recorded.
- Mark anything you did not test as "not tested". Honest partial results score higher than a matrix of unexplained passes.
-->

# <Your experience title>

## 1. What it is
Two or three sentences: the theme, the task a visitor completes, the end state, and how long it takes (target: under 3 minutes, R11).

## 2. How to run
Write this so a classmate can reproduce it in 10 minutes or less (rubric C6).

- Phone (monocular and stereo): open the Live URL, press Start, allow motion access on iOS. Press Stereo for the viewer layout.
- Desktop: open the Live URL, drag to look. Q / E turn.
- Headset browser: open the Live URL, press ENTER VR (shown only when `immersive-vr` is supported).
- From source: `npm install`, `npm run dev`, open the https Network URL. `npm run build` for the deployed build.

## 3. Controls and the input fallback chain
Four steps, in this order. The same activation path (`select` event on the XR input source, otherwise the gaze or pointer path) is used wherever possible.

| Step | Input | When it is in charge | How the page shows it |
|---|---|---|---|
| 1 | Controller select | A tracked-pointer input source is connected | Input-mode badge: "controller" |
| 2 | Hand pinch | An input source with a hand is present (a transient-pointer select) | Input-mode badge: "hand" |
| 3 | Gaze dwell | No controller or hand, or gaze enabled in the headset or stereo | Progress ring on the reticle |
| 4 | Pointer / touch | Mono on a phone or desktop; tap in stereo | Badge: "pointer/tap" |

Note what happens when a controller disconnects mid-session (target: next input takes over within 1 s, R6) and your measured takeover time: ____ s (from lab-notes/trace-questions.md and the Lab 3 Task 4 table).

Also list: safe-harbour controls (Pause / Exit reachable by gaze), settings reachable by gaze, keyboard shortcuts.

## 4. Device test matrix
Source: `lab-notes/device-matrix.md`. Paste the table here. At least 3 device/browser classes; dates; a screenshot link per row; pass / partial / not tested.

| Device | Browser | Date | Mode reached | Result | Screenshot | FPS | Size |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

Hand input on Quest: tested / not tested (R6).

## 5. Platform adaptations (at least 3)
Source: `lab-notes/adaptations.md`. Each row names the code location, the reason, and a before/after measurement or observation (R12).

| Adaptation | Where in code | Reason | Before | After |
|---|---|---|---|---|
|  |  |  |  |  |

## 6. Comfort and perception choices
Source: Lab 2 experiment notes (IPD, latency) and the comfort section of `lab-notes/delivery.md` if you recorded FPS there. State each default and why: IPD default and range, vignette mode, teleport rather than continuous movement, snap-turn angle, FPS target, mono/stereo toggle time (stopwatch, under 2 s). Quote your own Lab 2 results.

| Choice | Default | Range exposed | Evidence (your Lab 2 data) |
|---|---|---|---|
|  |  |  |  |

## 7. Accessibility and inclusion rationale (400-600 words)
Source: `lab-notes/xaur-table.md` (table and rationale frame). Write the rationale here, not in the table file. It must map at least 6 features to named XAUR user needs and to specific groups of people, justify each default with your Lab 3 data, state trade-offs, and name one genuine unmet need with a testable next step. Quote XAUR only after checking the wording on https://www.w3.org/TR/xaur/.

<Rationale text. Word count: ____ >

## 8. Known limits
Bullet list. Include your unmet need, untested platforms and any failed matrix row with its cause and workaround.

## 9. Asset licences
| Asset | Source | Licence | Used for |
|---|---|---|---|
|  |  |  |  |

If every asset is generated in code, say so.

## 10. AI-use log
Follow the logistics README. For each use: date, tool, what you asked, what you kept, what you changed, and which file it touched. You must be able to explain every line.

| Date | Tool | Purpose | File(s) | What I changed after |
|---|---|---|---|---|
|  |  |  |  |  |

---

## Appendix A. Map: lab-notes file to README section

| Lab-notes file (copy at lab) | Feeds README section | Rubric row | Copy at |
|---|---|---|---|
| `lab-notes/delivery.md` | Top line; 2 How to run; 4 matrix (size column) | Multi-platform delivery and platform-specific adaptation | Between labs W1 to W2 |
| `lab-notes/device-matrix.md` | 4 Device test matrix | Multi-platform delivery and platform-specific adaptation; Documentation | W1 (first rows) |
| `lab-notes/adaptations.md` | 5 Platform adaptations; 6 (FPS numbers) | Multi-platform delivery and platform-specific adaptation; Perception and comfort | W2 |
| `lab-notes/gaze-only-test.md` | 3 Controls; 7 Rationale evidence | Accessible interaction | W3 |
| `lab-notes/xaur-table.md` | 7 Accessibility and inclusion rationale | Accessibility and inclusion rationale (XAUR) | W3 |
| `lab-notes/trace-questions.md` | 3 Controls (takeover time); oral preparation | Code understanding and oral defence | W3 |
| `lab-notes/live-change-drills.md` | Oral preparation only (not in README) | Code understanding and oral defence | Between labs W5 to W6 and W6 to W7 |

## Appendix B. Self-check before tagging `a1-final` (R1-R12)
Tick only what you have observed on the live URL, not on your dev server. Delete this appendix or keep it as "Requirement status"; either is acceptable.

- [ ] R1 Live HTTPS URL on a phone and a laptop; first-load transfer 15 MB or less (Network tab, Disable cache ticked); URL commit equals `a1-final`.
- [ ] R2 WebXR button appears only when `isSessionSupported('immersive-vr')` is true; otherwise the fallback starts. Capability report printed with `console.table(caps.report())` (in the browser console type `console.table(hcd.caps.report())`).
- [ ] R3 Phone rotation rotates the view; denying motion permission leaves drag look-around working.
- [ ] R4 Mono/stereo toggle in under 2 s with no reload; IPD changes parallax across at least 55-70 mm.
- [ ] R5 At least 4 distinct gaze targets; progress ring; re-arm; audio and visual confirmation; dwell adjustable over at least 0.8-2.5 s; whole experience completed with gaze only in mono, stereo and WebXR (`lab-notes/gaze-only-test.md`).
- [ ] R6 Four-step fallback chain; active input shown; takeover within 1 s; hand on Quest marked tested or not tested.
- [ ] R7 FPS readout with developer toggle; vignette during any movement (including teleport blink); teleport reachable by gaze; snap turn option; comfort settings in one panel.
- [ ] R8 PositionalAudio; audio on/off; every audio cue has a visual equivalent; task completable with sound muted.
- [ ] R9 Dwell time, target size, contrast mode, audio, seated mode (Reset height), reduce motion all reachable by gaze; settings survive a reload.
- [ ] R10 Every interactive target subtends 3 degrees or more at default distance (calculated or measured with `hcd.angularSize`); stereo screenshot shows legible text.
- [ ] R11 Clear start, task, end state, and Pause/Exit reachable by gaze at any time; task done in under 3 minutes.
- [ ] R12 At least 3 adaptations (aim for 4) with reason and before/after.
- [ ] D-checks: README 2-4 pages; matrix 3+ classes; 400-600 word rationale; licences; AI-use log; tags `lab1`, `lab2`, `lab3`, `a1-final`; no `node_modules` committed.

## Appendix C. Oral preparation prompts
Write two or three lines of your own answer to each, with the file and line you would open. The oral is 8 minutes: demo 0-2, questions 2-6, live change 6-8.

1. Mode selection: How does the app decide what to start in on an iPhone and on a Quest 3? Which line? What happens if motion permission is denied?
2. Platform change: Name one thing you changed because of the platform and show the before/after number.
3. Stereo: Why does stereo need offset cameras? What does changing IPD do, and what does the simple stereo effect not correct?
4. Comfort: What did you do about motion sickness, and what is the first thing you check if a tester feels unwell?
5. Dwell trace: Walk from the reticle landing on a target to activation. What resets the timer? What re-arms it? Why is `dt` used and clamped?
6. Defaults: Why this dwell time and target size? What would you change for a user with tremor?
7. Fallback chain: Show the arbitration code. What happens when a controller disconnects? Why does gaze stay available in every mode?
8. Inclusion: Who cannot use this, and what do you change first? State a testable criterion.
9. Audio: What does PositionalAudio do, why does it need a click, and what do deaf users get?
10. Loop: Why `renderer.setAnimationLoop` and not `requestAnimationFrame`?
11. Matrix: Which row failed or was partial, and what did you do?
12. Live change: practise with `lab-notes/live-change-drills.md`.
