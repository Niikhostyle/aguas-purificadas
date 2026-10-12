"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CornerDownLeft,
  ExternalLink,
  LogOut,
  Search,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { confirmAction } from "@/lib/alerts";
import type { AdminNavGroup, AdminNavIcon } from "./nav";

export type PaletteAction = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  external?: boolean;
  /** Extra words that should match the search. */
  keywords?: string;
  run?: "logout";
};

type Entry = {
  id: string;
  section: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  keywords: string;
  href?: string;
  external?: boolean;
  run?: "logout";
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function CommandPalette({
  open,
  onClose,
  groups,
  icons,
  actions,
  searchTargets,
}: {
  open: boolean;
  onClose: () => void;
  groups: AdminNavGroup[];
  icons: Record<AdminNavIcon, LucideIcon>;
  actions: PaletteAction[];
  /** Free-text search shortcuts, e.g. orders/products list pages with `?q=`. */
  searchTargets: { label: string; href: string; icon: LucideIcon }[];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const entries = useMemo<Entry[]>(() => {
    const needle = normalize(q.trim());
    const nav: Entry[] = groups.flatMap((g) =>
      g.items.map((i) => ({
        id: `nav:${i.href}`,
        section: "Ir a",
        label: i.label,
        hint: g.label,
        icon: icons[i.icon],
        keywords: `${i.label} ${g.label}`,
        href: i.href,
      })),
    );
    const quick: Entry[] = actions.map((a) => ({
      id: `act:${a.id}`,
      section: "Acciones rápidas",
      label: a.label,
      hint: a.hint,
      icon: a.icon,
      keywords: `${a.label} ${a.hint ?? ""} ${a.keywords ?? ""}`,
      href: a.href,
      external: a.external,
      run: a.run,
    }));
    const matches = (e: Entry) => !needle || normalize(e.keywords).includes(needle);
    const search: Entry[] = needle
      ? searchTargets.map((t) => ({
          id: `search:${t.href}`,
          section: "Buscar",
          label: `${t.label} «${q.trim()}»`,
          icon: t.icon,
          keywords: "",
          href: `${t.href}${t.href.includes("?") ? "&" : "?"}q=${encodeURIComponent(q.trim())}`,
        }))
      : [];
    return [...nav.filter(matches), ...quick.filter(matches), ...search];
  }, [q, groups, icons, actions, searchTargets]);

  const close = useCallback(() => {
    setQ("");
    setActive(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const runEntry = async (e: Entry) => {
    if (e.run === "logout") {
      close();
      const ok = await confirmAction({
        title: "¿Cerrar sesión?",
        text: "Tendrás que volver a ingresar para administrar tu empresa.",
        confirmText: "Cerrar sesión",
        tone: "primary",
      });
      if (ok) await logoutAction();
      return;
    }
    if (!e.href) return;
    close();
    if (e.external) window.open(e.href, "_blank", "noopener,noreferrer");
    else router.push(e.href);
  };

  const onKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Escape") {
      ev.preventDefault();
      close();
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setActive((a) => (entries.length ? (a + 1) % entries.length : 0));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setActive((a) => (entries.length ? (a - 1 + entries.length) % entries.length : 0));
    } else if (ev.key === "Home") {
      ev.preventDefault();
      setActive(0);
    } else if (ev.key === "End") {
      ev.preventDefault();
      setActive(Math.max(0, entries.length - 1));
    } else if (ev.key === "Enter" && entries[active]) {
      ev.preventDefault();
      void runEntry(entries[active]);
    } else if (ev.key === "Tab") {
      ev.preventDefault();
    }
  };

  let lastSection = "";
  const rows: ReactNode[] = [];
  entries.forEach((e, i) => {
    if (e.section !== lastSection) {
      lastSection = e.section;
      rows.push(
        <li
          key={`h-${e.section}`}
          role="presentation"
          className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b8aa0] first:pt-1"
        >
          {e.section}
        </li>,
      );
    }
    const Icon = e.icon;
    const selected = i === active;
    rows.push(
      <li
        key={e.id}
        id={`${listId}-${i}`}
        data-index={i}
        role="option"
        aria-selected={selected}
        onMouseMove={() => setActive(i)}
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => void runEntry(e)}
        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
          selected
            ? "bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-[var(--brand-deep)]"
            : "text-[#3d4a5c]"
        }`}
      >
        <span
          aria-hidden
          className={`grid size-7 shrink-0 place-items-center rounded-md ${
            selected ? "bg-[var(--brand)] text-white" : "bg-[#eef3f7] text-[var(--brand-deep)]"
          }`}
        >
          {e.run === "logout" ? <LogOut className="size-4" /> : <Icon className="size-4" />}
        </span>
        <span className="min-w-0 flex-1 truncate">{e.label}</span>
        {e.hint ? <span className="hidden text-[11px] text-[#8a96a6] sm:inline">{e.hint}</span> : null}
        {e.external ? (
          <ExternalLink aria-hidden className="size-3.5 text-[#8a96a6]" />
        ) : selected ? (
          <CornerDownLeft aria-hidden className="size-3.5 text-[var(--brand)]" />
        ) : (
          <ArrowRight aria-hidden className="size-3.5 text-transparent" />
        )}
      </li>,
    );
  });

  const fade = reduce ? { duration: 0 } : { duration: 0.15 };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="command-palette"
          className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[10vh] sm:pt-[14vh]"
          exit={{ opacity: 1 }}
          transition={fade}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[#06142a]/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#dde7ee] bg-white shadow-[0_30px_80px_-24px_rgba(6,20,42,0.55)]"
            initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.25, bounce: 0.15 }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-2 border-b border-[#e8f0f5] px-4">
              <Search aria-hidden className="size-4 shrink-0 text-[var(--brand)]" />
              <label htmlFor={`${listId}-input`} className="sr-only">
                Buscar secciones y acciones
              </label>
              <input
                ref={inputRef}
                id={`${listId}-input`}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={entries[active] ? `${listId}-${active}` : undefined}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Busca una sección, acción, pedido o producto…"
                autoComplete="off"
                spellCheck={false}
                className="h-14 w-full bg-transparent text-[15px] text-[#12233d] placeholder:text-[#8a96a6] focus:outline-none"
              />
              <kbd className="hidden rounded border border-[#d5e3ec] bg-[#f4f8fb] px-1.5 py-0.5 font-mono text-[10px] text-[#7b8aa0] sm:block">
                Esc
              </kbd>
            </div>
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Resultados"
              className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
            >
              {entries.length === 0 ? (
                <li role="presentation" className="px-3 py-8 text-center text-sm text-[#5a6578]">
                  Sin resultados para «{q}».
                </li>
              ) : (
                rows
              )}
            </ul>
            <div className="hidden items-center gap-4 border-t border-[#e8f0f5] bg-[#fafcfd] px-4 py-2 text-[11px] text-[#7b8aa0] sm:flex">
              <span>
                <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> navegar
              </span>
              <span>
                <kbd className="font-mono">Enter</kbd> abrir
              </span>
              <span>
                <kbd className="font-mono">Esc</kbd> cerrar
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
