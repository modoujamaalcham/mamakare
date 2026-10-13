import { useEffect, useState } from "react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALL_DISMISSED_KEY = "mamakare-install-dismissed";

function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    let checking = false;

    // The indicator is driven by the browser's own connectivity signal. An
    // active probe can fail while the device is online (slow networks,
    // privacy extensions, firewalls blocking the health endpoint), so a probe
    // failure alone must never show the offline indicator. The probe is only
    // used to correct browsers that wrongly report being offline.
    async function checkConnectivity() {
      if (checking || typeof navigator === "undefined") return;
      if (navigator.onLine) {
        setOnline(true);
        return;
      }
      checking = true;
      const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
      const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        // Any response, even an error status, proves the network is reachable.
        await fetch(url && key ? `${url.replace(/\/$/, "")}/auth/v1/health` : "/favicon.ico", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: key ? { apikey: key } : {},
        });
        setOnline(true);
      } catch {
        setOnline(navigator.onLine);
      } finally {
        window.clearTimeout(timeout);
        checking = false;
      }
    }

    const handleOnline = () => setOnline(true);
    const handleOffline = () => {
      setOnline(false);
      void checkConnectivity();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", checkConnectivity);
    const connectivityTimer = window.setInterval(checkConnectivity, 30_000);
    void checkConnectivity();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", checkConnectivity);
      window.clearInterval(connectivityTimer);
    };
  }, []);

  return online;
}

export function OfflineIndicator() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <span
      role="status"
      title="Offline — clinical records and changes require an internet connection."
      className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-1 text-xs font-medium text-foreground"
    >
      <WifiOff className="h-3.5 w-3.5" />
      Offline
    </span>
  );
}

export function PwaProvider() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  useEffect(() => {
    const handleInstall = (event: Event) => {
      if (window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "1") return;
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      window.localStorage.removeItem(INSTALL_DISMISSED_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleInstall);
    window.addEventListener("appinstalled", handleInstalled);
    setDismissedInstall(window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "1");

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((nextRegistration) => {
          if (nextRegistration.waiting) setUpdate(nextRegistration);
          nextRegistration.addEventListener("updatefound", () => {
            const worker = nextRegistration.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdate(nextRegistration);
              }
            });
          });
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);

  async function install() {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
    }
  }

  function applyUpdate() {
    update?.waiting?.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
      once: true,
    });
  }

  return (
    <>
      {update && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm shadow-lg">
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />A new Mamakare version is ready.
          </span>
          <Button size="sm" onClick={applyUpdate}>
            Refresh
          </Button>
        </div>
      )}
      {!isStandalone && installPrompt && !dismissedInstall && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm shadow-lg">
          <span>Install Mamakare for quick access.</span>
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={install}>
              Install
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Dismiss install prompt"
              onClick={() => {
                setDismissedInstall(true);
                window.localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
