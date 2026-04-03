import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "#/components/ui/button";
import { useNotifications } from "#/hooks/use-notifications";

const STORAGE_KEY = "notif-banner-dismissed";

export function NotificationPermissionBanner() {
  const { permission, requestPermission } = useNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (permission === "default" && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, [permission]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleEnable = async () => {
    await requestPermission();
    dismiss();
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg">
      <Bell
        size={18}
        className="shrink-0 text-[var(--sport-accent)]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--foreground)]">
          Enable notifications
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Get alerts for goals, kick-offs, and live matches
        </p>
      </div>
      <Button
        size="sm"
        onClick={handleEnable}
        className="shrink-0 bg-[var(--sport-accent)] text-[var(--background)] hover:bg-[var(--sport-accent)]/90"
      >
        Enable
      </Button>
      <button
        onClick={dismiss}
        aria-label="Dismiss notification prompt"
        className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <X size={16} />
      </button>
    </div>
  );
}
