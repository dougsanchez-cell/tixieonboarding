import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Maximize } from "lucide-react";

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
  const maxRef = useRef(maxReached);

  // Keep maxRef in sync with prop
  useEffect(() => {
    maxRef.current = maxReached;
  }, [maxReached]);

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

  // Pause on unmount / tab switch
  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  // Block seeking
  const handleSeeking = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime > maxRef.current + 1) {
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
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
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
  const watchedPct = Math.floor(pct);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-[#1a1a2e] group"
        style={{ position: "relative", paddingBottom: "56.25%", width: "100%" }}
      >
        <video
          ref={videoRef}
          src={src}
          className="absolute top-0 left-0 w-full h-full object-contain bg-[#1a1a2e]"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          playsInline
        />

        {/* Center play/pause overlay */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="w-16 h-16 rounded-full bg-[#7B51D3] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
          </button>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e]/90 px-3 py-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button onClick={togglePlay} className="text-white hover:text-[#7B51D3] transition-colors">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <span className="text-xs text-white/70 font-mono min-w-[90px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Progress bar (display only) */}
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden pointer-events-none">
            <div
              className="h-full bg-[#7B51D3] rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <button onClick={toggleFullscreen} className="text-white hover:text-[#7B51D3] transition-colors">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress text */}
      {!isComplete && (
        <p className={`text-xs ${watchedPct >= 99 ? "text-success" : "text-muted-foreground"}`}>
          {watchedPct >= 99
            ? "Video complete ✓ — answer the questions below to continue"
            : `Watched: ${watchedPct}% — you must watch the full video to continue`}
        </p>
      )}
    </div>
  );
};

export default CustomVideoPlayer;
