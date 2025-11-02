import math
import random

# -----------------
# Constants / helpers
# -----------------

# Movement efficiency by relative wind angle (degrees off the bow)
# close-hauled (into wind) = slow, beam reach = fast, running = decent
def movement_modifier(angle_diff_degrees: float) -> float:
    """
    Returns a speed multiplier (0.0 - 1.0) based on how well the sails draw.
    angle_diff_degrees is the absolute difference between ship heading and wind direction.
    0   deg  = directly into the wind (bad)
    90  deg  = beam reach (great)
    180 deg  = dead downwind (good but not best for square riggers)
    """
    angle = min(angle_diff_degrees, 180)

    # super crude first-pass model:
    #   < 40 deg off wind: basically in irons, barely moving
    #   ~60-120 deg: fastest
    #   >150 deg: a little slower running dead downwind
    if angle < 40:
        return 0.2
    elif angle < 70:
        return 0.8
    elif angle < 120:
        return 1.0
    elif angle < 150:
        return 0.8
    else:
        return 0.6


def angle_diff(a, b):
    """smallest absolute difference in degrees between two headings"""
    diff = abs(a - b) % 360
    return diff if diff <= 180 else 360 - diff


def distance(a, b):
    """Euclidean distance between two (x,y) points."""
    return math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)


# -----------------
# Ship / GameState
# -----------------


class Ship:
    """
    Represents a single ship-of-the-line / frigate style unit.
    """

    def __init__(self,
                 name: str,
                 nation: str,
                 hull_max: int,
                 rigging_max: int,
                 crew_max: int,
                 guns_port: int,
                 guns_starboard: int,
                 handling: int,
                 base_speed: float,
                 x: float,
                 y: float,
                 heading: float):
        # Identity
        self.name = name
        self.nation = nation

        # Combat stats (current vs max)
        self.hull_max = hull_max
        self.hull = hull_max
        self.rigging_max = rigging_max
        self.rigging = rigging_max
        self.crew_max = crew_max
        self.crew = crew_max

        # Guns by side (abstract firepower rating)
        self.guns_port = guns_port
        self.guns_starboard = guns_starboard

        # Maneuverability
        self.handling = handling       # max degrees we can turn per turn
        self.base_speed = base_speed   # knots-ish / abstract units

        # Position & facing
        self.x = x
        self.y = y
        self.heading = heading         # 0-359, 0 = east, 90 = north

        # Status
        self.alive = True
        self.surrendered = False

        # Tactical state
        self.sail_setting = "battle"   # 'battle' or 'full'
        self.ammo_type = "round"       # preferred type when loading
        self.loaded_ammo = None         # currently loaded: None requires loading

        # Action Points per turn
        self.ap_max = 4
        self.ap = 0

    def is_sunk(self):
        return self.hull <= 0

    def is_dismasted(self):
        return self.rigging <= 0

    def can_fire_port(self, target_bearing):
        # Port broadside = target is roughly to ship's left side
        # Heading 0 deg means bow points east.
        # Left side is heading+90 (port), right side is heading-90 (starboard).
        port_dir = (self.heading + 90) % 360
        diff = angle_diff(port_dir, target_bearing)
        return diff <= 30  # 60-degree cone off port side

    def can_fire_starboard(self, target_bearing):
        starboard_dir = (self.heading - 90) % 360
        diff = angle_diff(starboard_dir, target_bearing)
        return diff <= 30

    def morale_check(self):
        """
        Very crude morale:
        - If hull < 30% OR crew < 30%, roll d6.
        - On 1, surrender.
        """
        hull_ratio = self.hull / self.hull_max
        crew_ratio = self.crew / self.crew_max
        if hull_ratio < 0.3 or crew_ratio < 0.3:
            roll = random.randint(1, 6)
            if roll == 1:
                self.surrendered = True
                return True
        return False


class GameState:
    """
    Holds everything about the battle.
    """

    def __init__(self, ships, wind_dir=90, wind_speed=10):
        # wind_dir: direction FROM which the wind blows, in degrees.
        # Heading convention: 0 = east, 90 = north, 180 = west, 270 = south.
        # For milestone 1 we use wind_dir abstractly for movement math.
        self.ships = ships
        self.turn_number = 1
        self.wind_dir = wind_dir      # 0-359
        self.wind_speed = wind_speed  # abstract, affects speed maybe later

    def living_ships(self):
        return [s for s in self.ships if s.alive and not s.surrendered and not s.is_sunk()]

    def start_turn(self):
        for s in self.living_ships():
            s.ap = s.ap_max

    def status_report(self):
        lines = [f"--- Turn {self.turn_number} ---"]
        for s in self.ships:
            lines.append(
                f"{s.name} ({s.nation}) @ ({s.x:.1f}, {s.y:.1f}) hdg {s.heading:.0f} deg | "
                f"Hull {s.hull:.1f}/{s.hull_max} Rig {s.rigging:.1f}/{s.rigging_max} "
                f"Crew {int(round(s.crew))}/{s.crew_max} "
                f"Ammo {getattr(s, 'loaded_ammo', None) or 'Unloaded'} "
                f"{'SURRENDERED' if s.surrendered else ''}"
                f"{'SUNK' if s.is_sunk() else ''}"
            )
        return "\n".join(lines)

    def check_victory(self):
        # Simple: if one side has only surrendered/sunk ships left, other side wins
        nations_alive = {}
        for s in self.ships:
            if s.alive and not s.surrendered and not s.is_sunk():
                nations_alive.setdefault(s.nation, 0)
                nations_alive[s.nation] += 1

        if len(nations_alive) == 0:
            return "Mutual destruction. Nobody sails home."
        elif len(nations_alive) == 1:
            winner = list(nations_alive.keys())[0]
            return f"{winner} wins!"
        else:
            return None
