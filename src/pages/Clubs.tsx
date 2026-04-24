import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

const clubs = [
  {
    id: "cardio",
    name: "Cardio Club",
    icon: "❤️",
    desc: "A community of cardiologists pushing the frontier of preventive heart health, interventional techniques, and digital cardiology.",
    gallery: [event1, event2, event3],
  },
  {
    id: "neuro",
    name: "Neuro Society",
    icon: "🧠",
    desc: "Neurology, neurosurgery and neuroscience meet here. Monthly journal clubs, case-based discussions and hands-on cadaver labs.",
    gallery: [event2, event3, event1],
  },
  {
    id: "surgery",
    name: "Surgical Innovators",
    icon: "🔬",
    desc: "Robotic, laparoscopic and AR-guided surgery — explored, debated and demonstrated by leading surgeons from across the globe.",
    gallery: [event3, event1, event2],
  },
  {
    id: "pediatrics",
    name: "Pediatric Care",
    icon: "👶",
    desc: "From neonatology to adolescent medicine — championing better outcomes for the youngest patients.",
    gallery: [event1, event3, event2],
  },
  {
    id: "research",
    name: "Research & AI",
    icon: "🧬",
    desc: "Where bench science, clinical research and machine learning collide. The home of MedConf's data-science community.",
    gallery: [event2, event1, event3],
  },
];

export default function Clubs() {
  const [active, setActive] = useState(clubs[0].id);
  const club = clubs.find((c) => c.id === active)!;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28 text-center">
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">
              Post-Café Expo
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
              Specialty <span className="gradient-text-hero">Clubs</span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Discover the communities that meet in the Atrium during every coffee break.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {clubs.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
                  active === c.id
                    ? "bg-gradient-secondary text-secondary-foreground shadow-glow"
                    : "bg-card border border-border hover:border-secondary"
                )}
              >
                <span className="mr-1.5">{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl bg-card border border-border shadow-elegant overflow-hidden"
            >
              <div className="grid md:grid-cols-[1fr_1.5fr]">
                <div className="p-10 bg-gradient-primary text-primary-foreground flex flex-col justify-center">
                  <div className="text-7xl mb-4">{club.icon}</div>
                  <h2 className="text-3xl font-bold mb-3">{club.name}</h2>
                  <p className="text-primary-foreground/80 leading-relaxed">{club.desc}</p>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="col-span-2 aspect-video rounded-2xl overflow-hidden">
                    <img src={club.gallery[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  {club.gallery.slice(1).map((g, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden">
                      <img src={g} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
      <Footer />
    </div>
  );
}
