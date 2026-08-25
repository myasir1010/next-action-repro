import { Card } from "./Card";
import Link from "next/link";
import { Bulk } from "./Bulk";
import { store } from "./store";
import { fanOut } from "../lib/io";

export const dynamic = "force-dynamic";

const BULK_KEYS = Number(process.env.BULK_KEYS ?? 0);
const bulk = Object.fromEntries(
  Array.from({ length: BULK_KEYS }, (_, i) => [
    `key.namespace.entry${i}`,
    `Some interface copy for entry ${i} that is about as long as a real sentence.`,
  ])
);


export default async function Page({ searchParams }) {
  const params = await searchParams;
  if (params?.reset) {
    store.goal = null;
  }

  // The only variable that matters: how many real outbound requests the render
  // makes. QUERIES=0 never reproduces; QUERIES=1 already does.
  const started = Date.now();
  const requests = await fanOut();

  console.log(
    `[page] render goal=${store.goal} requests=${requests} in ${Date.now() - started}ms`
  );

  return (
    <main>
      <h1>Repro</h1>
      <Card goal={store.goal} />
      <Bulk data={bulk} />
      <nav>
        {["a","b","c","d","e","f","g"].map((s) => (
          <Link key={s} href={`/${s}`}>link {s}</Link>
        ))}
      </nav>
    </main>
  );
}
