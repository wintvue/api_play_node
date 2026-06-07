import http from "k6/http";
import { check } from "k6";
import { Trend, Rate } from "k6/metrics";

const apiLatency = new Trend("api_latency");
const successRate = new Rate("success_rate");

export const options = {
  scenarios: {
    url_shortener: {
      executor: "constant-arrival-rate",
      rate: 10000, // target RPS
      timeUnit: "1s",
      duration: "5s",
      preAllocatedVUs: 5000,
      maxVUs: 5000,
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],

    http_req_duration: [
      "p(50)<20",
      "p(95)<100",
      "p(99)<200",
    ],

    success_rate: ["rate>0.99"],
  },
};

const BASE_URL = "http://localhost:3000";

export default function () {
  const payload = JSON.stringify({
    url: `https://example.com/${__VU}-${__ITER}`,
  });

  const res = http.post(
    `${BASE_URL}/shorten`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const success = check(res, {
    "status=200": (r) => r.status === 200,
    "has short_code": (r) => {
      try {
        return JSON.parse(r.body).short_code !== undefined;
      } catch {
        return false;
      }
    },
  });

  successRate.add(success);
  apiLatency.add(res.timings.duration);
}