# Imperium brand logos (PNG exports)

Source PNG exports of the Imperium mark and wordmark. The vector (SVG)
sources live one level up in [`assets/`](../).

| File | What it is | Used for |
| --- | --- | --- |
| `imperium-logo-horizontal.png` | Mark + "Imperium / Task Manager" wordmark (1108×296) | **Email headers** — hosted at `apps/landing/imperium-logo.png` → `https://imperiumtm.com/imperium-logo.png` |
| `imperium-mark-1024.png` | Shield mark on its tile | App icon / square contexts |
| `imperium-mark-transparent.png` | Shield mark, transparent bg (920×920) | Overlays, compositing on any background |
| `imperium-icon-1024.png` / `-512` / `-128` | App icon at sizes | Favicons, store icons |
| `imperium-icon-brown-1024.png` | Brown-on-light icon | Light backgrounds |
| `imperium-icon-light-1024.png` | Light icon | Dark backgrounds |

Note: if you re-export `imperium-logo-horizontal.png`, also refresh the
hosted copy at `apps/landing/imperium-logo.png` (that's the URL the auth
emails point at).
