import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, PlayCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Section {
  heading: string;
  body: string;
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
}

interface TrainingModulesProps {
  onComplete: () => void;
}

const TrainingModules = ({ onComplete }: TrainingModulesProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

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
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

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

  return (
    <div className="px-4 max-w-4xl mx-auto animate-fade-in">
      {/* Module tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {modules.map((m, i) => {
          const done = completed.has(m.module_number);
          const active = i === activeModule;
          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(i)}
              className={`relative flex items-center gap-2 p-3 rounded-lg border text-left transition-all text-sm ${
                active
                  ? "border-primary bg-secondary shadow-sm"
                  : done
                  ? "border-success/30 bg-success-light"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  done ? "bg-success text-success-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : `0${m.module_number}`}
              </span>
              <span className="font-medium truncate">{m.abbr}</span>
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
        <CardContent className="space-y-6">
          {/* Video placeholder */}
          <div className="rounded-lg bg-muted flex items-center justify-center py-12 border border-dashed border-border">
            <div className="text-center text-muted-foreground">
              <PlayCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Video walkthrough coming soon</p>
            </div>
          </div>

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

          {/* Mark complete button */}
          <div className="pt-4 border-t">
            {completed.has(current.module_number) ? (
              <div className="flex items-center gap-2 text-success font-medium">
                <Check className="w-5 h-5" />
                Module completed
              </div>
            ) : (
              <Button onClick={() => markComplete(current.module_number)} className="w-full sm:w-auto">
                Mark as Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-4">
        {completed.size} of {modules.length} modules completed
      </p>
    </div>
  );
};

export default TrainingModules;
