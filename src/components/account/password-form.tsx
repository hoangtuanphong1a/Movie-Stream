"use client";

import { useActionState, useRef, useEffect } from "react";
import { changePassword, type FormState } from "@/server/actions/user";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    changePassword,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Xoá các ô khi đổi mật khẩu thành công.
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Mật khẩu hiện tại</label>
        <Input name="currentPassword" type="password" required />
        {state?.fieldErrors?.currentPassword && (
          <p className="text-xs text-red-500">
            {state.fieldErrors.currentPassword[0]}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Mật khẩu mới</label>
        <Input name="newPassword" type="password" required />
        {state?.fieldErrors?.newPassword && (
          <p className="text-xs text-red-500">
            {state.fieldErrors.newPassword[0]}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Nhập lại mật khẩu mới</label>
        <Input name="confirmPassword" type="password" required />
        {state?.fieldErrors?.confirmPassword && (
          <p className="text-xs text-red-500">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Đang đổi..." : "Đổi mật khẩu"}
        </Button>
        {state?.success && (
          <span className="text-sm text-green-600">Đã đổi mật khẩu!</span>
        )}
        {state?.error && (
          <span className="text-sm text-red-500">{state.error}</span>
        )}
      </div>
    </form>
  );
}
