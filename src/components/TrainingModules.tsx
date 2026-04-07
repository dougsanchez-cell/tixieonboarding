import { useState, useEffect, useRef, useCallback } from "react";
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

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #2D1B69 0%, #7B51D3 50%, #9B6FE8 100%)" }}
      >
        <p className="text-white/80 animate-pulse">Loading modules...</p>
      </div>
    );

  const current = modules[activeModule];
  if (!current) return null;

  const isCompleted = completed.has(current.module_number);
  const hasVideo = !!current.video_url;
  const isSupabase = hasVideo && isSupabaseVideo(current.video_url!);
  const isYT = hasVideo && isYouTubeVideo(current.video_url!);
  const hasQuiz = current.comprehension_questions && current.comprehension_questions.length > 0;

  const supabaseVideoGateMet = isSupabase ? videoComplete.has(current.module_number) : true;
  const ytProgress = ytVideoProgress[current.module_number] || 0;
  const ytVideoGateMet = isYT ? ytProgress >= 100 : true;
  const videoGateMet = supabaseVideoGateMet && ytVideoGateMet;

  const textGateMet = hasVideo ? true : countdown === 0 && hasScrolledBottom;
  const quizGateMet = hasQuiz ? quizPassed.has(current.module_number) : true;
  const canComplete = videoGateMet && textGateMet && hasScrolledBottom && quizGateMet && !isCompleted;

  const showQuizAndComplete = isSupabase ? supabaseVideoGateMet : true;

  const getButtonLabel = () => {
    if (isYT && ytProgress < 100) return `Watch video (${ytProgress}% watched)`;
    if (hasVideo && !hasScrolledBottom) return "Scroll to the end";
    if (!hasVideo && countdown > 0) return `Available in ${countdown}s`;
    if (!hasVideo && !hasScrolledBottom) return "Scroll to the end";
    if (hasQuiz && !quizGateMet) return "Answer all questions correctly";
    return "Mark as Complete ✓";
  };

  const getHintText = () => {
    if (isCompleted) return null;
    if (isYT && ytProgress < 100) return `Video progress: ${ytProgress}% watched — you must watch the full video to continue`;
    if (hasVideo && !hasScrolledBottom) return "Scroll to the end to continue";
    if (!hasVideo && countdown > 0) return null;
    if (!hasVideo && !hasScrolledBottom) return "Scroll to the end to continue";
    if (hasQuiz && !quizGateMet) return "Answer all comprehension questions correctly to continue";
    return null;
  };

  return (
    <div
      className="min-h-screen py-6 px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2D1B69 0%, #7B51D3 50%, #9B6FE8 100%)" }}
    >
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <img
            src="/lovable-uploads/7f1e5a1b-2b57-4107-b737-9e6a43210ccc.png"
            alt="Tixie"
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-xl font-bold text-white">Module Training 📚</h1>
            <p className="text-white/70 text-xs">Complete all modules to unlock the AI assistant</p>
          </div>
        </div>

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
                className={`relative flex items-center gap-2 p-3 rounded-xl text-left transition-all text-sm ${
                  active
                    ? "bg-white text-[#7B51D3] font-semibold shadow-lg"
                    : done
                    ? "bg-green-500/90 text-white font-medium cursor-pointer"
                    : accessible
                    ? "bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer backdrop-blur-sm"
                    : "bg-white/5 text-white/40 cursor-not-allowed"
                }`}
                style={active ? { boxShadow: "0 0 20px rgba(123,81,211,0.6)" } : {}}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    done
                      ? "bg-white/20"
                      : active
                      ? "bg-[#7B51D3]/10"
                      : "bg-white/10"
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
                <span className="truncate">{m.abbr}</span>
              </button>
            );
          })}
        </div>

        {/* Module content card */}
        <div className="bg-white rounded-[20px] shadow-2xl overflow-hidden">
          {/* Purple top gradient border */}
          <div className="h-1" style={{ background: "linear-gradient(135deg, #7B51D3, #9B6FE8)" }} />

          <div className="px-6 pt-5 pb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: "#2D1B69" }}>{current.title}</h2>
            <span className="text-sm text-gray-400">{current.duration}</span>
          </div>

          <div ref={cardContentRef} className="max-h-[60vh] overflow-y-auto px-6 pb-6">
            <div className="space-y-6 pt-2">
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
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(ytProgress, 100)}%`,
                            background: "linear-gradient(135deg, #7B51D3, #9B6FE8)",
                          }}
                        />
                      </div>
                      <p className={`text-xs font-semibold ${ytProgress >= 100 ? "text-green-600" : "text-gray-500"}`}>
                        Video progress: {ytProgress}% watched
                        {ytProgress < 100 && " — you must watch the full video to continue"}
                      </p>
                    </div>
                  )}
                </div>
              ) : hasVideo ? (
                <div className="rounded-lg bg-gray-50 flex items-center justify-center py-12 border border-dashed border-gray-200">
                  <div className="text-center text-gray-400">
                    <PlayCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Video walkthrough coming soon</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 flex items-center justify-center py-12 border border-dashed border-gray-200">
                  <div className="text-center text-gray-400">
                    <PlayCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Video walkthrough coming soon</p>
                  </div>
                </div>
              )}

              {/* Sections */}
              {current.sections.map((section, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 mt-1 shrink-0" style={{ color: "#7B51D3" }} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{section.heading}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1 [&_a]:text-[#7B51D3] [&_a]:underline [&_a]:hover:text-[#9B6FE8]" dangerouslySetInnerHTML={{ __html: section.body }} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Comprehension quiz & Mark complete */}
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

                  <div className="pt-4 border-t border-gray-100 space-y-2">
                    {isCompleted ? (
                      <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <Check className="w-5 h-5" />
                        Module completed
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => markComplete(current.module_number)}
                          disabled={!canComplete}
                          className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden group"
                          style={{
                            background: canComplete
                              ? "linear-gradient(135deg, #7B51D3, #9B6FE8)"
                              : "#94a3b8",
                          }}
                        >
                          <span className="relative z-10">{getButtonLabel()}</span>
                          {canComplete && (
                            <span
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{
                                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,.25) 50%, transparent 60%)",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 1.5s infinite",
                              }}
                            />
                          )}
                        </button>
                        {getHintText() && (
                          <p className="text-sm text-gray-400">{getHintText()}</p>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress counter pill */}
        <div className="mt-5 flex justify-center">
          <div
            className="px-5 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "rgba(45,27,105,.7)", backdropFilter: "blur(8px)" }}
          >
            {completed.size} of {modules.length} modules completed 🎯
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default TrainingModules;
