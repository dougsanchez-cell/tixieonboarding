import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Award, BookOpen, ShieldCheck, Mail, Terminal, Clock, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CompletionStepProps {
  name: string;
  email: string;
  score: number;
  contractorId: string;
}

const CompletionStep = ({ name, email, score, contractorId }: CompletionStepProps) => {
  const firstName = name.split(" ")[0];

  useEffect(() => {
    // Trigger notification edge function
    supabase.functions.invoke("notify-ops", {
      body: { contractorId, name, email, score },
    }).catch(() => {});
  }, [contractorId, name, email, score]);

  return (
    <div className="px-4 max-w-2xl mx-auto animate-fade-in text-center">
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-success-light mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">{firstName}, you're cleared for Tixie</h1>
        <p className="text-muted-foreground mt-2">
          You passed with a score of {score}%. Your status has been updated and the ops team has been notified.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="border-success/30 bg-success-light">
          <CardContent className="py-4 text-center">
            <Award className="w-6 h-6 text-success mx-auto mb-1" />
            <div className="text-2xl font-bold text-success">{score}%</div>
            <div className="text-xs text-muted-foreground">Quiz Score</div>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success-light">
          <CardContent className="py-4 text-center">
            <BookOpen className="w-6 h-6 text-success mx-auto mb-1" />
            <div className="text-2xl font-bold text-success">4/4</div>
            <div className="text-xs text-muted-foreground">Modules</div>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success-light">
          <CardContent className="py-4 text-center">
            <ShieldCheck className="w-6 h-6 text-success mx-auto mb-1" />
            <div className="text-lg font-bold text-success">Cleared</div>
            <div className="text-xs text-muted-foreground">Status</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-6">
          <h2 className="font-semibold text-lg mb-4">What happens next</h2>
          <div className="space-y-3 text-left text-sm">
            <div className="flex gap-3 items-start">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>Check <strong>{email}</strong> for your Tixie login credentials</span>
            </div>
            <div className="flex gap-3 items-start">
              <Terminal className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>Install Tixie via Terminal if you haven't already (Module 1)</span>
            </div>
            <div className="flex gap-3 items-start">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>Sessions run Mon–Fri, 6:00 AM – 12:00 PM PST, max 1 hour</span>
            </div>
            <div className="flex gap-3 items-start">
              <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>Questions? Reach out to the Jomero team</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletionStep;
