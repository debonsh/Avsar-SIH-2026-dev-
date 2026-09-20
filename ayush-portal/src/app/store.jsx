// App-wide state, one context. LocalStorage is the source of truth, Supabase
// is a best-effort mirror (works fully offline). Pages read the pure lib
// functions directly; only cross-page state lives here.
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { loadJSON, saveJSON } from "../lib/storage.js";
import { loadRole, saveRole } from "../lib/roles.js";
import { funnelCounts, loadJobEvents, recordJobEvent, saveAssessment } from "../lib/backend.js";
import { loadCustomJobs, saveCustomJob } from "../lib/store.js";

const C2CContext = createContext(null);

const K_RESUME = "c2c-resume-v1";
// shares backend.js's c2c-job-events key: recordJobEvent mirrors there, so one
// list serves the pipeline, the dashboard, and the Supabase sync.
const K_EVENTS = "c2c-job-events";
const K_DISMISSED = "c2c-dismissed-v1";

export function C2CProvider({ children }) {
  const [role, setRoleState] = useState(() => loadRole());
  const [resume, setResumeState] = useState(() => loadJSON(K_RESUME, null));
  const [events, setEvents] = useState(() => loadJSON(K_EVENTS, []));
  const [dismissed, setDismissed] = useState(() => loadJSON(K_DISMISSED, []));
  const [customJobs, setCustomJobs] = useState(() => loadCustomJobs());

  const setRole = useCallback((v) => {
    setRoleState(v);
    saveRole(v);
  }, []);

  const saveResume = useCallback(
    (text, result, roleKey) => {
      const row = { text, result, roleKey, at: Date.now() };
      setResumeState(row);
      saveJSON(K_RESUME, row);
      saveAssessment({ role: roleKey, score: result.total, found: result.found, missing: result.missing }).catch(() => {});
    },
    []
  );

  const addEvent = useCallback(async (jobId, event) => {
    await recordJobEvent(jobId, event).catch(() => {});
    setEvents(loadJobEvents());
  }, []);

  const toggleDismiss = useCallback((id) => {
    setDismissed((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveJSON(K_DISMISSED, next);
      return next;
    });
  }, []);

  const addCustomJob = useCallback((job) => {
    saveCustomJob(job);
    setCustomJobs(loadCustomJobs());
  }, []);

  const funnel = useMemo(() => funnelCounts(events), [events]);

  const value = useMemo(
    () => ({ role, setRole, resume, saveResume, events, addEvent, dismissed, toggleDismiss, customJobs, addCustomJob, funnel }),
    [role, setRole, resume, saveResume, events, addEvent, dismissed, toggleDismiss, customJobs, addCustomJob, funnel]
  );
  return <C2CContext.Provider value={value}>{children}</C2CContext.Provider>;
}

// eslint-disable-next-line react/only-export-components -- hook must co-locate with its provider
export function useC2C() {
  const v = useContext(C2CContext);
  if (!v) throw new Error("useC2C must be used inside C2CProvider");
  return v;
}
