import { NextResponse } from "next/server";

export async function proxy(request) {
  return NextResponse.next({ request });
}

export const config = { matcher: ["/"] };
