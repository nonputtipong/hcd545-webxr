# Live-change drills (rubric: Code understanding and oral defence)

Feeds oral preparation only (not README). Copy between labs W5 to W6, repeat W6 to W7.
At the oral (minutes 6-8) the examiner asks for one small modification. You may use documentation and your own notes, not an AI assistant. Targets: Expert 3 minutes or less, Masterly 5 minutes or less, and it must run on a phone with side effects explained (persistence, UI update).

## How to drill
1. Start from a clean `main` that matches `a1-final`. Run the live build or `npm run dev`.
2. Start the stopwatch when you read the task. Stop when the change works **on your phone**. Do not use AI.
3. Commit with a clear message, and write the commit hash. Then revert (`git revert` or a fresh branch) so the next drill starts clean.
4. Explain the side effects out loud: what else reads this value, does it persist, does the UI update, does the other mode break.

## Drills (do each at least once; repeat the slow ones)

| # | Change | Files you expect to touch | Stopwatch (min:s) | On phone (Y/N) | Hints used | Commit hash | Side effects I explained |
|---|---|---|---|---|---|---|---|
| 1 | Change the default dwell to 2 s and show the value in the settings panel | `settings.js` (default), the panel or 3D menu label |  |  |  |  |  |
| 2 | Add a fifth gaze target (a new object with `userData.target`, scaled by the Size setting) | `my-interaction.js` or your scene file, `gaze.add(...)` |  |  |  |  |  |
| 3 | Add a mute-audio switch reachable by gaze (a 3D button or object that toggles `audio`) | `menu.js`, `settings.js` key `audio` |  |  |  |  |  |
| 4 | Change the vignette strength (or default mode) and show it responds to teleport | `comfort.js` or `my-comfort.js`, `settings.js` |  |  |  |  |  |
| 5 | Add a log line proving which input fired (`via`: gaze, controller, pointer, tap, key) | `gaze.js` `activate`, `input.js` |  |  |  |  |  |

Extra from the assignment's live-change menu if you finish early: add or move a target; add a fifth settings option; make the ring colour follow the contrast mode.

## Reflection (after each round)
- Which drill was slowest and why (searching, not knowing where the value lives, forgetting persistence)?
- Which file do you still need to re-read before the oral?
- Best time per drill after the second round:  1 ____  2 ____  3 ____  4 ____  5 ____
