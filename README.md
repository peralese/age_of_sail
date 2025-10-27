# Wooden Ships (Inspired) — Milestone 1 Prototype

## ⚓ Overview

This project is a **Python-based tactical naval combat simulator** inspired by the classic Avalon Hill board game *Wooden Ships & Iron Men*. It recreates the thrill of 18th–19th century Age-of-Sail combat, emphasizing wind, broadsides, maneuvering, and morale.

> **Note:** This project is an *original reimagining*, not an official or commercial adaptation of Avalon Hill’s game. It uses original data, rules, and mechanics while capturing a similar spirit.

---

## 🎯 Project Goals (Milestone 1)

* Create a **turn-based console engine** (no graphics yet)
* Model ship movement based on wind direction and rigging damage
* Simulate **port/starboard broadside combat**
* Include **basic morale and surrender mechanics**
* Track win conditions per nation

This version lets you command a ship, fire broadsides, and maneuver against an AI or human hotseat opponent directly from the command line.

---

## 🧱 Project Structure

```
wooden_ships_proto/
├── main.py           # Game loop and user menu
├── game_state.py     # Ship and GameState classes
├── actions.py        # Turn, movement, and combat logic
└── README.md         # Project documentation (this file)
```

---

## ⚙️ How to Run

### 1. Requirements

* Python 3.9+
* No external libraries required (standard library only)

### 2. Setup

```bash
git clone https://github.com/<yourname>/wooden_ships_proto.git
cd wooden_ships_proto
```

### 3. Run the Game

```bash
python main.py
```

You’ll see a text-based interface allowing you to control ships, turn, move, and fire broadsides.

---

## 🎮 Gameplay Basics

### Ships

Each ship has the following stats:

* **Hull** – Structural strength (if reduced to 0, the ship sinks)
* **Rigging** – Affects speed and maneuvering
* **Crew** – Affects boarding and morale
* **Guns (Port/Starboard)** – Determines firepower on each side
* **Handling** – Max turn angle per turn
* **Base Speed** – Determines speed under full sail

### Wind

* The **wind direction** affects how fast a ship can move depending on its heading.
* Sailing into the wind (“in irons”) greatly slows your ship.

### Movement

Ships move forward each turn based on:

```
effective_speed = base_speed × sail_setting × rigging_health × wind_angle_modifier
```

### Combat

* You can fire from either the **port** or **starboard** side depending on relative bearing.
* Damage is applied to hull, rigging, and crew.
* Morale checks trigger when damage is severe — a ship may **strike its colors**.

### Victory

* If only one nation has ships still afloat and unsurrendered, that side wins.

---

## 🧩 Example Scenario

**HMS Resolute** (British) vs **Glorieuse** (French)

* The Resolute is a heavy 74-gun ship of the line.
* The Glorieuse is a lighter, faster 38-gun frigate.
* Both begin on opposite sides of the map.

You can move, turn, and fire until one side surrenders or sinks.

---

## 🚀 Next Milestones

### **Milestone 2 – Tactical Layer (Visuals & AI)**

* Add Pygame 2D grid visualization (ships, wind arrow, firing arcs)
* Introduce simple AI captain (attempts to turn broadside and maintain optimal range)
* Add boarding and grappling mechanics

### **Milestone 3 – Scenarios & Data Files**

* Load ships and setups from JSON
* Add wind shift events
* Add historical scenario templates (fictionalized)

### **Milestone 4 – Multiplayer / Campaign Mode**

* Enable LAN or hotseat multiplayer
* Persistent campaign mode (ship upgrades, crew experience)

---

## 🧠 Design Philosophy

* Keep it **mechanically faithful** to Age of Sail tactics
* Maintain a **clean, extensible codebase** for future Pygame or web UIs
* Focus on **fun, not fidelity** — this is naval chess, not a simulator

---

## 📜 License

MIT License. Use freely, modify, and share!

---

## 👨‍✈️ Author

**Erick Perales** — IT Architect, Cloud Migration Specialist
*GitHub:* [@peralese](https://github.com/peralese)

---
