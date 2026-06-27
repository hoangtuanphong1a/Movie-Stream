"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({
  callbackUrl,
  registered,
}: {
  callbackUrl?: string;
  registered?: boolean;
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      {registered && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Đăng ký thành công! Hãy đăng nhập.
        </p>
      )}
      {state?.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <Input name="email" type="email" placeholder="email@example.com" required />
        {state?.fieldErrors?.email && (
          <p className="text-xs text-red-400">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Mật khẩu</label>
        <Input name="password" type="password" placeholder="••••••••" required />
        {state?.fieldErrors?.password && (
          <p className="text-xs text-red-400">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className="text-[var(--color-primary)] hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
