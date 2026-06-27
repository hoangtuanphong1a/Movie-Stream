"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Reply as ReplyIcon, Send } from "lucide-react";
import { postComment, deleteComment } from "@/server/actions/user";

type CUser = { id: string; name: string | null; image: string | null };
type CItem = {
  id: string;
  content: string;
  createdAt: string | Date;
  userId: string;
  user: CUser;
};
type CThread = CItem & { replies: CItem[] };

function Avatar({ user, size = 36 }: { user: CUser; size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]"
      style={{ width: size, height: size }}
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ""} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-sm font-bold text-[var(--color-muted-foreground)]">
          {(user.name ?? "U").charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentSection({
  comments,
  movieId,
  slug,
  currentUserId,
  isAdmin,
  isLoggedIn,
}: {
  comments: CThread[];
  movieId: string;
  slug: string;
  currentUserId?: string | null;
  isAdmin?: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const total = comments.reduce((s, c) => s + 1 + c.replies.length, 0);
  const canManage = (uid: string) => Boolean(isAdmin) || uid === currentUserId;

  const send = (content: string, parentId: string | null, after: () => void) => {
    if (!content.trim() || pending) return;
    setErr(null);
    start(async () => {
      const r = await postComment({ movieId, slug, content, parentId });
      if (r.error) setErr(r.error);
      else {
        after();
        setReplyTo(null);
        router.refresh();
      }
    });
  };
  const removeC = (id: string) =>
    start(async () => {
      await deleteComment(id, slug);
      router.refresh();
    });

  return (
    <div>
      {/* Ô nhập bình luận */}
      {isLoggedIn ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Viết bình luận, trao đổi với người xem khác..."
            className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => send(text, null, () => setText(""))}
              disabled={pending || !text.trim()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send className="size-4" /> Gửi bình luận
            </button>
            {err && <span className="text-sm text-red-500">{err}</span>}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
          <a
            href={`/dang-nhap?callbackUrl=/phim/${slug}`}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Đăng nhập
          </a>{" "}
          để tham gia bình luận.
        </p>
      )}

      {/* Danh sách bình luận */}
      {total === 0 ? (
        <p className="mt-5 text-sm text-[var(--color-muted-foreground)]">
          Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
            >
              <div className="flex gap-3">
                <Avatar user={c.user} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{c.user.name ?? "Người dùng"}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {fmt(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {c.content}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {isLoggedIn && (
                      <button
                        onClick={() => {
                          setReplyTo(replyTo === c.id ? null : c.id);
                          setReplyText("");
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                      >
                        <ReplyIcon className="size-3.5" /> Trả lời
                      </button>
                    )}
                    {canManage(c.userId) && (
                      <button
                        onClick={() => removeC(c.id)}
                        className="inline-flex cursor-pointer items-center gap-1 text-[var(--color-muted-foreground)] transition-colors hover:text-red-500"
                      >
                        <Trash2 className="size-3.5" /> Xóa
                      </button>
                    )}
                  </div>

                  {/* Ô trả lời */}
                  {replyTo === c.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") send(replyText, c.id, () => setReplyText(""));
                        }}
                        autoFocus
                        placeholder="Viết trả lời..."
                        className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                      <button
                        onClick={() => send(replyText, c.id, () => setReplyText(""))}
                        disabled={pending || !replyText.trim()}
                        className="cursor-pointer rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-50"
                      >
                        Gửi
                      </button>
                    </div>
                  )}

                  {/* Trả lời */}
                  {c.replies.length > 0 && (
                    <ul className="mt-3 space-y-3 border-l border-[var(--color-border)] pl-4">
                      {c.replies.map((r) => (
                        <li key={r.id} className="flex gap-3">
                          <Avatar user={r.user} size={28} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium">
                                {r.user.name ?? "Người dùng"}
                              </span>
                              <span className="text-xs text-[var(--color-muted-foreground)]">
                                {fmt(r.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {r.content}
                            </p>
                            {canManage(r.userId) && (
                              <button
                                onClick={() => removeC(r.id)}
                                className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs text-[var(--color-muted-foreground)] transition-colors hover:text-red-500"
                              >
                                <Trash2 className="size-3" /> Xóa
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
