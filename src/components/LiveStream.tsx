import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { useLanguage } from "@/contexts/language";
import { useEffect, useMemo, useState } from "react";
import { fetchLiveSession, toYouTubeEmbedUrl } from "@/lib/live";

export function LiveStream() {
  const { t } = useLanguage();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const live = await fetchLiveSession();
        if (!cancelled) setStreamUrl(live?.stream_url ?? null);
      } catch {
        if (!cancelled) setStreamUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const embedUrl = useMemo(() => (streamUrl ? toYouTubeEmbedUrl(streamUrl) : null), [streamUrl]);

  return (
    <section id="live" className="container py-24 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-live/10 text-live text-xs font-bold uppercase tracking-widest mb-4">
          <span className="h-2 w-2 rounded-full bg-live live-pulse" />
          {t.liveStream.kicker}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {t.liveStream.title}
        </h2>
        <p className="text-muted-foreground">
          {t.liveStream.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-5xl mx-auto"
      >
        <div className="absolute -inset-4 bg-gradient-secondary rounded-[2rem] blur-2xl opacity-30" />
        <div className="relative rounded-3xl overflow-hidden shadow-elegant border border-border/50 bg-card">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-live text-live-foreground text-xs font-bold uppercase tracking-widest live-glow">
            <Radio className="h-3 w-3 live-pulse" />
            {t.liveStream.badge}
          </div>
          <div className="aspect-video bg-black">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">Loading stream...</div>
            ) : embedUrl ? (
              <iframe
                className="w-full h-full"
                src={`${embedUrl}?autoplay=0&mute=1`}
                title={t.liveStream.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
                No live stream right now.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
