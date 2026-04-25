import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import speakerFallback from "@/assets/speaker-1.png";
import { SpeakerCard, type TimelineSession, getTimelineStatus } from "@/components/SpeakerCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language";

export default function Timeline() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<TimelineSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("timeline_cards")
        .select(
          "id, full_name, specialty, organization, photo_url, linkedin_url, talk_title, description, starts_at, ends_at, links, gallery, is_live, stream_url, sort_order",
        )
        .order("sort_order", { ascending: true })
        .order("starts_at", { ascending: true });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setSessions([]);
        setLoading(false);
        return;
      }

      const next = (data ?? []).map((row) => {
        const r = row as {
          id: string;
          full_name: string;
          specialty: string;
          organization: string;
          photo_url: string | null;
          talk_title: string;
          description: string | null;
          starts_at: string;
          ends_at: string;
          links: { label: string; url: string }[];
          gallery: string[];
          is_live: boolean;
          stream_url: string | null;
        };

        const startsAt = new Date(r.starts_at).getTime();
        const endsAt = new Date(r.ends_at).getTime();

        const startTime = new Date(r.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const endTime = new Date(r.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        return {
          id: r.id,
          fullName: r.full_name,
          photo: r.photo_url || speakerFallback,
          specialtyLine: `${r.specialty} · ${r.organization}`,
          talkTitle: r.talk_title,
          timeLabel: `${startTime} — ${endTime}`,
          startsAt: Number.isFinite(startsAt) ? startsAt : Date.now(),
          endsAt: Number.isFinite(endsAt) ? endsAt : Date.now(),
          description: r.description,
          links: Array.isArray(r.links) ? r.links : [],
          gallery: Array.isArray(r.gallery) ? r.gallery : [],
          isLive: r.is_live,
          streamUrl: r.stream_url,
        } satisfies TimelineSession;
      });

      setSessions(next);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const order = { live: 0, upcoming: 1, done: 2 } as const;
    return [...sessions].sort((a, b) => {
      const sa = order[getTimelineStatus(a)];
      const sb = order[getTimelineStatus(b)];
      if (sa !== sb) return sa - sb;
      return a.startsAt - b.startsAt;
    });
  }, [sessions]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">
                {t.liveProgramHero.kicker}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
                {t.liveProgramHero.title}
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                {t.liveProgramHero.description}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="container py-16">
          <div className="space-y-5">
            <AnimatePresence>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading live program…</div>
              ) : error ? (
                <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
              ) : sorted.length ? (
                sorted.map((s) => <SpeakerCard key={s.id} session={s} />)
              ) : (
                <div className="text-sm text-muted-foreground">No sessions yet.</div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
