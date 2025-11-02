from game_state import Ship, GameState
from actions import turn_ship, move_ship, fire_broadside, bearing_from_to


def _heading_arrow(deg: float) -> str:
    d = deg % 360
    if 337.5 <= d or d < 22.5:
        return ">"
    if 22.5 <= d < 67.5:
        return "/"
    if 67.5 <= d < 112.5:
        return "^"
    if 112.5 <= d < 157.5:
        return "\\"
    if 157.5 <= d < 202.5:
        return "<"
    if 202.5 <= d < 247.5:
        return "/"
    if 247.5 <= d < 292.5:
        return "v"
    return "\\"


def render_ascii_map(game: GameState, width: int = 31, height: int = 15) -> str:
    ships = game.living_ships() or game.ships
    if not ships:
        return "[No ships]"

    min_x = min(s.x for s in ships)
    max_x = max(s.x for s in ships)
    min_y = min(s.y for s in ships)
    max_y = max(s.y for s in ships)

    # pad bounds so ships near edges are visible
    pad = 1.0
    min_x -= pad
    max_x += pad
    min_y -= pad
    max_y += pad

    span_x = max(1e-6, max_x - min_x)
    span_y = max(1e-6, max_y - min_y)

    grid = [[" "] * width for _ in range(height)]

    # place ships (and remember their cells for heading arrows)
    taken = {}
    positions = {}
    for s in ships:
        col = int(round((s.x - min_x) / span_x * (width - 1)))
        row = int(round((s.y - min_y) / span_y * (height - 1)))
        row = (height - 1) - row  # y up -> top row
        col = max(0, min(width - 1, col))
        row = max(0, min(height - 1, row))

        key = (row, col)
        if key in taken:
            grid[row][col] = "*"  # collision marker
        else:
            sym = s.name[0].upper()
            grid[row][col] = sym
            taken[key] = s
            positions[s] = (row, col)

    # draw heading arrows in adjacent cells when available
    def _heading_offset(deg: float):
        d = deg % 360
        if 337.5 <= d or d < 22.5:   # E
            return (0, 1)
        if 22.5 <= d < 67.5:         # NE
            return (-1, 1)
        if 67.5 <= d < 112.5:        # N
            return (-1, 0)
        if 112.5 <= d < 157.5:       # NW
            return (-1, -1)
        if 157.5 <= d < 202.5:       # W
            return (0, -1)
        if 202.5 <= d < 247.5:       # SW
            return (1, -1)
        if 247.5 <= d < 292.5:       # S
            return (1, 0)
        return (1, 1)                 # SE

    for s, (row, col) in positions.items():
        dr, dc = _heading_offset(s.heading)
        ar, ac = row + dr, col + dc
        if 0 <= ar < height and 0 <= ac < width and grid[ar][ac] == " ":
            grid[ar][ac] = _heading_arrow(s.heading)

    lines = []
    lines.append(f"Wind from {game.wind_dir} deg")
    lines.append("+" + ("-" * width) + "+")
    for r in range(height):
        lines.append("|" + "".join(grid[r]) + "|")
    lines.append("+" + ("-" * width) + "+")

    # legend
    for s in ships:
        lines.append(
            f" {s.name[0].upper()} = {s.name} ({_heading_arrow(s.heading)})"
        )
    return "\n".join(lines)


def create_demo_game():
    # We'll create 2 ships:
    # - A 74-gun ship of the line (slow, tough, huge guns)
    # - A 38-gun frigate (faster, lighter)

    ship1 = Ship(
        name="HMS Resolute",
        nation="Royal Navy",
        hull_max=100,
        rigging_max=80,
        crew_max=90,
        guns_port=30,       # abstract firepower values, not literal gun count
        guns_starboard=30,
        handling=20,        # max degrees turn per turn
        base_speed=2.5,     # "units" per turn
        x=0.0,
        y=0.0,
        heading=0.0,        # facing east
    )

    ship2 = Ship(
        name="Glorieuse",
        nation="French Navy",
        hull_max=80,
        rigging_max=70,
        crew_max=75,
        guns_port=22,
        guns_starboard=22,
        handling=25,
        base_speed=3.0,
        x=8.0,
        y=2.0,
        heading=180.0,      # facing west
    )

    game = GameState(
        ships=[ship1, ship2],
        wind_dir=90,        # wind direction used abstractly for now
        wind_speed=10
    )
    return game


