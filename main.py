from game_state import Ship, GameState
from actions import turn_ship, move_ship, fire_broadside

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
        wind_dir=90,        # wind blowing from the east-ish (for now abstract)
        wind_speed=10
    )
    return game


def show_menu():
    print("\nWhat do you want to do?")
    print("1) Turn ship")
    print("2) Move ship")
    print("3) Fire broadside")
    print("4) End turn")
    print("5) Quit")


def pick_ship(game):
    print("\nWhich ship?")
    for idx, s in enumerate(game.ships):
        status = "DEAD" if (not s.alive or s.is_sunk()) else ("SURRENDERED" if s.surrendered else "OK")
        print(f"{idx}) {s.name} ({s.nation}) [{status}] @ ({s.x:.1f},{s.y:.1f}) hdg {s.heading:.0f}°")
    try:
        choice = int(input("Enter number: ").strip())
        return game.ships[choice]
    except Exception:
        print("Invalid choice.")
        return None


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
    print(f"{ship.name} turned {actual_change:.1f}°. New heading {ship.heading:.1f}°.")


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

    print("Defender:")
    dfn = pick_ship(game)
    if not dfn:
        return
    if not dfn.alive or dfn.is_sunk():
        print("Target already destroyed.")
        return

    result = fire_broadside(atk, dfn)
    print(result)


def main_loop():
    game = create_demo_game()

    print("=== Wooden Ships (Inspired) – Milestone 1 Prototype ===")
    while True:
        # Status
        print()
        print(game.status_report())

        # Victory check
        victor = game.check_victory()
        if victor:
            print(f"\n*** {victor} ***")
            break

        # Menu
        show_menu()

        choice = input("Select action: ").strip()
        if choice == "1":
            handle_turn_ship(game)
        elif choice == "2":
            handle_move_ship(game)
        elif choice == "3":
            handle_fire(game)
        elif choice == "4":
            game.turn_number += 1
        elif choice == "5":
            print("Exiting game.")
            break
        else:
            print("Unknown option.")


if __name__ == "__main__":
    main_loop()
