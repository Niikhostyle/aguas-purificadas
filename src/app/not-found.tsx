import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f7f6] px-5 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)]">
        No encontrado
      </h1>
      <p className="mt-3 max-w-md text-[#4a655f]">
        No hay un tenant activo para esta solicitud, o la página no existe.
        Probá con{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-sm">
          ?tenant=rio-claro
        </code>
        .
      </p>
      <Link
        href="/?tenant=rio-claro"
        className="mt-8 rounded-md bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Ir a la tienda demo
      </Link>
    </div>
  );
}
