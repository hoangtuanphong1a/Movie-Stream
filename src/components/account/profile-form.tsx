"use client";

import { useActionState, useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { updateProfile, type FormState } from "@/server/actions/user";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileForm({
  defaultName,
  defaultImage,
}: {
  defaultName: string;
  defaultImage: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProfile,
    undefined,
  );
  const [image, setImage] = useState(defaultImage);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resize ảnh tải lên về tối đa 256px rồi nén JPEG để nhẹ (lưu thẳng dạng data URL).
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 256;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <form action={action} className="space-y-4">
      {/* Ảnh đại diện: xem trước + tải lên + (tuỳ chọn) dán URL */}
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Ảnh đại diện" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xl font-bold text-[var(--color-muted-foreground)]">
              {(defaultName || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-accent)]"
          >
            <Upload className="size-4" /> Tải ảnh lên
          </button>
          {image && (
            <button
              type="button"
              onClick={() => setImage("")}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
            >
              <Trash2 className="size-4" /> Xoá
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Tên hiển thị</label>
        <Input name="name" defaultValue={defaultName} required />
        {state?.fieldErrors?.name && (
          <p className="text-xs text-red-500">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Hoặc dán URL ảnh{" "}
          <span className="font-normal text-[var(--color-muted-foreground)]">
            (tuỳ chọn)
          </span>
        </label>
        <Input
          value={image.startsWith("data:") ? "" : image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://..."
        />
        {state?.fieldErrors?.image && (
          <p className="text-xs text-red-500">{state.fieldErrors.image[0]}</p>
        )}
      </div>

      {/* Giá trị thực gửi lên server (URL hoặc ảnh đã tải) */}
      <input type="hidden" name="image" value={image} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu..." : "Lưu hồ sơ"}
        </Button>
        {state?.success && <span className="text-sm text-green-600">Đã lưu!</span>}
        {state?.error && (
          <span className="text-sm text-red-500">{state.error}</span>
        )}
      </div>
    </form>
  );
}
