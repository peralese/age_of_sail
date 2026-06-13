# Age of Sail (Hex Tactics Prototype)

## Overview

A browser-based tactical naval combat game inspired by the classic Avalon Hill board game *Wooden Ships & Iron Men*. It recreates 18th/19th century Age-of-Sail combat on a hex grid: wind-driven movement, ship facing, broadside firing arcs, and damage to hull, rigging, and crew.

Note: This project is an original reimagining, not an official or commercial adaptation of Avalon Hill's game. It uses original data, rules, and mechanics while capturing a similar spirit.

This is a from-scratch rewrite of the earlier Python console prototype, moving to a TypeScript + Canvas hex-grid game with a basic AI opponent.

---

## Project Structure

```
index.html       # App shell (canvas + side panel)
src/
  main.ts         # Bootstraps the scenario and UI
  hex.ts          # Axial hex-grid math (directions, distance, pixel conversion)
  types.ts        # Ship and game state types
  ships.ts        # Ship factory / starting stats
  scenario.ts     # Starting scenario (ships, positions, wind)
  gameState.ts    # Turn/activation tracking, victory conditions
  actions.ts      # Turning and movement (wind, sail, rigging)
  combat.ts       # Firing arcs, range, damage, ammo, morale
  ai.ts           # Simple AI captain
  render.ts       # Canvas rendering of the hex grid, ships, wind
  ui.ts           # Side panel, action buttons, combat log
  style.css       # Layout and styling
```

---

## How to Run

Requirements
- Node.js 18+

Install and run the dev server:
```
npm install
npm run dev
```

Then open the printed local URL in your browser.

---

## Gameplay Basics

### The Grid

The battle takes place on a hex grid (axial coordinates). Each ship occupies one hex and faces one of six directions (E, NE, NW, W, SW, SE).

### Wind

Wind blows from one of the six hex directions, shown by the arrow in the top-left corner. A ship's point of sail (the angle between its heading and the wind) determines its movement allowance:

- **In irons** (facing directly into the wind): no movement
- **Close-hauled** (1 step off the wind): 1 hex
- **Reach** (2 steps off the wind, fastest): speed class + 1 hexes
- **Running** (3 steps off the wind, downwind): speed class hexes

"Battle" sail reduces movement by 1 (floor 0) but is the default; "Full" sail removes that penalty. Rigging damage further reduces movement allowance proportionally.

### Facing & Firing Arcs

Each ship has a bow (facing direction), a stern (opposite), and port/starboard broadside arcs (the two hex directions on either side of the bow). A ship can only fire a broadside at a target whose bearing falls within that arc.

### Combat

- Range bands: point-blank (1 hex, ×1.2 damage), close (2-3 hexes, ×1.0), long (4-6 hexes, ×0.5), beyond 6 hexes is out of range.
- Ammo types:
  - **Round shot** - balanced damage to hull/rigging/crew.
  - **Chain shot** - short range (≤3 hexes), extra rigging damage, reduced hull damage.
  - **Double shot** - point-blank only (1 hex), extra crew damage.
- Firing unloads the guns; use "Load Shot" to reload (costs 1 AP).
- Damage below 30% hull or crew triggers a morale check; a failed check causes the ship to strike its colors.

### Turns & Action Points

Each ship gets 4 Action Points (AP) per turn. Actions cost 1 AP each: turn (limited by handling), move forward one hex, fire a broadside, change sail setting, or load shot. "End Activation" ends a ship's turn early.

### Victory

If only one nation has ships still afloat and unsurrendered, that side wins. If both fleets are destroyed simultaneously, it's a draw.

---

## Controls

All actions are buttons in the side panel:

- **Turn Port / Turn Starboard** - rotate facing by one hex-direction (limited by handling)
- **Move Forward** - advance one hex in the current facing (limited by movement allowance)
- **Fire Port / Fire Starboard** - fire a broadside if the target is in arc and range
- **Change Sail** - toggle between Battle and Full sail
- **Load Shot** - select an ammo type and load it
- **End Activation** - pass remaining AP

---

## Current Opponent

A single AI-controlled frigate (Glorieuse, French Navy) opposes the player's ship of the line (HMS Resolute, Royal Navy). The AI fires when it can bear on the player, reloads when empty, and otherwise maneuvers to bring its guns to bear at a favorable range.

---

## Next Steps

- Hotseat / multiplayer activation order
- Multiple ships per side, squadron scenarios loaded from data
- Critical hit / damage tables (masts, rudder, magazine)
- Boarding and grappling
- Wind shifts over time

---

## License

MIT License. Use freely, modify, and share.

---

## Author

Erick Perales - IT Architect, Cloud Migration Specialist
GitHub: @peralese (https://github.com/peralese)
