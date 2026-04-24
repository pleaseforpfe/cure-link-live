import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";
import hero from "@/assets/hero-bg.jpg";

const items = [
  { src: event1, title: "Main Stage Poster", category: "Poster" },
  { src: hero, title: "Welcome Badge", category: "Badge" },
  { src: event2, title: "Schedule Mockup", category: "UI" },
  { src: event3, title: "Workshop Banner", category: "Poster" },
  { src: event1, title: "Mobile App", category: "UI" },
  { src: hero, title: "VIP Pass", category: "Badge" },
  { src: event2, title: "Sponsor Wall", category: "Poster" },
  { src: event3, title: "Web Dashboard", category: "UI" },
];

export default function Portfolio() {
  const [zoomed, setZoomed] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28 text-center">
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">
              Visual Identity
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
              Design <span className="gradient-text-hero">Portfolio</span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Posters, badges and product mockups crafted by the MedConf design team.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((it, i) => (
              <motion.button
                key={i}
                onClick={() => setZoomed(i)}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-muted text-left card-hover"
              >
                <img src={it.src} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                  <div className="text-[10px] uppercase tracking-widest text-secondary-glow font-bold">{it.category}</div>
                  <div className="font-bold text-sm">{it.title}</div>
                </div>
                <div className="absolute top-3 right-3 h-8 w-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-3.5 w-3.5 text-white" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </main>
      <Footer />

      <AnimatePresence>
        {zoomed !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
          >
            <button className="absolute top-6 right-6 h-12 w-12 rounded-full glass flex items-center justify-center text-white">
              <X className="h-5 w-5" />
            </button>
            <motion.img
              key={zoomed}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={items[zoomed].src}
              alt=""
              className="max-h-[88vh] max-w-[92vw] rounded-3xl shadow-elegant"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
