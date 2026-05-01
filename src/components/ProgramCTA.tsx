import { Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language";
import { useEffect, useState } from "react";
import { fetchActiveProgramFile, type ActiveProgramFile } from "@/lib/program";
import { downloadPublicFile } from "@/lib/download";

export function ProgramCTA() {
  const { t } = useLanguage();
  const [file, setFile] = useState<ActiveProgramFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const next = await fetchActiveProgramFile();
        if (!cancelled) setFile(next);
      } catch (e) {
        if (!cancelled) setFile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <div className="relative flex flex-col gap-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-3">
              {t.programCta.fileInfo}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t.programCta.title}</h2>
            <p className="text-primary-foreground/80 max-w-xl">{t.programCta.description}</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              size="xl"
              variant="hero"
              className="w-full"
              disabled={loading || !file?.file_url}
              onClick={() => {
                if (!file?.file_url) return;
                void downloadPublicFile({ url: file.file_url, fileName: `${file.title || "Program"}.pdf` });
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              {t.programCta.button}
            </Button>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeVRQDEVvzojcHZKq3iJRSA9LWVuzjmleR26Vx916ysBEQ5dQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                size="xl"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Register Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
