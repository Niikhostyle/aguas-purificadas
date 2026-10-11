"use client";

import { useEffect } from "react";

/**
 * Wires the apex landing's motion through data attributes:
 * [data-nav], [data-progress], [data-reveal], [data-count], [data-spotlight],
 * [data-parallax] (+ .mb-layer children with --depth) and [data-fab].
 * Keep in sync with the inline script in public/landing-premium.html.
 */
export function LandingEffects() {
  useEffect(() => initLandingEffects(document), []);
  return null;
}

function initLandingEffects(doc: Document): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cleanups: Array<() => void> = [];

  const nav = doc.querySelector<HTMLElement>("[data-nav]");
  const progress = doc.querySelector<HTMLElement>("[data-progress]");
  let scrollRaf = 0;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const y = window.scrollY;
      nav?.setAttribute("data-scrolled", String(y > 12));
      if (progress) {
        const max = doc.documentElement.scrollHeight - window.innerHeight;
        progress.style.setProperty("--mb-progress", String(max > 0 ? Math.min(1, y / max) : 0));
      }
    });
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  cleanups.push(() => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(scrollRaf);
  });

  const counters = Array.from(doc.querySelectorAll<HTMLElement>("[data-count]"));
  const runCount = (el: HTMLElement) => {
    const target = Number(el.dataset.count) || 0;
    if (reduced) {
      el.textContent = target.toLocaleString("es-CL");
      return;
    }
    const t0 = performance.now();
    const dur = 1600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString("es-CL");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const reveals = Array.from(doc.querySelectorAll<HTMLElement>("[data-reveal]"));
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
    counters.forEach(runCount);
  } else {
    counters.forEach((el) => (el.textContent = "0"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          if (el.hasAttribute("data-count")) runCount(el);
          else el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    reveals.forEach((el) => io.observe(el));
    counters.forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());
  }

  if (finePointer && !reduced) {
    doc.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((card) => {
      const onMove = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      card.addEventListener("pointermove", onMove);
      cleanups.push(() => card.removeEventListener("pointermove", onMove));
    });

    const stage = doc.querySelector<HTMLElement>("[data-parallax]");
    if (stage) {
      let tx = 0;
      let ty = 0;
      let cx = 0;
      let cy = 0;
      let raf = 0;
      const step = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        stage.style.setProperty("--px", cx.toFixed(3));
        stage.style.setProperty("--py", cy.toFixed(3));
        raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(step) : 0;
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(step);
      };
      const onMove = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      };
      const onLeave = () => {
        tx = 0;
        ty = 0;
        kick();
      };
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerleave", onLeave);
        cancelAnimationFrame(raf);
      });
    }
  }

  const fab = doc.querySelector<HTMLElement>("[data-fab]");
  if (fab && !reduced) {
    const show = window.setTimeout(() => fab.setAttribute("data-tip", "true"), 3500);
    const hide = window.setTimeout(() => fab.removeAttribute("data-tip"), 8000);
    cleanups.push(() => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    });
  }

  return () => cleanups.forEach((fn) => fn());
}
