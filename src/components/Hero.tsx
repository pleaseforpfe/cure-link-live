import { motion } from "framer-motion";
import { Calendar, MapPin, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

export function Hero() {
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
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/20 text-xs font-medium uppercase tracking-widest mb-6">
            <Sparkles className="h-3.5 w-3.5 text-secondary-glow" />
            International Medical Summit · Edition 12
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6">
            <span className="block">The Future of</span>
            <span className="block gradient-text-hero">Modern Medicine</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-8 leading-relaxed">
            Join 5,000+ physicians, researchers, and innovators for three days of
            breakthrough science, hands-on workshops, and global networking.
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-10 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl glass flex items-center justify-center">
                <Calendar className="h-4 w-4 text-secondary-glow" />
              </div>
              March 14–16, 2026
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl glass flex items-center justify-center">
                <MapPin className="h-4 w-4 text-secondary-glow" />
              </div>
              Geneva Convention Center
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="xl" variant="hero">
              Register Now
            </Button>
            <Button size="xl" variant="glass">
              <Play className="h-4 w-4 mr-1 fill-current" />
              Watch Live
            </Button>
          </div>
        </motion.div>
      </div>

      {/* bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  );
}
