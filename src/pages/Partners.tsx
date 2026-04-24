import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const partners = [
  { name: "Pfizer", tier: "Platinum" },
  { name: "Roche", tier: "Platinum" },
  { name: "Novartis", tier: "Platinum" },
  { name: "Johnson & Johnson", tier: "Gold" },
  { name: "Merck", tier: "Gold" },
  { name: "AstraZeneca", tier: "Gold" },
  { name: "Sanofi", tier: "Gold" },
  { name: "Bayer", tier: "Silver" },
  { name: "GSK", tier: "Silver" },
  { name: "Eli Lilly", tier: "Silver" },
  { name: "Medtronic", tier: "Silver" },
  { name: "Siemens Healthineers", tier: "Silver" },
];

export default function Partners() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28 text-center">
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">
              Trusted by global leaders
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
              Our <span className="gradient-text-hero">Partners</span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Twelve years of collaboration with the world's most respected names in healthcare and life sciences.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {partners.map((p, i) => (
              <motion.a
                href="#"
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group relative aspect-[5/3] rounded-2xl bg-card border border-border flex flex-col items-center justify-center p-6 card-hover overflow-hidden"
              >
                <div className="absolute top-3 right-3 text-[9px] uppercase tracking-widest font-bold opacity-60 group-hover:opacity-100 transition-opacity"
                     style={{ color: p.tier === "Platinum" ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground))" }}>
                  {p.tier}
                </div>
                <div className="text-xl md:text-2xl font-extrabold tracking-tight grayscale group-hover:grayscale-0 transition-all bg-gradient-primary bg-clip-text text-transparent group-hover:bg-gradient-secondary">
                  {p.name}
                </div>
                <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-5 transition-opacity" />
              </motion.a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
