import { X } from "lucide-react";

interface DemoModeBannerProps {
  onExit: () => void;
  userPath?: string | null;
}

const DemoModeBanner = ({ onExit, userPath }: DemoModeBannerProps) => {
  const pathLabel = userPath ? ` · Path ${userPath.toUpperCase()}` : "";
  const shareUrl = userPath
    ? `tixieonboarding.lovable.app/?demo=true&path=${userPath}`
    : `tixieonboarding.lovable.app/?demo=true`;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-xs font-semibold"
      style={{ backgroundColor: "#F59E0B", color: "#1C1D2E" }}
    >
      <span>🎬 Demo Mode{pathLabel} · All gates bypassed · {shareUrl}</span>
      <button onClick={onExit} className="hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DemoModeBanner;
