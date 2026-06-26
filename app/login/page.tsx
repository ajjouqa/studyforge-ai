"use client";

import { useActionState } from "react";
import { GraduationCap } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button, Card } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg">
            <GraduationCap size={18} />
          </span>
          StudyForge
        </div>
        <form action={formAction} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          />
          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
