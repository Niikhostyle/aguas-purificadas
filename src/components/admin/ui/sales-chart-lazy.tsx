"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "./skeleton";
import type { SalesDatum } from "./sales-chart";

const SalesChart = dynamic(() => import("./sales-chart"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-[220px] w-full" />
    </div>
  ),
});

export function LazySalesChart({ data }: { data: SalesDatum[] }) {
  return <SalesChart data={data} />;
}
