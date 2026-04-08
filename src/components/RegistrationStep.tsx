import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

interface RegistrationStepProps {
  onComplete: (contractor: { id: string; name: string; email: string; phone: string }) => void;
  demoMode?: boolean;
  userPath?: string | null;
}

const RegistrationStep = ({ onComplete, demoMode = false, userPath = null }: RegistrationStepProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDemoSkip = async () => {
    const id = crypto.randomUUID();
    const demoData = { id, name: "Demo User", email: "demo@jomero.co", phone: "5550000000" };
    try {
      await supabase.from("contractors").insert({ ...demoData, path: userPath } as any);
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
      const id = crypto.randomUUID();
      const { error } = await supabase
        .from("contractors")
        .insert({ id, name: name.trim(), email: email.trim(), phone: phone.trim(), path: userPath } as any);
      if (error) throw error;
      onComplete({ id, name: name.trim(), email: email.trim(), phone: phone.trim() });
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left hero panel */}
      <div
        className="relative lg:w-[40%] w-full px-8 py-16 lg:py-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#D4B8F8" }}
      >
        {/* Organic blob shapes */}
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
          <p className="text-sm mb-8" style={{ color: "#9898B0" }}>
            Complete this orientation to get cleared for live purchasing
          </p>

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
