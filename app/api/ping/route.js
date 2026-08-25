export const dynamic = "force-dynamic";

// The cheapest possible endpoint. What matters is that reaching it is a real
// outbound request from the render, not what it returns.
export async function GET() {
  return Response.json({ ok: true });
}
