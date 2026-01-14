import { useEffect, useState } from "react";
import { checkHealth } from "./api/health";

const HEALTH_INTERVAL_MS = 10_000;

export function App() {
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    let ac: AbortController | null = null;

    const runCheck = async () => {
      ac?.abort();
      ac = new AbortController();

      try {
        const ok = await checkHealth(ac.signal);
        if (!cancelled) {
          setBackendUp(ok);
          setLastCheck(new Date());
        }
      } catch {
        if (!cancelled) {
          setBackendUp(false);
          setLastCheck(new Date());
        }
      }
    };

    runCheck();

    const id = setInterval(runCheck, HEALTH_INTERVAL_MS);

    return () => {
      cancelled = true;
      ac?.abort();
      clearInterval(id);
    };
  }, []);

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      {/* TODO Main implementation */}

      <footer
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 8,
          background:
            backendUp === null
              ? "#eee"
              : backendUp
              ? "rgba(0,160,0,0.15)"
              : "rgba(200,0,0,0.15)",
          color: backendUp === null ? "#666" : backendUp ? "#0a5" : "#c00",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        Backend: {backendUp === null ? "CHECKING …" : backendUp ? "UP" : "DOWN"}
        {lastCheck && (
          <div style={{ fontSize: 10, opacity: 0.6 }}>
            last check: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </footer>
    </div>
  );
}
