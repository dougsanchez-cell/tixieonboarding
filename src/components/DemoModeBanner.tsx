import { X } from "lucide-react";

interface DemoModeBannerProps {
  onExit: () => void;
}

const DemoModeBanner = ({ onExit }: DemoModeBannerProps) => (
  <div
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-xs font-semibold"
    style={{ backgroundColor: "#F59E0B", color: "#1C1D2E" }}
  >
    <span>🎬 Demo Mode · All gates bypassed · Share: tixieonboarding.lovable.app/?demo=true</span>
    <button onClick={onExit} className="hover:opacity-70 transition-opacity">
      <X className="w-4 h-4" />
    </button>
  </div>
);

export default DemoModeBanner;
