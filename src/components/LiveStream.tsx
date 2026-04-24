import { motion } from "framer-motion";
import { Radio } from "lucide-react";

export function LiveStream() {
  return (
    <section className="container py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-live/10 text-live text-xs font-bold uppercase tracking-widest mb-4">
          <span className="h-2 w-2 rounded-full bg-live live-pulse" />
          On Air
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Watch the <span className="gradient-text">Live Stream</span>
        </h2>
        <p className="text-muted-foreground">
          Follow every keynote, panel, and workshop in HD — from anywhere in the world.
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
            Live
          </div>
          <div className="aspect-video bg-black">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&mute=1"
              title="Live Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
