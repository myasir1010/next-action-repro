"use client";

// A large object passed as a prop to a client component: it is serialised into
// the RSC payload on every render and every action response.
export function Bulk({ data }) {
  return <div hidden>{Object.keys(data).length}</div>;
}
