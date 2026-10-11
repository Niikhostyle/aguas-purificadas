"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/** Scroll-triggered reveal. */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setOn(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const style: CSSProperties = { transitionDelay: `${delayMs}ms` };

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        on ? "translate-y-0 opacity-100" : "translate-y-9 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Sticky header that densifies after scroll. */
export function ScrollHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#04101f]/94 shadow-[0_8px_28px_-8px_rgba(4,16,31,0.55)] backdrop-blur-xl"
          : "border-b border-transparent bg-[#04101f]/58 backdrop-blur-md"
      }`}
    >
      {children}
    </header>
  );
}

/** Animated integer counter when in view. */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  durationMs = 1400,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    let started = false;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || started) return;
        started = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        obs.disconnect();
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {n.toLocaleString("es-CL")}
      {suffix}
    </span>
  );
}

/** Soft mouse-tilt for the ROI glass panel. */
export function TiltPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
