import { Megaphone } from "lucide-react";

const items = [
  "🩺 Day 1 keynote starts at 9:00 AM — Main Auditorium",
  "💊 Workshop: Advanced Cardiac Imaging — Hall B at 2:00 PM",
  "🧬 New: AI in Diagnostics panel added to the schedule",
  "☕ Networking break with sponsors — 10:30 AM in the Atrium",
  "📜 CME credits available for all live sessions",
  "🎓 Don't miss the Closing Awards Ceremony tonight at 8 PM",
];

export function NewsTicker() {
  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground border-y border-secondary/30">
      <div className="flex items-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-semibold text-xs uppercase tracking-wider shrink-0 z-10">
          <Megaphone className="h-3.5 w-3.5" />
          Live News
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="ticker flex whitespace-nowrap py-2.5">
            {[...items, ...items].map((t, i) => (
              <span key={i} className="px-8 text-sm flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary inline-block" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
