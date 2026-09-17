import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { registerTokenGetter } from "../lib/offlineQueue.js";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { getToken } = useAuth();

  useEffect(() => {
    // Give the offline queue module a way to fetch a fresh Clerk JWT when
    // it replays mutations after reconnecting.
    registerTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
