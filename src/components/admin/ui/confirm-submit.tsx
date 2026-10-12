"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { confirmAction, toast, type ConfirmTone } from "@/lib/alerts";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> & {
  confirmTitle: string;
  confirmText?: string;
  confirmLabel?: string;
  tone?: ConfirmTone;
  /**
   * Checkbox name that must have at least one checked box in the form (including
   * inputs bound via the `form` attribute). `{n}` in title/text is replaced by the count.
   */
  requireSelection?: string;
  selectionMessage?: string;
  children: ReactNode;
};

function checkedCount(form: HTMLFormElement, name: string) {
  return Array.from(form.elements).filter(
    (el): el is HTMLInputElement => el instanceof HTMLInputElement && el.name === name && el.checked,
  ).length;
}

/**
 * Submit button that asks for confirmation with SweetAlert2 before letting the
 * form's server action run. Works inside server-rendered forms; `formAction`,
 * `name` and `value` are preserved because the button itself is the submitter.
 */
export function ConfirmSubmitButton({
  confirmTitle,
  confirmText,
  confirmLabel = "Confirmar",
  tone = "danger",
  requireSelection,
  selectionMessage = "Selecciona al menos un pedido.",
  children,
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={async (e) => {
        const button = e.currentTarget;
        const form = button.form;
        if (!form) return;
        e.preventDefault();
        if (!form.reportValidity()) return;
        let n = 0;
        if (requireSelection) {
          n = checkedCount(form, requireSelection);
          if (n === 0) {
            void toast.info(selectionMessage);
            return;
          }
        }
        const fill = (s?: string) => s?.replaceAll("{n}", String(n));
        const ok = await confirmAction({
          title: fill(confirmTitle)!,
          text: fill(confirmText),
          confirmText: confirmLabel,
          tone,
        });
        if (ok) form.requestSubmit(button);
      }}
    >
      {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : null}
      {children}
    </button>
  );
}
