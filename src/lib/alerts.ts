"use client";

import type { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from "sweetalert2";

/**
 * SweetAlert2 themed with the admin palette. Popups mount on <body>, outside the
 * element that carries the tenant's Apariencia variables, so those variables are
 * copied onto each container before it opens.
 */

const THEME_VARS = [
  "--brand",
  "--brand-deep",
  "--admin-sidebar-fill",
  "--admin-sidebar-text",
  "--admin-active-bg",
  "--admin-active-text",
  "--admin-topbar-bg",
  "--admin-topbar-text",
  "--kpi-success-bg",
  "--kpi-danger-bg",
  "--kpi-warning-bg",
] as const;

type Swal = typeof import("sweetalert2").default;
let swalPromise: Promise<Swal> | null = null;

function loadSwal(): Promise<Swal> {
  swalPromise ??= import("sweetalert2").then((m) => m.default);
  return swalPromise;
}

function applyTheme(popup: HTMLElement) {
  const source = document.querySelector<HTMLElement>("[data-admin-theme]");
  const container = popup.closest<HTMLElement>(".swal2-container") ?? popup;
  if (!source) return;
  const styles = getComputedStyle(source);
  for (const name of THEME_VARS) {
    const value = styles.getPropertyValue(name).trim();
    if (value) container.style.setProperty(name, value);
  }
}

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const BASE: SweetAlertOptions = {
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: false,
  customClass: {
    container: "mb-swal",
    popup: "mb-swal-popup",
    title: "mb-swal-title",
    htmlContainer: "mb-swal-text",
    actions: "mb-swal-actions",
    confirmButton: "mb-swal-btn mb-swal-btn-confirm",
    cancelButton: "mb-swal-btn mb-swal-btn-cancel",
    denyButton: "mb-swal-btn mb-swal-btn-cancel",
    closeButton: "mb-swal-close",
  },
};

async function fire(options: SweetAlertOptions): Promise<SweetAlertResult> {
  const Swal = await loadSwal();
  const userWillOpen = options.willOpen;
  return Swal.fire({
    ...BASE,
    ...options,
    customClass: { ...(BASE.customClass as object), ...(options.customClass as object) },
    ...(reducedMotion() ? { showClass: { popup: "" }, hideClass: { popup: "" } } : {}),
    willOpen: (popup: HTMLElement) => {
      applyTheme(popup);
      userWillOpen?.(popup);
    },
  } as SweetAlertOptions);
}

export type ConfirmTone = "danger" | "warning" | "primary";

export type ConfirmOptions = {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: SweetAlertIcon;
};

/** Resolves to true only when the user explicitly confirms. */
export async function confirmAction({
  title,
  text,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "primary",
  icon,
}: ConfirmOptions): Promise<boolean> {
  const res = await fire({
    title,
    text,
    icon: icon ?? (tone === "primary" ? "question" : "warning"),
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      ...(BASE.customClass as object),
      container: `mb-swal mb-swal-tone-${tone}`,
    },
  });
  return res.isConfirmed;
}

export type ToastKind = "success" | "error" | "info" | "warning";

export async function toast(kind: ToastKind, title: string, text?: string) {
  const Swal = await loadSwal();
  const isError = kind === "error";
  return Swal.fire({
    buttonsStyling: false,
    customClass: {
      container: "mb-swal mb-swal-toast-container",
      popup: `mb-swal-toast mb-swal-toast-${kind}`,
      title: "mb-swal-toast-title",
      htmlContainer: "mb-swal-toast-text",
      timerProgressBar: "mb-swal-toast-progress",
    },
    toast: true,
    position: "top-end",
    icon: kind,
    title,
    text,
    showConfirmButton: false,
    showCloseButton: true,
    closeButtonAriaLabel: "Cerrar aviso",
    timer: isError ? 7000 : 3500,
    timerProgressBar: true,
    ...(reducedMotion() ? { showClass: { popup: "" }, hideClass: { popup: "" } } : {}),
    willOpen: applyTheme,
    didOpen: (el) => {
      el.addEventListener("mouseenter", Swal.stopTimer);
      el.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
}

toast.success = (title: string, text?: string) => toast("success", title, text);
toast.error = (title: string, text?: string) => toast("error", title, text);
toast.info = (title: string, text?: string) => toast("info", title, text);

/** Blocking, friendly error dialog. Returns true when the user chose to retry. */
export async function errorDialog({
  title = "Algo salió mal",
  text = "No pudimos completar la acción. Revisa tu conexión e inténtalo de nuevo.",
  retryText,
}: { title?: string; text?: string; retryText?: string } = {}): Promise<boolean> {
  const res = await fire({
    title,
    text,
    icon: "error",
    showCancelButton: Boolean(retryText),
    confirmButtonText: retryText ?? "Entendido",
    cancelButtonText: "Cerrar",
  });
  return Boolean(retryText) && res.isConfirmed;
}
