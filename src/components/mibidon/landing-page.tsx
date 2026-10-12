import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CircleCheck,
  CirclePlay,
  House,
  LayoutDashboard,
  MessageCircle,
  MessageSquareMore,
  Star,
  Store,
  Tag,
  TrendingUp,
  Truck,
} from "lucide-react";
import {
  CountUp,
  Parallax,
  Reveal,
  ScrollHeader,
  SpotlightCard,
} from "@/components/mibidon/landing-motion";
import { RevenueSimulator } from "@/components/mibidon/revenue-simulator";
import { DEMO_STORE_URL } from "@/lib/landing/defaults";
import { fillTrialTokens, formatClp, isExternalHref, richText } from "@/lib/landing/format";
import { LANDING_ICONS } from "@/lib/landing/icons";
import type { LandingContent, LandingSectionContent } from "@/lib/landing/schema";
import { whatsappHref } from "@/lib/whatsapp";

const CLIENT_LOGIN_HREF = "/ingresar";
const NO_TRIAL_WHATSAPP = "Hola MiBidón, quiero crear la tienda online de mi purificadora.";

function d(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}

function externalProps(href: string) {
  return isExternalHref(href) && !href.startsWith("mailto:")
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}

function BrandLogo({ className, preload = false }: { className: string; preload?: boolean }) {
  return (
    <Image
      src="/brand/mibidon/logo.png"
      alt="MiBidón"
      width={843}
      height={280}
      preload={preload}
      className={className}
    />
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
  className = "mb-12 max-w-3xl",
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <Reveal className={`mx-auto text-center ${className}`}>
      {eyebrow ? (
        <span className="text-xs font-bold uppercase tracking-widest text-sv-secondary">{eyebrow}</span>
      ) : null}
      <h2 className="sv-display mt-1 text-2xl font-black text-sv-primary sm:text-4xl">{title}</h2>
      {body ? <p className="mt-3 text-base text-sv-on-surface-variant">{body}</p> : null}
    </Reveal>
  );
}

