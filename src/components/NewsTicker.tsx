import { Megaphone, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/language";

export function NewsTicker() {
  const { t } = useLanguage();
  const items = t.newsTicker.items;

  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground border-y border-secondary/30">
      <div className="flex items-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-semibold text-xs uppercase tracking-wider shrink-0 z-10">
          <Megaphone className="h-3.5 w-3.5" />
          {t.newsTicker.label}
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="ticker flex whitespace-nowrap py-2.5">
            {[...items, ...items].map((t, i) => (
              <span key={i} className="px-8 text-sm flex items-center gap-2">
                <Activity className="h-3 w-3 text-secondary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
