import { chromium } from "playwright";

/**
 * Drives the reproduction and reports a failure rate. Always exits 0 — the
 * point is to measure a rate, not to gate a build.
 *
 *   BASE     where the app is served (default http://localhost:3100)
 *   N        how many attempts (default 12)
 *   TIMEOUT  how long to wait for the UI to update (default 15000ms)
 *
 * A pass takes ~100ms. A failure never completes, so it costs the full timeout.
 */
const BASE = process.env.BASE ?? "http://localhost:3100";
const N = Number(process.env.N ?? 12);
const TIMEOUT = Number(process.env.TIMEOUT ?? 15000);

const browser = await chromium.launch();
const page = await browser.newPage();

let fails = 0;
let ran = 0;

for (let run = 1; run <= N; run++) {
  await page.goto(`${BASE}/?reset=1`, { waitUntil: "networkidle" });

  if (!/working towards/i.test(await page.locator("body").innerText())) {
    console.log(`run ${run}: SKIP (page did not start in the expected state)`);
    continue;
  }

  await page.getByRole("button", { name: "Talking with people" }).click();

  const started = Date.now();
  await page.getByRole("button", { name: "Set goal" }).click();

  let ok = true;
  try {
    // The action always mutates and the server always re-renders. This waits
    // for the client to show it.
    await page.waitForFunction(
      () => !/working towards/i.test(document.body.innerText),
      undefined,
      { timeout: TIMEOUT }
    );
  } catch {
    ok = false;
  }

  ran += 1;
  if (!ok) fails += 1;

  console.log(`run ${run}: ${ok ? "PASS" : "FAIL"} ${Date.now() - started}ms`);
}

await browser.close();

console.log(`\nRESULT queries=${process.env.QUERIES ?? "?"} failed=${fails} of ${ran}`);
