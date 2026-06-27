"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type PlayerSource = {
  id: string;
  label: string | null;
  url: string;
  type: "MP4" | "HLS" | "EMBED";
};

export function VideoPlayer({
  sources,
  movieId,
  episodeId,
  initialTime = 0,
  trackProgress = true,
}: {
  sources: PlayerSource[];
  movieId: string;
  episodeId?: string | null;
  initialTime?: number;
  /** Chỉ lưu tiến độ xem khi đã đăng nhập. */
  trackProgress?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const source = sources[current];

  // Gửi tiến độ xem lên server (dùng chung cho cả <video> và YouTube).
  const saveProgress = useCallback(
    (progress: number, duration: number) => {
      if (!trackProgress || !duration || Number.isNaN(duration)) return;
      fetch("/api/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          episodeId: episodeId ?? null,
          progressSeconds: Math.floor(progress),
          durationSeconds: Math.floor(duration),
        }),
        keepalive: true,
      }).catch(() => {});
    },
    [trackProgress, movieId, episodeId],
  );

  // ── Nguồn MP4/HLS qua thẻ <video> ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source || source.type === "EMBED") return;

    let hls: Hls | null = null;
    if (source.type === "HLS") {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url;
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(source.url);
        hls.attachMedia(video);
      } else {
        video.src = source.url;
      }
    } else {
      video.src = source.url;
    }

    const restore = () => {
      if (initialTime > 0 && initialTime < (video.duration || Infinity)) {
        video.currentTime = initialTime;
      }
    };
    video.addEventListener("loadedmetadata", restore);
    return () => {
      video.removeEventListener("loadedmetadata", restore);
      hls?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id]);

  // Lưu tiến độ cho <video>.
  useEffect(() => {
    if (!trackProgress) return;
    const video = videoRef.current;
    if (!video || !source || source.type === "EMBED") return;

    const save = () => {
      if (video.duration) saveProgress(video.currentTime, video.duration);
    };
    const interval = setInterval(() => {
      if (!video.paused) save();
    }, 15000);
    video.addEventListener("playing", save); // lưu ngay khi bắt đầu xem
    video.addEventListener("pause", save);
    window.addEventListener("beforeunload", save);
    return () => {
      clearInterval(interval);
      video.removeEventListener("playing", save);
      video.removeEventListener("pause", save);
      window.removeEventListener("beforeunload", save);
      save();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id, trackProgress, saveProgress]);

  // ── Nguồn EMBED (trailer YouTube) qua IFrame API ──
  useEffect(() => {
    if (!source || source.type !== "EMBED") return;
    const videoId = source.url.split("/embed/")[1]?.split(/[?&]/)[0];
    const host = ytHostRef.current;
    if (!videoId || !host) return;

    let player: any = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    host.appendChild(mount);

    const save = () => {
      try {
        const d = player?.getDuration?.();
        const t = player?.getCurrentTime?.();
        if (d) saveProgress(t, d);
      } catch {
        /* ignore */
      }
    };

    const create = () => {
      if (cancelled || !window.YT?.Player) return;
      player = new window.YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            if (initialTime > 0) {
              try {
                e.target.seekTo(initialTime, true);
              } catch {
                /* ignore */
              }
            }
          },
          onStateChange: (e: any) => {
            if (interval) clearInterval(interval);
            if (e.data === 1) {
              // đang phát
              save();
              interval = setInterval(save, 10000);
            } else if (e.data === 2 || e.data === 0) {
              // tạm dừng / kết thúc
              save();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      create();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        create();
      };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    window.addEventListener("beforeunload", save);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      window.removeEventListener("beforeunload", save);
      save();
      try {
        player?.destroy?.();
      } catch {
        /* ignore */
      }
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id, source?.type, source?.url, saveProgress]);

  if (!source) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 text-center">
        <p className="font-medium text-zinc-200">
          Phim này chưa có nguồn phát hợp pháp.
        </p>
        <p className="max-w-md text-sm text-zinc-400">
          Bạn có thể xem các phim có trailer, hoặc vào mục{" "}
          <span className="text-zinc-200">“Phim kinh điển”</span> để xem full miễn phí.
        </p>
      </div>
    );
  }

  return (
    <div>
      {source.type === "EMBED" ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <div ref={ytHostRef} className="h-full w-full" />
        </div>
      ) : (
        <video
          ref={videoRef}
          controls
          playsInline
          className="aspect-video w-full rounded-lg bg-black"
        />
      )}

      {sources.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--color-muted-foreground)]">
            Nguồn:
          </span>
          {sources.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={cn(
                "rounded-md border px-3 py-1 text-sm",
                i === current
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-muted)] hover:border-[var(--color-primary)]",
              )}
            >
              {s.label || `Nguồn ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
