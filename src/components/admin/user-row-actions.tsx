"use client";

import { useTransition } from "react";
import { setUserRole, toggleUserBan } from "@/server/actions/admin";

export function UserRowActions({
  id,
  role,
  status,
  disabled,
}: {
  id: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "BANNED";
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={role}
        disabled={disabled || pending}
        onChange={(e) =>
          start(() =>
            setUserRole(id, e.target.value as "USER" | "ADMIN").then(() => {}),
          )
        }
        className="h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 text-xs disabled:opacity-50"
      >
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <button
        disabled={disabled || pending}
        onClick={() => start(() => toggleUserBan(id).then(() => {}))}
        className={`rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
          status === "BANNED"
            ? "border-green-500/40 text-green-400 hover:bg-green-500/10"
            : "border-red-500/40 text-red-400 hover:bg-red-500/10"
        }`}
      >
        {status === "BANNED" ? "Mở khóa" : "Khóa"}
      </button>
    </div>
  );
}
