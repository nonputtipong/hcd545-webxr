# Delivery notes (R1, D1, D2)

Feeds README: top line "Live: <URL> (commit <hash>)", section 2 How to run, and the Size column of the device matrix.
Copy at: Between labs W1 to W2 (deploy to GitHub Pages is required). Re-measure before tagging `a1-final`.

## 1. Deployment

| Item | Value |
|---|---|
| Repository URL |  |
| GitHub Pages URL (https) |  |
| Pages source | GitHub Actions (workflow copied from `github-pages-workflow.yml`) |
| Commit hash shown in the page footer / on the Pages deploy |  |
| Opened successfully on phone (device, browser, date) |  |
| Opened successfully on laptop (browser, date) |  |

## 2. First-load transfer (target: 15 MB or less)

Method: open the live URL in a fresh tab. DevTools, Network tab, tick **Disable cache**, reload. Read "transferred" at the bottom of the panel (not "resources").

| Date | Browser | Disable cache ticked (Y/N) | Requests | Transferred | Resources (uncompressed) | 15 MB or less (Y/N) |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

Largest three files (name, size) and what you would shrink first:

1.
2.
3.

## 3. Branch and tag policy check (run before every lab tag)

Pages deploys from `main`. Work on a branch is invisible on the live URL until it is merged.

- [ ] Merge the lab branch to `main`
- [ ] `git push`
- [ ] `git tag labN` (or `a1-final`)
- [ ] `git push --tags`
- [ ] Confirm in the Actions tab that the Pages deploy ran for this commit, and that the commit hash on the live page equals the tag

Tag | Commit hash | Pages deploy confirmed (date)
---|---|---
lab1 | |
lab2 | |
lab3 | |
a1-final | |

## 4. Capability check output

Paste the output of `console.table(caps.report())` from your phone or laptop console (or the Copy report text). Note the device class it chose.

```
(paste here)
```
