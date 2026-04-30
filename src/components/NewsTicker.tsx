import { Megaphone, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/language";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function NewsTicker() {
  const { t } = useLanguage();
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("home_news_ticker_items")
        .select("title, starts_at, ends_at")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("sort_order", { ascending: true });

      if (cancelled || error || !data) return;
      const next = data.map((row) => row.title).filter(Boolean);
      setItems(next);
    }

    loadItems();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground border-y border-secondary/30">
      <div className="flex items-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-semibold text-xs uppercase tracking-wider shrink-0 z-10">
          <Megaphone className="h-3.5 w-3.5" />
          {t.newsTicker.label}
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="ticker flex whitespace-nowrap py-2.5">
            {items.length > 0 ? [...items, ...items].map((item, i) => (
              <span key={i} className="px-8 text-sm flex items-center gap-2">
                <Activity className="h-3 w-3 text-secondary" />
                {item}
              </span>
            )) : (
              <span className="px-8 text-sm text-white/80">No news items yet.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
