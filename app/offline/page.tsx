import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <WifiOff className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">You're Offline</h1>
      <p className="text-muted-foreground max-w-xs">
        PremiumSupply requires an internet connection to sync inventory data.
        Please reconnect and try again.
      </p>
    </div>
  );
}
