## Phase 4 Performance Summary

### Smoke tests (baseline)
- Endpoints and latency (TTFB):
  - /api/health: 404 (intentionally missing)
  - /api/health/extended: 200 in 23 ms
  - /api/performance: 200 in 3.9 ms
  - /api/performance/cache: 200 in 3.3 ms
  - /api/websocket/metrics: 200 in 3.2 ms
  - /api/worker/status: 200 in 3.2 ms
  - /api/projects/system/status: 200 in 5.2 ms
- Result: Baselines well under 200 ms target.

### Load tests (/api/performance, 10s each)
- 5 users: ~1,103 req/s, avg latency 4.0 ms
- 15 users: ~1,133 req/s, avg latency 12.7 ms
- 30 users: ~1,173 req/s, avg latency 25.0 ms
- 50 users: ~1,117 req/s, avg latency 44.2 ms
- 100 users: ~1,135 req/s, avg latency 87.4 ms
- Errors/timeouts: 0%
- Result: Meets target (≥1,000 req/s at 30 users; error rate <0.1%).

### Stress/spike test (60s)
- Config: 10 connections, pipelining 10 (sustained high pressure)
- Throughput: ~1,367 req/s (82k in 60s)
- Latency: avg 72.6 ms; p97.5 91 ms; p99 157 ms; max 526 ms
- Errors/timeouts: none observed
- Result: Remained responsive (≤150 ms typical); stable under spike.

### Notes and next steps
- All tested criteria passed for smoke, load, and spike/stress.
- 4-hour soak was deferred; see guide in chat to validate long-duration memory stability (<5% drift).

### Commands used

```bash
# Smoke checks (latency/TTFB)
for ep in \
  /api/health \
  /api/health/extended \
  /api/performance \
  /api/performance/cache \
  /api/websocket/metrics \
  /api/worker/status \
  /api/projects/system/status; do \
  echo "Testing $ep"; \
  curl -s -w "\nHTTP:%{http_code} TIME_TOTAL:%{time_total}\n" -o /dev/null http://localhost:4000$ep; \
done

# Load tests (10s each)
npx --yes autocannon -c 5  -d 10 http://localhost:4000/api/performance
npx --yes autocannon -c 15 -d 10 http://localhost:4000/api/performance
npx --yes autocannon -c 30 -d 10 http://localhost:4000/api/performance
npx --yes autocannon -c 50 -d 10 http://localhost:4000/api/performance
npx --yes autocannon -c 100 -d 10 http://localhost:4000/api/performance

# Stress/Spike test (60s, pipelining 10)
npx --yes autocannon -c 10 -p 10 -d 60 http://localhost:4000/api/performance
```

### 4-hour soak test guide (deferred)

Run later to validate long-duration stability (memory drift <5%, no critical errors):

```bash
# 1) Start backend (Mongo assumed running locally)
MONGO_URI=mongodb://127.0.0.1:27017/flowcraft npm run dev --prefix backend

# 2) Optional 2-min warm-up
npx --yes autocannon -c 30 -d 120 http://localhost:4000/api/performance

# 3) Soak for 4 hours (14,400s) at 30 users; save JSON report
mkdir -p /home/aatish/flowtrainer/results
npx --yes autocannon -c 30 -d 14400 -j http://localhost:4000/api/performance \
  > /home/aatish/flowtrainer/results/soak_c30_4h.json

# 4) Sidecar monitoring (snapshot every 60s)
( echo "timestamp,cpu,mem,node_heap"; \
  while true; do \
    ts=$(date -Is); \
    cpu=$(top -bn1 | awk '/Cpu\\(s\\)/{print 100-$8"%"}' | head -1); \
    mem=$(free -m | awk '/Mem:/{printf "%s/%sMB", $3, $2}'); \
    heap=$(curl -s http://localhost:4000/api/health/extended | jq -r '.memory.used' 2>/dev/null || echo "na"); \
    echo "$ts,$cpu,$mem,$heap"; \
    sleep 60; \
  done ) | tee /home/aatish/flowtrainer/results/soak_monitor_60s.csv

# 5) Quick acceptance checks (manual)
# - Latency: p50 ≤ 150ms, p99 ≤ 200ms across run (inspect JSON)
# - Memory drift: Node heap change within ±5% from first to last 10 mins
# - Errors/timeouts: ≈0 in autocannon report, no critical errors in logs
```


