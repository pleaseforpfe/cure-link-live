import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ProgramCTA() {
  return (
    <section className="container py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-14 text-primary-foreground shadow-elegant"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/40 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-secondary-glow/30 blur-3xl" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-3">PDF · 4.2 MB</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Download the full program</h2>
            <p className="text-primary-foreground/80 max-w-xl">
              All sessions, speakers, room maps and CME credit details — in one beautifully designed document.
            </p>
          </div>
          <Button size="xl" variant="hero" className="shrink-0">
            <Download className="h-4 w-4 mr-1" />
            Download Program
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
