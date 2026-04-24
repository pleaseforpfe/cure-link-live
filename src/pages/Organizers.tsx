import { motion } from "framer-motion";
import { Linkedin, Facebook, Twitter, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import speaker1 from "@/assets/speaker-1.png";
import speaker2 from "@/assets/speaker-2.png";
import speaker3 from "@/assets/speaker-3.png";
import speaker4 from "@/assets/speaker-4.png";

const team = [
  { name: "Dr. Marcus Chen", role: "Conference Chair", photo: speaker1 },
  { name: "Dr. Sofia Ramirez", role: "Scientific Director", photo: speaker2 },
  { name: "Prof. Hans Müller", role: "Program Lead", photo: speaker3 },
  { name: "Dr. Amelia Brooks", role: "Partnerships", photo: speaker4 },
  { name: "Dr. Marcus Chen", role: "Communications", photo: speaker1 },
  { name: "Dr. Sofia Ramirez", role: "Operations", photo: speaker2 },
  { name: "Prof. Hans Müller", role: "Workshops Lead", photo: speaker3 },
  { name: "Dr. Amelia Brooks", role: "Volunteer Coordinator", photo: speaker4 },
];

export default function Organizers() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28 text-center">
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">
              The team behind it all
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
              Meet the <span className="gradient-text-hero">Organizers</span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              A volunteer team of physicians, researchers and students dedicated to building the world's best medical conference.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative rounded-3xl bg-card border border-border overflow-hidden card-hover"
              >
                <div className="aspect-[4/5] bg-gradient-to-br from-secondary/20 to-primary/20 overflow-hidden">
                  <img
                    src={m.photo}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="text-xs uppercase tracking-widest text-secondary font-bold mb-1">{m.role}</div>
                  <h3 className="text-lg font-bold mb-3">{m.name}</h3>
                  <div className="flex gap-2">
                    {[Linkedin, Facebook, Twitter, Mail].map((Icon, idx) => (
                      <a key={idx} href="#" className="h-8 w-8 rounded-full bg-muted hover:bg-secondary hover:text-secondary-foreground flex items-center justify-center transition-colors">
                        <Icon className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
