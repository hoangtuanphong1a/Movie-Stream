import { isTmdbConfigured } from "@/lib/tmdb";
import { TmdbImport } from "@/components/admin/tmdb-import";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  const configured = isTmdbConfigured();

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">Import phim từ TMDB</h1>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
        Tìm phim trên TMDB và nhập metadata vào hệ thống. Phim sau khi import ở
        trạng thái <strong>Nháp</strong> — hãy thêm nguồn phát rồi xuất bản.
      </p>

      {configured ? (
        <TmdbImport />
      ) : (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm">
          <p className="font-medium text-yellow-400">
            Chưa cấu hình TMDB API Key
          </p>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Đăng ký miễn phí tại{" "}
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-primary)] hover:underline"
            >
              themoviedb.org
            </a>
            , rồi thêm vào file <code>.env</code>:
          </p>
          <pre className="mt-2 rounded bg-black/40 p-3 text-xs">
            TMDB_API_KEY=&quot;your_api_key_here&quot;
          </pre>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Khởi động lại server sau khi cập nhật <code>.env</code>.
          </p>
        </div>
      )}
    </div>
  );
}
