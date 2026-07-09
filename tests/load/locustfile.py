"""Load test: core social actions — target p95 < 120ms at 1000 users."""

import os

from locust import HttpUser, between, task

IDENTITY = os.getenv("IDENTITY_URL", "http://localhost:8001")
CONTENT = os.getenv("CONTENT_URL", "http://localhost:8003")
SAFETY = os.getenv("SAFETY_URL", "http://localhost:8005")


class NexusUser(HttpUser):
    wait_time = between(0.5, 2.0)
    token: str | None = None

    def on_start(self):
        # Health checks warm-up
        self.client.get(f"{IDENTITY}/api/v1/health", name="identity/health")
        self.client.get(f"{CONTENT}/api/v1/health", name="content/health")

    @task(5)
    def feed(self):
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        self.client.get(f"{CONTENT}/api/v1/feed", headers=headers, name="content/feed")

    @task(3)
    def moderate(self):
        self.client.post(
            f"{SAFETY}/api/v1/moderate",
            json={"text": "Hello Nexus community!", "author_mode": "prime"},
            name="safety/moderate",
        )

    @task(2)
    def health_all(self):
        for url, name in [
            (IDENTITY, "identity"),
            (CONTENT, "content"),
            (SAFETY, "safety"),
        ]:
            self.client.get(f"{url}/api/v1/health", name=f"{name}/health")