import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RegistrationStepProps {
  onComplete: (contractor: { id: string; name: string; email: string; phone: string }) => void;
  onReturningUser?: (contractor: { id: string; name: string; email: string; phone: string }) => void;
  demoMode?: boolean;
  userPath?: string | null;
}

const RegistrationStep = ({ onComplete, onReturningUser, demoMode = false, userPath = null }: RegistrationStepProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Returning user state
  const [returningEmail, setReturningEmail] = useState("");
  const [returningLoading, setReturningLoading] = useState(false);

  const handleDemoSkip = async () => {
    const id = crypto.randomUUID();
    const demoData = { id, name: "Demo User", email: "demo@jomero.co", phone: "5550000000" };
    try {
      await supabase.from("contractors").insert({ ...demoData, path: userPath });
    } catch {}
    onComplete(demoData);
  };

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
      const { data: existing } = await supabase
        .rpc("check_contractor_email", { _email: email.trim() });

      if (existing && existing.length > 0) {
        const prev = existing[0];
        if (prev.status === "cleared") {
          toast.info("You've already completed orientation with this email. Contact gigsupport@jomero.co if you need help.");
          setLoading(false);
          return;
        }
        toast.info("Welcome back! Starting a new orientation attempt.");
      }

      const id = crypto.randomUUID();
      const { error } = await supabase
        .from("contractors")
        .insert({ id, name: name.trim(), email: email.trim(), phone: phone.trim(), path: userPath });
      if (error) throw error;
      onComplete({ id, name: name.trim(), email: email.trim(), phone: phone.trim() });
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturningSignIn = async () => {
    if (!returningEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(returningEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setReturningLoading(true);
    try {
      const { data } = await supabase
        .rpc("check_contractor_email", { _email: returningEmail.trim() });

      if (data && data.length > 0 && data[0].status === "cleared") {
        // Fetch full contractor details for the cleared user
        const { data: fullData } = await supabase
          .rpc("get_returning_contractor", { _email: returningEmail.trim() });

        if (fullData && fullData.length > 0) {
          const c = fullData[0];
          if (onReturningUser) {
            onReturningUser({ id: c.id, name: c.name, email: c.email, phone: c.phone });
          }
        } else {
          toast.error("Could not retrieve your account details. Please try again.");
        }
      } else {
        toast.error("No cleared account found with this email. Complete the orientation first.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReturningLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left hero panel */}
      <div
        className="relative lg:w-[40%] w-full px-8 py-16 lg:py-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#D4B8F8" }}
      >
        <div
          className="absolute w-[300px] h-[300px] opacity-60"
          style={{
            background: "#8B50CC",
            borderRadius: "50% 40% 60% 50% / 60% 50% 40% 50%",
            top: "-10%",
            right: "-15%",
            animation: "morphBlob 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[250px] h-[250px] opacity-50"
          style={{
            background: "#7B3FC4",
            borderRadius: "40% 60% 50% 50% / 50% 40% 60% 50%",
            bottom: "-5%",
            left: "-10%",
            animation: "morphBlob 8s ease-in-out infinite 2s",
          }}
        />
        <div
          className="absolute w-[180px] h-[180px] opacity-40"
          style={{
            background: "#8B50CC",
            borderRadius: "60% 50% 40% 50% / 50% 60% 50% 40%",
            top: "40%",
            left: "20%",
            animation: "morphBlob 8s ease-in-out infinite 4s",
          }}
        />

        <div className="relative z-10 text-center">
          <h1
            className="text-4xl font-black leading-tight"
            style={{ color: "#0D0D0D" }}
          >
            Welcome to<br />Tixie!
          </h1>
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="lg:w-[60%] w-full flex flex-col items-center justify-center px-6 py-12 lg:py-0"
        style={{ background: "#1C1D2E" }}
      >
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Let's get you set up</h2>
          <p className="text-sm mb-4" style={{ color: "#9898B0" }}>
            Complete this orientation to get cleared for live purchasing
          </p>

          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
               style={{ background: "#1A2A3A", border: "1px solid #B3D4F0", color: "#7BC8F6" }}>
            <span className="text-base shrink-0">💡</span>
            <span>Complete this orientation to get cleared for live purchasing. If you'd like additional support, a guided 1-hour session is available — just email <a href="mailto:gigsupport@jomero.co" className="underline text-[#8B50CC]">gigsupport@jomero.co</a> after completing orientation.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: "name", label: "FULL NAME", value: name, onChange: setName, placeholder: "Jane Doe", type: "text" },
              { id: "email", label: "EMAIL ADDRESS", value: email, onChange: setEmail, placeholder: "jane@example.com", type: "email" },
              { id: "phone", label: "PHONE NUMBER", value: phone, onChange: setPhone, placeholder: "(555) 123-4567", type: "tel" },
            ].map((field) => (
              <div key={field.id}>
                <Label
                  htmlFor={field.id}
                  className="text-xs font-semibold tracking-wider"
                  style={{ color: "#9898B0", letterSpacing: "0.08em" }}
                >
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1.5 text-white placeholder:text-white/30 rounded-xl border focus:ring-2 transition-colors"
                  style={{
                    background: "#2A2B3D",
                    borderColor: "#3A3B50",
                  }}
                />
                {errors[field.id] && (
                  <p className="text-sm mt-1" style={{ color: "#E05555" }}>{errors[field.id]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[10px] text-white font-semibold text-base transition-all duration-200 hover:brightness-125 disabled:opacity-60 disabled:pointer-events-none"
              style={{ background: "#6B5498" }}
            >
              {loading ? "Registering..." : "Start Orientation →"}
            </button>

            {demoMode && (
              <button
                type="button"
                onClick={handleDemoSkip}
                className="w-full py-2.5 rounded-[10px] font-semibold text-sm transition-all duration-200 hover:brightness-125 mt-2"
                style={{ background: "#F59E0B", color: "#1C1D2E" }}
              >
                ⚡ Demo: Skip registration →
              </button>
            )}
          </form>

          {/* Returning user section */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: "#3A3B50" }} />
              <span className="text-xs font-medium" style={{ color: "#9898B0" }}>Already completed orientation?</span>
              <div className="flex-1 h-px" style={{ background: "#3A3B50" }} />
            </div>

            <div className="px-4 py-5 rounded-xl" style={{ background: "#22233A", border: "1px solid #3A3B50" }}>
              <p className="text-sm font-medium text-white mb-3">Sign in to review materials</p>
              <Input
                type="email"
                value={returningEmail}
                onChange={(e) => setReturningEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="mb-3 text-white placeholder:text-white/30 rounded-xl border focus:ring-2 transition-colors"
                style={{
                  background: "#2A2B3D",
                  borderColor: "#3A3B50",
                }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleReturningSignIn(); } }}
              />
              <button
                type="button"
                onClick={handleReturningSignIn}
                disabled={returningLoading}
                className="w-full py-3 rounded-[10px] font-semibold text-sm transition-all duration-200 hover:brightness-125 disabled:opacity-60 disabled:pointer-events-none"
                style={{ background: "transparent", border: "1px solid #6B5498", color: "#B89CE8" }}
              >
                {returningLoading ? "Checking..." : "Sign In to Review →"}
              </button>
            </div>
          </div>

          {/* Progress preview */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs font-medium" style={{ color: "#9898B0" }}>
            <span className="text-white">📋 Register</span>
            <span style={{ color: "#3A3B50" }}>→</span>
            <span>📚 Train</span>
            <span style={{ color: "#3A3B50" }}>→</span>
            <span>🤖 Ask AI</span>
            <span style={{ color: "#3A3B50" }}>→</span>
            <span>📝 Quiz</span>
            <span style={{ color: "#3A3B50" }}>→</span>
            <span>✅ Cleared</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes morphBlob {
          0%, 100% { border-radius: 50% 40% 60% 50% / 60% 50% 40% 50%; }
          33% { border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%; }
          66% { border-radius: 60% 50% 40% 50% / 50% 60% 50% 40%; }
        }
      `}</style>
    </div>
  );
};

export default RegistrationStep;
