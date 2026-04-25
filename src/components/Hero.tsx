import { motion } from "framer-motion";
import { Calendar, Download, MapPin, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language";
import heroBg from "@/assets/hero-bg.jpg";
import { useEffect, useState } from "react";
import { fetchLiveSession } from "@/lib/live";
import { fetchActiveProgramFile } from "@/lib/program";
import { downloadPublicFile } from "@/lib/download";

export function Hero() {
  const { t } = useLanguage();
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [programUrl, setProgramUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const live = await fetchLiveSession();
        if (!cancelled) setLiveUrl(live?.stream_url ?? null);
      } catch {
        if (!cancelled) setLiveUrl(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const file = await fetchActiveProgramFile();
        if (!cancelled) setProgramUrl(file?.file_url ?? null);
      } catch {
        if (!cancelled) setProgramUrl(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-secondary/30 blur-3xl animate-blob" />
      <div className="absolute top-40 right-10 h-80 w-80 rounded-full bg-primary-glow/40 blur-3xl animate-blob [animation-delay:-4s]" />

      <div className="container relative py-24 md:py-32 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] items-start"
        >
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/20 text-xs font-medium uppercase tracking-widest mb-6">
              <Sparkles className="h-3.5 w-3.5 text-secondary-glow" />
              {t.hero.kicker}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6">
              <span className="block">{t.hero.titleLine1}</span>
              <span className="block gradient-text-hero">{t.hero.titleLine2}</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-8 leading-relaxed">
              {t.hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-10 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl glass flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-secondary-glow" />
                </div>
                {t.hero.date}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl glass flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-secondary-glow" />
                </div>
                {t.hero.location}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl" variant="hero">
                <a href="/timeline">{t.hero.ctaPrimary}</a>
              </Button>
              <Button asChild size="xl" variant="glass" disabled={!liveUrl}>
                <a
                  href={liveUrl ?? "/#live"}
                  target={liveUrl ? "_blank" : "_self"}
                  rel="noreferrer"
                  aria-disabled={!liveUrl}
                  onClick={(e) => {
                    if (!liveUrl) e.preventDefault();
                  }}
                >
                  <Play className="h-4 w-4 mr-1 fill-current" />
                  {t.hero.ctaSecondary}
                </a>
              </Button>
            </div>
          </div>

          <div className="lg:pt-10">
            <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-6 shadow-elegant">
              <div className="text-xs uppercase tracking-widest text-white/70 font-bold mb-2">
                Program PDF
              </div>
              <div className="text-2xl font-extrabold leading-tight mb-2">Download the program</div>
              <p className="text-sm text-white/75 leading-relaxed mb-5">
                Get the full schedule as a PDF. Updated by the organizers.
              </p>
              <Button asChild size="xl" variant="secondary" className="w-full rounded-2xl" disabled={!programUrl}>
                <button
                  type="button"
                  onClick={() => {
                    if (!programUrl) return;
                    void downloadPublicFile({ url: programUrl, fileName: "program.pdf" });
                  }}
                >
                  <span className="inline-flex items-center justify-center">
                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </span>
                </button>
              </Button>
              {!programUrl ? (
                <div className="mt-3 text-xs text-white/60">No program file uploaded yet.</div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>

      {/* bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  );
}
