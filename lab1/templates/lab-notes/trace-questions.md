# Code trace questions (rubric: Code understanding and oral defence; Q5, Q7)

Feeds oral preparation and README section 3. Copy at W3 (answer in Lab 3), revisit between W6 and W7.
Answer in your own words, in 3-6 sentences each, **citing the file and the identifier** you looked at. Open the code; do not answer from memory. At the oral you will be asked to trace live.

Files in the Lab 3 starter: `src/gaze.js` (GazeSystem, `REARM`, `update(dt)`, `activate`), `src/input.js` (InputChain, `controllerActive`, `mode`, `update()`), `src/main.js` (animation loop with the `dt` clamp, `gaze.onActivated`).

## T1. Dwell timer reset
The reticle lands on a target and stays. In `GazeSystem.update(dt)`:
a) What variable counts the dwell and what adds to it each frame?
b) Exactly which conditions reset it to 0?
c) What happens to the progress ring when you look away halfway?
d) Why does the code compare `this.t` with `settings.dwell` rather than counting frames?

Answer:

## T2. Re-arm
After an activation the timer is set to `-REARM`.
a) What does a negative timer do for the next 0.6 s?
b) What would happen with no re-arm if you kept looking at one target?
c) What is the Midas touch problem and which setting trades against it?
d) Where would you change the delay, and what other value must you consider (dwell, target size)?

Answer:

## T3. The `dt` clamp
In `main.js`: `dt = Math.min(Math.max(t - last, 0), 0.1)`.
a) What problem does the upper limit solve (think of a tab that was in the background, or a long frame)?
b) What would happen to the dwell timer without it?
c) Why use `dt` at all instead of a fixed increment per frame, given phones at 30 FPS and headsets at 72 Hz?

Answer:

## T4. What suppresses gaze under a controller?
a) Which property on the gaze system is set, by which file and method, each frame?
b) Which input-source `targetRayMode` values count as "controller active" in `controllerActive`?
c) Why is gaze suppressed while a controller is in use (hint: double activation)?
d) What about a hand? Where in the code would a connected hand be distinguished, and what does the input-mode badge show? (Check `CHANGELOG-alignment.md` for the exact identifier if the starter splits hand from controller.)

Answer:

## T5. Input arbitration
a) List the four steps of the fallback chain in order and where each is implemented.
b) Which events fire when a controller disconnects mid-session (`connected` / `disconnected`), and what does `update()` do on the next frame?
c) How quickly does the next input take over? Your measured value: ____ s (Lab 3 Task 4 table).
d) Why must gaze keep working in mono, stereo and WebXR?

Answer:

## Self-check
- [ ] I opened the code for each answer.
- [ ] I can find `REARM`, the `dt` clamp and `controllerActive` without searching.
- [ ] I can explain each one aloud in under 90 seconds.
