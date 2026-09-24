import { useEffect, useMemo, useState } from "react";
import { Page, Card, H2, Btn, Chip, Empty, Badge } from "../components/ui.jsx";
import { COHORT, cohortStats, enrich, toCSV } from "../lib/cohort.js";
import { bundledCorpus } from "../lib/corpus.js";
import { marketSignals } from "../lib/market.js";
import { freshestAt } from "../lib/dates.js";
import { districtDemand, unmetDemand, capacityPlan, privacyAggregate, DEFAULT_K, DEFAULT_BATCH } from "../lib/district.js";
import { canonSkill, skillById } from "../data/taxonomy.js";
import { loadIssuerKey, signPayload, modeLabel } from "../lib/sign.js";
import { codeFromReceipt, verifyUrl } from "../lib/verify.js";
import { ReceiptCard } from "../components/Receipt.jsx";
import { loadAssessments, loadRemoteAssessments, loadFeedback, loadRemoteFeedback, analyticsSummary } from "../lib/backend.js";

// Real placement data first (local mirror, then Supabase). The demo cohort
// below is labeled as sample data, never presented as a real college (R-38).
export default function Institute() {
  const [real, setReal] = useState(() => loadAssessments());
  const [feedback, setFeedback] = useState(() => loadFeedback());
  // demand is read per lane and never averaged across them: an ayurveda batch plan and a
  // software batch plan are different decisions, and a mixed figure would be neither.
  const [lane, setLane] = useState("ayush");
  // k is a control rather than a constant because a demo cohort of eight will suppress most
  // buckets at the default, and a reader who lowers it should see exactly what that costs.
  const [k, setK] = useState(DEFAULT_K);
  const [signed, setSigned] = useState(null);
  // The export signs its own figures, so a district officer who receives the file can tell
  // whether the numbers changed after it left this device. It carries counts and a lane, never
  // a student record, which is what makes publishing it defensible.
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRemoteAssessments().then((r) => { if (r && r.length) setReal(r); }).catch(() => {});
    loadRemoteFeedback().then((r) => { if (r) setFeedback(r); }).catch(() => {});
  }, []);

  const summary = analyticsSummary(real, feedback);

  const corpus = useMemo(() => bundledCorpus(lane), [lane]);
  const demand = useMemo(() => marketSignals(corpus, { lane, limit: 8 }), [corpus, lane]);
  const freshest = useMemo(() => freshestAt(corpus), [corpus]);
  const demandMax = Math.max(1, ...demand.rows.map((r) => r.postings));

  // --- district thermometer ------------------------------------------------------------
  // Demand comes from the corpus. Supply comes from the cohort's own gap list, inverted: a
  // student who reports a gap is a student who cannot meet that demand, so the rest of the
  // cohort is the local supply. Supply is only known for the skills the cohort reports on,
  // and the panel says so instead of assuming everyone can do everything.
  const district = useMemo(() => districtDemand(corpus, { limit: 8 }), [corpus]);
  const cohort = useMemo(() => COHORT.filter((r) => (lane === "ayush" ? r.role === "ayush" : r.role !== "ayush")), [lane]);
  const gapCounts = useMemo(() => {
    const m = new Map();
    for (const r of cohort) for (const g of r.gaps || []) {
      const key = canonSkill(g);
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [cohort]);
  const supply = useMemo(() => {
    const m = new Map();
    for (const [skill, missing] of gapCounts) m.set(skill, Math.max(0, cohort.length - missing));
    return m;
  }, [gapCounts, cohort]);
  const unmet = useMemo(
    () => unmetDemand(district, supply).filter((r) => supply.has(r.skill)),
    [district, supply]
  );
  const supplyUnknown = useMemo(
    () => unmetDemand(district, supply).filter((r) => !supply.has(r.skill)).length,
    [district, supply]
  );
  const plan = useMemo(() => capacityPlan(unmet, { batchSize: DEFAULT_BATCH }), [unmet]);
  // The aggregate is over students, not postings, because k-anonymity protects people. A
  // posting count is not a person and withholding it would protect nobody.
  const agg = useMemo(
    () => privacyAggregate([...gapCounts].map(([skill, count]) => ({ key: skill, count, lane })), k),
    [gapCounts, k, lane]
  );

  async function exportAggregate() {
    if (exporting) return;
    setExporting(true);
    try {
      const payload = {
        kind: "avsar-district-aggregate",
        lane,
        k,
        cohort: cohort.length,
        buckets: agg.buckets.map((b) => ({ skill: b.key, count: b.count })),
        suppressedBuckets: agg.suppressed.length,
        suppressedStudents: agg.suppressedCount,
        at: new Date().toISOString(),
      };
      const key = await loadIssuerKey();
      const receipt = await signPayload(payload, key);
      const code = codeFromReceipt(receipt);
      const columns = ["skill", "count", ...agg.buckets.map((b) => b.key)];
      const csv = [
        columns.slice(0, 2).join(","),
        ...payload.buckets.map((b) => `${b.skill},${b.count}`),
        `suppressed_buckets,${payload.suppressedBuckets}`,
        `suppressed_students,${payload.suppressedStudents}`,
        `k,${payload.k}`,
        `lane,${payload.lane}`,
      ].join("\n");
      const blob = new Blob([JSON.stringify({ receipt, csv }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avsar-district-${lane}-${payload.at.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSigned({ receipt, code });
    } finally {
      setExporting(false);
    }
  }


  function downloadCSV(rows, name) {
    const blob = new Blob([toCSV(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!real.length) {
    const stats = cohortStats(COHORT);
    const rows = enrich(COHORT);
    return (
      <Page
        title="Institute"
        sub="Cohort readiness for placement cells. Showing sample data until your students score."
        actions={<Btn variant="quiet" onClick={() => downloadCSV(rows, "sample-cohort.csv")}>Export sample CSV</Btn>}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><H2>Students</H2><p className="text-3xl font-semibold tabular-nums">{stats.total}</p><p className="text-xs text-zinc-400">sample cohort</p></Card>
          <Card><H2>Gold or better</H2><p className="text-3xl font-semibold tabular-nums">{stats.goldPct}%</p><p className="text-xs text-zinc-400">readiness 65+</p></Card>
          <Card><H2>Scored</H2><p className="text-3xl font-semibold tabular-nums">{stats.funnel.scored}</p><p className="text-xs text-zinc-400">have a resume score</p></Card>
          <Card><H2>Applied</H2><p className="text-3xl font-semibold tabular-nums">{stats.funnel.applied}</p><p className="text-xs text-zinc-400">tracked applications</p></Card>
        </div>
        <Card className="mt-4">
          <H2>Average readiness by track</H2>
          <ul className="space-y-1.5">
            {Object.entries(stats.avgByRole).map(([k, v]) => (
              <li key={k} className="flex justify-between text-sm"><span className="text-zinc-400">{k}</span><span className="font-medium tabular-nums">{v}</span></li>
            ))}
          </ul>
          <H2 className="mt-4">Most common gaps</H2>
          <div className="flex flex-wrap gap-1.5">
            {stats.topGaps.map((g) => <Chip key={g.skill}>{g.skill} ({g.n})</Chip>)}
          </div>
        </Card>
        <Card className="mt-4">
          <H2>Policymaker view: live demand vs cohort supply</H2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Btn size="sm" variant={lane === "ayush" ? "primary" : "quiet"} onClick={() => setLane("ayush")}>Ayush lane</Btn>
            <Btn size="sm" variant={lane === "tech" ? "primary" : "quiet"} onClick={() => setLane("tech")}>Tech lane</Btn>
            <Badge tone="zinc">{demand.sample.total} postings, {demand.sample.dated} dated</Badge>
            <Badge tone={freshest ? "zinc" : "amber"}>{freshest ? `freshest ${freshest.slice(0, 10)}` : "no posting in this lane is dated"}</Badge>
          </div>
          <p className="mb-2 text-xs leading-5 text-zinc-400">
            Demand counted from this lane&rsquo;s own feed ({demand.sample.total} postings, never mixed with the other lane).
            {demand.sample.dated === 0 && " No posting in this lane carries a date, so no trend is claimed here."} The mismatch against the gap list above is the curriculum memo.
          </p>
          {demand.rows.length === 0 ? (
            <Empty title="Nothing clears the sample floor" body={`No skill appears in ${demand.sample.minPostings} or more postings in this lane, so no demand ranking is claimed.`} />
          ) : (
            <ul className="space-y-1.5">
              {demand.rows.map((h) => (
                <li key={h.skill} className="flex items-center gap-2 text-xs">
                  <span className="w-32 shrink-0 truncate text-zinc-300">{h.name}</span>
                  <span className="h-2 flex-1 rounded-full bg-zinc-800">
                    <span className="block h-full rounded-full bg-blurple" style={{ width: `${Math.max(4, (h.postings / demandMax) * 100)}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono tabular-nums text-zinc-500">{h.postings}</span>
                  <span className={`w-12 shrink-0 text-right font-mono tabular-nums ${h.weight > 1 ? "text-emerald-400" : h.weight < 1 ? "text-amber-400" : "text-zinc-400"}`}>{h.weight.toFixed(2)}x</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="mt-4">
          <H2>District skills: demand and gaps</H2>
          <p className="mb-3 text-xs leading-5 text-zinc-400">
            Where this lane&rsquo;s demand is, what the cohort can already meet, and the batch plan that closes the rest.
            Demand is read from the same corpus that moves student scores, and it is never mixed across lanes.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {district.length === 0 ? (
              <Empty title="No location in this lane" body="No posting in this lane states a city, so there is no district picture to draw." />
            ) : (
              <ul className="w-full space-y-1.5">
                {district.map((c) => (
                  <li key={c.city} className="flex items-center gap-2 text-xs">
                    <span className="w-32 shrink-0 truncate text-zinc-300" title={c.city}>{c.city}</span>
                    <span className="h-2 flex-1 rounded-full bg-zinc-800">
                      <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, (c.total / Math.max(1, district[0].total)) * 100)}%` }} />
                    </span>
                    <span className="w-8 shrink-0 text-right font-mono tabular-nums text-zinc-500">{c.total}</span>
                    <span className="w-40 shrink-0 truncate text-right text-zinc-600" title={c.skills.map((s) => s.name).join(", ")}>
                      {c.skills.slice(0, 2).map((s) => s.name).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <H2 className="mt-5">What this cohort cannot cover yet</H2>
          {unmet.length === 0 ? (
            <Empty
              title="No overlap between demand and the cohort&rsquo;s own gaps"
              body="Unmet demand needs a skill the market is asking for and the cohort reports as a gap. This lane has no such skill today."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-xs text-zinc-400">
                    <th className="py-1 pr-3 font-medium">Skill</th>
                    <th className="py-1 pr-3 font-medium">City</th>
                    <th className="py-1 pr-3 text-right font-medium">Demand</th>
                    <th className="py-1 pr-3 text-right font-medium">Cohort can meet</th>
                    <th className="py-1 text-right font-medium">Unmet</th>
                  </tr>
                </thead>
                <tbody>
                  {unmet.slice(0, 8).map((r) => (
                    <tr key={`${r.city}-${r.skill}`} className="border-t border-zinc-800">
                      <td className="py-1.5 pr-3 text-zinc-200">{r.name}</td>
                      <td className="py-1.5 pr-3 text-zinc-400">{r.city}</td>
                      <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-zinc-300">{r.demand}</td>
                      <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-zinc-400">{r.supply}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-amber-400">{r.unmet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {supplyUnknown > 0 && (
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">
              {supplyUnknown} demanded skill{supplyUnknown === 1 ? "" : "s"} in this lane are not in any cohort gap list, so
              this cohort&rsquo;s supply for them is unknown. They are left out rather than counted as zero, which would
              have inflated the plan.
            </p>
          )}

          <H2 className="mt-5">Courses to run next</H2>
          {plan.length === 0 ? (
            <p className="text-xs leading-5 text-zinc-400">
              No batch is needed against what this cohort reports. That is a statement about this cohort and this corpus,
              not about the district.
            </p>
          ) : (
            <ul className="space-y-2">
              {plan.slice(0, 6).map((b) => (
                <li key={b.skill} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="min-w-0">
                    <span className="text-zinc-200">{b.name}</span>
                    <span className="ml-2 text-zinc-500">{b.cities.join(", ")}</span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums text-zinc-400">
                    {b.unmet} unmet · {b.batches} batch{b.batches === 1 ? "" : "es"} of {b.batchSize}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-zinc-800 pt-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <H2 className="mb-0">Gaps in this cohort</H2>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                hide groups under
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={k}
                  onChange={(e) => setK(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                  className="w-16 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-200"
                />
              </label>
            </div>
            {agg.error ? (
              <p className="font-mono text-xs text-red-400">{agg.error}</p>
            ) : (
              <>
                {agg.buckets.length === 0 ? (
                  <p className="text-xs leading-5 text-amber-300">
                    Every bucket is below k = {k}, so nothing is published. This cohort has {cohort.length} students and a
                    small cohort suppresses almost everything: that is the control working, not a missing feature. Lower k
                    to see what publishing more would cost.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {agg.buckets.map((b) => (
                      <li key={b.key} className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs">
                        <span className="text-zinc-300">{skillById(b.key)?.name || b.key}</span>
                        <span className="font-mono tabular-nums text-zinc-500">{b.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {agg.suppressed.length > 0 && (
                  <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                    {agg.suppressed.length} bucket{agg.suppressed.length === 1 ? "" : "s"} covering{" "}
                    {agg.suppressedCount} student{agg.suppressedCount === 1 ? "" : "s"} withheld for being below k = {k},
                    and the count of what was withheld is itself published. A suppressed bucket is not a zero, and the
                    reader can tell the difference.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Btn size="sm" onClick={exportAggregate} disabled={exporting}>
                    {exporting ? "Signing" : "Download signed counts"}
                  </Btn>
                  <span className="text-[11px] leading-4 text-zinc-500">
                    Downloads the counts with a signature proving they were not changed. No student record is in the file.
                  </span>
                </div>
                {signed && (
                  <ReceiptCard
                    className="mt-3"
                    receipt={signed.receipt}
                    title="Signature for this export"
                    note={`${signed.receipt.payload.buckets.length} published buckets, ${signed.receipt.payload.suppressedBuckets} withheld at k=${signed.receipt.payload.k}`}
                    action={
                      <a href={verifyUrl(signed.code)} className="font-mono text-[11px] text-blurple-soft underline underline-offset-4">
                        verify this export
                      </a>
                    }
                  />
                )}
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  Nothing personal leaves this device. The file carries counts and a {modeLabel(signed?.receipt?.mode) || "signature"}, never a
                  student record. The figures above never mix lanes, because one bar with an ayurveda cohort beside an
                  engineering cohort would describe a job market that does not exist.
                </p>
              </>
            )}
          </div>
        </Card>
        <Card className="mt-4">
          <H2>Sample cohort roster (demo data)</H2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="text-xs text-zinc-400"><th className="py-1 pr-3 font-medium">Name</th><th className="py-1 pr-3 font-medium">Track</th><th className="py-1 pr-3 font-medium">Readiness</th><th className="py-1 pr-3 font-medium">Rank</th><th className="py-1 font-medium">Applied</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                    <tr key={r.name} className="border-t border-zinc-800">
                    <td className="py-1.5 pr-3 text-zinc-200">{r.name}</td>
                    <td className="py-1.5 pr-3 text-zinc-400">{r.role}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{r.main}</td>
                    <td className="py-1.5 pr-3"><Chip tone={r.main >= 65 ? "green" : "zinc"}>{r.rank}</Chip></td>
                    <td className="py-1.5 text-zinc-400">{r.applied ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Institute"
      sub={`${summary.total} scored assessments on this device and workspace.`}
      actions={<Btn variant="quiet" onClick={() => downloadCSV(real.map((a, i) => ({ name: `student-${i + 1}`, role: a.role_key, ats: a.ats, quiz: 0, quests: 0, main: a.ats, rank: "", applied: false })), "assessments.csv")}>Export CSV</Btn>}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><H2>Assessments</H2><p className="text-3xl font-semibold tabular-nums">{summary.total}</p></Card>
        <Card><H2>Average rating</H2><p className="text-3xl font-semibold tabular-nums">{summary.avgRating || "not yet"}</p><p className="text-xs text-zinc-400">{summary.ratingCount} ratings</p></Card>
        {Object.entries(summary.byRole).slice(0, 2).map(([k, v]) => (
          <Card key={k}><H2>Track: {k}</H2><p className="text-3xl font-semibold tabular-nums">{v}</p></Card>
        ))}
      </div>
      <Card className="mt-4">
        <H2>Score bands (resume score)</H2>
        <ul className="space-y-1.5">
          {Object.entries(summary.bands).map(([b, n]) => (
            <li key={b} className="flex justify-between text-sm"><span className="text-zinc-400">{b}</span><span className="font-medium tabular-nums">{n}</span></li>
          ))}
        </ul>
        {summary.comments.length > 0 && (
          <>
            <H2 className="mt-4">Latest student comments</H2>
            <ul className="space-y-1.5">
              {summary.comments.map((c, i) => <li key={i} className="text-sm text-zinc-400">{c.rating ? `${c.rating}/5: ` : ""}{c.comment}</li>)}
            </ul>
          </>
        )}
        {summary.comments.length === 0 && (
          <div className="mt-4">
            <Empty title="No feedback yet" body="Students can leave a star rating on their Portfolio page. It appears here." />
          </div>
        )}
      </Card>
    </Page>
  );
}
