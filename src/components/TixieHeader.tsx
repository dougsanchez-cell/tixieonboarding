import tixieLogo from "@/assets/tixie-logo.jpg";

const TixieHeader = () => (
  <header className="flex items-center gap-3 py-4 px-4">
    <img src={tixieCat} alt="Tixie mascot" width={40} height={40} className="w-10 h-10" />
    <span className="text-2xl font-bold text-primary">Tixie</span>
    <span className="text-sm text-muted-foreground hidden sm:inline">Buyer Orientation</span>
  </header>
);

export default TixieHeader;
