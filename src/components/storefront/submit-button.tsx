"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Form submit button that shows a spinner while its server action is pending. */
export function SubmitButton({
  children,
  icon,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "type"> & { icon?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending} {...props}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : icon}
      {children}
    </Button>
  );
}
