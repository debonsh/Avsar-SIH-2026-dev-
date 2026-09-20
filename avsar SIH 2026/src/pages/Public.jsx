// Public passport (/u/:id): the shareable face of a portfolio. Offline it can
// only render the owner's own device data; anyone else gets an honest empty
// state pointing at the QR-signed /verify credential instead of a fake page.
import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Page, Card, H2, Btn, Chip, Empty } from "../components/ui.jsx";
import { useC2C } from "../app/store.jsx";
import { getOrCreateC2CId, loadNickname, loadGithub } from "../lib/identity.js";
import { isVerified } from "../lib/store.js";
import { completedSkillIdsForRole } from "../lib/progress.js";
import { calculateMainScore, questPairsToProof } from "../lib/score.js";
import { loadJSON } from "../lib/storage.js";
import { signCredential, verifyUrl } from "../lib/verify.js";

export default function Public() {
  const { id } = useParams();
  const { role, resume } = useC2C();
  const mine = getOrCreateC2CId();
  const isMine = id === mine;

  const found = resume?.result?.found || [];
  const earned = completedSkillIdsForRole(role);
  const github = loadGithub();
  const verified = found.filter((s) => isVerified(s, earned, github));
  const readiness = resume?.result
    ? calculateMainScore(resume.result.total, loadJSON("c2c-interview-best", 0), questPairsToProof(earned.length), role)
    : 0;
  const code = useMemo(
    () => signCredential({ id: mine, name: loadNickname() || "avsar student", readiness, skills: verified }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot for sharing
    [mine, readiness]
  );

  if (!isMine) {
    return (
      <Page title="Passport not on this device" sub="Public profiles need the network; offline, only the owner's device can render one.">
        <Empty
          title="Ask for their verify link"
          body="Every student carries a QR-signed credential that recomputes offline. That link — not this page — is the proof."
          action={<Btn to="/">Get your own passport</Btn>}
        />
      </Page>
    );
  }

  return (
    <Page title={`${loadNickname() || "Avsar student"}`} sub={`Public passport · ${mine.slice(0, 8)} · readiness ${readiness}/100`}>
      <Card>
        <H2>Verified skills ({verified.length}/{found.length})</H2>
        <div className="flex flex-wrap gap-1.5">
          {found.map((s) => (
            <Chip key={s} tone={isVerified(s, earned, github) ? "green" : "zinc"}>{s}</Chip>
          ))}
          {found.length === 0 && <p className="text-sm text-stone-500">No scored resume on this device yet.</p>}
        </div>
        <p className="mt-4 border-t border-stone-200 pt-3 text-xs leading-5 text-stone-500">
          Trust this page the way you trust any screenshot — verify instead:
        </p>
        <Link to={verifyUrl(code)} className="mt-1 inline-block text-sm font-semibold text-emerald-700 underline underline-offset-4">
          Open the signed credential →
        </Link>
      </Card>
    </Page>
  );
}
