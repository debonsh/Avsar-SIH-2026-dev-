import { Page, Card, Btn } from "../components/ui.jsx";

const AUDIENCES = [
  { to: "/resume", title: "Students: score your resume", body: "Paste your resume, get a transparent ATS score with the exact fixes that raise it." },
  { to: "/jobs", title: "Students: find and track roles", body: "Open roles matched to your skills, with a pipeline that follows every application." },
  { to: "/institute", title: "Colleges: see cohort readiness", body: "Average scores, skill gaps across the batch, and one-click CSV for placement cells." },
  { to: "/faculty", title: "Faculty: track development", body: "FDP listings by theme, with interest tracking for your growth record." },
];

const STEPS = [
  { n: "1", title: "Score", body: "Upload your resume on the Resume page. Five scored dimensions, every point explained." },
  { n: "2", title: "Close gaps", body: "Quests turn each missing skill into a course plus a mini project with proof." },
  { n: "3", title: "Apply", body: "Eligible roles unlock on the Jobs page as your score and proof grow." },
];

export default function Home() {
  return (
    <Page
      title="From campus to corporate, with proof at every step"
      sub="A career readiness tracker for students, colleges, and faculty. Free courses, verified projects, and a job pipeline in one place."
      actions={
        <>
          <Btn to="/resume">Score your resume</Btn>
          <Btn to="/jobs" variant="quiet">Browse open roles</Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {AUDIENCES.map((a) => (
          <Card key={a.to}>
            <h2 className="text-base font-semibold text-zinc-900">{a.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{a.body}</p>
            <Btn to={a.to} variant="quiet" className="mt-4">
              Open
            </Btn>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold text-zinc-900">How it works</h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <Card key={s.n}>
            <p className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-sm font-semibold text-white">{s.n}</p>
            <h3 className="mt-3 text-base font-semibold text-zinc-900">{s.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{s.body}</p>
          </Card>
        ))}
      </ol>
    </Page>
  );
}
