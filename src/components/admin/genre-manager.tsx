"use client";

import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  createGenre,
  deleteGenre,
  type AdminFormState,
} from "@/server/actions/admin";

export function CreateGenreForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    createGenre,
    undefined,
  );
  return (
    <form action={action} className="flex items-end gap-2">
      <input
        name="name"
        placeholder="Tên thể loại mới"
        className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "..." : "Thêm"}
      </button>
      {state?.error && (
        <span className="text-xs text-red-400">{state.error}</span>
      )}
    </form>
  );
}

export function DeleteGenreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Xóa thể loại này?")) start(() => deleteGenre(id));
      }}
      className="flex size-7 items-center justify-center rounded-md border border-[var(--color-border)] hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
