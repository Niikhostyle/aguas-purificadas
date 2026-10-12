"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { ArrowRight, CheckCircle2, Droplets, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { setCartLineAction, type CartSnapshot } from "@/app/(storefront)/cart-actions";
import { formatClp } from "@/lib/utils";

type CartContextValue = {
  cart: CartSnapshot;
  isOpen: boolean;
  /** Opens the drawer; `added` highlights the product that was just added. */
  openCart: (opts?: { cart?: CartSnapshot; added?: string }) => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Holds the client copy of the cart; the server (cookie) stays authoritative and re-seeds it on every render. */
export function CartProvider({ initial, children }: { initial: CartSnapshot; children: ReactNode }) {
  const [cart, setCart] = useState(initial);
  const [seed, setSeed] = useState(initial);
  if (seed !== initial) {
    setSeed(initial);
    setCart(initial);
  }
  const [isOpen, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const openCart = useCallback((opts?: { cart?: CartSnapshot; added?: string }) => {
    if (opts?.cart) setCart(opts.cart);
    setAdded(opts?.added ?? null);
    setOpen(true);
  }, []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ cart, isOpen, openCart, closeCart }), [cart, isOpen, openCart, closeCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer cart={cart} setCart={setCart} open={isOpen} onClose={closeCart} added={added} />
    </CartContext.Provider>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function withQuantity(cart: CartSnapshot, productId: string, quantity: number): CartSnapshot {
  const items = cart.items
    .map((i) =>
      i.productId === productId
        ? { ...i, quantity, lineTotalClp: i.unitPriceClp * quantity }
        : i,
    )
    .filter((i) => i.quantity > 0);
  return {
    items,
    subtotalClp: items.reduce((s, i) => s + i.lineTotalClp, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  };
}

function CartDrawer({
  cart,
  setCart,
  open,
  onClose,
  added,
}: {
  cart: CartSnapshot;
  setCart: (c: CartSnapshot) => void;
  open: boolean;
  onClose: () => void;
  added: string | null;
}) {
  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    const focusFirst = window.setTimeout(() => {
      const panel = panelRef.current;
      (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel)?.focus({ preventScroll: true });
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusFirst);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      openerRef.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  const update = (productId: string, quantity: number) => {
    setCart(withQuantity(cart, productId, quantity));
    setBusyId(productId);
    startTransition(async () => {
      try {
        setCart(await setCartLineAction(productId, quantity));
      } catch {
        router.refresh();
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[70] flex justify-end print:hidden">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-[#051b3f]/45 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="relative flex h-dvh w-full max-w-[26rem] flex-col bg-white shadow-[-24px_0_60px_-20px_rgba(5,27,63,0.45)] outline-none sm:rounded-l-[1.75rem]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38, mass: 0.9 }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[var(--sf-line)] px-5 py-4">
                <h2 id={titleId} className="rc-display flex items-center gap-2 text-2xl uppercase text-[var(--brand-deep)]">
                  <ShoppingBag className="size-5 text-[var(--brand)]" aria-hidden />
                  Tu carrito
                  {cart.itemCount > 0 ? (
                    <span className="rounded-full bg-[var(--mist)] px-2 py-0.5 font-sans text-xs font-bold text-[var(--brand)]">
                      {cart.itemCount}
                    </span>
                  ) : null}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar carrito"
                  className="inline-flex size-10 items-center justify-center rounded-full text-[#5a6578] transition duration-300 hover:rotate-90 hover:bg-[var(--mist)] hover:text-[var(--brand-deep)]"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              {added ? (
                <p
                  role="status"
                  className="sf-rise mx-5 mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200"
                >
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">Agregaste {added}</span>
                </p>
              ) : null}

              {cart.items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--brand)]">
                    <ShoppingBag className="size-7" aria-hidden />
                  </span>
                  <p className="mt-4 text-[#5a6578]">Tu carrito está vacío.</p>
                  <button
                    type="button"
                    data-autofocus
                    onClick={onClose}
                    className="rc-btn-primary mt-6 px-6 py-2.5 text-sm font-bold uppercase tracking-wide"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                <>
                  <ul className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4" aria-busy={busyId !== null}>
                    {cart.items.map((item) => (
                      <li
                        key={item.productId}
                        className="sf-card flex gap-3 p-2.5 shadow-none"
                      >
                        <Link
                          href={`/productos/${item.slug}`}
                          onClick={onClose}
                          tabIndex={-1}
                          aria-hidden
                          className="size-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_50%_15%,#fff_0%,var(--mist)_100%)] ring-1 ring-[var(--sf-line)]"
                        >
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[var(--brand)]">
                              <Droplets className="size-6 opacity-50" />
                            </span>
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/productos/${item.slug}`}
                              onClick={onClose}
                              className="rc-display line-clamp-2 text-lg uppercase leading-tight text-[var(--brand-deep)] transition-colors hover:text-[var(--brand)]"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => update(item.productId, 0)}
                              aria-label={`Quitar ${item.name}`}
                              className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#8a94a6] transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </div>
                          <p className="text-xs text-[#5a6578]">
                            {item.discountBadge ? (
                              <s className="mr-1 text-[#8a96a8]">{formatClp(item.listUnitPriceClp)}</s>
                            ) : null}
                            {formatClp(item.unitPriceClp)} c/u
                            {item.discountBadge ? (
                              <span className="ml-1.5 rounded-full bg-[var(--brand)] px-1.5 py-px text-[10px] font-bold text-white">
                                {item.discountBadge}
                              </span>
                            ) : null}
                          </p>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                            <div
                              className="inline-flex items-center rounded-full border border-[var(--sf-line-strong)] bg-white p-0.5"
                              role="group"
                              aria-label={`Cantidad de ${item.name}`}
                            >
                              <button
                                type="button"
                                onClick={() => update(item.productId, item.quantity - 1)}
                                aria-label={item.quantity <= 1 ? `Quitar ${item.name}` : "Restar uno"}
                                className="inline-flex size-7 items-center justify-center rounded-full text-[var(--brand-deep)] transition hover:bg-[var(--mist)] active:scale-90"
                              >
                                <Minus className="size-3.5" aria-hidden />
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-[var(--brand-deep)]" aria-live="polite">
                                {busyId === item.productId ? (
                                  <Loader2 className="mx-auto size-3.5 animate-spin text-[var(--brand)]" aria-label={`${item.quantity}`} />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => update(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= 99}
                                aria-label="Sumar uno"
                                className="inline-flex size-7 items-center justify-center rounded-full text-[var(--brand-deep)] transition hover:bg-[var(--mist)] active:scale-90 disabled:opacity-40"
                              >
                                <Plus className="size-3.5" aria-hidden />
                              </button>
                            </div>
                            <span className="font-bold tabular-nums text-[var(--brand)]">{formatClp(item.lineTotalClp)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-[var(--sf-line)] bg-[linear-gradient(180deg,#fff_0%,var(--mist)_100%)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-[#5a6578]">Subtotal</span>
                      <span className="rc-display text-3xl tabular-nums text-[var(--brand-deep)]">
                        {formatClp(cart.subtotalClp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#5a6578]">El despacho se calcula en el checkout.</p>
                    <Link
                      href="/checkout"
                      data-autofocus
                      onClick={onClose}
                      className="rc-btn-primary group mt-4 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide"
                    >
                      Ir a pagar
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--brand-deep)] transition hover:bg-white hover:text-[var(--brand)]"
                      >
                        Seguir comprando
                      </button>
                      <Link
                        href="/carrito"
                        onClick={onClose}
                        className="rounded-full px-3 py-2 text-xs text-[#5a6578] underline-offset-4 hover:underline"
                      >
                        Ver carrito completo
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
