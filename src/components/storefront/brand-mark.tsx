import { brandInitials } from "@/lib/storefront-defaults";

type Props = {
  name: string;
  logoUrl?: string | null;
  /** "light" = on white header, "dark" = on footer / colored backgrounds. */
  tone?: "light" | "dark";
  size?: "md" | "lg";
  subtitle?: string | null;
};

/** Tenant logo, or an initials badge in the brand colors when no logo was uploaded. */
export function BrandMark({ name, logoUrl, tone = "light", size = "md", subtitle }: Props) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className={size === "lg" ? "h-14 w-auto object-contain" : "h-12 w-auto object-contain md:h-14"}
      />
    );
  }

  const badge =
    tone === "dark"
      ? "bg-white/12 text-[var(--footer-text,#fff)] ring-1 ring-white/30"
      : "bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)] text-white shadow-sm shadow-black/10";
  const badgeSize = size === "lg" ? "size-14 text-xl" : "size-11 text-base md:size-12 md:text-lg";
  const nameColor = tone === "dark" ? "text-[var(--footer-text,#fff)]" : "text-[var(--nav-text)]";

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-xl font-bold tracking-wide ${badge} ${badgeSize}`}
      >
        {brandInitials(name)}
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          className={`rc-display truncate uppercase leading-none ${nameColor} ${
            size === "lg" ? "text-3xl" : "text-xl md:text-2xl"
          }`}
        >
          {name}
        </span>
        {subtitle ? (
          <span
            className={`mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] ${
              tone === "dark" ? "opacity-70" : "text-[var(--brand)]"
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