function ResultBars({
  bars,
  tone,
}: {
  bars: LandingSectionContent<"comparison">["manual"]["bars"];
  tone: "bad" | "good";
}) {
  if (!bars.length) return null;
  return (
    <div className="mb-4 space-y-3">
      {bars.map((b) => (
        <div key={b.id}>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold">
            <span className={tone === "bad" ? "text-sv-on-surface-variant" : "text-sv-on-surface"}>{b.label}</span>
            <span className={tone === "bad" ? "text-sv-error" : "text-sv-secondary"}>{b.percent}%</span>
          </div>
          <div className={`h-2 overflow-hidden rounded-full ${tone === "bad" ? "bg-red-100" : "bg-sv-surface-high"}`}>
            <div
              className={`h-full rounded-full ${tone === "bad" ? "bg-sv-error/70" : "bg-sv-secondary"}`}
              style={{ width: `${b.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CmsImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  sizes?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      unoptimized={!src.startsWith("/")}
      className={className}
    />
  );
}

export function MiBidonLanding({ content }: { content: LandingContent }) {
  const {
    trial,
    announcement,
    hero,
    demo,
    trust,
    steps,
    stats,
    comparison,
    features,
    showcase,
    testimonials,
    pricing,
    faq,
    advisor,
    footer,
  } = content;

  const t = trial.content;
  const trialOn = trial.enabled;
  const fill = (s: string) => fillTrialTokens(s, t.days, t.label);

  const activePlans = pricing.content.plans.filter((p) => p.active);
  const pricingOn = pricing.enabled && activePlans.length > 0;
  const featuresOn = features.enabled && features.content.items.length > 0;
  const testimonialsOn = testimonials.enabled && testimonials.content.items.length > 0;
  const faqOn = faq.enabled && faq.content.items.length > 0;
  const simulatorOn = hero.enabled && hero.content.showSimulator;
  const stepsOn = steps.enabled && steps.content.items.length > 0;
  const demoOn = demo.enabled && Boolean(demo.content.storeHref);
  const demoInHero = demoOn && hero.enabled && !simulatorOn;
  const demoNavOn = demoOn && Boolean(demo.content.navLabel);

  const anchors: Record<string, boolean> = {
    "como-funciona": stepsOn,
    beneficios: featuresOn,
    comparativa: comparison.enabled,
    simulador: simulatorOn,
    testimonios: testimonialsOn,
    precios: pricingOn,
    faq: faqOn,
  };
  const anchorVisible = (href: string) =>
    !href.startsWith("#") || href === "#" || anchors[href.slice(1)] !== false;

  const waTrial = whatsappHref(trialOn ? fill(t.whatsappMessage) : NO_TRIAL_WHATSAPP);
  const waAdvisor = whatsappHref(advisor.content.whatsappMessage);
  const primaryCtaLabel = trialOn ? fill(t.ctaLabel) : t.noTrialCtaLabel;
  const plansHref = pricingOn ? "#precios" : activePlans[0]?.ctaUrl || waTrial;
  const headerCtaHref = plansHref;
  const primaryCtaHref = trialOn ? waTrial : plansHref;

  const navLinks = [
    { href: "#como-funciona", label: steps.content.navLabel },
    { href: "#beneficios", label: features.content.navLabel },
    { href: "#comparativa", label: comparison.content.navLabel },
    { href: "#simulador", label: hero.content.simulatorNavLabel },
    { href: "#testimonios", label: testimonials.content.navLabel },
    { href: "#precios", label: pricing.content.navLabel },
  ].filter((l) => l.label && anchorVisible(l.href));

  const planGrid =
    activePlans.length >= 3
      ? "mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
      : activePlans.length === 2
        ? "mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2"
        : "mx-auto grid max-w-lg grid-cols-1";

  const showcaseLinkHref = pricingOn ? "#precios" : waTrial;

  return (
    <div className="pb-20 md:pb-0">
      {announcement.enabled ? (
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-sv-surface-tint/30 sv-label bg-sv-primary-container px-4 py-2.5 text-center text-xs font-medium text-sv-surface">
          {announcement.content.badge ? (
            <span className="inline-flex items-center rounded-full bg-sv-secondary-container px-2 py-0.5 text-[10px] font-bold text-sv-on-secondary-container">
              {announcement.content.badge}
            </span>
          ) : null}
          <span>{fill(trialOn ? announcement.content.text : announcement.content.textNoTrial)}</span>
          {announcement.content.linkLabel &&
          announcement.content.linkHref &&
          anchorVisible(announcement.content.linkHref) ? (
            <a
              className="font-bold underline transition-colors hover:text-sv-secondary-fixed"
              href={announcement.content.linkHref}
              {...externalProps(announcement.content.linkHref)}
            >
              {announcement.content.linkLabel}
            </a>
          ) : null}
        </div>
      ) : null}

      <ScrollHeader className="sticky top-0 z-40 border-b border-sv-surface-high bg-sv-surface/95 px-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="mb-nav-logo flex h-10 items-center" aria-label="MiBidón - Inicio">
            <BrandLogo className="h-12 w-auto" preload />
          </Link>
          <nav className="sv-label hidden items-center gap-8 text-sm font-medium text-sv-on-surface-variant lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} className="transition-colors hover:text-sv-primary" href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-sv-primary transition-colors hover:bg-sv-surface-container md:inline-block"
              href={CLIENT_LOGIN_HREF}
            >
              Ingresar
            </Link>
            {demoNavOn ? (
              <a
                className="group inline-flex items-center gap-2 rounded-full border-2 border-sv-secondary bg-sv-secondary-fixed/50 px-3.5 py-2 text-xs font-bold text-sv-on-secondary-fixed-variant transition-all hover:-translate-y-0.5 hover:bg-sv-secondary hover:text-white sm:text-sm"
                href={demo.content.storeHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="relative flex h-2 w-2">
                  <span className="mb-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>{demo.content.navLabel}</span>
              </a>
            ) : null}
            <a
              className="sv-shine hidden items-center gap-1.5 rounded-lg bg-sv-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sv-primary-container sm:flex"
              href={headerCtaHref}
              {...externalProps(headerCtaHref)}
            >
              <span>{trialOn ? fill(t.headerCtaLabel) : t.noTrialCtaLabel}</span>
              <ArrowRight className="sv-arrow size-4" aria-hidden />
            </a>
          </div>
        </div>
      </ScrollHeader>

      {hero.enabled ? (
        <HeroSection
          hero={hero.content}
          primaryCtaLabel={primaryCtaLabel}
          primaryCtaHref={primaryCtaHref}
          whatsappHref={waAdvisor}
          demo={demoInHero ? demo.content : null}
        />
      ) : null}

      {demoOn && !demoInHero ? (
        <section className="bg-sv-surface py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal variant="scale">
              <DemoCard demo={demo.content} />
            </Reveal>
          </div>
        </section>
      ) : null}

      {trust.enabled && trust.content.badges.length ? (
        <section className="border-y border-sv-surface-high bg-sv-surface py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {trust.content.eyebrow || trust.content.text ? (
              <Reveal className="mb-6 text-center">
                {trust.content.eyebrow ? (
                  <p className="text-xs font-bold uppercase tracking-widest text-sv-secondary">{trust.content.eyebrow}</p>
                ) : null}
                {trust.content.text ? (
                  <p className="text-base font-bold text-sv-primary">{trust.content.text}</p>
                ) : null}
              </Reveal>
            ) : null}
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
              {trust.content.badges.map((b, i) => {
                const Icon = LANDING_ICONS[b.icon];
                return (
                  <Reveal as="li" key={b.id} delayMs={i * 90} className="flex items-center justify-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sv-surface-container text-sv-secondary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-bold text-sv-primary">{b.label}</span>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {stepsOn ? (
        <section className="scroll-mt-20 bg-sv-surface py-20" id="como-funciona">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              className="mb-14 max-w-2xl"
              eyebrow={steps.content.eyebrow}
              title={steps.content.title}
              body={steps.content.body}
            />
            <ol className={`relative grid grid-cols-1 gap-10 md:gap-8 ${steps.content.items.length >= 4 ? "md:grid-cols-4" : steps.content.items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
              <span
                className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-transparent via-sv-secondary/40 to-transparent md:block"
                aria-hidden
              />
              {steps.content.items.map((s, i) => (
                <Reveal as="li" key={s.id} delayMs={i * 120} className="relative flex flex-col items-center text-center">
                  <span className="sv-display relative flex size-12 items-center justify-center rounded-full bg-sv-primary text-lg font-black text-white shadow-lg ring-8 ring-sv-surface">
                    {i + 1}
                  </span>
                  <h3 className="sv-display mt-5 text-lg font-bold text-sv-primary">{s.title}</h3>
                  {s.body ? (
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-sv-on-surface-variant">{s.body}</p>
                  ) : null}
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {stats.enabled && stats.content.items.length ? (
        <section className="bg-sv-surface-low py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto mb-8 max-w-2xl text-center">
              <h2 className="sv-display text-2xl font-extrabold text-sv-primary sm:text-3xl">{stats.content.title}</h2>
              {stats.content.body ? (
                <p className="mt-2 text-sm text-sv-on-surface-variant">{stats.content.body}</p>
              ) : null}
            </Reveal>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.content.items.map((s, i) => {
                const Icon = LANDING_ICONS[s.icon];
                return (
                  <Reveal key={s.id} delayMs={i * 110}>
                    <SpotlightCard className="mb-lift flex h-full flex-col gap-2 rounded-xl border border-sv-surface-high bg-sv-surface-lowest p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-sv-on-surface">{s.label}</p>
                        <Icon className="size-[18px] text-sv-secondary" aria-hidden />
                      </div>
                      <p className="sv-display text-3xl font-extrabold tracking-tight text-sv-primary">
                        <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
                      </p>
                      {s.trend ? (
                        <div className="flex w-fit items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                          <TrendingUp className="size-3.5" aria-hidden />
                          <span>{s.trend}</span>
                        </div>
                      ) : null}
                    </SpotlightCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {comparison.enabled ? (
        <section className="scroll-mt-20 bg-sv-surface py-16" id="comparativa">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow={comparison.content.eyebrow}
              title={comparison.content.title}
              body={comparison.content.body}
            />
            <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">
              <Reveal variant="left" className="h-full">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-red-200/60 bg-red-50/50 p-6 sm:p-8">
                  <div>
                    <div className="flex items-center gap-3 border-b border-red-200/50 pb-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-sv-error">✕</div>
                      <div>
                        <h3 className="sv-display text-lg font-bold text-sv-primary">{comparison.content.manual.title}</h3>
                        <p className="text-xs font-semibold text-sv-error">{comparison.content.manual.subtitle}</p>
                      </div>
                    </div>
                    <ul className="my-6 space-y-4 text-sm font-medium text-sv-on-surface-variant">
                      {comparison.content.manual.items.map((item, i) => (
                        <Reveal as="li" key={item.id} delayMs={150 + i * 90} className="flex items-start gap-3">
                          <span className="font-bold text-sv-error">✗</span>
                          <span>
                            <strong>{item.title}</strong> {item.body}
                          </span>
                        </Reveal>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <ResultBars bars={comparison.content.manual.bars} tone="bad" />
                    {comparison.content.manual.result ? (
                      <div className="rounded-xl bg-red-100/60 p-3 text-center text-xs font-bold text-sv-error">
                        {comparison.content.manual.result}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Reveal>
              <Reveal variant="right" delayMs={120} className="h-full">
                <div className="relative flex h-full flex-col justify-between rounded-2xl border-2 border-sv-secondary bg-sv-surface-low p-6 shadow-lg transition-shadow duration-500 hover:shadow-2xl sm:p-8">
                  {comparison.content.badge ? (
                    <div className="absolute -top-3.5 right-6 rounded-full bg-sv-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                      {comparison.content.badge}
                    </div>
                  ) : null}
                  <div>
                    <div className="flex items-center gap-3 border-b border-sv-surface-high pb-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-sv-secondary-fixed text-xl font-bold text-sv-secondary">✓</div>
                      <div>
                        <h3 className="sv-display text-lg font-bold text-sv-primary">{comparison.content.mibidon.title}</h3>
                        <p className="text-xs font-bold text-sv-secondary">{comparison.content.mibidon.subtitle}</p>
                      </div>
                    </div>
                    <ul className="my-6 space-y-4 text-sm font-medium text-sv-on-surface">
                      {comparison.content.mibidon.items.map((item, i) => (
                        <Reveal as="li" key={item.id} delayMs={250 + i * 90} className="flex items-start gap-3">
                          <span className="font-bold text-emerald-600">✓</span>
                          <span>
                            <strong>{item.title}</strong> {item.body}
                          </span>
                        </Reveal>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <ResultBars bars={comparison.content.mibidon.bars} tone="good" />
                    {comparison.content.mibidon.result ? (
                      <div className="rounded-xl bg-sv-secondary-fixed/50 p-3 text-center text-xs font-bold text-sv-on-secondary-fixed-variant">
                        {comparison.content.mibidon.result}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {featuresOn || showcase.enabled ? (
        <section className="scroll-mt-20 bg-sv-surface-low py-20" id={featuresOn ? "beneficios" : undefined}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {featuresOn ? (
              <>
                <SectionIntro
                  className="mb-14 max-w-3xl"
                  eyebrow={features.content.eyebrow}
                  title={features.content.title}
                  body={features.content.body}
                />
                <div
                  className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${features.content.items.length % 4 === 0 && features.content.items.length % 3 !== 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
                >
                  {features.content.items.map((f, i) => {
                    const Icon = f.icon ? LANDING_ICONS[f.icon] : null;
                    return (
                      <Reveal key={f.id} delayMs={i * 100}>
                        <SpotlightCard className="mb-lift h-full rounded-2xl border border-sv-surface-high bg-sv-surface-lowest p-6 shadow-sm">
                          {Icon ? (
                            <div className="sv-icon-tile mb-4 flex size-12 items-center justify-center rounded-xl bg-sv-surface-container text-sv-secondary">
                              <Icon className="size-6" aria-hidden />
                            </div>
                          ) : null}
                          <h3 className="sv-display mb-1.5 text-lg font-bold text-sv-primary">{f.title}</h3>
                          <p className="text-sm leading-relaxed text-sv-on-surface-variant">{f.body}</p>
                        </SpotlightCard>
                      </Reveal>
                    );
                  })}
                </div>
              </>
            ) : null}

            {showcase.enabled ? (
              <Reveal variant="scale" className={featuresOn ? "mt-12" : undefined}>
                <div className="flex flex-col items-center gap-8 rounded-2xl border border-sv-surface-high bg-sv-surface-lowest p-6 shadow-md sm:p-10 lg:flex-row">
                  <div className="w-full space-y-4 lg:w-1/2">
                    {showcase.content.eyebrow ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-sv-secondary">
                        {showcase.content.eyebrow}
                      </span>
                    ) : null}
                    <h3 className="sv-display text-2xl font-bold text-sv-primary">{showcase.content.title}</h3>
                    {showcase.content.body ? (
                      <p className="text-sm leading-relaxed text-sv-on-surface-variant">{showcase.content.body}</p>
                    ) : null}
                    {showcase.content.linkLabel ? (
                      <div className="pt-2">
                        <a
                          className="inline-flex items-center gap-2 text-sm font-bold text-sv-secondary hover:underline"
                          href={showcaseLinkHref}
                          {...externalProps(showcaseLinkHref)}
                        >
                          <span>{fill(showcase.content.linkLabel)}</span>
                          <ArrowRight className="sv-arrow size-4" aria-hidden />
                        </a>
                      </div>
                    ) : null}
                  </div>
                  {showcase.content.imageUrl ? (
                    <Parallax className="w-full lg:w-1/2">
                      <div className="mb-layer" style={{ "--depth": 8 } as CSSProperties}>
                        <div className="mb-float" style={{ "--fd": "-3s" } as CSSProperties}>
                          <CmsImage
                            src={showcase.content.imageUrl}
                            alt={showcase.content.imageAlt}
                            width={512}
                            height={279}
                            sizes="(min-width: 1024px) 560px, 100vw"
                            className="h-64 w-full rounded-xl border border-sv-surface-high object-cover shadow-sm sm:h-72"
                          />
                        </div>
                      </div>
                    </Parallax>
                  ) : null}
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}

      {testimonialsOn ? (
        <section className="scroll-mt-20 bg-sv-surface py-16" id="testimonios">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              className="mb-12 max-w-2xl"
              eyebrow={testimonials.content.eyebrow}
              title={testimonials.content.title}
              body={testimonials.content.body}
            />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {testimonials.content.items.map((item, i) => (
                <Reveal key={item.id} delayMs={i * 140} className="h-full">
                  <SpotlightCard className="mb-lift flex h-full flex-col justify-between rounded-2xl border border-sv-surface-high bg-sv-surface-low p-6 sm:p-8">
                    <div>
                      <div className="mb-4 flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, k) => (
                          <Star key={k} className="size-[18px] fill-current" aria-hidden />
                        ))}
                      </div>
                      <p className="text-base italic leading-relaxed text-sv-on-surface sm:text-lg">
                        &ldquo;{richText(item.quote)}&rdquo;
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-4 border-t border-sv-surface-container pt-6">
                      {item.avatarUrl ? (
                        <CmsImage
                          src={item.avatarUrl}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="size-12 rounded-full border border-sv-outline-variant object-cover"
                        />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded-full border border-sv-outline-variant bg-sv-surface-container text-sm font-bold text-sv-secondary">
                          {item.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-bold text-sv-primary">{item.name}</p>
                        {item.role ? <p className="text-xs text-sv-on-surface-variant">{item.role}</p> : null}
                      </div>
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {pricingOn ? (
        <section className="relative scroll-mt-20 overflow-hidden bg-sv-surface-low py-16" id="precios">
          <div className="sv-blob left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 bg-sv-secondary-container/15" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow={pricing.content.eyebrow}
              title={pricing.content.title}
              body={pricing.content.body}
            />
            <div className={planGrid}>
              {activePlans.map((plan, idx) => {
                const ctaHref =
                  plan.ctaUrl ||
                  whatsappHref(
                    `Hola MiBidón, quiero mi tienda con el ${plan.name} (${formatClp(plan.price)}${plan.period ? ` ${plan.period}` : ""}).`,
                  );
                const pill = plan.highlighted && plan.badge ? `${plan.name} • ${plan.badge}` : plan.name;
                return (
                  <Reveal key={plan.id} variant="scale" delayMs={idx * 120} className="h-full">
                    <div
                      className={`relative flex h-full flex-col rounded-3xl bg-sv-surface-lowest p-8 transition-transform duration-500 hover:-translate-y-1 sm:p-10 ${
                        plan.highlighted
                          ? "border-2 border-sv-secondary shadow-2xl"
                          : "border border-sv-surface-high shadow-lg"
                      }`}
                    >
                      <div
                        className={`absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-md sm:text-xs ${
                          plan.highlighted
                            ? "bg-sv-secondary text-white"
                            : "border border-sv-surface-high bg-sv-surface-lowest text-sv-primary"
                        }`}
                      >
                        {pill}
                      </div>
                      <div className="border-b border-sv-surface-container pb-6 text-center">
                        {plan.headline ? (
                          <h3 className="sv-display text-2xl font-black text-sv-primary">{plan.headline}</h3>
                        ) : null}
                        {plan.description ? (
                          <p className="mt-1 text-sm text-sv-on-surface-variant">{plan.description}</p>
                        ) : null}
                        <div className="mt-4 flex items-baseline justify-center gap-1">
                          <span className="sv-display text-4xl font-black text-sv-primary sm:text-5xl">
                            <CountUp value={plan.price} prefix="$" durationMs={1400} />
                          </span>
                          {plan.period ? (
                            <span className="text-sm font-semibold text-sv-on-surface-variant">{plan.period}</span>
                          ) : null}
                        </div>
                        {trialOn && t.pricingNote ? (
                          <p className="mt-1 text-xs font-bold text-sv-secondary">{fill(t.pricingNote)}</p>
                        ) : null}
                      </div>
                      <ul className="flex-1 space-y-3.5 py-6 text-sm text-sv-on-surface">
                        {plan.features.map((f, i) => (
                          <Reveal as="li" key={f.id} delayMs={120 + i * 70} className="flex items-center gap-3">
                            <CircleCheck className="size-[18px] shrink-0 text-emerald-600" aria-hidden />
                            <span>{richText(f.text)}</span>
                          </Reveal>
                        ))}
                      </ul>
                      <a
                        className={`sv-shine flex w-full items-center justify-center gap-1.5 rounded-xl px-6 py-4 text-center text-base font-bold shadow-lg hover:shadow-xl ${
                          plan.highlighted
                            ? "bg-sv-primary text-white hover:bg-sv-primary-container"
                            : "bg-sv-surface-container text-sv-primary hover:bg-sv-surface-high"
                        }`}
                        href={ctaHref}
                        {...externalProps(ctaHref)}
                        style={{ "--shine-delay": "0.6s" } as CSSProperties}
                      >
                        <span>{plan.ctaLabel}</span>
                        <ArrowRight className="sv-arrow size-5" aria-hidden />
                      </a>
                      {pricing.content.footnote ? (
                        <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-sv-outline">
                          <BadgeCheck className="size-4 text-emerald-600" aria-hidden />
                          <span>{pricing.content.footnote}</span>
                        </p>
                      ) : null}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {faqOn ? (
        <section className="scroll-mt-20 bg-sv-surface py-20" id="faq">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              className="mb-10 max-w-2xl"
              eyebrow={faq.content.eyebrow}
              title={faq.content.title}
              body={faq.content.body}
            />
            <div className="space-y-3">
                  {faq.content.items.map((f, i) => (
                    <Reveal key={f.id} delayMs={i * 80}>
                      <details className="sv-faq group cursor-pointer rounded-xl border border-sv-surface-high bg-sv-surface-low p-5">
                        <summary className="flex list-none items-center justify-between gap-4 text-base font-bold text-sv-primary">
                          <span>{f.q}</span>
                          <ChevronDown className="sv-faq-icon size-5 shrink-0 text-sv-secondary" aria-hidden />
                        </summary>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-sv-on-surface-variant">{f.a}</p>
                      </details>
                    </Reveal>
                  ))}
            </div>
          </div>
        </section>
      ) : null}

      {advisor.enabled ? (
        <section className="relative overflow-hidden bg-sv-primary-container py-20 text-white">
          <div className="sv-blob -right-24 -top-24 h-80 w-80 bg-sv-secondary/30" />
          <Reveal variant="scale" className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="sv-display text-3xl font-black tracking-tight sm:text-4xl">{advisor.content.title}</h2>
            {advisor.content.body ? (
              <p className="mt-3 text-base text-white/75 sm:text-lg">{advisor.content.body}</p>
            ) : null}
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <a
                className="sv-shine inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-sv-primary shadow-lg hover:bg-sv-surface-low"
                href={primaryCtaHref}
                {...externalProps(primaryCtaHref)}
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="sv-arrow size-5" aria-hidden />
              </a>
              {demoOn ? (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-sv-secondary-fixed/70 px-6 py-3 font-bold text-white transition-colors hover:bg-white/10"
                  href={demo.content.storeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CirclePlay className="size-5" aria-hidden />
                  <span>{hero.content.secondaryCtaLabel || demo.content.navLabel || demo.content.storeLabel}</span>
                </a>
              ) : null}
              <a
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                href={waAdvisor}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" aria-hidden />
                <span>{advisor.content.ctaLabel}</span>
              </a>
            </div>
          </Reveal>
        </section>
      ) : null}

      {footer.enabled ? (
        <footer className="border-t border-sv-surface-high bg-sv-surface-low py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-sv-on-surface-variant sm:flex-row sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <BrandLogo className="h-10 w-auto" />
              <span>
                © {new Date().getFullYear()} {footer.content.brandText}
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium">
              {footer.content.demoLabel ? (
                <a href={demo.content.storeHref || DEMO_STORE_URL} className="hover:text-sv-primary" target="_blank" rel="noopener noreferrer">
                  {footer.content.demoLabel}
                </a>
              ) : null}
              {footer.content.loginLabel ? (
                <Link href={CLIENT_LOGIN_HREF} className="hover:text-sv-primary">{footer.content.loginLabel}</Link>
              ) : null}
              {footer.content.contactEmail ? (
                <a href={`mailto:${footer.content.contactEmail}`} className="hover:text-sv-primary">
                  {footer.content.contactEmail}
                </a>
              ) : null}
            </nav>
          </div>
        </footer>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" aria-label="Navegación rápida">
        <div className="flex gap-2 border-t border-[#e8ecf2] bg-[#f8fafb] px-4 pb-3 pt-2">
          {[
            { href: "#", label: "Inicio", icon: House, active: true, show: true },
            {
              href: demo.content.storeHref,
              label: demo.content.navLabel || "Demo",
              icon: CirclePlay,
              accent: true,
              show: demoOn,
            },
            { href: plansHref, label: "Planes", icon: Tag, show: true },
            { href: waAdvisor, label: "WhatsApp", icon: MessageSquareMore, show: true },
          ]
            .filter((item) => item.show && anchorVisible(item.href))
            .map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...externalProps(item.href)}
                className={`flex flex-1 flex-col items-center justify-end gap-1 transition-transform active:scale-95 ${item.active ? "text-[#0e131a]" : item.accent ? "font-bold text-sv-secondary" : "text-[#516a94]"}`}
              >
                <span className="flex h-8 items-center justify-center">
                  <item.icon className="size-6" strokeWidth={item.active || item.accent ? 2.5 : 2} aria-hidden />
                </span>
                <span className="text-xs font-medium leading-normal tracking-[0.015em]">{item.label}</span>
              </a>
            ))}
        </div>
      </nav>
    </div>
  );
}

function DemoCard({ demo }: { demo: LandingSectionContent<"demo"> }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-sv-surface-high bg-sv-surface-lowest p-3 shadow-2xl">
      {demo.imageUrl ? (
        <a
          href={demo.storeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block overflow-hidden rounded-2xl"
          aria-label={demo.storeLabel || demo.title}
        >
          <CmsImage
            src={demo.imageUrl}
            alt={demo.imageAlt}
            width={512}
            height={279}
            sizes="(min-width: 1024px) 520px, 100vw"
            className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] h-48 sm:h-64`}
          />
          <span className="absolute inset-0 bg-gradient-to-t from-sv-primary/60 via-sv-primary/10 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-sv-secondary shadow-xl transition-transform duration-300 group-hover:scale-110">
              <CirclePlay className="size-8" aria-hidden />
            </span>
          </span>
          {demo.badge ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sv-primary shadow">
              <span className="relative flex h-1.5 w-1.5">
                <span className="mb-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {demo.badge}
            </span>
          ) : null}
        </a>
      ) : null}
      <div className="px-3 pb-3 pt-5 sm:px-4">
        {!demo.imageUrl && demo.badge ? (
          <span className="text-xs font-bold uppercase tracking-widest text-sv-secondary">{demo.badge}</span>
        ) : null}
        <p className="sv-display text-lg font-bold leading-snug text-sv-primary">{demo.title}</p>
        {demo.body ? <p className="mt-1 text-sm text-sv-on-surface-variant">{demo.body}</p> : null}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
          {demo.storeLabel ? (
            <a
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sv-secondary px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              href={demo.storeHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Store className="size-4" aria-hidden />
              <span>{demo.storeLabel}</span>
            </a>
          ) : null}
          {demo.adminLabel && demo.adminHref ? (
            <a
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-sv-secondary/40 bg-sv-surface-lowest px-4 py-2.5 text-sm font-bold text-sv-primary transition-all hover:-translate-y-0.5 hover:border-sv-secondary"
              href={demo.adminHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LayoutDashboard className="size-4 text-sv-secondary" aria-hidden />
              <span>{demo.adminLabel}</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  hero,
  primaryCtaLabel,
  primaryCtaHref,
  whatsappHref,
  demo,
}: {
  hero: LandingSectionContent<"hero">;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  whatsappHref: string;
  demo: LandingSectionContent<"demo"> | null;
}) {
  const words = hero.headline.split(/\s+/).filter(Boolean);
  const chipIcons = [CirclePlay, LANDING_ICONS.BadgeCheck, LANDING_ICONS.Palette, LANDING_ICONS.CircleCheck];
  const twoCol = hero.showSimulator || demo !== null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sv-surface-low via-sv-surface to-sv-surface pb-20 pt-10 lg:pb-28 lg:pt-20">
      <div className="sv-blob -left-24 top-10 h-72 w-72 bg-sv-secondary-container/20" />
      <div className="sv-blob -right-20 bottom-0 h-80 w-80 bg-sv-surface-highest/70" style={{ animationDelay: "-6s" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 items-center gap-12 lg:gap-16 ${twoCol ? "lg:grid-cols-12" : ""}`}>
          <div className={`flex flex-col gap-6 text-left ${twoCol ? "lg:col-span-7" : "mx-auto max-w-3xl"}`}>
            {hero.badge ? (
              <div
                className="mb-fade-up inline-flex items-center gap-2 self-start rounded-full border border-sv-secondary/20 bg-sv-secondary-fixed/50 px-3.5 py-1.5"
                style={d(80)}
              >
                <span className="relative flex h-2 w-2">
                  <span className="mb-ping absolute inline-flex h-full w-full rounded-full bg-sv-secondary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sv-secondary" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-sv-on-secondary-fixed-variant">
                  {hero.badge}
                </span>
              </div>
            ) : null}
            <h1 className="sv-display text-3xl font-black leading-tight tracking-tight text-sv-primary sm:text-4xl lg:text-5xl">
              {words.map((w, i) => (
                <span key={w + i}>
                  <span className="mb-word" style={{ "--i": i } as CSSProperties}>
                    {w}
                  </span>{" "}
                </span>
              ))}
              {hero.headlineAccent ? (
                <span
                  className="mb-word text-sv-secondary underline decoration-sv-secondary-container decoration-4 underline-offset-4"
                  style={{ "--i": words.length } as CSSProperties}
                >
                  {hero.headlineAccent}
                </span>
              ) : null}
            </h1>
            <p
              className="mb-fade-up max-w-2xl text-base leading-relaxed text-sv-on-surface-variant sm:text-lg"
              style={d(650)}
            >
              {richText(hero.body)}
            </p>
            <div className="mb-fade-up flex flex-col gap-3 pt-2 sm:flex-row" style={d(800)}>
              <a
                className="sv-shine inline-flex items-center justify-center gap-2 rounded-xl bg-sv-primary-container px-7 py-4 text-base font-bold text-white shadow-lg hover:bg-sv-primary hover:shadow-xl"
                href={primaryCtaHref}
                {...externalProps(primaryCtaHref)}
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="sv-arrow size-5" aria-hidden />
              </a>
              {hero.secondaryCtaLabel && hero.secondaryCtaHref ? (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sv-secondary px-7 py-4 text-base font-bold text-white shadow-lg ring-4 ring-sv-secondary-container/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  href={hero.secondaryCtaHref}
                  {...externalProps(hero.secondaryCtaHref)}
                >
                  <CirclePlay className="size-5" aria-hidden />
                  <span>{hero.secondaryCtaLabel}</span>
                </a>
              ) : null}
            </div>
            {hero.whatsappLabel ? (
              <a
                className="mb-fade-up -mt-2 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-sv-on-surface-variant transition-colors hover:text-emerald-700"
                style={d(880)}
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4 text-emerald-600" aria-hidden />
                <span>{hero.whatsappLabel}</span>
              </a>
            ) : null}
            {hero.chips.length ? (
              <div
                className="mb-fade-up sv-label flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-sv-on-surface-variant"
                style={d(950)}
              >
                {hero.chips.map((chip, i) => {
                  const Icon = chipIcons[i % chipIcons.length]!;
                  return i === 0 ? (
                    <span key={chip.id} className="inline-flex items-center gap-1 font-bold text-sv-on-secondary-fixed-variant">
                      <Icon className="size-3.5" aria-hidden /> {chip.label}
                    </span>
                  ) : (
                    <span key={chip.id} className="inline-flex items-center gap-1 font-semibold">
                      <Icon className="size-3.5 text-sv-secondary" aria-hidden /> {chip.label}
                    </span>
                  );
                })}
              </div>
            ) : null}
            {hero.liveText ? (
              <div
                className="mb-fade-up mt-4 flex max-w-md items-center justify-between rounded-xl border border-sv-surface-highest bg-sv-surface-container p-3"
                style={d(1100)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden>🔥</span>
                  <p className="text-xs font-semibold text-sv-primary">{richText(hero.liveText)}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded bg-sv-surface-lowest px-2 py-1 text-[11px] font-bold text-sv-secondary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="mb-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  En Vivo
                </span>
              </div>
            ) : null}
          </div>

          {twoCol ? (
            <Parallax className="relative lg:col-span-5">
              <div className="mb-pop" style={d(450)}>
                <div className="mb-layer" style={{ "--depth": 10 } as CSSProperties}>
                  <div className={hero.showSimulator ? "mb-float" : undefined}>
                    {hero.showSimulator ? <RevenueSimulator /> : demo ? <DemoCard demo={demo} /> : null}
                  </div>
                </div>
              </div>
              <div
                className="mb-layer pointer-events-none absolute -top-8 right-20 hidden xl:block"
                style={{ "--depth": -22 } as CSSProperties}
              >
                <div className="mb-pop" style={d(1200)}>
                  <div className="mb-float flex items-center gap-2 rounded-xl border border-sv-surface-high bg-white/95 px-3 py-2 shadow-lg" style={{ "--fd": "-2s" } as CSSProperties}>
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CircleCheck className="size-4" aria-hidden />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-sv-primary">Pago WebPay aprobado</p>
                      <p className="text-[10px] text-sv-on-surface-variant">2 bidones · $7.000</p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="mb-layer pointer-events-none absolute -bottom-6 -right-6 hidden xl:block"
                style={{ "--depth": -16 } as CSSProperties}
              >
                <div className="mb-pop" style={d(1400)}>
                  <div className="mb-float flex items-center gap-2 rounded-xl border border-sv-surface-high bg-white/95 px-3 py-2 shadow-lg" style={{ "--fd": "-4s" } as CSSProperties}>
                    <span className="flex size-7 items-center justify-center rounded-lg bg-sv-secondary-fixed text-sv-secondary">
                      <Truck className="size-4" aria-hidden />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-sv-primary">Ruta del día lista</p>
                      <p className="text-[10px] text-sv-on-surface-variant">18 entregas · 3 comunas</p>
                    </div>
                  </div>
                </div>
              </div>
            </Parallax>
          ) : null}
        </div>
      </div>
    </section>
  );
}
