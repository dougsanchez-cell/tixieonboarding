import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Maximize, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomVideoPlayerProps {
  src: string;
  moduleNumber: number;
  maxReached: number;
  onMaxReachedChange: (moduleNumber: number, time: number) => void;
  onComplete: () => void;
  isComplete: boolean;
  demoMode?: boolean;
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
  demoMode = false,
}: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const maxRef = useRef(maxReached);
  const isMobile = useIsMobile();

  useEffect(() => {
    maxRef.current = maxReached;
  }, [maxReached]);

  // Auto-hide controls on mobile
  const showControlsTemporarily = useCallback(() => {
    if (!isMobile) return;
    setControlsVisible(true);
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (playing) setControlsVisible(false);
    }, 3000);
  }, [isMobile, playing]);

  useEffect(() => {
    return () => clearTimeout(hideTimeoutRef.current);
  }, []);

  // Auto-pause helper
  const autoPause = useCallback(() => {
    if (demoMode) return;
    const v = videoRef.current;
    if (v && !v.paused) {
      v.pause();
      setPlaying(false);
      setAutoPaused(true);
    }
  }, [demoMode]);

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

  // Block seeking forward past maxReached (disabled in demo mode)
  const handleSeeking = useCallback(() => {
    if (demoMode) return;
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime > maxRef.current + 0.1) {
      v.currentTime = maxRef.current;
    }
  }, [demoMode]);

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

  const handleContainerTap = () => {
    if (isMobile) {
      if (controlsVisible) {
        setControlsVisible(false);
        clearTimeout(hideTimeoutRef.current);
      } else {
        showControlsTemporarily();
      }
    }
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
  const playPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const watchedPct = Math.floor(pct);
  const showControls = isMobile ? controlsVisible : true;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-[hsl(var(--background))]"
        style={{ position: "relative", paddingBottom: "56.25%", width: "100%" }}
        onClick={handleContainerTap}
      >
        <video
          ref={videoRef}
          src={src}
          className="absolute top-0 left-0 w-full h-full object-contain bg-[hsl(var(--background))]"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onPlay={() => { setPlaying(true); setAutoPaused(false); }}
          onPause={() => { setPlaying(false); if (isMobile) setControlsVisible(true); }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          playsInline
        />

        {/* Auto-paused overlay */}
        {autoPaused && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4"
               style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
            <AlertTriangle className="w-12 h-12 text-primary" />
            <p className="text-sm text-center px-4 text-foreground">
              Video paused — return to this tab to continue watching
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleResume(); }}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors bg-primary text-primary-foreground"
            >
              Resume
            </button>
          </div>
        )}

        {/* Center play overlay (only when manually paused, not auto-paused) */}
        {!playing && !autoPaused && (
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform bg-primary">
              <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </button>
        )}

        {/* Bottom controls — always visible (desktop) or toggle on tap (mobile) */}
        <div
          className={`absolute bottom-0 left-0 right-0 px-3 py-2 z-20 transition-opacity duration-200 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          style={{ backgroundColor: "rgba(13,14,26,0.9)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-primary-foreground hover:text-primary transition-colors">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <span className="text-xs font-mono min-w-[90px] text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Progress bar container with extra tap padding */}
            <div
              className="flex-1 py-2 cursor-pointer relative"
              onClick={(e) => {
                const v = videoRef.current;
                if (!v || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPct = (e.clientX - rect.left) / rect.width;
                const clickTime = clickPct * duration;
                if (clickTime <= maxRef.current) {
                  v.currentTime = clickTime;
                }
                if (isMobile) showControlsTemporarily();
              }}
            >
              <div className="h-2 rounded-full relative" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                {/* Max reached fill */}
                <div
                  className="h-full rounded-full absolute top-0 left-0"
                  style={{ width: `${pct}%`, backgroundColor: "hsl(var(--primary) / 0.4)" }}
                />
                {/* Current playback position fill */}
                <div
                  className="h-full rounded-full absolute top-0 left-0 transition-all duration-150"
                  style={{ width: `${playPct}%`, backgroundColor: "hsl(var(--primary))" }}
                />
              </div>
              {/* Max reached indicator dot — positioned outside overflow-hidden */}
              <div
                className="absolute top-1/2 w-3 h-3 rounded-full bg-primary-foreground shadow"
                style={{ left: `${pct}%`, transform: "translate(-50%, -50%)" }}
              />
            </div>

            <button onClick={toggleFullscreen} className="text-primary-foreground hover:text-primary transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">← tap bar to rewind</p>
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
