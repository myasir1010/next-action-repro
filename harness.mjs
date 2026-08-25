import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv("C:/MY/Github/language_diary/.env.local");

const B = process.env.BASE ?? "http://localhost:3100";
const N = Number(process.env.N ?? 10);

const browser = await chromium.launch();
const page = await browser.newPage();
let fails = 0, ran = 0;

if (process.env.SIGN_IN) {
  await page.goto(`${B}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", process.env.E2E_SOLO_MELALAK);
  await page.fill("#password", process.env.E2E_SOLO_MELALAK_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const cookies = await page.context().cookies();
  console.log("signed in:", cookies.some((c) => c.name.startsWith("sb-")) ? "yes" : "NO SESSION COOKIE");
}

for (let run = 1; run <= N; run++) {
  await page.goto(`${B}/?reset=1`, { waitUntil: "networkidle" });
  if (!/working towards/i.test(await page.locator("body").innerText())) {
    console.log(`run ${run}: SKIP (not in invitation state)`);
    continue;
  }
  await page.getByRole("button", { name: "Talking with people" }).click();
  const t0 = Date.now();
  await page.getByRole("button", { name: "Set goal" }).click();
  let ok = true;
  try {
    await page.waitForFunction(
      () => !/working towards/i.test(document.body.innerText),
      undefined,
      { timeout: 15000 }
    );
  } catch { ok = false; }
  ran++;
  if (!ok) fails++;
  console.log(`run ${run}: ${ok ? "PASS" : "FAIL"} ${Date.now() - t0}ms`);
}

console.log(`\n${fails} failed of ${ran}`);
await browser.close();
