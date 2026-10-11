import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7fbfd] px-5 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)]">
        No encontrado
      </h1>
      <p className="mt-3 max-w-md text-[#5a6578]">
        No hay una tienda activa para este subdominio, o la página no existe.
        La demo está en{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-sm">
          demo.mibidon.cl
        </code>
        .
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md border border-[#d5e3ec] bg-white px-5 py-2.5 text-sm font-semibold text-[#12326e]"
        >
          Ir a MiBidón
        </Link>
        <Link
          href="/?tenant=rio-claro"
          className="rounded-md bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Ver demo
        </Link>
      </div>
    </div>
  );
}
