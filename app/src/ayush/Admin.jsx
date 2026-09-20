// [ayush] admin panel: portal health at a glance. google sign-in gate,
// stats, applications per posting, feedback, feed controls. local-first:
// remote rows appear when supabase is keyed. rollback: delete src/ayush/.
import { useEffect, useState } from "react";
import { Page, Card, H2, Btn, Chip } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import Masthead from "./Masthead.jsx";
import { isAdmin, gateLabel } from "./admin.js";
import { getUser, signInWithGoogle, signOut, onAuthChange } from "../lib/auth.js";
import { loadAssessments, loadFeedback, loadArtifacts } from "../lib/backend.js";
import { listApplicants } from "../lib/store.js";
import { AYUSH_JOBS } from "./seed.js";
import { AYUSH_FEED_JOBS, AYUSH_FEED_AT } from "./feed.js";
import { AYUSH_COLLEGES } from "./data.js";

export default function Admin() {
  const { customJobs } = useC2C();
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({ assessments: 0, feedback: [], artifacts: 0 });
  const [apps, setApps] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getUser().then(setUser).catch(() => {});
    onAuthChange(setUser);
    try {
      setCounts({
        assessments: loadAssessments().length,
        feedback: loadFeedback().slice(0, 5),
        artifacts: loadArtifacts().length,
      });
    } catch {
      /* guest storage */
    }
  }, []);

  useEffect(() => {
    if (!isAdmin(user)) return;
    (async () => {
      const out = {};
      for (const j of [...customJobs, ...AYUSH_JOBS.slice(0, 6)]) {
        try {
          out[j.id] = await listApplicants(j.id);
        } catch {
          out[j.id] = [];
        }
      }
      setApps(out);
    })();
  }, [user, customJobs]);

  const ok = isAdmin(user);
  const totalApps = Object.values(apps).reduce((a, r) => a + r.length, 0);

  return (
    <div className="ayush-light bg-[#f4f4f4] pb-4 text-zinc-900">
      <Masthead />
      <Page
        title="admin"
        sub={`portal health · ${gateLabel()}`}
        actions={user
          ? <Btn variant="quiet" onClick={() => signOut().then(() => setUser(null))}>sign out ({user.email})</Btn>
          : <Btn variant="quiet" onClick={() => signInWithGoogle().then((r) => setMsg(r.error || "redirecting…"))}>continue with google</Btn>}
      >
        {msg && <p className="mb-4 font-mono text-xs text-zinc-500">{msg}</p>}
        {!ok ? (
          <Card>
            <H2>{"// locked"}</H2>
            <p className="text-sm leading-6 text-zinc-600">
              sign in with google to open this panel. production locks it to VITE_ADMIN_EMAILS.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                ["roles live", String(AYUSH_JOBS.length + AYUSH_FEED_JOBS.length)],
                ["feed date", AYUSH_FEED_AT],
                ["colleges", String(AYUSH_COLLEGES.length)],
                ["applications", String(totalApps)],
                ["assessments", String(counts.assessments)],
                ["artifacts", String(counts.artifacts)],
                ["feedback", String(loadFeedbackSafe())],
                ["my postings", String(customJobs.length)],
              ].map(([k, v]) => (
                <Card key={k}>
                  <p className="font-mono text-2xl tabular-nums text-zinc-900">{v}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{k}</p>
                </Card>
              ))}
            </div>

            <Card className="mt-4">
              <H2>{"// refresh live data"}</H2>
              <p className="font-mono text-xs leading-5 text-zinc-600">
                run in app/: <span className="bg-zinc-100 px-1.5 py-0.5 text-zinc-900">npm run ayush:feed</span> — scrapes
                ccras vacancies + news, writes src/ayush/feed.js, never blanks on failure.
              </p>
            </Card>

            <Card className="mt-4">
              <H2>{"// applications per posting"}</H2>
              {Object.keys(apps).length === 0 ? (
                <p className="font-mono text-xs text-zinc-500">reading…</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(apps).map(([id, rows]) => (
                    <li key={id} className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2 font-mono text-xs">
                      <span className="truncate text-zinc-700">{String(id).slice(0, 40)}</span>
                      <span className="shrink-0 tabular-nums text-zinc-900">{rows.length} applicants</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {counts.feedback.length > 0 && (
              <Card className="mt-4">
                <H2>{"// latest feedback"}</H2>
                <ul className="space-y-1.5">
                  {counts.feedback.map((f, i) => (
                    <li key={i} className="font-mono text-xs text-zinc-600">
                      <span className="text-zinc-900">{"★".repeat(Math.max(0, Math.min(5, f.rating || 0)))}</span> {(f.comment || "").slice(0, 120)}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip>prototype mode</Chip>
              <Chip>supabase mirror when keyed</Chip>
            </div>
          </>
        )}
      </Page>
    </div>
  );

  function loadFeedbackSafe() {
    try {
      return loadFeedback().length;
    } catch {
      return 0;
    }
  }
}
