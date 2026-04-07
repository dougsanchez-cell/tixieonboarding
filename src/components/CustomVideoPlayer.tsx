import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Maximize, AlertTriangle } from "lucide-react";

interface CustomVideoPlayerProps {
  src: string;
  moduleNumber: number;
  maxReached: number;
  onMaxReachedChange: (moduleNumber: number, time: number) => void;
  onComplete: () => void;
  isComplete: boolean;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const CustomVideoPlayer = ({
  src,
  moduleNumber,
  maxReached,
  onMaxReachedChange,
  onComplete,
  isComplete,
}: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const maxRef = useRef(maxReached);

  useEffect(() => {
    maxRef.current = maxReached;
  }, [maxReached]);

  // Auto-pause helper
  const autoPause = useCallback(() => {
    const v = videoRef.current;
    if (v && !v.paused) {
      v.pause();
      setPlaying(false);
      setAutoPaused(true);
    }
  }, []);

  // 1. Page Visibility API
  useEffect(() => {
    const handler = () => {
      if (document.hidden) autoPause();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [autoPause]);

  // 2. Window blur
  useEffect(() => {
    const handler = () => autoPause();
    window.addEventListener("blur", handler);
    return () => window.removeEventListener("blur", handler);
  }, [autoPause]);

  // 3. IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.5) autoPause();
      },
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPause]);

  // Restore position when mounting or switching back
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      setDuration(v.duration);
      if (maxReached > 0) {
        v.currentTime = maxReached;
      }
    };
    v.addEventListener("loadedmetadata", onLoaded);
    if (v.readyState >= 1) onLoaded();
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pause on unmount
  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  // Block seeking
  const handleSeeking = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime > maxRef.current + 0.1) {
      v.currentTime = maxRef.current;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    const newMax = Math.max(maxRef.current, v.currentTime);
    if (newMax > maxRef.current) {
      maxRef.current = newMax;
      onMaxReachedChange(moduleNumber, newMax);
    }
    if (v.duration > 0 && newMax / v.duration >= 0.99 && !isComplete) {
      onComplete();
    }
  }, [moduleNumber, onMaxReachedChange, onComplete, isComplete]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setAutoPaused(false);
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleResume = () => {
    const v = videoRef.current;
    if (!v) return;
    setAutoPaused(false);
    v.play();
    setPlaying(true);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  const pct = duration > 0 ? Math.min((maxReached / duration) * 100, 100) : 0;
  const watchedPct = Math.floor(pct);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-[#0D0E1A] group"
        style={{ position: "relative", paddingBottom: "56.25%", width: "100%" }}
      >
        <video
          ref={videoRef}
          src={src}
          className="absolute top-0 left-0 w-full h-full object-contain bg-[#0D0E1A]"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onPlay={() => { setPlaying(true); setAutoPaused(false); }}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          playsInline
        />

        {/* Auto-paused overlay */}
        {autoPaused && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4"
               style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
            <AlertTriangle className="w-12 h-12 text-[hsl(var(--primary))]" />
            <p className="text-sm text-center px-4" style={{ color: "hsl(var(--foreground))" }}>
              Video paused — return to this tab to continue watching
            </p>
            <button
              onClick={handleResume}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: "hsl(var(--primary))", color: "#fff" }}
            >
              Resume
            </button>
          </div>
        )}

        {/* Center play overlay (only when manually paused, not auto-paused) */}
        {!playing && !autoPaused && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                 style={{ backgroundColor: "hsl(var(--primary))" }}>
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
          </button>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20"
             style={{ backgroundColor: "rgba(13,14,26,0.9)" }}>
          <button onClick={togglePlay} className="text-white hover:text-[hsl(var(--primary))] transition-colors">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <span className="text-xs font-mono min-w-[90px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer relative"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            onClick={(e) => {
              const v = videoRef.current;
              if (!v || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPct = (e.clientX - rect.left) / rect.width;
              const clickTime = clickPct * duration;
              if (clickTime <= maxRef.current) {
                v.currentTime = clickTime;
              }
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: "hsl(var(--primary))" }}
            />
            {/* Max reached indicator dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow"
              style={{ left: `${pct}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>

          <button onClick={toggleFullscreen} className="text-white hover:text-[hsl(var(--primary))] transition-colors">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isComplete && (
        <p className={`text-xs ${watchedPct >= 99 ? "text-success" : "text-muted-foreground"}`}>
          {watchedPct >= 99
            ? "Video complete ✓ — answer the questions below to continue"
            : `Watched: ${watchedPct}% — you must watch the full video to continue — you can rewind to review any section`}
        </p>
      )}
    </div>
  );
};

export default CustomVideoPlayer;
