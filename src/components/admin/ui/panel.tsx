import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  actions,
  toolbar,
  footer,
  children,
  flush = false,
  className = "",
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Remove body padding (tables that should touch the panel edges). */
  flush?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`overflow-hidden rounded-xl border border-[#dde7ee] bg-white shadow-[0_1px_2px_rgba(16,40,70,0.04)] ${className}`}
    >
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8f0f5] px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="text-[15px] font-semibold text-[#12233d]">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[13px] text-[#5a6578]">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {toolbar ? <div className="border-b border-[#e8f0f5] bg-[#fafcfd] px-5 py-3">{toolbar}</div> : null}
      <div className={flush ? "" : "p-5"}>{children}</div>
      {footer ? (
        <footer className="border-t border-[#e8f0f5] bg-[#fafcfd] px-5 py-3">{footer}</footer>
      ) : null}
    </section>
  );
}
