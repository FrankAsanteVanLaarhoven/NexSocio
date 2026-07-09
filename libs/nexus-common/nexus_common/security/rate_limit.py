"""In-memory rate limiter for development; swap for Redis in production."""

import time
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class RateLimitBucket:
    tokens: float
    last_update: float


class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.rate = requests_per_minute / 60.0
        self.capacity = float(requests_per_minute)
        self._buckets: dict[str, RateLimitBucket] = defaultdict(
            lambda: RateLimitBucket(tokens=self.capacity, last_update=time.monotonic())
        )

    def allow(self, key: str) -> bool:
        bucket = self._buckets[key]
        now = time.monotonic()
        elapsed = now - bucket.last_update
        bucket.tokens = min(self.capacity, bucket.tokens + elapsed * self.rate)
        bucket.last_update = now
        if bucket.tokens >= 1.0:
            bucket.tokens -= 1.0
            return True
        return False