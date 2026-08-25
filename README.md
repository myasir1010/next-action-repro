# Next 16: a Server Action's result is silently dropped by the client

Next 16.2.10, React 19.2.4, next-intl 4.13.5, Node 24.18.0, Windows 11.

> **The measurements below are on Windows.** The bundled GitHub Actions
> workflow runs the same two configurations on Linux; see that run for a
> second platform. macOS is untested.

## Symptom

A Server Action submitted from `<form action={...}>` runs correctly on the
server, but **the client never applies its result**. In a failing run:

- the mutation lands every time;
- the server logs a fresh render with the new value after every submit;
- the HTTP response completes — in the app this came from, byte-identical
  (107,724 bytes) to a passing run;
- the client component never re-renders;
- a full page load always shows the correct state.

`redirect()` inside the action, `router.refresh()` after it, and
`useActionState` returning the value as plain data **all fail identically**, so
this is not "the client applied a stale tree" — the action result is not
processed at all.

## Running it

```bash
npm install
npx playwright install chromium
npm run build

# reproduces: 3-6 in 12
PORT=3100 QUERIES=20 BULK_KEYS=1200 npm start &
QUERIES=20 npm run harness

# control, same build: never reproduces
PORT=3100 QUERIES=0 BULK_KEYS=1200 npm start &
QUERIES=0 npm run harness
```

The harness loads `/?reset=1`, clicks the button that reveals the form, submits,
and waits up to 15s for the invitation heading to leave
`document.body.innerText`. A pass takes ~100ms; a failure never completes. It
prints `RESULT queries=<n> failed=<f> of <n>` and always exits 0 — it measures a
rate rather than gating anything.

`.github/workflows/repro.yml` runs both configurations on `ubuntu-latest`, so
the rate can be checked on Linux without a Linux machine.

## What decides it

**`QUERIES` — the number of real outbound `fetch` calls the server render makes.**

| QUERIES | Failures |
|---|---|
| 0 | 0 of 12 |
| 1 | 1 of 10 |
| 5 | 2 of 10 |
| 20 | 3-6 of 12 |
| 100 | 7 of 10 |

They are ordinary `fetch` calls to this app's own `/api/ping`, so no database or
credentials are involved. **A `setTimeout` of the same or much longer duration
never reproduces it** — the render here completes in ~10ms and still fails,
while a 3s sleep passed 10 of 10. It is the outbound requests, not the time.

## What else is required

Removing **next-intl** takes it to 0 of 12 with everything else unchanged, so the
`NextIntlClientProvider` is also necessary. It is not sufficient on its own:
next-intl plus `QUERIES=20` and nothing else is 0 of 12, as is next-intl plus
prefetching `<Link>`s.

The configuration that does reproduce additionally has a large object passed as
a prop to a client component (`Bulk`), a `loading.js`, and a trivial middleware.
**Which of those three is load-bearing has not been isolated** — they were
restored together after removing them individually stopped reproduction.

## Ruled out individually

Each of these was added to a passing configuration and did **not** cause it:

- render duration (3s sleep), action duration (400ms sleep)
- payload size alone (~100KB)
- `loading.js` Suspense boundary alone
- middleware that awaits I/O and writes cookies onto `NextResponse.next()`
- a real `supabase.auth.getUser()` in middleware, page and action
- prefetching `<Link>`s alone

## Verified from a clean clone

`git clone`, `npm install`, `npm run build`, then the two commands above:
**6 of 12** with `QUERIES=20`, **0 of 12** with `QUERIES=0`. No credentials, no
configuration, nothing needed from outside the repo.

## Provenance

Found in a real app where the page issues ~15 queries to a remote Postgres and
wraps its tree in `NextIntlClientProvider`. There it fails **6–7 of 8**, and the
user-visible effect is that setting a value appears to do nothing until the page
is reloaded.

## Reading it

- `app/Card.js` — the component: a server prop chooses the branch, a two-step
  `useState` reveal, and a form whose success replaces the branch it lives in
- `app/actions.js` — the action: mutate, `revalidatePath`, return state
- `lib/io.js` — the outbound `fetch` fan-out (`QUERIES`)
