"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "@/lib/alerts";

const OK_MESSAGES: Record<string, string> = {
  "1": "Cambios guardados.",
  reset: "Se restauraron los valores originales.",
};

let lastShown = "";

/**
 * Server actions in the panel finish with a redirect carrying `?ok=` or `?error=`.
 * This turns those into SweetAlert2 toasts and strips the params so a reload or
 * a shared link doesn't repeat the message.
 */
export function FlashToaster() {
  const pathname = usePathname();
  const params = useSearchParams();
  const ok = params.get("ok");
  const error = params.get("error");

  useEffect(() => {
    if (!ok && !error) {
      lastShown = "";
      return;
    }
    const key = `${pathname}|${ok}|${error}`;
    if (key === lastShown) return;
    lastShown = key;
    if (error) void toast.error(error);
    else if (ok) void toast.success(OK_MESSAGES[ok] ?? ok);

    const url = new URL(window.location.href);
    url.searchParams.delete("ok");
    url.searchParams.delete("error");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [pathname, ok, error]);

  return null;
}
