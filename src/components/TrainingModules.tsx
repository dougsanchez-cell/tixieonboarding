import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, PlayCircle, BookOpen, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ComprehensionQuiz from "@/components/ComprehensionQuiz";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";

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

// Load YT IFrame API once (for YouTube URLs)
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

const isSupabaseVideo = (url: string) => url.includes("supabase.co");
const isYouTubeVideo = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");

const TrainingModules = ({ onComplete }: TrainingModulesProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [hasScrolledBottom, setHasScrolledBottom] = useState(false);
  const [videoMaxReached, setVideoMaxReached] = useState<Record<number, number>>({});
  const [videoComplete, setVideoComplete] = useState<Set<number>>(new Set());
  const [quizPassed, setQuizPassed] = useState<Set<number>>(new Set());
  // YT player state for YouTube videos
  const [ytVideoProgress, setYtVideoProgress] = useState<Record<number, number>>({});
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

  // --- YouTube IFrame Player logic (only for YT URLs) ---
  const getVideoId = (url: string): string | null => {
    const match = url.match(/\/embed\/([^?/]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (modules.length === 0) return;
    const current = modules[activeModule];
    if (!current?.video_url || !isYouTubeVideo(current.video_url) || completed.has(current.module_number)) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
      return;
    }

    const videoId = getVideoId(current.video_url);
    if (!videoId) return;

    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }

    const moduleNum = current.module_number;

    loadYTApi(() => {
      setTimeout(() => {
        const el = document.getElementById(playerDivId);
        if (!el) return;
        playerRef.current = new window.YT.Player(playerDivId, {
          videoId,
          playerVars: { enablejsapi: 1, origin: "https://tixieonboarding.lovable.app", rel: 0 },
          events: {
            onReady: () => {
              pollRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p?.getCurrentTime || !p?.getDuration) return;
                const dur = p.getDuration();
                if (dur <= 0) return;
                const pct = Math.round((p.getCurrentTime() / dur) * 100);
                setYtVideoProgress((prev) => ({ ...prev, [moduleNum]: Math.max(prev[moduleNum] || 0, pct) }));
              }, 2000);
            },
          },
        });
      }, 100);
    });

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
    };
  }, [activeModule, modules, completed]);

  // Timer & scroll gate for text-only modules (no video)
  useEffect(() => {
    if (modules.length === 0) return;
    const current = modules[activeModule];
    if (!current || completed.has(current.module_number)) {
      setCountdown(0);
      setHasScrolledBottom(true);
      return;
    }

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
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) setHasScrolledBottom(true);
  }, []);

  useEffect(() => {
    const el = cardContentRef.current;
    if (!el) return;
    if (el.scrollHeight - el.clientHeight < 100) setHasScrolledBottom(true);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeModule, handleScroll, loading]);

  const isModuleAccessible = (index: number): boolean => {
    if (index === activeModule) return true;
    const mod = modules[index];
    if (!mod) return false;
    if (completed.has(mod.module_number)) return true;
    for (let i = 0; i < modules.length; i++) {
      if (!completed.has(modules[i].module_number)) return i === index;
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

  const handleMaxReachedChange = useCallback((moduleNumber: number, time: number) => {
    setVideoMaxReached((prev) => ({
      ...prev,
      [moduleNumber]: Math.max(prev[moduleNumber] || 0, time),
    }));
  }, []);

  const handleVideoComplete = useCallback((moduleNumber: number) => {
    setVideoComplete((prev) => new Set(prev).add(moduleNumber));
  }, []);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading modules...</div>;

  const current = modules[activeModule];
  if (!current) return null;

  const isCompleted = completed.has(current.module_number);
  const hasVideo = !!current.video_url;
  const isSupabase = hasVideo && isSupabaseVideo(current.video_url!);
  const isYT = hasVideo && isYouTubeVideo(current.video_url!);
  const hasQuiz = current.comprehension_questions && current.comprehension_questions.length > 0;

  // Video gate
  const supabaseVideoGateMet = isSupabase ? videoComplete.has(current.module_number) : true;
  const ytProgress = ytVideoProgress[current.module_number] || 0;
  const ytVideoGateMet = isYT ? ytProgress >= 80 : true;
  const videoGateMet = supabaseVideoGateMet && ytVideoGateMet;

  const textGateMet = hasVideo ? true : countdown === 0 && hasScrolledBottom;
  const quizGateMet = hasQuiz ? quizPassed.has(current.module_number) : true;
  const canComplete = videoGateMet && textGateMet && hasScrolledBottom && quizGateMet && !isCompleted;

  // For supabase video modules, hide quiz & complete until video is done
  const showQuizAndComplete = isSupabase ? supabaseVideoGateMet : true;

  const getButtonLabel = () => {
    if (isYT && ytProgress < 80) return `Watch video (${ytProgress}% / 80%)`;
    if (hasVideo && !hasScrolledBottom) return "Scroll to the end";
    if (!hasVideo && countdown > 0) return `Available in ${countdown}s`;
    if (!hasVideo && !hasScrolledBottom) return "Scroll to the end";
    if (hasQuiz && !quizGateMet) return "Answer all questions correctly";
    return "Mark as Complete";
  };

  const getHintText = () => {
    if (isCompleted) return null;
    if (isYT && ytProgress < 80) return `Video progress: ${ytProgress}% watched — watch at least 80% to continue`;
    if (hasVideo && !hasScrolledBottom) return "Scroll to the end to continue";
    if (!hasVideo && countdown > 0) return null;
    if (!hasVideo && !hasScrolledBottom) return "Scroll to the end to continue";
    if (hasQuiz && !quizGateMet) return "Answer all comprehension questions correctly to continue";
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
        <div ref={cardContentRef} className="max-h-[60vh] overflow-y-auto">
          <CardContent className="space-y-6">
            {/* Video */}
            {isSupabase ? (
              <CustomVideoPlayer
                src={current.video_url!}
                moduleNumber={current.module_number}
                maxReached={videoMaxReached[current.module_number] || 0}
                onMaxReachedChange={handleMaxReachedChange}
                onComplete={() => handleVideoComplete(current.module_number)}
                isComplete={videoComplete.has(current.module_number)}
              />
            ) : isYT ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden" style={{ position: "relative", paddingBottom: "56.25%", width: "100%" }}>
                  <div
                    id={playerDivId}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  />
                </div>
                {!isCompleted && (
                  <div className="space-y-1.5">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(ytProgress, 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs ${ytProgress >= 80 ? "text-success" : "text-muted-foreground"}`}>
                      Video progress: {ytProgress}% watched
                      {ytProgress < 80 && ` — watch at least 80% to continue`}
                    </p>
                  </div>
                )}
              </div>
            ) : hasVideo ? (
              <div className="rounded-lg bg-muted flex items-center justify-center py-12 border border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <PlayCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Video walkthrough coming soon</p>
                </div>
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
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1 [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80" dangerouslySetInnerHTML={{ __html: section.body }} />
                  </div>
                </div>
              </div>
            ))}

            {/* Comprehension quiz & Mark complete — hidden until video done for supabase videos */}
            {showQuizAndComplete && (
              <>
                {hasQuiz && !isCompleted && (
                  <ComprehensionQuiz
                    questions={current.comprehension_questions}
                    moduleNumber={current.module_number}
                    passed={quizPassed.has(current.module_number)}
                    onPass={() => setQuizPassed((prev) => new Set(prev).add(current.module_number))}
                  />
                )}

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
              </>
            )}
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
