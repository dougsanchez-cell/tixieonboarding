import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Download, Save, Users, BookOpen, HelpCircle, Settings, Bot, ChevronRight, Search } from "lucide-react";
import TixieHeader from "@/components/TixieHeader";
import type { Session } from "@supabase/supabase-js";

interface SessionEvent {
  id: number;
  contractor_id: string;
  step_name: string;
  event_type: string;
  event_at: string;
}

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
  path: string | null;
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

interface ContractorGroup {
  email: string;
  latest: Contractor;
  attempts: Contractor[];
  bestScore: number | null;
  rolledStatus: string;
  totalAttempts: number;
  firstRegisteredAt: string;
  path: string | null;
}

const formatStatusLabel = (status: string) =>
  status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);

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
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [pathFilter, setPathFilter] = useState("all");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  // New state for improvements
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contractorNotes, setContractorNotes] = useState<Record<string, string>>({});

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

  const groupedContractors = useMemo(
    () => contractors.reduce<Record<string, Contractor[]>>((acc, contractor) => {
      (acc[contractor.email] = acc[contractor.email] || []).push(contractor);
      return acc;
    }, {}),
    [contractors],
  );

  const contractorGroups = useMemo<ContractorGroup[]>(() => (
    Object.entries(groupedContractors)
      .map(([email, attempts]) => {
        const sortedAttempts = [...attempts].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const latest = sortedAttempts[0];
        const earliest = sortedAttempts[sortedAttempts.length - 1];
        const bestScore = attempts.reduce<number | null>((best, attempt) => {
          if (attempt.quiz_score == null) return best;
          return best == null ? attempt.quiz_score : Math.max(best, attempt.quiz_score);
        }, null);
        const rolledStatus = attempts.some(attempt => attempt.status === "cleared")
          ? "cleared"
          : attempts.some(attempt => attempt.status === "failed")
            ? "failed"
            : "in_progress";

        return {
          email,
          latest,
          attempts: sortedAttempts,
          bestScore,
          rolledStatus,
          totalAttempts: attempts.length,
          firstRegisteredAt: earliest.created_at,
          path: latest.path,
        };
      })
      .sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime())
  ), [groupedContractors]);

  const filteredContractorGroups = useMemo(() => {
    let groups = filter === "all" ? contractorGroups : contractorGroups.filter(group => group.rolledStatus === filter);
    if (pathFilter !== "all") groups = groups.filter(group => group.path === pathFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      groups = groups.filter(group =>
        group.latest.name.toLowerCase().includes(q) ||
        group.email.toLowerCase().includes(q)
      );
    }
    return groups;
  }, [contractorGroups, filter, pathFilter, searchQuery]);

  const sortedContractorGroups = useMemo(() => {
    const sorted = [...filteredContractorGroups];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name": cmp = a.latest.name.localeCompare(b.latest.name); break;
        case "email": cmp = a.email.localeCompare(b.email); break;
        case "path": cmp = (a.path || "").localeCompare(b.path || ""); break;
        case "score": cmp = (a.bestScore ?? -1) - (b.bestScore ?? -1); break;
        case "status": cmp = a.rolledStatus.localeCompare(b.rolledStatus); break;
        case "attempts": cmp = a.totalAttempts - b.totalAttempts; break;
        case "date": cmp = new Date(a.firstRegisteredAt).getTime() - new Date(b.firstRegisteredAt).getTime(); break;
        case "lastActivity": cmp = new Date(a.latest.created_at).getTime() - new Date(b.latest.created_at).getTime(); break;
        default: cmp = 0;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredContractorGroups, sortColumn, sortDirection]);

  const exportableContractors = useMemo(() => {
    if (filter === "all") return contractors;
    const visibleEmails = new Set(filteredContractorGroups.map(group => group.email));
    return contractors.filter(contractor => visibleEmails.has(contractor.email));
  }, [contractors, filter, filteredContractorGroups]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const loadAll = async () => {
    const [cRes, mRes, qRes, cfgRes, seRes] = await Promise.all([
      supabase.from("contractors").select("*").order("created_at", { ascending: false }),
      supabase.from("content_modules").select("*").order("module_number"),
      supabase.from("quiz_questions").select("*").order("question_number"),
      supabase.from("app_config").select("*"),
      supabase.from("session_events").select("*").order("event_at", { ascending: true }),
    ]);
    if (cRes.data) setContractors(cRes.data as Contractor[]);
    if (mRes.data) setModules(mRes.data.map(m => ({ ...m, sections: m.sections as unknown as { heading: string; body: string }[], comprehension_questions: (m.comprehension_questions as unknown as CompQuestion[]) || [] })));
    if (qRes.data) setQuestions(qRes.data.map(q => ({ ...q, options: q.options as unknown as string[] })));
    if (cfgRes.data) {
      cfgRes.data.forEach(c => {
        if (c.key === "ai_system_prompt") setSystemPrompt(c.value);
        if (c.key === "pass_threshold") setPassThreshold(c.value);
        if (c.key === "ops_notification_email") setOpsEmail(c.value);
        if (c.key === "min_chat_questions") setMinQuestions(c.value);
        if (c.key === "contractor_notes") {
          try { setContractorNotes(JSON.parse(c.value)); } catch { setContractorNotes({}); }
        }
      });
      const hasNotesKey = cfgRes.data.some(c => c.key === "contractor_notes");
      if (!hasNotesKey) {
        await supabase.from("app_config").insert({ key: "contractor_notes", value: "{}" });
      }
    }
    if (seRes.data) setSessionEvents(seRes.data as SessionEvent[]);
  };

  const getTimePerStep = (contractorId: string) => {
    const events = sessionEvents.filter(e => e.contractor_id === contractorId);
    const timeByStep: Record<string, number> = {};
    const enterStack: Record<string, string> = {};
    for (const event of events) {
      if (event.event_type === "enter") {
        enterStack[event.step_name] = event.event_at;
      } else if (event.event_type === "exit" && enterStack[event.step_name]) {
        const duration = (new Date(event.event_at).getTime() - new Date(enterStack[event.step_name]).getTime()) / 1000;
        if (duration > 0 && duration < 7200) {
          timeByStep[event.step_name] = (timeByStep[event.step_name] || 0) + duration;
        }
        delete enterStack[event.step_name];
      }
    }
    return timeByStep;
  };

  const getTotalTime = (contractorId: string) => {
    return Object.values(getTimePerStep(contractorId)).reduce((sum, t) => sum + t, 0);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) toast.error(error.message);
    setLogging(false);
  };

  const logout = () => supabase.auth.signOut();

  const toggleExpandedEmail = (email: string) => {
    setExpandedEmail(current => (current === email ? null : email));
  };

  const renderStatusBadge = (status: string) => (
    <Badge
      variant={status === "cleared" ? "default" : status === "failed" ? "destructive" : "secondary"}
      className={status === "cleared" ? "bg-success text-success-foreground" : ""}
    >
      {formatStatusLabel(status)}
    </Badge>
  );

  const deleteContractor = async (id: string, name: string) => {
    if (!confirm(`Delete contractor "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("contractors").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Contractor deleted"); loadAll(); }
  };

  const saveContractor = async (c: Contractor) => {
    const { error } = await supabase.from("contractors").update({
      name: c.name,
      email: c.email,
      phone: c.phone,
      path: c.path,
      status: c.status,
    }).eq("id", c.id);
    if (error) toast.error("Failed to save");
    else { toast.success("Contractor updated"); setEditingContractor(null); loadAll(); }
  };

  const resetContractor = async (id: string, name: string) => {
    if (!confirm(`Reset "${name}" to In Progress? This will clear their score and attempts.`)) return;
    const { error } = await supabase.from("contractors").update({
      status: "in_progress",
      quiz_score: null,
      quiz_attempts: 0,
      completed_at: null,
    }).eq("id", id);
    if (error) toast.error("Failed to reset");
    else { toast.success("Contractor reset to In Progress"); loadAll(); }
  };

  const saveNote = async (email: string, note: string) => {
    const updated = { ...contractorNotes, [email]: note };
    if (!note.trim()) delete updated[email];
    const { error } = await supabase.from("app_config").upsert({ key: "contractor_notes", value: JSON.stringify(updated) });
    if (error) toast.error("Failed to save note");
    else { setContractorNotes(updated); toast.success("Note saved"); }
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Path", "Score", "Status", "Attempts", "Date"]];
    exportableContractors.forEach(c => {
      rows.push([
        c.name,
        c.email,
        c.phone,
        c.path || "",
        String(c.quiz_score ?? ""),
        c.status,
        String(c.quiz_attempts),
        new Date(c.created_at).toLocaleDateString(),
      ]);
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
      .update({
        title: mod.title,
        duration: mod.duration,
        video_url: mod.video_url,
        sections: mod.sections as unknown as any,
        comprehension_questions: mod.comprehension_questions as unknown as any,
      })
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

  const renderSortHeader = (label: string, column: string, extraClass = "") => (
    <th
      className={`p-2 cursor-pointer select-none hover:text-foreground ${extraClass}`}
      onClick={() => handleSort(column)}
    >
      {label} {sortColumn === column && (sortDirection === "asc" ? "↑" : "↓")}
    </th>
  );

  const COL_SPAN = 11; // checkbox + 8 data cols + last activity + expand arrow

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
            <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2 flex-wrap items-center">
                {["all", "cleared", "failed", "in_progress"].map(f => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                    {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
                <span className="text-muted-foreground self-center px-1">|</span>
                {["all", "a1", "a2", "a3"].map(p => (
                  <Button key={p} variant={pathFilter === p ? "default" : "outline"} size="sm" onClick={() => setPathFilter(p)}>
                    {p === "all" ? "All Paths" : p.toUpperCase()}
                  </Button>
                ))}
                <span className="text-muted-foreground self-center px-1">|</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="max-w-xs pl-8 h-9"
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
            </div>

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <Button size="sm" variant="outline" onClick={() => {
                  if (!confirm(`Delete ${selectedIds.size} contractor records? This cannot be undone.`)) return;
                  Promise.all([...selectedIds].map(id => supabase.from("contractors").delete().eq("id", id)))
                    .then(() => { toast.success(`${selectedIds.size} records deleted`); setSelectedIds(new Set()); loadAll(); })
                    .catch(() => toast.error("Failed to delete some records"));
                }} className="text-destructive border-destructive">
                  Delete Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const rows = [["Name", "Email", "Phone", "Path", "Score", "Status", "Attempts", "Date"]];
                  contractors.filter(c => selectedIds.has(c.id)).forEach(c => {
                    rows.push([c.name, c.email, c.phone, c.path || "", String(c.quiz_score ?? ""), c.status, String(c.quiz_attempts), new Date(c.created_at).toLocaleDateString()]);
                  });
                  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `selected-contractors-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}>
                  Export Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                  Clear Selection
                </Button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2 w-8">
                      <input type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === sortedContractorGroups.reduce((sum, g) => sum + g.attempts.length, 0)}
                        onChange={e => {
                          if (e.target.checked) {
                            const all = new Set<string>();
                            sortedContractorGroups.forEach(g => g.attempts.forEach(a => all.add(a.id)));
                            setSelectedIds(all);
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                        className="accent-primary"
                      />
                    </th>
                    {renderSortHeader("Name", "name")}
                    {renderSortHeader("Email", "email")}
                    <th className="p-2 hidden sm:table-cell cursor-pointer select-none hover:text-foreground">Phone</th>
                    {renderSortHeader("Path", "path")}
                    {renderSortHeader("Best Score", "score")}
                    {renderSortHeader("Status", "status")}
                    {renderSortHeader("Attempts", "attempts", "hidden sm:table-cell")}
                    {renderSortHeader("First Registered", "date")}
                    {renderSortHeader("Last Activity", "lastActivity")}
                    <th className="w-8 p-2" aria-label="Expand row"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContractorGroups.map(group => {
                    const isExpanded = expandedEmail === group.email;

                    return (
                      <Fragment key={group.email}>
                        <tr
                          className="cursor-pointer border-b transition-colors hover:bg-accent/50"
                          onClick={() => toggleExpandedEmail(group.email)}
                        >
                          <td className="p-2" onClick={e => e.stopPropagation()}>
                            <input type="checkbox"
                              checked={group.attempts.every(a => selectedIds.has(a.id))}
                              onChange={e => {
                                const next = new Set(selectedIds);
                                group.attempts.forEach(a => e.target.checked ? next.add(a.id) : next.delete(a.id));
                                setSelectedIds(next);
                              }}
                              className="accent-primary"
                            />
                          </td>
                          <td className={`p-2 font-medium ${isExpanded ? "border-l-4 border-primary pl-1" : ""}`}>
                            {group.latest.name}
                          </td>
                          <td className="p-2 text-muted-foreground">{group.email}</td>
                          <td className="p-2 hidden sm:table-cell text-muted-foreground">{group.latest.phone}</td>
                          <td className="p-2">
                            <Badge variant="outline">{group.path ? group.path.toUpperCase() : "—"}</Badge>
                          </td>
                          <td className="p-2">{group.bestScore != null ? `${group.bestScore}%` : "—"}</td>
                          <td className="p-2">{renderStatusBadge(group.rolledStatus)}</td>
                          <td className="p-2 hidden sm:table-cell">{group.totalAttempts}</td>
                          <td className="p-2 text-muted-foreground">{new Date(group.firstRegisteredAt).toLocaleDateString()}</td>
                          <td className="p-2 text-muted-foreground">{new Date(group.latest.created_at).toLocaleDateString()}</td>
                          <td className="p-2">
                            <div className="flex justify-end">
                              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b">
                            <td colSpan={COL_SPAN} className="p-0">
                              <div className="my-2 ml-4 overflow-hidden rounded-lg border border-primary/15 bg-primary/5">
                                <div className="flex justify-end p-2">
                                  <Button size="sm" variant="ghost" className="text-destructive text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!confirm(`Delete ALL ${group.attempts.length} records for ${group.email}? This cannot be undone.`)) return;
                                      Promise.all(group.attempts.map(a => supabase.from("contractors").delete().eq("id", a.id)))
                                        .then(() => { toast.success("All records deleted"); loadAll(); })
                                        .catch(() => toast.error("Failed to delete some records"));
                                    }}>
                                    Delete All Records
                                  </Button>
                                </div>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                      <th className="p-2 pl-4">#</th>
                                      <th className="p-2">Score</th>
                                      <th className="p-2">Status</th>
                                      <th className="p-2">Date</th>
                                      <th className="p-2 hidden sm:table-cell">Quiz Attempts</th>
                                      <th className="p-2">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.attempts.map((attempt, index) => (
                                      <tr key={attempt.id} className="border-b last:border-b-0">
                                        <td className="p-2 pl-4 font-medium">{index + 1}</td>
                                        <td className="p-2">{attempt.quiz_score != null ? `${attempt.quiz_score}%` : "—"}</td>
                                        <td className="p-2">{renderStatusBadge(attempt.status)}</td>
                                        <td className="p-2 text-muted-foreground">{new Date(attempt.created_at).toLocaleString()}</td>
                                        <td className="p-2 hidden sm:table-cell">{attempt.quiz_attempts}</td>
                                        <td className="p-2">
                                          <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
                                              onClick={(e) => { e.stopPropagation(); setEditingContractor(attempt); }}>
                                              Edit
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-orange-500 h-6 px-2 text-xs"
                                              onClick={(e) => { e.stopPropagation(); resetContractor(attempt.id, attempt.name); }}>
                                              Reset
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive h-6 px-2 text-xs"
                                              onClick={(e) => { e.stopPropagation(); deleteContractor(attempt.id, attempt.name); }}>
                                              Delete
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {/* Notes */}
                                <div className="p-3 border-t border-primary/15">
                                  <Label className="text-xs font-medium">Internal Notes</Label>
                                  <div className="flex gap-2 mt-1">
                                    <Textarea
                                      value={contractorNotes[group.email] || ""}
                                      placeholder="Add internal notes (e.g. 'needs follow-up', 'referred by Nick')..."
                                      rows={2}
                                      className="text-xs"
                                      onChange={e => setContractorNotes(prev => ({ ...prev, [group.email]: e.target.value }))}
                                    />
                                    <Button size="sm" variant="outline" className="shrink-0 self-end"
                                      onClick={(e) => { e.stopPropagation(); saveNote(group.email, contractorNotes[group.email] || ""); }}>
                                      <Save className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {sortedContractorGroups.length === 0 && (
                    <tr><td colSpan={COL_SPAN} className="p-8 text-center text-muted-foreground">No contractors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Edit Contractor Modal */}
            {editingContractor && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingContractor(null)}>
                <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <CardHeader>
                    <CardTitle>Edit Contractor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={editingContractor.name} onChange={e => setEditingContractor({ ...editingContractor, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={editingContractor.email} onChange={e => setEditingContractor({ ...editingContractor, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={editingContractor.phone} onChange={e => setEditingContractor({ ...editingContractor, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>Path</Label>
                      <select value={editingContractor.path || ""} onChange={e => setEditingContractor({ ...editingContractor, path: e.target.value || null })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">None</option>
                        <option value="a1">A1</option>
                        <option value="a2">A2</option>
                        <option value="a3">A3</option>
                      </select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <select value={editingContractor.status} onChange={e => setEditingContractor({ ...editingContractor, status: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="in_progress">In Progress</option>
                        <option value="cleared">Cleared</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => saveContractor(editingContractor)} className="flex-1">
                        <Save className="w-4 h-4 mr-1" /> Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingContractor(null)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Comprehension Questions</Label>
                        <Button size="sm" variant="outline" onClick={() => {
                          const next = [...modules];
                          next[mi] = { ...mod, comprehension_questions: [...mod.comprehension_questions, { q: "", options: ["", "", "", ""], correct: 0 }] };
                          setModules(next);
                        }}>+ Add Question</Button>
                      </div>
                      {mod.comprehension_questions.map((cq, ci) => (
                        <div key={ci} className="border rounded-lg p-3 space-y-2 mb-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Question {ci + 1}</Label>
                            <Button size="sm" variant="ghost" className="text-destructive h-6 px-2 text-xs" onClick={() => {
                              const next = [...modules];
                              const cqs = mod.comprehension_questions.filter((_, i) => i !== ci);
                              next[mi] = { ...mod, comprehension_questions: cqs };
                              setModules(next);
                            }}>Remove</Button>
                          </div>
                          <Textarea value={cq.q} rows={2} placeholder="Question text" onChange={e => {
                            const next = [...modules];
                            const cqs = [...mod.comprehension_questions];
                            cqs[ci] = { ...cq, q: e.target.value };
                            next[mi] = { ...mod, comprehension_questions: cqs };
                            setModules(next);
                          }} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cq.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="radio" name={`comp-correct-${mod.id}-${ci}`} checked={cq.correct === oi}
                                  onChange={() => {
                                    const next = [...modules];
                                    const cqs = [...mod.comprehension_questions];
                                    cqs[ci] = { ...cq, correct: oi };
                                    next[mi] = { ...mod, comprehension_questions: cqs };
                                    setModules(next);
                                  }} className="accent-primary" />
                                <Input value={opt} placeholder={`Option ${String.fromCharCode(65 + oi)}`} onChange={e => {
                                  const next = [...modules];
                                  const cqs = [...mod.comprehension_questions];
                                  const opts = [...cq.options];
                                  opts[oi] = e.target.value;
                                  cqs[ci] = { ...cq, options: opts };
                                  next[mi] = { ...mod, comprehension_questions: cqs };
                                  setModules(next);
                                }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
