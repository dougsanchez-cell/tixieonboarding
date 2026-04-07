import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Download, Save, Users, BookOpen, HelpCircle, Settings, Bot } from "lucide-react";
import TixieHeader from "@/components/TixieHeader";
import type { Session } from "@supabase/supabase-js";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  quiz_score: number | null;
  quiz_attempts: number;
  created_at: string;
  completed_at: string | null;
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
  duration: string | null;
  video_url: string | null;
  sections: { heading: string; body: string }[];
  comprehension_questions: CompQuestion[];
}

interface QuizQ {
  id: number;
  question_number: number;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [logging, setLogging] = useState(false);
  const [checking, setChecking] = useState(true);

  // Data
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [passThreshold, setPassThreshold] = useState("80");
  const [opsEmail, setOpsEmail] = useState("ops@jomero.com");
  const [minQuestions, setMinQuestions] = useState("2");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setChecking(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    loadAll();
  }, [session]);

  const loadAll = async () => {
    const [cRes, mRes, qRes, cfgRes] = await Promise.all([
      supabase.from("contractors").select("*").order("created_at", { ascending: false }),
      supabase.from("content_modules").select("*").order("module_number"),
      supabase.from("quiz_questions").select("*").order("question_number"),
      supabase.from("app_config").select("*"),
    ]);
    if (cRes.data) setContractors(cRes.data as Contractor[]);
    if (mRes.data) setModules(mRes.data.map(m => ({ ...m, sections: m.sections as unknown as { heading: string; body: string }[] })));
    if (qRes.data) setQuestions(qRes.data.map(q => ({ ...q, options: q.options as unknown as string[] })));
    if (cfgRes.data) {
      cfgRes.data.forEach(c => {
        if (c.key === "ai_system_prompt") setSystemPrompt(c.value);
        if (c.key === "pass_threshold") setPassThreshold(c.value);
        if (c.key === "ops_notification_email") setOpsEmail(c.value);
        if (c.key === "min_chat_questions") setMinQuestions(c.value);
      });
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) toast.error(error.message);
    setLogging(false);
  };

  const logout = () => supabase.auth.signOut();

  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Score", "Status", "Attempts", "Date"]];
    const filtered = filter === "all" ? contractors : contractors.filter(c => c.status === filter);
    filtered.forEach(c => {
      rows.push([c.name, c.email, c.phone, String(c.quiz_score ?? ""), c.status, String(c.quiz_attempts), new Date(c.created_at).toLocaleDateString()]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contractors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveModule = async (mod: Module) => {
    const { error } = await supabase
      .from("content_modules")
      .update({ title: mod.title, duration: mod.duration, video_url: mod.video_url, sections: mod.sections as unknown as any })
      .eq("id", mod.id);
    if (error) toast.error("Failed to save");
    else toast.success("Module saved");
  };

  const saveQuestion = async (q: QuizQ) => {
    const { error } = await supabase
      .from("quiz_questions")
      .update({ question_text: q.question_text, options: q.options as unknown as any, correct_index: q.correct_index, explanation: q.explanation })
      .eq("id", q.id);
    if (error) toast.error("Failed to save");
    else toast.success("Question saved");
  };

  const saveConfig = async (key: string, value: string) => {
    const { error } = await supabase.from("app_config").update({ value }).eq("key", key);
    if (error) toast.error("Failed to save");
    else toast.success("Saved");
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={login} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={logging}>
                {logging ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredContractors = filter === "all" ? contractors : contractors.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between pr-4">
          <TixieHeader />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="contractors" className="px-4 pb-8">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="contractors"><Users className="w-4 h-4 mr-1" />Contractors</TabsTrigger>
            <TabsTrigger value="modules"><BookOpen className="w-4 h-4 mr-1" />Modules</TabsTrigger>
            <TabsTrigger value="quiz"><HelpCircle className="w-4 h-4 mr-1" />Quiz</TabsTrigger>
            <TabsTrigger value="ai"><Bot className="w-4 h-4 mr-1" />AI Prompt</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="contractors">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex gap-2">
                {["all", "cleared", "failed", "in_progress"].map(f => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                    {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2 hidden sm:table-cell">Phone</th>
                    <th className="p-2">Score</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 hidden sm:table-cell">Attempts</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContractors.map(c => (
                    <tr key={c.id} className="border-b hover:bg-accent/50">
                      <td className="p-2 font-medium">{c.name}</td>
                      <td className="p-2 text-muted-foreground">{c.email}</td>
                      <td className="p-2 hidden sm:table-cell text-muted-foreground">{c.phone}</td>
                      <td className="p-2">{c.quiz_score != null ? `${c.quiz_score}%` : "—"}</td>
                      <td className="p-2">
                        <Badge variant={c.status === "cleared" ? "default" : c.status === "failed" ? "destructive" : "secondary"}
                          className={c.status === "cleared" ? "bg-success text-success-foreground" : ""}>
                          {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-2 hidden sm:table-cell">{c.quiz_attempts}</td>
                      <td className="p-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredContractors.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No contractors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="modules">
            <div className="space-y-4">
              {modules.map((mod, mi) => (
                <Card key={mod.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Module {mod.module_number}: {mod.title}</h3>
                      <Button size="sm" onClick={() => saveModule(mod)}><Save className="w-3 h-3 mr-1" />Save</Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Title</Label>
                        <Input value={mod.title} onChange={e => {
                          const next = [...modules]; next[mi] = { ...mod, title: e.target.value }; setModules(next);
                        }} />
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Input value={mod.duration || ""} onChange={e => {
                          const next = [...modules]; next[mi] = { ...mod, duration: e.target.value }; setModules(next);
                        }} />
                      </div>
                      <div>
                        <Label>Video URL</Label>
                        <Input value={mod.video_url || ""} placeholder="Loom embed URL" onChange={e => {
                          const next = [...modules]; next[mi] = { ...mod, video_url: e.target.value }; setModules(next);
                        }} />
                      </div>
                    </div>
                    {mod.sections.map((sec, si) => (
                      <div key={si} className="border rounded-lg p-3 space-y-2">
                        <Label>Section {si + 1} Heading</Label>
                        <Input value={sec.heading} onChange={e => {
                          const next = [...modules];
                          const secs = [...mod.sections];
                          secs[si] = { ...sec, heading: e.target.value };
                          next[mi] = { ...mod, sections: secs };
                          setModules(next);
                        }} />
                        <Label>Body</Label>
                        <Textarea value={sec.body} rows={3} onChange={e => {
                          const next = [...modules];
                          const secs = [...mod.sections];
                          secs[si] = { ...sec, body: e.target.value };
                          next[mi] = { ...mod, sections: secs };
                          setModules(next);
                        }} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            <div className="space-y-4">
              {questions.map((q, qi) => (
                <Card key={q.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Q{q.question_number}</h3>
                      <Button size="sm" onClick={() => saveQuestion(q)}><Save className="w-3 h-3 mr-1" />Save</Button>
                    </div>
                    <div>
                      <Label>Question</Label>
                      <Textarea value={q.question_text} rows={2} onChange={e => {
                        const next = [...questions]; next[qi] = { ...q, question_text: e.target.value }; setQuestions(next);
                      }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`correct-${q.id}`} checked={q.correct_index === oi}
                            onChange={() => {
                              const next = [...questions]; next[qi] = { ...q, correct_index: oi }; setQuestions(next);
                            }} className="accent-primary" />
                          <Input value={opt} onChange={e => {
                            const next = [...questions];
                            const opts = [...q.options];
                            opts[oi] = e.target.value;
                            next[qi] = { ...q, options: opts };
                            setQuestions(next);
                          }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <Label>Explanation</Label>
                      <Textarea value={q.explanation || ""} rows={2} onChange={e => {
                        const next = [...questions]; next[qi] = { ...q, explanation: e.target.value }; setQuestions(next);
                      }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Label>AI System Prompt</Label>
                <Textarea value={systemPrompt} rows={20} onChange={e => setSystemPrompt(e.target.value)} className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground">Changes go live immediately for new conversations</p>
                <Button onClick={() => saveConfig("ai_system_prompt", systemPrompt)}>
                  <Save className="w-4 h-4 mr-1" /> Save Prompt
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label>Pass Threshold (%)</Label>
                  <Input type="number" value={passThreshold} onChange={e => setPassThreshold(e.target.value)} className="max-w-xs" />
                  <Button size="sm" className="mt-2" onClick={() => saveConfig("pass_threshold", passThreshold)}>Save</Button>
                </div>
                <div>
                  <Label>Ops Notification Email</Label>
                  <Input value={opsEmail} onChange={e => setOpsEmail(e.target.value)} className="max-w-md" />
                  <Button size="sm" className="mt-2" onClick={() => saveConfig("ops_notification_email", opsEmail)}>Save</Button>
                </div>
                <div>
                  <Label>Minimum Chat Questions Before Quiz</Label>
                  <Input type="number" value={minQuestions} onChange={e => setMinQuestions(e.target.value)} className="max-w-xs" />
                  <Button size="sm" className="mt-2" onClick={() => saveConfig("min_chat_questions", minQuestions)}>Save</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
