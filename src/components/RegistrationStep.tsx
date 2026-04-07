import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RegistrationStepProps {
  onComplete: (contractor: { id: string; name: string; email: string; phone: string }) => void;
}

const FloatingShape = ({ children, className }: { children: React.ReactNode; className: string }) => (
  <div className={`absolute pointer-events-none hidden sm:block ${className}`}>{children}</div>
);

const RegistrationStep = ({ onComplete }: RegistrationStepProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email is required";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) e.phone = "Phone must be at least 10 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const id = crypto.randomUUID();
      const { error } = await supabase
        .from("contractors")
        .insert({ id, name: name.trim(), email: email.trim(), phone: phone.trim() });
      const data = { id };
      if (error) throw error;
      onComplete({ id: data.id, name: name.trim(), email: email.trim(), phone: phone.trim() });
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2D1B69 0%, #7B51D3 50%, #9B6FE8 100%)" }}
    >
      {/* Floating decorations — hidden on mobile */}
      <FloatingShape className="top-[8%] left-[10%] animate-[float_4s_ease-in-out_infinite]">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="white" opacity=".12"/></svg>
      </FloatingShape>
      <FloatingShape className="top-[15%] right-[12%] animate-[float_5s_ease-in-out_infinite_0.5s]">
        <svg width="36" height="24" viewBox="0 0 36 24" fill="none"><rect x="1" y="1" width="34" height="22" rx="4" stroke="white" strokeWidth="1.5" opacity=".1"/><line x1="12" y1="0" x2="12" y2="24" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity=".1"/></svg>
      </FloatingShape>
      <FloatingShape className="bottom-[20%] left-[7%] animate-[float_6s_ease-in-out_infinite_1s]">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="white" strokeWidth="1.5" opacity=".1"/><polyline points="9,14 13,18 20,10" stroke="white" strokeWidth="1.5" opacity=".12" fill="none"/></svg>
      </FloatingShape>
      <FloatingShape className="bottom-[30%] right-[8%] animate-[float_4.5s_ease-in-out_infinite_0.8s]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12,1 15,9 23,9 17,14 19,23 12,18 5,23 7,14 1,9 9,9" fill="white" opacity=".1"/></svg>
      </FloatingShape>
      <FloatingShape className="top-[40%] left-[25%] animate-[float_5.5s_ease-in-out_infinite_1.5s]">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke="white" strokeWidth="1" opacity=".08" transform="rotate(15 10 10)"/></svg>
      </FloatingShape>

      {/* Hero section */}
      <div className="flex flex-col items-center mb-8 z-10 animate-fade-in">
        {/* Floating Tixie logo */}
        <div className="animate-[float_3s_ease-in-out_infinite] mb-4">
          <img
            src="/lovable-uploads/7f1e5a1b-2b57-4107-b737-9e6a43210ccc.png"
            alt="Tixie"
            className="w-20 h-20 drop-shadow-lg"
          />
        </div>
        <h1 className="text-[28px] font-bold text-white mb-2 text-center">
          Welcome to Tixie! 🎟️
        </h1>
        <p className="text-white/80 text-center max-w-md mb-5 text-sm sm:text-base">
          Complete this orientation to get cleared for live purchasing
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: "⚡", label: "~15 min" },
            { icon: "🎯", label: "3 modules" },
            { icon: "🤖", label: "AI powered" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)" }}
            >
              <span>{stat.icon}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-lg z-10 animate-fade-in"
        style={{ animationDelay: "0.15s" }}
      >
        <div
          className="bg-white rounded-[20px] p-6 sm:p-8 shadow-2xl"
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "#2D1B69" }}>
            Let's get you set up
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="font-semibold" style={{ color: "#7B51D3" }}>
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1.5 border-2 border-gray-200 focus:border-[#7B51D3] focus:ring-[#7B51D3]/20 transition-colors rounded-xl"
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="font-semibold" style={{ color: "#7B51D3" }}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="mt-1.5 border-2 border-gray-200 focus:border-[#7B51D3] focus:ring-[#7B51D3]/20 transition-colors rounded-xl"
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="font-semibold" style={{ color: "#7B51D3" }}>
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-1.5 border-2 border-gray-200 focus:border-[#7B51D3] focus:ring-[#7B51D3]/20 transition-colors rounded-xl"
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>

            {/* Submit button with gradient + shimmer */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl text-white font-semibold text-base transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none overflow-hidden group"
              style={{ background: "linear-gradient(135deg, #7B51D3, #9B6FE8)" }}
            >
              <span className="relative z-10">
                {loading ? "Registering..." : "Start my orientation →"}
              </span>
              {/* Shimmer sweep on hover */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,.25) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            </button>
          </form>
        </div>
      </div>

      {/* Progress preview strip */}
      <div className="mt-8 z-10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-white/70 text-xs sm:text-sm font-medium">
          <span>📋 Register</span>
          <span className="text-white/40">→</span>
          <span>📚 Train</span>
          <span className="text-white/40">→</span>
          <span>🤖 Ask AI</span>
          <span className="text-white/40">→</span>
          <span>📝 Quiz</span>
          <span className="text-white/40">→</span>
          <span>✅ Cleared</span>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default RegistrationStep;
