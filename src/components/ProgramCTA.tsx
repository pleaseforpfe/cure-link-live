import { Download } from "lucide-react";
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
        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-3">
              {t.programCta.fileInfo}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t.programCta.title}</h2>
            <p className="text-primary-foreground/80 max-w-xl">{t.programCta.description}</p>
          </div>
          <Button
            size="xl"
            variant="hero"
            className="shrink-0"
            disabled={loading || !file?.file_url}
            onClick={() => {
              if (!file?.file_url) return;
              void downloadPublicFile({ url: file.file_url, fileName: `${file.title || "Program"}.pdf` });
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            {t.programCta.button}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
