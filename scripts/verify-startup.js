const http = require("http");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const tests = [
  {
    name: "Public Landing Page (/) Navigation",
    url: `${BASE_URL}/`,
    expectedStatus: 200,
  },
  {
    name: "Public Login Route (/login) Navigation",
    url: `${BASE_URL}/login`,
    expectedStatus: 200,
  },
  {
    name: "Public Signup Route (/signup) Navigation",
    url: `${BASE_URL}/signup`,
    expectedStatus: 200,
  },
  {
    name: "Middleware Protection Redirect (/dashboard)",
    url: `${BASE_URL}/dashboard`,
    expectedStatus: 307,
  },
  {
    name: "Public Demo Redirect Route (/demo/luxury)",
    url: `${BASE_URL}/demo/luxury`,
    expectedStatus: 307,
  }
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: { "Accept-Encoding": "identity" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function runVerification() {
  console.log("\n==========================================");
  console.log("      AUTOMATED SYSTEM STARTUP CHECKLIST   ");
  console.log("==========================================\n");

  let allPassed = true;

  for (const test of tests) {
    process.stdout.write(`Checking: ${test.name}... `);
    try {
      const response = await fetchUrl(test.url);

      const statusMatch = response.statusCode === test.expectedStatus;

      if (statusMatch) {
        console.log("✓ PASSED");
      } else {
        console.log("✗ FAILED");
        console.log(`  - Expected Status: ${test.expectedStatus}, Got: ${response.statusCode}`);
        allPassed = false;
      }
    } catch (error) {
      console.log("✗ FAILED (Connection Error)");
      console.log(`  - Error: ${error.message}`);
      allPassed = false;
    }
  }

  console.log("\n==========================================");
  if (allPassed) {
    console.log("✓ SUCCESS: All critical startup paths verified!");
    console.log("==========================================\n");
    process.exit(0);
  } else {
    console.log("✗ ERROR: Startup verification failed!");
    console.log("==========================================\n");
    process.exit(1);
  }
}

// Delay checking to allow dev/prod server startup compilation
setTimeout(() => {
  runVerification();
}, 2000);
