"""The boss rat's idle and jump poses were generated without his ushanka, so the hat blinked on and off.
Reuse hatted poses instead: idle <- strum1, jump <- walk. Runs as the `fixup` of w2_rats (pixelize.py)."""
import shutil
from pathlib import Path

F = Path(__file__).resolve().parent.parent / "assets_src" / "frames" / "chars"


def main():
    shutil.copy(F / "ratboss_strum1.png", F / "ratboss_idle.png")
    shutil.copy(F / "ratboss_walk.png", F / "ratboss_jump.png")
    print("ratboss: idle/jump now use hatted poses")


if __name__ == "__main__":
    main()
