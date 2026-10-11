import { NextResponse } from "next/server";
import { ensureDemoAdminSession } from "@/lib/auth";

/**
 * Credential-free entry to the public demo company admin.
 * Always mints a session for tenant `demo` (never plataforma / super-admin).
 */
export async function GET(request: Request) {
  const result = await ensureDemoAdminSession();
  const url = new URL(request.url);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(
        `/admin/login?tenant=demo&error=${encodeURIComponent(result.error)}`,
        url.origin,
      ),
    );
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
