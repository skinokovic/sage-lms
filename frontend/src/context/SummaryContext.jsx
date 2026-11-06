import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import axiosClient from "../api/axiosClient";

const POLL_MS = 10000;

// Dispatch this from anywhere to refresh the badge and bell right away
export const REFRESH_EVENT = "sage-summary-refresh";

const SummaryContext = createContext({
  notifications: [],
  unread: 0,
  counts: {},
  loading: false,
  refresh: () => {},
  markAllRead: async () => {},
});

export const SummaryProvider = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const { pathname } = useLocation();

  const enabled = Boolean(user) && user.role !== "admin";

  const [state, setState] = useState({
    notifications: [],
    unread: 0,
    counts: {},
  });
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || inFlight.current) return;

    inFlight.current = true;

    try {
      const { data } = await axiosClient.get("/notifications/summary");

      setState({
        notifications: data.notifications,
        unread: data.unread,
        counts: data.counts || {},
      });
    } catch {
      // keep what we have; the next check will try again
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [enabled]);

  // On load and whenever the page changes
  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  // Regular checks while the tab is open, plus when you come back to it
  useEffect(() => {
    if (!enabled) return undefined;

    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const timer = setInterval(tick, POLL_MS);

    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    window.addEventListener(REFRESH_EVENT, refresh);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
      window.removeEventListener(REFRESH_EVENT, refresh);
    };
  }, [enabled, refresh]);

  const markAllRead = useCallback(async () => {
    // Update the screen first, then tell the server
    setState((current) => ({
      ...current,
      unread: 0,
      notifications: current.notifications.map((item) => ({
        ...item,
        unread: false,
      })),
    }));

    try {
      await axiosClient.post("/notifications/read-all");
    } catch {
      refresh();
    }
  }, [refresh]);

  const value = useMemo(
    () => ({ ...state, loading, refresh, markAllRead }),
    [state, loading, refresh, markAllRead],
  );

  return (
    <SummaryContext.Provider value={value}>{children}</SummaryContext.Provider>
  );
};

export const useSummary = () => useContext(SummaryContext);
