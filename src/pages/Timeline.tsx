import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import speakerFallback from "@/assets/speaker-1.png";
import { SpeakerCard, type TimelineSession, getTimelineStatus } from "@/components/SpeakerCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language";

type SessionRow = {
  id: string;
  title: string;
};

type ModeratorRow = {
  session_id: string;
  full_name: string;
};

type ProgramRow = TimelineSession & {
  session_id: string | null;
};

type SessionGroup = {
  id: string;
  title: string;
  moderators: string[];
  programs: TimelineSession[];
  livePrograms: TimelineSession[];
};

export default function Timeline() {
  const { t } = useLanguage();
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const [sessionsRes, moderatorsRes, programsRes] = await Promise.all([
        supabase.from("sessions").select("id, title").order("created_at", { ascending: true }),
        supabase.from("moderators").select("session_id, full_name").order("created_at", { ascending: true }),
        supabase
          .from("timeline_cards")
          .select(
            "id, full_name, specialty, organization, photo_url, linkedin_url, talk_title, description, starts_at, ends_at, links, gallery, is_live, stream_url, sort_order, session_id",
          )
          .order("sort_order", { ascending: true })
          .order("starts_at", { ascending: true }),
      ]);

      if (cancelled) return;
      if (sessionsRes.error) {
        setError(sessionsRes.error.message);
        setSessionGroups([]);
        setLoading(false);
        return;
      }
      if (moderatorsRes.error) {
        setError(moderatorsRes.error.message);
        setSessionGroups([]);
        setLoading(false);
        return;
      }
      if (programsRes.error) {
        setError(programsRes.error.message);
        setSessionGroups([]);
        setLoading(false);
        return;
      }

      const programRows = (programsRes.data ?? []) as ProgramRow[];
      const sessionRows = (sessionsRes.data ?? []) as SessionRow[];
      const moderatorRows = (moderatorsRes.data ?? []) as ModeratorRow[];

      const next = programRows.map((row) => {
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

      const grouped = sessionRows.map((session) => {
        const programsForSession = next.filter((program) => (programRows.find((row) => row.id === program.id)?.session_id ?? null) === session.id);
        const moderatorsForSession = moderatorRows.filter((moderator) => moderator.session_id === session.id).map((moderator) => moderator.full_name);
        const livePrograms = programsForSession.filter((program) => getTimelineStatus(program) === "live");
        return {
          id: session.id,
          title: session.title,
          moderators: moderatorsForSession,
          programs: programsForSession,
          livePrograms,
        } satisfies SessionGroup;
      });

      setSessionGroups(grouped.filter((group) => group.programs.length > 0));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedSessionGroups = useMemo(() => {
    return [...sessionGroups].sort((a, b) => {
      const aLive = a.livePrograms.length > 0 ? 1 : 0;
      const bLive = b.livePrograms.length > 0 ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;

      const aFirst = Math.min(...a.programs.map((p) => p.startsAt));
      const bFirst = Math.min(...b.programs.map((p) => p.startsAt));
      return aFirst - bFirst;
    });
  }, [sessionGroups]);

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
          <div className="space-y-8">
            <AnimatePresence>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading live program…</div>
              ) : error ? (
                <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
              ) : sortedSessionGroups.length ? (
                <div className="space-y-6">
                  {sortedSessionGroups.map((group) => (
                    <motion.section key={group.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="rounded-3xl border bg-card shadow-card overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-5">
                          <div>
                            <div className="text-xs uppercase tracking-widest text-secondary font-bold">Session</div>
                            <h2 className="text-2xl md:text-3xl font-black">{group.title}</h2>
                            {group.moderators.length ? (
                              <div className="mt-2 text-sm md:text-base font-semibold text-foreground/85">
                                Moderators: <span className="font-semibold text-foreground">{group.moderators.join(" · ")}</span>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            {group.livePrograms.length ? (
                              <span className="px-3 py-1 rounded-full bg-live text-live-foreground text-xs font-bold uppercase tracking-widest">
                                Live
                              </span>
                            ) : null}
                            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-widest">
                              {group.programs.length} programs
                            </span>
                          </div>
                        </div>
                        <div className="p-4 md:p-6 space-y-4">
                          {group.programs.map((program) => (
                            <SpeakerCard key={program.id} session={program} />
                          ))}
                        </div>
                      </div>
                    </motion.section>
                  ))}
                </div>
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
