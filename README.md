# Wooden Ships (Inspired) - Milestone 1 Prototype

## Overview

This project is a Python-based tactical naval combat simulator inspired by the classic Avalon Hill board game Wooden Ships & Iron Men. It recreates the thrill of 18th-19th century Age-of-Sail combat, emphasizing wind, broadsides, maneuvering, and morale.

Note: This project is an original reimagining, not an official or commercial adaptation of Avalon Hill's game. It uses original data, rules, and mechanics while capturing a similar spirit.

---

## Project Goals (Milestone 1)

- Create a turn-based console engine (no graphics yet)
- Model ship movement based on wind direction and rigging damage
- Simulate port/starboard broadside combat
- Include basic morale and surrender mechanics
- Track win conditions per nation

This version lets you command a ship, fire broadsides, and maneuver against an AI or human hotseat opponent directly from the command line.

---

## Project Structure

```
main.py         # Game loop, menu, mini-map, AP flow
game_state.py   # Ship + GameState models
actions.py      # Turning, movement, firing & damage
README.md       # This file
```

---

## How to Run

Requirements
- Python 3.9+
- No external libraries required (standard library only)

Run
```
python main.py
```

You will see a text interface to control ships, turn, move, fire, manage sails, and ammo.

---

## Gameplay Basics

### Ships

Each ship has the following stats:

- Hull - Structural strength (at 0 the ship sinks)
- Rigging - Affects speed and maneuvering
- Crew - Affects boarding and morale
- Guns (Port/Starboard) - Firepower rating by side
- Handling - Max degrees you can turn in one action
- Base Speed - Baseline speed under full sail

### Wind

- Wind direction affects how fast a ship can move depending on its heading.
- Sailing into the wind ("in irons") greatly slows your ship.

### Movement

```
effective_speed = base_speed x sail_setting x rigging_health x wind_angle_modifier
```

### Combat

- You can fire from either the port or starboard side depending on relative bearing.
- Damage is applied to hull, rigging, and crew.
- Morale checks trigger when damage is severe - a ship may strike its colors.

### Victory

- If only one nation has ships still afloat and unsurrendered, that side wins.

---

## Current Mechanics (Prototype)

- Action Points (AP)
  - Each ship starts the turn with AP=4.
  - Actions cost 1 AP: Turn, Move, Fire. "End activation" ends the ship's turn early.
  - The turn advances automatically when all ships spend their AP.
- Turn 1 Setup
  - On each ship's first activation on Turn 1, set initial sails (free) and choose + load the initial ammo (free).
- Sails
  - "battle" (more stable, slower) or "full" (faster). Changing sails on later turns costs 1 AP.
- Ammo Types
  - "round" - Baseline split (60% hull, 30% rigging, 10% crew).
  - "chain" - Shorter range (out of range at >=5), increased rigging damage, reduced hull.
  - "double" - Very short range (out of range at >=2), increased crew damage.
  - Firing unloads the guns. Use "Load shot (1 AP)" to load or change shot at any time.
- Mini-map
  - ASCII mini-map shows ship letters at positions and heading arrows (and an adjacent arrow marker).
  - The map renders once per activation to reduce clutter (toggleable).
- 1v1 Targeting
  - When only one valid target exists, it is auto-selected.
- Status Formatting
  - Heading in deg; hull/rigging with one decimal; crew is an integer; ammo shows "round/chain/double" or "Unloaded".

---

## Controls

- 1 - Turn ship
- 2 - Move ship
- 3 - Fire broadside
- 4 - End activation
- 5 - Quit
- 6 - Toggle mini-map
- 7 - Load shot (1 AP)

---

## Example Scenario

HMS Resolute (British) vs Glorieuse (French)

- The Resolute is a heavy 74-gun ship of the line.
- The Glorieuse is a lighter, faster 38-gun frigate.
- Both begin on opposite sides of the map.

Play until one side surrenders or sinks.

---

## Next Milestones

### Milestone 2 - Tactical Layer (Visuals & AI)

- Add Pygame 2D grid visualization (ships, wind arrow, firing arcs)
- Introduce simple AI captain (attempt to turn broadside and maintain optimal range)
- Add boarding and grappling mechanics

### Milestone 3 - Scenarios & Data Files

- Load ships and setups from JSON
- Add wind shift events
- Add historical scenario templates (fictionalized)

### Milestone 4 - Multiplayer / Campaign Mode

- Enable LAN or hotseat multiplayer
- Persistent campaign mode (ship upgrades, crew experience)

---

## Design Philosophy

- Keep it mechanically faithful to Age of Sail tactics
- Maintain a clean, extensible codebase for future Pygame or web UIs
- Focus on fun, not fidelity - this is naval chess, not a simulator

---

## License

MIT License. Use freely, modify, and share.

---

## Author

Erick Perales - IT Architect, Cloud Migration Specialist
GitHub: @peralese (https://github.com/peralese)

