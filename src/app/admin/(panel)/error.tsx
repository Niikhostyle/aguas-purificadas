"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { EmptyState, adminButton } from "@/components/admin/ui";
import { errorDialog } from "@/lib/alerts";

export default function PanelError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    let cancelled = false;
    void errorDialog({
      title: "No pudimos cargar esta sección",
      text: "Ocurrió un error inesperado. Puedes reintentar; si persiste, vuelve en unos minutos.",
      retryText: "Reintentar",
    }).then((again) => {
      if (again && !cancelled) retry();
    });
    return () => {
      cancelled = true;
    };
  }, [error, retry]);

  return (
    <div className="rounded-xl border border-dashed border-[#d5e3ec] bg-white">
      <EmptyState
        icon={<TriangleAlert />}
        title="No pudimos cargar esta sección"
        description={
          <>
            Ocurrió un error inesperado.
            {error.digest ? <span className="mt-1 block font-mono text-xs text-[#8a96a6]">Ref: {error.digest}</span> : null}
          </>
        }
        action={
          <>
            <button type="button" onClick={() => retry()} className={adminButton()}>
              <RefreshCw aria-hidden />
              Reintentar
            </button>
            <Link href="/admin" className={adminButton({ variant: "secondary" })}>
              Ir al dashboard
            </Link>
          </>
        }
      />
    </div>
  );
}