def show_menu(show_map: bool):
    print("\nWhat do you want to do?")
    print("1) Turn ship")
    print("2) Move ship")
    print("3) Fire broadside")
    print("4) End activation")
    print("5) Quit")
    print(f"6) Toggle mini-map [{'ON' if show_map else 'OFF'}]")
    print("7) Load shot (1 AP)")


def pick_ship(game):
    print("\nWhich ship?")
    for idx, s in enumerate(game.ships):
        status = "DEAD" if (not s.alive or s.is_sunk()) else ("SURRENDERED" if s.surrendered else "OK")
        print(f"{idx}) {s.name} ({s.nation}) [{status}] @ ({s.x:.1f},{s.y:.1f}) hdg {s.heading:.0f} deg")
    try:
        choice = int(input("Enter number: ").strip())
    except Exception:
        print("Invalid choice.")
        return None
    if choice < 0 or choice >= len(game.ships):
        print("Invalid choice.")
        return None
    return game.ships[choice]


def handle_turn_ship(game):
    ship = pick_ship(game)
    if not ship:
        return
    if not ship.alive or ship.surrendered or ship.is_sunk():
        print("That ship cannot act.")
        return
    try:
        desired = float(input("Desired new heading (0-359): ").strip())
    except Exception:
        print("Invalid heading.")
        return
    actual_change = turn_ship(ship, desired)
    print(f"{ship.name} turned {actual_change:.1f} deg. New heading {ship.heading:.1f} deg.")


def handle_move_ship(game):
    ship = pick_ship(game)
    if not ship:
        return
    if not ship.alive or ship.surrendered or ship.is_sunk():
        print("That ship cannot move.")
        return
    sail = input("Sail setting [battle/full]: ").strip().lower()
    if sail not in ("battle", "full"):
        sail = "battle"
    spd, dx, dy = move_ship(ship, game, sail_setting=sail)
    print(f"{ship.name} moved ({dx:.2f},{dy:.2f}) at effective speed {spd:.2f}. "
          f"Now at ({ship.x:.2f},{ship.y:.2f}).")


def handle_fire(game):
    print("Attacker:")
    atk = pick_ship(game)
    if not atk:
        return
    if not atk.alive or atk.surrendered or atk.is_sunk():
        print("That ship cannot fire.")
        return

    # Auto-select defender if it's a 1v1 situation (exactly two living ships)
    living = game.living_ships()
    if len(living) == 2:
        dfn = living[0] if living[1] is atk else living[1]
        print(f"Defender: {dfn.name} (auto-selected)")
    else:
        print("Defender:")
        dfn = pick_ship(game)
        if not dfn:
            return
        if not dfn.alive or dfn.is_sunk():
            print("Target already destroyed.")
            return

    # If both sides can bear, let the user choose which side to fire
    brg = bearing_from_to(atk, dfn)
    can_port = atk.can_fire_port(brg)
    can_star = atk.can_fire_starboard(brg)
    preferred_side = None
    if can_port and can_star:
        side = input("Fire side [port/starboard]: ").strip().lower()
        if side in ("port", "starboard"):
            preferred_side = side

    result = fire_broadside(atk, dfn, preferred_side=preferred_side)
    print(result)


