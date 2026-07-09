# NEXSOCIO Load Tests

Target: **p95 < 120ms** for core actions at 1000 concurrent users.

## k6

```bash
brew install k6  # or download from k6.io
k6 run tests/load/k6-core-flow.js
```

## Locust

```bash
pip install locust
locust -f tests/load/locustfile.py --host=http://localhost:8001
# Open http://localhost:8089 — start with 1000 users
```