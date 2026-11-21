# Twin Lanterns — Spot the Difference

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![Rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Hasanrdp/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![Reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Hasanrdp/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

**Twin Lanterns** is a spot-the-difference game about two lantern-lit
pictures that are almost — but never quite — the same. Built for the
[make.fun best-spot-the-difference-game-20261121-0451 bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).

## The game

Two near-identical pictures sit side by side. Seven differences hide
between them. Click a difference on either picture and a golden ring marks
it on both; a counter at the bottom counts down how many remain. A wrong
click costs a heart, and the lantern burns down in 3 minutes per scene.

- **Three hand-drawn scenes:** Harbour at Dusk (fishing boats, a
  lighthouse, gulls), Moonlit Garden (koi pond, cherry blossom, fireflies),
  and Bakery Morning (striped awning, a bicycle, a cat on the doorstep).
- **Seven differences per scene:** a missing flag, an extra crate, a
  lantern that changed colour, a fish that jumped, a frog that appeared —
  each one painted into the scene itself, never pasted on top.
- **Hints:** three per scene (H or the Hint button). A hint pulses the next
  unfound difference and costs 50 points.
- **Scoring:** 100 points per find plus a time bonus, a 250-point clear
  bonus, and a time bonus for finishing fast. Best total score is kept
  between visits.
- **Sound:** all effects are synthesised with WebAudio — chimes for a find,
  a low buzz for a miss, a fanfare for clearing a scene. M mutes.
- **No network, no build step:** static files under `game/`, plain canvas
  2D, deterministic per `?seed=N`.

## Controls

- **Mouse** — click a difference on either picture; click buttons
- **1 / 2 / 3** — start a scene from the title screen
- **H** — hint (3 per scene)
- **P / Esc** — pause (leaving the tab pauses too)
- **M** — mute / unmute
- **N** — next scene after clearing one
- **R** — retry a scene, or play again after winning

## Files

- `game/index.html` — the page; `game/src/main.js` — boot and frame loop
- `game/src/world.js` — state, levels, click resolution, timer, hints, scoring
- `game/src/scenes.js` — the three scenes, each painted twice (left plain,
  right with its seven differences)
- `game/src/render.js` — HUD, markers, progress dots, and all screens
- `game/src/config.js` — layout, tuning, and the difference data
- `game/src/random.js` — seeded RNG for deterministic scenes
- `game/src/input.js` — pointer and keyboard input
- `game/src/audio.js` — synthesised sound effects
- `game/src/shots.js` — deterministic `?shot=` states for screenshots
- `main.ts` — hands the game in (copies game/ + screenshots/, writes the dossier)
- `shots.json` — the four screenshot states and their URLs

## Screenshots

Take them in desktop Chrome from `game/` served locally
(`node serve.ts`, then http://localhost:8080):

- `?shot=start` — title screen over the harbour scene
- `?shot=play` — mid-game, 3 of 7 found, 4 remain
- `?shot=play2` — the garden, 5 of 7 found
- `?shot=end` — victory screen after all three scenes

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
