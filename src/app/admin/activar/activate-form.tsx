"use client";

import { useActionState } from "react";
import { activateAdminAction, type ActivateState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActivateState = { error: null };

export function ActivateForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(activateAdminAction, initial);

  return (
    <form
      action={action}
      className="mt-8 space-y-4 rounded-lg border border-[#d5e3ec] bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="username" value={email} autoComplete="username" />
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña (mín. 12 caracteres)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={12}
          maxLength={200}
          required
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Repite la contraseña</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          minLength={12}
          maxLength={200}
          required
          autoComplete="new-password"
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : "Guardar y entrar"}
      </Button>
    </form>
  );
}
