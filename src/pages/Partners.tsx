import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

type PartnerCategory = "clubs" | "media" | "sponsors";

type PartnerRow = {
  id: string;
  category: PartnerCategory;
  name: string;
  description: string;
  image_url: string;
};

export default function Partners() {
  const { t } = useLanguage();
  const groupCopy = t.partnersGroups;
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("partners")
        .select("id, category, name, description, image_url")
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as PartnerRow[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const by: Record<PartnerCategory, PartnerRow[]> = { clubs: [], media: [], sponsors: [] };
    for (const r of rows) by[r.category].push(r);
    return by;
  }, [rows]);

  const partnerGroups = useMemo(() => {
    return (["clubs", "media", "sponsors"] as const).map((id) => ({ id, partners: grouped[id] }));
  }, [grouped]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28 text-center">
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">
              {t.partnersHero.kicker}
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
              {t.partnersHero.title}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {t.partnersHero.description}
            </p>
          </div>
        </section>

        <section className="container py-16">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading partners...</div>
          ) : error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <div className="space-y-12">
              {partnerGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">
                        {groupCopy[group.id].title}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold">
                        {groupCopy[group.id].title} {groupCopy.groupLabel}
                      </h2>
                    </div>
                    <p className="text-muted-foreground max-w-md">{groupCopy[group.id].description}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.partners.map((p, i) => (
                      <motion.article
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="group rounded-3xl bg-card border border-border overflow-hidden card-hover"
                      >
                        <div className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-secondary text-secondary-foreground font-bold flex items-center justify-center">
                              {p.name
                                .split(" ")
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="text-lg font-bold leading-tight">{p.name}</div>
                              <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.description}</div>
                            </div>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-muted group-hover:bg-secondary/20 transition-colors" />
                        </div>
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={p.image_url}
                            alt={`${p.name} partner`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
                        </div>
                      </motion.article>
                    ))}
                    {group.partners.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No partners yet.</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
