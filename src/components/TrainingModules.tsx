import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, PlayCircle, BookOpen, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import ComprehensionQuiz from "@/components/ComprehensionQuiz";

interface Section {
  heading: string;
  body: string;
}

interface CompQuestion {
  q: string;
  options: string[];
  correct: number;
}

interface Module {
  id: number;
  module_number: number;
  title: string;
  abbr: string;
  accent: string | null;
  light: string | null;
  duration: string | null;
  video_url: string | null;
  sections: Section[];
  comprehension_questions: CompQuestion[];
}

interface TrainingModulesProps {
  onComplete: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Load YT IFrame API once
let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYTApi(cb: () => void) {
  if (ytApiReady) { cb(); return; }
  ytReadyCallbacks.push(cb);
  if (ytApiLoaded) return;
  ytApiLoaded = true;
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    prev?.();
    ytReadyCallbacks.forEach((fn) => fn());
    ytReadyCallbacks.length = 0;
  };
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

const VIDEO_THRESHOLD = 80; // percent

const TrainingModules = ({ onComplete }: TrainingModulesProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [hasScrolledBottom, setHasScrolledBottom] = useState(false);
  const [videoProgress, setVideoProgress] = useState<Record<number, number>>({});
  const [quizPassed, setQuizPassed] = useState<Set<number>>(new Set());
  const cardContentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerDivId = "yt-player-container";

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("content_modules")
        .select("*")
        .order("module_number");
      if (error) {
        toast.error("Failed to load training modules");
        return;
      }
      setModules(
        (data || []).map((m) => ({
          ...m,
          sections: (m.sections as unknown as Section[]) || [],
          comprehension_questions: (m.comprehension_questions as unknown as CompQuestion[]) || [],
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  // Extract YouTube video ID from embed URL
  const getVideoId = (url: string): string | null => {
    const match = url.match(/\/embed\/([^?/]+)/);
    return match ? match[1] : null;
  };

  // Initialize / re-initialize YT player when active module changes
  useEffect(() => {
    if (modules.length === 0) return;
    const current = modules[activeModule];
    if (!current?.video_url || completed.has(current.module_number)) {
      // Destroy player & stop polling for non-video modules
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
      return;
    }

    const videoId = getVideoId(current.video_url);
    if (!videoId) return;

    // Clean up previous
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }

    const moduleNum = current.module_number;

    loadYTApi(() => {
      // Small delay to ensure the DOM div exists
      setTimeout(() => {
        const el = document.getElementById(playerDivId);
        if (!el) return;

        playerRef.current = new window.YT.Player(playerDivId, {
          videoId,
          playerVars: {
            enablejsapi: 1,
            origin: "https://tixieonboarding.lovable.app",
            rel: 0,
          },
          events: {
            onReady: () => {
              // Start polling
              pollRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p?.getCurrentTime || !p?.getDuration) return;
                const dur = p.getDuration();
                if (dur <= 0) return;
                const pct = Math.round((p.getCurrentTime() / dur) * 100);
                setVideoProgress((prev) => ({
                  ...prev,
                  [moduleNum]: Math.max(prev[moduleNum] || 0, pct),
                }));
              }, 2000);
            },
          },
        });
      }, 100);
    });

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [activeModule, modules, completed]);

  // Timer & scroll gate for NON-video modules only
  useEffect(() => {
    if (modules.length === 0) return;
    const current = modules[activeModule];
    if (!current || completed.has(current.module_number)) {
      setCountdown(0);
      setHasScrolledBottom(true);
      return;
    }

    // Video modules don't use timer gate
    if (current.video_url) {
      setCountdown(0);
      setHasScrolledBottom(false);
      return;
    }

    const duration = 90;
    setCountdown(duration);
    setHasScrolledBottom(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeModule, modules, completed]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const el = cardContentRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) setHasScrolledBottom(true);
  }, []);

  useEffect(() => {
    const el = cardContentRef.current;
    if (!el) return;
    if (el.scrollHeight - el.clientHeight < 100) {
      setHasScrolledBottom(true);
    }
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeModule, handleScroll, loading]);

  const isModuleAccessible = (index: number): boolean => {
    if (index === activeModule) return true;
    const mod = modules[index];
    if (!mod) return false;
    if (completed.has(mod.module_number)) return true;
    for (let i = 0; i < modules.length; i++) {
      if (!completed.has(modules[i].module_number)) {
        return i === index;
      }
    }
    return false;
  };

  const markComplete = (moduleNum: number) => {
    const next = new Set(completed);
    next.add(moduleNum);
    setCompleted(next);
    if (next.size === modules.length) {
      setTimeout(() => onComplete(), 600);
    } else {
      const nextIncomplete = modules.find((m) => !next.has(m.module_number));
      if (nextIncomplete) setActiveModule(modules.indexOf(nextIncomplete));
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading modules...</div>;

  const current = modules[activeModule];
  if (!current) return null;

  const isCompleted = completed.has(current.module_number);
  const hasVideo = !!current.video_url;
  const currentVideoProgress = videoProgress[current.module_number] || 0;
  const videoGateMet = hasVideo ? currentVideoProgress >= VIDEO_THRESHOLD : true;
  const textGateMet = hasVideo ? true : countdown === 0 && hasScrolledBottom;
  const hasQuiz = current.comprehension_questions && current.comprehension_questions.length > 0;
  const quizGateMet = hasQuiz ? quizPassed.has(current.module_number) : true;
  const canComplete = videoGateMet && textGateMet && hasScrolledBottom && quizGateMet && !isCompleted;

  // For video modules, also require scroll to bottom
  const getButtonLabel = () => {
    if (hasVideo) {
      if (currentVideoProgress < VIDEO_THRESHOLD) return `Watch video (${currentVideoProgress}% / ${VIDEO_THRESHOLD}%)`;
      if (!hasScrolledBottom) return "Scroll to the end";
      return "Mark as Complete";
    }
    if (countdown > 0) return `Available in ${countdown}s`;
    return "Mark as Complete";
  };

  const getHintText = () => {
    if (isCompleted) return null;
    if (hasVideo && currentVideoProgress < VIDEO_THRESHOLD) {
      return `Video progress: ${currentVideoProgress}% watched — watch at least ${VIDEO_THRESHOLD}% to continue`;
    }
    if (hasVideo && !hasScrolledBottom) {
      return "Scroll to the end to continue";
    }
    if (!hasVideo && countdown === 0 && !hasScrolledBottom) {
      return "Scroll to the end to continue";
    }
    return null;
  };

  return (
    <div className="px-4 max-w-4xl mx-auto animate-fade-in">
      {/* Module tabs */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {modules.map((m, i) => {
          const done = completed.has(m.module_number);
          const active = i === activeModule;
          const accessible = isModuleAccessible(i);
          return (
            <button
              key={m.id}
              onClick={() => accessible && setActiveModule(i)}
              disabled={!accessible}
              className={`relative flex items-center gap-2 p-3 rounded-lg border text-left transition-all text-sm ${
                active
                  ? "border-primary bg-secondary shadow-sm"
                  : done
                  ? "border-success/30 bg-success-light cursor-pointer"
                  : accessible
                  ? "border-border bg-card hover:bg-accent cursor-pointer"
                  : "border-border/50 bg-muted/50 opacity-50 cursor-not-allowed"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  done
                    ? "bg-success text-success-foreground"
                    : accessible
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" />
                ) : !accessible ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  `0${m.module_number}`
                )}
              </span>
              <span className={`font-medium truncate ${!accessible && !done ? "text-muted-foreground" : ""}`}>
                {m.abbr}
              </span>
            </button>
          );
        })}
      </div>

      {/* Module content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{current.title}</CardTitle>
            <span className="text-sm text-muted-foreground">{current.duration}</span>
          </div>
        </CardHeader>
        <div
          ref={cardContentRef}
          className="max-h-[60vh] overflow-y-auto"
        >
          <CardContent className="space-y-6">
            {/* Video */}
            {hasVideo ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden" style={{ position: "relative", paddingBottom: "56.25%", width: "100%" }}>
                  <div
                    id={playerDivId}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  />
                </div>
                {!isCompleted && (
                  <div className="space-y-1.5">
                    <Progress value={Math.min(currentVideoProgress, 100)} className="h-2" />
                    <p className={`text-xs ${currentVideoProgress >= VIDEO_THRESHOLD ? "text-success" : "text-muted-foreground"}`}>
                      Video progress: {currentVideoProgress}% watched
                      {currentVideoProgress < VIDEO_THRESHOLD && ` — watch at least ${VIDEO_THRESHOLD}% to continue`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-muted flex items-center justify-center py-12 border border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <PlayCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Video walkthrough coming soon</p>
                </div>
              </div>
            )}

            {/* Sections */}
            {current.sections.map((section, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 mt-1 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">{section.heading}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{section.body}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Comprehension quiz */}
            {hasQuiz && !isCompleted && (
              <ComprehensionQuiz
                questions={current.comprehension_questions}
                moduleNumber={current.module_number}
                passed={quizPassed.has(current.module_number)}
                onPass={() => setQuizPassed(prev => new Set(prev).add(current.module_number))}
              />
            )}

            {/* Mark complete button */}
            <div className="pt-4 border-t space-y-2">
              {isCompleted ? (
                <div className="flex items-center gap-2 text-success font-medium">
                  <Check className="w-5 h-5" />
                  Module completed
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => markComplete(current.module_number)}
                    disabled={!canComplete}
                    className="w-full sm:w-auto"
                  >
                    {getButtonLabel()}
                  </Button>
                  {getHintText() && (
                    <p className="text-sm text-muted-foreground">{getHintText()}</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-4">
        {completed.size} of {modules.length} modules completed
      </p>
    </div>
  );
};

export default TrainingModules;
