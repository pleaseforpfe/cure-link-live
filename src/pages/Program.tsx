import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { fetchActiveProgramFile, type ActiveProgramFile } from "@/lib/program";

export default function Program() {
  const [file, setFile] = useState<ActiveProgramFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchActiveProgramFile();
        if (cancelled) return;
        setFile(next);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load program");
        setFile(null);
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary-glow text-xs font-bold uppercase tracking-widest mb-4">
              <FileText className="h-3.5 w-3.5" />
              Program PDF
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">Conference Program</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Download the latest program schedule, sessions, and details.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border bg-card shadow-card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Latest file</div>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : error ? (
                <div className="text-sm text-destructive">{error}</div>
              ) : file ? (
                <div className="min-w-0">
                  <div className="text-xl font-extrabold truncate">{file.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{file.file_url}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No program uploaded yet.</div>
              )}
            </div>

            <Button
              asChild
              size="xl"
              variant="hero"
              className="shrink-0"
              disabled={!file?.file_url || loading || !!error}
            >
              <a href={file?.file_url ?? "#"} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4 mr-1" />
                Download program
              </a>
            </Button>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

