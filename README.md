# Next 16: a Server Action's result is silently dropped by the client

Next 16.2.10, React 19.2.4, Node 24. Reproduced on Windows 11 and on
`ubuntu-latest`. Dependencies: `next`, `react`, `react-dom`. Nothing else.

## Symptom

A Server Action submitted from `<form action={...}>` runs correctly on the
server, but **the client never applies its result**. In a failing run:

- the mutation lands every time;
- the server logs a fresh render with the new value after every submit;
- the HTTP response completes, byte-identical to a passing run;
- the client component never re-renders;
- a full page load always shows the correct state.

`redirect()` inside the action, `router.refresh()` after it, and
`useActionState` returning the value as plain data **all fail identically**, so
the action result is not being processed at all — this is not "a stale tree was
applied".

A pass completes in ~70ms. A failure never completes.

## Three ingredients, each necessary

Each was removed on its own from the reproducing configuration, leaving the
other two in place:

| Ingredient | Present | Removed |
|---|---|---|
| `app/loading.js` — a Suspense boundary on the route | 3 of 20 | **0 of 20** |
| A large object serialised to a client component (`BULK_KEYS=4000`) | 3 of 20 | **0 of 20** (`BULK_KEYS=0`) |
| Real outbound `fetch` from the render (`QUERIES=20`) | 3 of 20 | **0 of 12** (`QUERIES=0`) |

`QUERIES` counts ordinary `fetch` calls to this app's own `/api/ping`, so no
database or credentials are involved. Both other axes scale the rate:

| QUERIES | Failures |
|---|---|
| 0 | 0 of 12 |
| 1 | 1 of 10 |
| 5 | 2 of 10 |
| 20 | 3 of 20 |
| 100 | 7 of 10 |

**A `setTimeout` never reproduces it, at any duration.** A 3s sleep in the
render passed 10 of 10; the reproducing render completes in ~10ms. It is the
outbound requests, not the elapsed time.

## Running it

```bash
npm install
npx playwright install chromium
npm run build

# reproduces
PORT=3100 QUERIES=20 BULK_KEYS=4000 npm start &
QUERIES=20 N=20 npm run harness

# control, same build
PORT=3100 QUERIES=0 BULK_KEYS=4000 npm start &
QUERIES=0 N=20 npm run harness
```

The harness loads `/?reset=1`, clicks the button that reveals the form, submits,
and waits for the invitation heading to leave `document.body.innerText`. It
prints `RESULT queries=<n> failed=<f> of <n>` and always exits 0 — it measures a
rate rather than gating anything.

`.github/workflows/repro.yml` runs both configurations on `ubuntu-latest`.

## Ruled out

Added to a reproducing or passing configuration and shown **not** to be the
cause:

- render duration and action duration (sleeps, up to 3s)
- middleware — including one that awaits I/O and writes cookies onto
  `NextResponse.next()`
- prefetching `<Link>`s and the concurrent RSC traffic they cause
- `next-intl` and its client provider. It **raises** the rate by adding a second
  large client payload, but removing it still reproduces (1 of 12), so it is an
  instance of the payload axis rather than an ingredient.
- a real `supabase.auth.getUser()` in middleware, page and action

## Provenance

Found in an app whose dashboard issues ~15 queries to a remote Postgres and
ships a large message catalogue to the client. There it fails **6–7 of 8**, and
the user-visible effect is that setting a value appears to do nothing until the
page is reloaded.

## Reading it

- `app/Card.js` — a server prop chooses the branch; a two-step `useState` reveal;
  a form whose success replaces the branch it lives in
- `app/actions.js` — mutate, `revalidatePath`, return state
- `lib/io.js` — the outbound `fetch` fan-out (`QUERIES`)
- `app/Bulk.js` — the large client payload (`BULK_KEYS`)
- `app/loading.js` — the Suspense boundary
