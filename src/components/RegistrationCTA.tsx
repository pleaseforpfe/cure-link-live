import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function RegistrationCTA() {
  return (
    <section className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 p-8 md:p-12 shadow-card border border-blue-200"
      >
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-3">
              Join Us for the 4JMC
            </h2>
            <p className="text-blue-800/80 text-lg max-w-2xl">
              Register now to secure your spot at the 4èmes Journées Médico-Chirurgicales. Limited seats available for this premium scientific conference.
            </p>
          </div>
          
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeVRQDEVvzojcHZKq3iJRSA9LWVuzjmleR26Vx916ysBEQ5dQ/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center shrink-0"
          >
            <Button
              size="xl"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Registration for the 4JMC
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
