"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, type SelectOption } from "@/components/ui/select";

export function BrowseFilters({ years }: { years: number[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const cur = (k: string) => sp.get(k) ?? "";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("trang"); // về trang 1 khi đổi bộ lọc
    const qs = next.toString();
    router.push(`/duyet${qs ? `?${qs}` : ""}`);
  };

  const yearOpts: SelectOption[] = [
    { value: "", label: "Tất cả năm" },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];
  const typeOpts: SelectOption[] = [
    { value: "", label: "Phim lẻ & bộ" },
    { value: "MOVIE", label: "Phim lẻ" },
    { value: "TV", label: "Phim bộ" },
  ];
  const sortOpts: SelectOption[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "rating", label: "Điểm cao" },
    { value: "title", label: "Tên A→Z" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Select
        className="w-32"
        ariaLabel="Năm"
        placeholder="Tất cả năm"
        value={cur("nam")}
        options={yearOpts}
        onValueChange={(v) => update("nam", v)}
      />
      <Select
        className="w-40"
        ariaLabel="Loại phim"
        placeholder="Phim lẻ & bộ"
        value={cur("loai")}
        options={typeOpts}
        onValueChange={(v) => update("loai", v)}
      />
      <Select
        className="w-40"
        ariaLabel="Sắp xếp"
        value={cur("sap-xep") || "newest"}
        options={sortOpts}
        onValueChange={(v) => update("sap-xep", v)}
      />
    </div>
  );
}
