# Magic Story — Swap & Repaint Prototype

A front-end prototype for the Magic Story image-editing workflow: dropping a customer's
child avatar into a finished story page (**Avatar Swap**), or keeping the characters and
changing the scene behind them (**Background Repaint**).

It's a single self-contained `index.html` — no build step, no server. Just open it.

## Run it

Double-click `index.html`, or serve the folder any way you like. To view it live on the web,
enable **GitHub Pages** (Settings → Pages → Deploy from branch → `main` / root).

## The flow

A guided stepper, chosen from two modes on the landing screen:

**Avatar Swap:** upload base image → auto-build the mask (shown side-by-side to approve) →
upload the avatar (full body + face) → prompt → output resolution (1k / 2k / 4k) → generate.

**Background Repaint:** upload base image → auto-build the mask → describe the new background
(with a *Suggest a prompt* helper) → output resolution → generate.

## Status — what's real vs. simulated

This is a **UI prototype**. The flow is fully clickable, but two steps are placeholders until
the backend is wired up (both are clearly badged `simulated` in the UI):

- **Mask generation** — currently a stand-in. Wires in as: Higgsfield `remove_background`
  on the base image → a small deterministic code step → the black/white mask.
- **Generate** — currently shows the base image as a stand-in. Wires in as the real
  Higgsfield generation call.

## Next steps

1. Wire real mask generation into the mask step.
2. Wire the real generation call to the Generate button.
3. (Optional) Add a "drop in a real mask" upload so the flow can be tested end-to-end
   before the auto-mask backend exists.
