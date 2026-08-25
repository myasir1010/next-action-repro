/**
 * The variable that decides whether this reproduces: how many **real outbound
 * requests** the server render makes.
 *
 * Sleeps of any length do not reproduce it, at any duration. A single real
 * outbound request does. More requests raise the rate.
 *
 * Found first with Supabase queries in a real app; plain fetch to this app's
 * own /api/ping reproduces it just as well, so no database, credentials or
 * configuration are needed.
 */
export async function fanOut() {
  const n = Number(process.env.QUERIES ?? 0);
  if (!n) return 0;

  const url =
    process.env.PING_URL ??
    `http://127.0.0.1:${process.env.PORT ?? 3100}/api/ping`;

  // Sequential on purpose: the real page awaits its queries one after another.
  for (let i = 0; i < n; i++) {
    await fetch(url, { cache: "no-store" }).then((r) => r.json());
  }
  return n;
}
