import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Download } from "lucide-react";
import { toast } from "sonner";
import {
  pushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

// Minimal type for the (non-standard) install prompt event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Two small, self-contained PWA controls for the Home screen:
 *  - "Install app"  — appears on Android/desktop Chrome when installable.
 *  - "Reminders"    — opt in/out of daily-entry push notifications.
 *
 * On iOS there is no install button (install is manual via Safari → Share →
 * "Add to Home Screen"); we show a hint instead.
 */
export default function PwaControls() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari only
    window.navigator.standalone === true;

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!pushSupported()) return;
    getNotificationPermission().then(async (perm) => {
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setRemindersOn(!!sub);
    });
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  };

  const toggleReminders = async () => {
    setBusy(true);
    try {
      if (remindersOn) {
        const res = await unsubscribeFromPush();
        if (res.ok) {
          setRemindersOn(false);
          toast.success("Daily reminders turned off.");
        } else {
          toast.error(res.reason ?? "Could not turn off reminders.");
        }
      } else {
        const res = await subscribeToPush();
        if (res.ok) {
          setRemindersOn(true);
          toast.success("Daily reminders enabled.");
        } else {
          toast.error(res.reason ?? "Could not enable reminders.");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const canInstall = !!installEvent && !installed && !isStandalone;
  const showIosHint = isIos && !isStandalone;

  return (
    <div className="flex flex-col gap-2">
      {canInstall && (
        <Button variant="outline" className="w-full" onClick={handleInstall}>
          <Download className="w-4 h-4 mr-1" /> Install app
        </Button>
      )}

      {showIosHint && (
        <p className="text-xs text-muted-foreground text-center">
          To install on iPhone/iPad: tap the <strong>Share</strong> icon in Safari, then{" "}
          <strong>“Add to Home Screen”</strong>.
        </p>
      )}

      {pushSupported() && (
        <Button variant="ghost" size="sm" className="w-full" onClick={toggleReminders} disabled={busy}>
          {remindersOn ? (
            <>
              <BellOff className="w-4 h-4 mr-1" /> Turn off daily reminders
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-1" /> Enable daily reminders
            </>
          )}
        </Button>
      )}
    </div>
  );
}
