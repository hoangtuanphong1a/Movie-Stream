"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Tên hiển thị</label>
        <Input name="name" placeholder="Nguyễn Văn A" required />
        {state?.fieldErrors?.name && (
          <p className="text-xs text-red-400">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <Input name="email" type="email" placeholder="email@example.com" required />
        {state?.fieldErrors?.email && (
          <p className="text-xs text-red-400">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Mật khẩu</label>
        <Input name="password" type="password" placeholder="Tối thiểu 6 ký tự" required />
        {state?.fieldErrors?.password && (
          <p className="text-xs text-red-400">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Nhập lại mật khẩu</label>
        <Input name="confirmPassword" type="password" placeholder="••••••••" required />
        {state?.fieldErrors?.confirmPassword && (
          <p className="text-xs text-red-400">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang tạo tài khoản..." : "Đăng ký"}
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="text-[var(--color-primary)] hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
