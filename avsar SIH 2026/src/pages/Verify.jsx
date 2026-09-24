// Public credential check. Recomputes the signature offline, with no account and no
// backend. Tampered codes fail loudly, revoked codes stay visible as revoked with the
// payload intact, because a record that can quietly disappear is not a record.
//
// Two versions are accepted. v1 is a hash over the envelope and has been printed on QRs
// already, so it must keep working forever. v2 carries a real ECDSA signature, which is
// why this page awaits: a hash answers immediately and a signature does not.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Page, Card, H2, Chip, Badge, Skeleton } from "../components/ui.jsx";
import { checkCredentialAny, isV2 } from "../lib/verify.js";
import { modeLabel } from "../lib/sign.js";

export default function Verify() {
  const { code } = useParams();
  const raw = decodeURIComponent(code || "");
  const [state, setState] = useState({ pending: true });

  useEffect(() => {
    let alive = true;
    checkCredentialAny(raw)
      .then((res) => alive && setState({ pending: false, res }))
      .catch((err) => alive && setState({ pending: false, res: { ok: false, reason: err?.message || "unreadable code" } }));
    return () => {
      alive = false;
    };
  }, [raw]);

  if (state.pending) {
    return (
      <Page title="verify" sub="credential check">
        <Card>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-3 h-4 w-64" />
        </Card>
      </Page>
    );
  }

  const res = state.res;
  if (!res.ok) {
    return (
      <Page title="verify" sub="credential check">
        <Card>
          <H2>Invalid signature</H2>
          <p className="font-mono text-sm text-red-400">[!!] {res.reason}</p>
          <p className="mt-2 text-sm text-zinc-400">
            Valid credentials are signed by the device that issued them. Ask the student for a fresh link.
            {res.mode === "ecdsa-p256" && " This code carries a signature that does not match what it claims, so it was altered after it was issued."}
          </p>
          {res.mode && <Badge tone="zinc" className="mt-3">{modeLabel(res.mode)}</Badge>}
        </Card>
      </Page>
    );
  }

  const p = res.payload || {};
  const isReceipt = isV2(raw);
  return (
    <Page title="verify" sub="credential check">
      {res.revoked && (
        <Card className="mb-4 border-red-900">
          <H2>REVOKED by issuer</H2>
          <p className="border-l-2 border-red-400 py-1 pl-3 font-mono text-sm text-red-300">{res.revoked.reason}</p>
          <p className="mt-1 font-mono text-xs text-red-400/70">
            revoked {new Date(res.revoked.at).toLocaleDateString()} · the history below stays visible on purpose
          </p>
        </Card>
      )}
      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <H2 className="mb-0">Valid signature</H2>
          {res.weak ? <Badge tone="amber">weaker hash mode</Badge> : <Badge tone="green">ECDSA P-256</Badge>}
          <Badge tone="zinc">{isReceipt ? "v2 receipt" : "v1 credential"}</Badge>
        </div>

        {isReceipt ? (
          <>
            <p className="font-mono text-2xl text-zinc-50">
              {p.score != null ? `${p.score}/100` : "graded submission"}
              {p.passed != null && <span className="ml-2 text-sm text-zinc-500">{p.passed ? "passed" : "below the bar"}</span>}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              submission {p.submissionId || "unknown"} · challenge {p.challengeId || "unknown"} · lane {p.lane || "unknown"}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.skill && <Chip tone="green">{p.skill}</Chip>}
              {res.kid && <Chip>key {String(res.kid).slice(0, 10)}</Chip>}
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-2xl text-zinc-50">
              {p.name} <span className="text-zinc-500">· readiness {p.readiness}/100</span>
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              id {p.id} · signed {p.at ? new Date(p.at).toLocaleDateString() : "unknown"}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(p.skills || []).map((s) => (
                <Chip key={s} tone="green">{s} ✓</Chip>
              ))}
              {(p.skills || []).length === 0 && <Chip>no verified skills yet</Chip>}
            </div>
          </>
        )}

        <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] leading-5 text-zinc-600">
          {res.weak
            ? "Checked by recomputing a hash in your browser. That catches an altered record, but it is not a signature, and this page will not pretend otherwise."
            : "Checked by verifying an ECDSA signature in your browser. Nothing was uploaded. The signature proves the record is unchanged; pinning the key separately is what would prove who issued it."}
        </p>
      </Card>
      <p className="mt-4 text-sm text-zinc-500">
        <Link to="/" className="text-blurple-soft underline underline-offset-4">get your own passport</Link>
      </p>
    </Page>
  );
}
