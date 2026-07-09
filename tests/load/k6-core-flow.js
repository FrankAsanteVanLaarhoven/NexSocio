import http from "k6/http";
import { check, sleep } from "k6";

const IDENTITY = __ENV.IDENTITY_URL || "http://localhost:8001";
const CONTENT = __ENV.CONTENT_URL || "http://localhost:8003";
const SAFETY = __ENV.SAFETY_URL || "http://localhost:8005";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 200 },
    { duration: "30s", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<120"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const health = http.get(`${IDENTITY}/api/v1/health`);
  check(health, { "identity healthy": (r) => r.status === 200 });

  const feed = http.get(`${CONTENT}/api/v1/feed`);
  check(feed, { "feed ok": (r) => r.status === 200 || r.status === 401 });

  const mod = http.post(
    `${SAFETY}/api/v1/moderate`,
    JSON.stringify({ text: "load test post", author_mode: "prime" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(mod, { "moderation ok": (r) => r.status === 200 });

  sleep(1);
}