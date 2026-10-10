import { NextRequest, NextResponse } from "next/server";
import { finalizeWebpayReturn } from "@/lib/payments";
import { getAppBaseUrl } from "@/lib/webpay";

async function handleReturn(
  tokenWs: string | null,
  tbkToken: string | null,
) {
  const result = await finalizeWebpayReturn({
    token: tokenWs,
    abortedToken: tbkToken,
  });

  const base = getAppBaseUrl();
  if (!result.orderId) {
    return NextResponse.redirect(
      `${base}/carrito?error=${encodeURIComponent("No pudimos confirmar el pago")}`,
    );
  }
  return NextResponse.redirect(`${base}/pedido/${result.orderId}`);
}

export async function GET(request: NextRequest) {
  const tokenWs = request.nextUrl.searchParams.get("token_ws");
  const tbkToken = request.nextUrl.searchParams.get("TBK_TOKEN");
  return handleReturn(tokenWs, tbkToken);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const tokenWs = String(form.get("token_ws") || "") || null;
  const tbkToken = String(form.get("TBK_TOKEN") || "") || null;
  return handleReturn(tokenWs, tbkToken);
}