def main_loop():
    game = create_demo_game()

    print("=== Wooden Ships (Inspired) - Milestone 1 Prototype ===")
    show_map = True
    while True:
        # Start of turn: reset AP for all living ships
        game.start_turn()
        print(f"\n=== Start Turn {game.turn_number} ===")

        # Track which ships we prompted for sails/ammo this turn
        configured = set()
        # Track mini-map rendering per active ship (show once per activation)
        shown_map_for_ship = None

        def set_sails(ship: Ship):
            cur = ship.sail_setting
            val = input(f"Set sails [battle/full] (current {cur}): ").strip().lower()
            if val in ("battle", "full"):
                ship.sail_setting = val
            print(f"Sails: {ship.sail_setting}")

        def set_ammo(ship: Ship):
            cur = getattr(ship, 'ammo_type', 'round')
            val = input(f"Load ammo [round/chain/double] (current {cur}): ").strip().lower()
            if val in ("round", "chain", "double"):
                ship.ammo_type = val
            print(f"Ammo: {ship.ammo_type}")

        def do_turn(ship: Ship):
            try:
                desired = float(input("Desired new heading (0-359): ").strip())
            except Exception:
                print("Invalid heading.")
                return False
            actual_change = turn_ship(ship, desired)
            print(f"{ship.name} turned {actual_change:.1f} deg. New heading {ship.heading:.1f} deg.")
            return True

        def do_move(ship: Ship):
            spd, dx, dy = move_ship(ship, game, sail_setting=ship.sail_setting)
            print(f"{ship.name} moved ({dx:.2f},{dy:.2f}) at effective speed {spd:.2f}. Now at ({ship.x:.2f},{ship.y:.2f}).")
            return True

        def do_load(ship: Ship):
            if ship.ap <= 0:
                print("No AP left to load.")
                return False
            loaded = getattr(ship, 'loaded_ammo', None)
            if loaded:
                ch = input(f"Guns already loaded with {loaded}. Change shot? [y/N]: ").strip().lower()
                if ch not in ("y", "yes"):
                    print("Keeping current load.")
                    return False
            val = input("Load ammo [round/chain/double] (default uses preference): ").strip().lower()
            if val not in ("round", "chain", "double"):
                val = ship.ammo_type
            ship.loaded_ammo = val
            print(f"Loaded {ship.loaded_ammo}.")
            return True

        def do_fire(ship: Ship):
            living = [s for s in game.living_ships() if s is not ship]
            if not living:
                print("No valid targets.")
                return False
            if len(living) == 1:
                dfn = living[0]
                print(f"Defender: {dfn.name} (auto-selected)")
            else:
                print("Defender:")
                dfn = pick_ship(game)
                if not dfn or dfn is ship:
                    print("Invalid target.")
                    return False
                if not dfn.alive or dfn.is_sunk():
                    print("Target already destroyed.")
                    return False

            # Require pre-loading via menu; do not auto-load here
            if getattr(ship, 'loaded_ammo', None) is None:
                print("Guns are unloaded. Use 'Load shot' before firing.")
                return False

            brg = bearing_from_to(ship, dfn)
            can_port = ship.can_fire_port(brg)
            can_star = ship.can_fire_starboard(brg)
            preferred_side = None
            if can_port and can_star:
                side = input("Fire side [port/starboard]: ").strip().lower()
                if side in ("port", "starboard"):
                    preferred_side = side
            result = fire_broadside(ship, dfn, preferred_side=preferred_side)
            print(result)
            return True

        # Activation loop: keep going until all AP are spent
        while True:
            living = game.living_ships()
            if not living:
                break
            # If no ship has AP left, end turn
            if not any(s.ap > 0 for s in living):
                break

            # Pick the next ship with AP in list order
            current = next(s for s in game.ships if s in living and s.ap > 0)

            print()
            print(game.status_report())
            if show_map and shown_map_for_ship is not current:
                print(render_ascii_map(game))
                shown_map_for_ship = current

            print(f"\nActive ship: {current.name} ({current.nation}) | AP {current.ap}/{current.ap_max}")
            if current not in configured:
                if game.turn_number == 1:
                    # First turn: set initial sails (no AP cost)
                    cur = current.sail_setting
                    val = input(f"Set initial sails [battle/full] (current {cur}): ").strip().lower()
                    if val in ("battle", "full"):
                        current.sail_setting = val
                    print(f"Sails: {current.sail_setting}")
                    # First turn: set ammo preference and LOAD it (no AP cost)
                    set_ammo(current)
                    current.loaded_ammo = current.ammo_type
                    print(f"Loaded initial ammo: {current.loaded_ammo} (free)")
                else:
                    # Subsequent turns: optional change at AP cost
                    ch = input("Change sails? [y/N] (costs 1 AP): ").strip().lower()
                    if ch in ("y", "yes"):
                        if current.ap <= 0:
                            print("No AP left to change sails.")
                        else:
                            set_sails(current)
                            current.ap = max(0, current.ap - 1)
                            print(f"AP spent to change sails. AP now {current.ap}/{current.ap_max}.")
                configured.add(current)

            show_menu(show_map)
            choice = input("Select action: ").strip()

            spent = False
            if choice == "1":
                spent = do_turn(current)
            elif choice == "2":
                spent = do_move(current)
            elif choice == "3":
                spent = do_fire(current)
            elif choice == "4":
                current.ap = 0
                print(f"Ending activation for {current.name}.")
            elif choice == "5":
                print("Exiting game.")
                return
            elif choice == "6":
                prev = show_map
                show_map = not show_map
                if show_map and not prev:
                    # Force re-render on next loop
                    shown_map_for_ship = None
            elif choice == "7":
                spent = do_load(current)
            else:
                print("Unknown option.")

            if spent:
                current.ap = max(0, current.ap - 1)

            # Victory check mid-turn
            victor = game.check_victory()
            if victor:
                print(f"\n*** {victor} ***")
                return

        # End of turn
        game.turn_number += 1


if __name__ == "__main__":
    main_loop()
