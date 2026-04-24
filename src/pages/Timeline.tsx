import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { speakers, getStatus } from "@/data/speakers";
import { SpeakerCard } from "@/components/SpeakerCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Timeline() {
  const sorted = useMemo(() => {
    const order = { live: 0, upcoming: 1, done: 2 } as const;
    return [...speakers].sort((a, b) => {
      const sa = order[getStatus(a)];
      const sb = order[getStatus(b)];
      if (sa !== sb) return sa - sb;
      return a.startsAt - b.startsAt;
    });
  }, []);

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
                Day 1 · March 14, 2026
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
                Live <span className="gradient-text-hero">Timeline</span>
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                Active sessions appear at the top with a real-time countdown.
                Click any card to open the gallery and full session details.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="container py-16">
          <div className="space-y-5">
            <AnimatePresence>
              {sorted.map((s) => (
                <SpeakerCard key={s.id} speaker={s} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
