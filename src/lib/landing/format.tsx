import { Fragment, type ReactNode } from "react";

/** Renders **negrita** and _cursiva_ as React nodes; never interprets HTML. */
export function richText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_\s][^_]*_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function fillTrialTokens(text: string, days: number, label: string): string {
  return text.replaceAll("{dias}", String(days)).replaceAll("{prueba}", `${days} ${label}`);
}

export function formatClp(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

export function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href);
}
