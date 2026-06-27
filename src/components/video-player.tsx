"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";

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
}: {
  sources: PlayerSource[];
  movieId: string;
  episodeId?: string | null;
  initialTime?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const source = sources[current];

  // Tải nguồn (HLS qua hls.js, hoặc gán src trực tiếp cho MP4).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source || source.type === "EMBED") return;

    let hls: Hls | null = null;

    if (source.type === "HLS") {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url; // Safari hỗ trợ HLS gốc
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

  // Lưu tiến độ định kỳ + khi rời trang.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const save = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const payload = JSON.stringify({
        movieId,
        episodeId: episodeId ?? null,
        progressSeconds: Math.floor(video.currentTime),
        durationSeconds: Math.floor(video.duration),
      });
      fetch("/api/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    };

    const interval = setInterval(() => {
      if (!video.paused) save();
    }, 15000);
    video.addEventListener("pause", save);
    window.addEventListener("beforeunload", save);

    return () => {
      clearInterval(interval);
      video.removeEventListener("pause", save);
      window.removeEventListener("beforeunload", save);
      save();
    };
  }, [movieId, episodeId]);

  if (!source) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-black text-[var(--color-muted-foreground)]">
        Phim đang được cập nhật nguồn phát.
      </div>
    );
  }

  if (source.type === "EMBED") {
    return (
      <div className="overflow-hidden rounded-lg bg-black">
        <iframe
          src={source.url}
          className="aspect-video w-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div>
      <video
        ref={videoRef}
        controls
        playsInline
        className="aspect-video w-full rounded-lg bg-black"
      />
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
