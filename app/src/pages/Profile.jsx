import { useState } from "react";
import { Page, Card, H2, Btn, Field, inputCls } from "../components/ui.jsx";
import { PROFILE_QS, loadProfile, saveProfile, clearProfile, toMarkdown, queryFromProfile } from "../lib/profile.js";

const empty = () => Object.fromEntries(PROFILE_QS.map((q) => [q.id, ""]));

// Profile answers personalize the live job search (skills, track, location).
export default function Profile() {
  const [form, setForm] = useState(() => ({ ...empty(), ...(loadProfile() || {}) }));
  const [savedAt, setSavedAt] = useState(() => loadProfile()?.updatedAt || 0);

  function set(id, v) {
    setForm((p) => ({ ...p, [id]: v }));
    setSavedAt(0);
  }

  function save() {
    const v = saveProfile(form);
    setSavedAt(v.updatedAt);
  }

  function clear() {
    clearProfile();
    setForm(empty());
    setSavedAt(0);
  }

  const q = queryFromProfile(form);

  return (
    <Page
      title="Profile"
      sub="Five answers tune your job search. Stored on this device only."
      actions={savedAt > 0 && <Btn to="/jobs" variant="quiet">Search with this profile</Btn>}
    >
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROFILE_QS.map((item) => (
            <Field key={item.id} label={item.q}>
              {item.opts ? (
                <select className={inputCls} value={form[item.id] || ""} onChange={(e) => set(item.id, e.target.value)}>
                  <option value="">Choose</option>
                  {item.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input className={inputCls} value={form[item.id] || ""} onChange={(e) => set(item.id, e.target.value)} placeholder={item.ph || ""} />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn onClick={save}>Save profile</Btn>
          <Btn variant="dangerQuiet" onClick={clear}>Clear everything</Btn>
        </div>
        {savedAt > 0 && (
          <p className="mt-2 text-sm text-green-800">
            Saved. Live search starts with {q.search}{q.remote ? ", remote roles" : ", all locations"}.
          </p>
        )}
      </Card>

      {savedAt > 0 && (
        <Card className="mt-4">
          <H2>Profile summary</H2>
          <pre className="whitespace-pre-wrap text-sm text-zinc-700">{toMarkdown({ ...form, updatedAt: savedAt })}</pre>
        </Card>
      )}
    </Page>
  );
}
