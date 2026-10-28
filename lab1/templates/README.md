# A1 student templates

Templates for the documentation and evidence of Assignment A1 (Accessible, Multi-Platform WebXR Experience). They are reference material and cost no lab minutes: you copy a file at the moment the lab or between-labs box tells you, and fill it in as you go.

## How to copy them into your repository

From the root of your own repository (not this folder), after you have copied the lab starter in:

```bash
mkdir -p lab-notes docs
cp <path-to-starter>/templates/README-template.md README.md        # Lab 1 (then edit the top line and title)
cp <path-to-starter>/templates/lab-notes/device-matrix.md lab-notes/   # Lab 1
cp <path-to-starter>/templates/lab-notes/delivery.md lab-notes/        # between labs W1 to W2
cp <path-to-starter>/templates/lab-notes/adaptations.md lab-notes/     # Lab 2
cp <path-to-starter>/templates/lab-notes/gaze-only-test.md lab-notes/  # Lab 3
cp <path-to-starter>/templates/lab-notes/xaur-table.md lab-notes/      # Lab 3
cp <path-to-starter>/templates/lab-notes/trace-questions.md lab-notes/ # Lab 3
cp <path-to-starter>/templates/lab-notes/live-change-drills.md lab-notes/  # between labs W5 to W6
```

Commit the copies (`git add lab-notes README.md docs`). Screenshots go in `docs/`.

## Which template, which lab

| File | Copy at | Feeds README section | Rubric row |
|---|---|---|---|
| `README-template.md` | Lab 1 (becomes `README.md`) | all | Documentation |
| `lab-notes/device-matrix.md` | Lab 1 | 4 Device test matrix | Multi-platform delivery and platform-specific adaptation |
| `lab-notes/delivery.md` | Between labs W1 to W2 | top line, 2, 4 | Multi-platform delivery and platform-specific adaptation |
| `lab-notes/adaptations.md` | Lab 2 | 5 Platform adaptations | Multi-platform delivery and platform-specific adaptation |
| `lab-notes/gaze-only-test.md` | Lab 3 | 3, 7 | Accessible interaction |
| `lab-notes/xaur-table.md` | Lab 3 | 7 Accessibility and inclusion rationale | Accessibility and inclusion rationale (XAUR) |
| `lab-notes/trace-questions.md` | Lab 3 | 3, oral preparation | Code understanding and oral defence |
| `lab-notes/live-change-drills.md` | Between labs W5 to W6 | oral preparation | Code understanding and oral defence |

The README is assembled from the lab-notes files: paste or summarise each table into its section, so the README is the single document the examiner reads. The same map is in Appendix A of `README-template.md`.

## Rules that apply to all templates

- Evidence comes from the live HTTPS URL where possible, with a date.
- Mark anything untested as "not tested".
- XAUR wording is quoted only after checking https://www.w3.org/TR/xaur/.
- Field names in the templates (`dwell`, `targetScale`, `REARM`, `controllerActive`, `caps.report()`) refer to the Lab 3 starter in `../lab3/src`. If your copy differs, use your own names and keep the meaning.
