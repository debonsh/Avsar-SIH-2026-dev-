// ponytail: segmented role tabs reuse existing pill pattern, no new deps
import { APP_ROLES } from "../lib/roles";

export default function RoleSwitch({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10" role="tablist" aria-label="Switch portal role">
      {APP_ROLES.map((r) => (
        <button
          key={r.value}
          role="tab"
          aria-selected={value === r.value}
          onClick={() => onChange(r.value)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            value === r.value ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
