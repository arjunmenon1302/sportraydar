import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "#/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      dismiss();
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--foreground)]">
          Install Sports Tracker
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Get the best experience — add to home screen
        </p>
      </div>
      <Button
        size="sm"
        onClick={handleInstall}
        className="shrink-0 bg-[var(--sport-accent)] text-[var(--background)] hover:bg-[var(--sport-accent)]/90"
      >
        Install
      </Button>
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <X size={16} />
      </button>
    </div>
  );
}
