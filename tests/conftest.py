import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "libs" / "nexus-common"))
sys.path.insert(0, str(ROOT / "services"))