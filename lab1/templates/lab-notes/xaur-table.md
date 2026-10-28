# XAUR mapping table and rationale frame (D4, rubric: Accessibility and inclusion rationale (XAUR))

Feeds README section 7. Copy at W3 (start the table), finish between W4 and W6.
Source: W3C *XR Accessibility User Requirements*, Working Group Note, https://www.w3.org/TR/xaur/. It is informative, not a standard.

## Rules
- Open the page and copy the **user need name exactly as written there**. Write the date you checked it. Do not cite requirement numbers or letters from memory or from this template.
- Map at least **6 features** (Expert). Each to a named need, to a specific group of people, and to your own data where a default is involved.
- At least one row must be an **unmet need** (a need you did not meet), with a testable next step.

## Starting points (instructor pre-check, 2026-10-13, by reading the page's section headings; unverified in detail: confirm every name and wording yourself)
The page's section titles that look relevant to this build:
- Motion agnostic interactions (controller-free selection, seated use)
- Interaction speed (dwell time)
- Interaction and target customization (target size, sensitivity)
- Avoiding sickness triggers (teleport, vignette, snap turn, reduce motion)
- Color changes (contrast mode)
- Captioning, Subtitling and Text: Support and customization (captions, visual equivalent for audio)
- Spatial audio tracks and alternatives; Spatial orientation: Mono audio option (audio on/off, mono)
- Safe harbour controls (Pause / Exit)
- Orientation and navigation (reset, device-independent recentre)
- Immersive personalization (persistent settings)

Seated mode has no dedicated section of its own that the pre-check found; decide which need it supports and say why.

## Table

| # | Feature (your build) | XAUR need as worded on the page | Date checked | Who it helps (specific group) | Own data (Lab 3 number, test result) | Trade-off | Unmet need? |
|---|---|---|---|---|---|---|---|
| 1 | Gaze dwell (no controller) |  |  |  |  |  |  |
| 2 | Adjustable dwell time (0.8-2.5 s range, default ____ s) |  |  |  |  |  |  |
| 3 | Target size setting and 3 degree minimum |  |  |  |  |  |  |
| 4 | Teleport, vignette, snap turn, reduce motion |  |  |  |  |  |  |
| 5 | Audio on/off and visual equivalent (captions) |  |  |  |  |  |  |
| 6 | Contrast mode |  |  |  |  |  |  |
| 7 | Seated mode and Reset height |  |  |  |  |  |  |
| 8 | Safe harbour: Pause / Exit by gaze |  |  |  |  |  |  |
| 9 | Persistent settings (`localStorage`) |  |  |  |  |  |  |
| 10 | (Unmet) a need you did not meet |  |  |  |  | n/a | Yes: what you would do next and the test that shows it worked |

## Frame for the 400-600 word rationale (write the prose in README section 7)

1. **Who is excluded without each feature** (about 150 words). Name groups: people without controllers, with limited reach or fine motor control, deaf or hard of hearing, prone to motion sickness, with low vision, using different phone or headset setups. One sentence each, tied to a table row.
2. **Why each default and range** (about 150 words). Dwell default and range, target size, vignette, teleport. Cite your Lab 3 timing experiment: "My median selection time was ____ s at dwell ____ s; ____ accidental activations in ____ trials." A default of 1.0-1.5 s is a design judgment, not a standard.
3. **Trade-offs** (about 100 words). For example: longer dwell is safer against accidental activation (the Midas touch problem) but slower; a vignette reduces sickness but narrows the field of view; a high-contrast mode may reduce scene mood.
4. **One unmet need and the next step** (about 100 words). A real gap in your build, and a testable criterion: "I would add ____; it passes if ____ participants complete ____ in under ____ s."

Word count (rationale only, excluding table): ____ (must be 400-600)

## Check before submission
- [ ] Every need name and quotation copied from the XAUR page, with date
- [ ] At least 6 features mapped, each to a group of people
- [ ] Defaults justified with your own numbers
- [ ] Trade-offs stated
- [ ] One unmet need with a testable next step
