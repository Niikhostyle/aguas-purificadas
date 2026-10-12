"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches server data periodically while the tab is visible (dispatch dashboards stay current). */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
