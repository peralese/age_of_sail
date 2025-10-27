import math
import random
from game_state import angle_diff, distance, movement_modifier

# TURN / MOVEMENT

def turn_ship(ship, desired_heading):
    """
    Apply heading change, respecting ship.handling.
    """
    # normalize:
    desired_heading = desired_heading % 360

    diff = ((desired_heading - ship.heading + 540) % 360) - 180
    # diff now is signed shortest turn angle (-180..180)

    # limit by handling
    if diff > ship.handling:
        diff = ship.handling
    elif diff < -ship.handling:
        diff = -ship.handling

    ship.heading = (ship.heading + diff) % 360
    return diff  # how much we actually turned


def move_ship(ship, game_state, sail_setting="battle"):
    """
    Move ship forward based on:
    - base_speed
    - sail_setting
    - rigging health
    - wind angle
    For milestone 1, we keep it simple:
      effective_speed = base_speed * sail_mult * rigging_mult * wind_mult
    """
    # sail_setting impact
    # battle sail = stable gun platform, slower
    # full sail   = faster, maybe penalty to gunnery later
    if sail_setting == "full":
        sail_mult = 1.2
    else:
        sail_mult = 0.8

    # rigging damage slows you
    rigging_mult = max(0.2, ship.rigging / ship.rigging_max)

    # wind impact
    rel_angle = angle_diff(ship.heading, game_state.wind_dir)
    wind_mult = movement_modifier(rel_angle)

    effective_speed = ship.base_speed * sail_mult * rigging_mult * wind_mult

    # move in heading direction
    rad = math.radians(ship.heading)
    dx = math.cos(rad) * effective_speed
    dy = math.sin(rad) * effective_speed
    ship.x += dx
    ship.y += dy

    return effective_speed, dx, dy


# COMBAT

def bearing_from_to(src_ship, tgt_ship):
    """
    Return bearing from src_ship to tgt_ship in degrees (0=east,90=north).
    """
    dx = tgt_ship.x - src_ship.x
    dy = tgt_ship.y - src_ship.y
    ang = math.degrees(math.atan2(dy, dx)) % 360
    return ang

def fire_broadside(attacker, defender):
    """
    Resolve one broadside attack.
    Steps:
    1. Figure out which side can bear (port or starboard).
    2. Check range.
    3. Compute damage.
    4. Apply to hull / rigging / crew (simple ratio split for now).
    """
    if attacker.surrendered or defender.surrendered:
        return "No effect: one ship already surrendered."

    if attacker.is_sunk() or defender.is_sunk():
        return "No effect: one ship already sunk."

    brg = bearing_from_to(attacker, defender)
    rng = distance((attacker.x, attacker.y), (defender.x, defender.y))

    can_port = attacker.can_fire_port(brg)
    can_star = attacker.can_fire_starboard(brg)

    if not can_port and not can_star:
        return f"{attacker.name} cannot bear on target."

    if can_port:
        base_firepower = attacker.guns_port
        firing_side = "port"
    else:
        base_firepower = attacker.guns_starboard
        firing_side = "starboard"

    # Range bands: point blank (<2), close (<5), long (<8), else out of range
    if rng < 2:
        rng_mult = 1.2
    elif rng < 5:
        rng_mult = 1.0
    elif rng < 8:
        rng_mult = 0.5
    else:
        return f"Out of range (~{rng:.1f})."

    # damaged guns? we could later reduce firepower if hull <50%, etc.
    # for now keep it simple
    raw_damage = base_firepower * rng_mult

    # add some randomness
    variance = random.uniform(0.8, 1.2)
    dmg = raw_damage * variance

    # split damage: 60% hull, 30% rigging, 10% crew
    hull_dmg = dmg * 0.6
    rig_dmg = dmg * 0.3
    crew_dmg = dmg * 0.1

    defender.hull -= hull_dmg
    defender.rigging -= rig_dmg
    defender.crew -= crew_dmg

    if defender.hull < 0:
        defender.hull = 0
    if defender.rigging < 0:
        defender.rigging = 0
    if defender.crew < 0:
        defender.crew = 0

    # sink check
    sunk = False
    if defender.is_sunk():
        defender.alive = False
        sunk = True

    # morale check for defender
    surrendered_now = defender.morale_check()

    summary = (
        f"{attacker.name} fires {firing_side} broadside at {defender.name}!\n"
        f"Range {rng:.1f}. Damage dealt: "
        f"Hull -{hull_dmg:.1f}, Rigging -{rig_dmg:.1f}, Crew -{crew_dmg:.1f}."
    )

    if sunk:
        summary += f"\n{defender.name} is sinking!"
    elif surrendered_now:
        summary += f"\n{defender.name} strikes their colors!"

    return summary
