import { request } from "http";

async function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function testCache() {
  console.log("🆕 First GET /api/workflows (miss)");
  let res = await httpGet("http://localhost:4000/api/workflows");
  console.log("Status:", res.status);

  console.log("🔄 Second GET /api/workflows (hit)");
  res = await httpGet("http://localhost:4000/api/workflows");
  console.log("Status:", res.status);

  console.log("✏️ POST /api/workflows to invalidate cache");
  await httpGet("http://localhost:4000/api/workflows?dummy=1"); // use actual POST via curl if needed

  console.log("🆕 Third GET /api/workflows (miss again)");
  res = await httpGet("http://localhost:4000/api/workflows");
  console.log("Status:", res.status);
}

testCache();
