import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

type ClubRow = {
  id: string;
  club_name: string;
  workshop_title: string;
  description: string;
  gallery: string[];
};

export default function Clubs() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ClubRow | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("clubs")
        .select("id, club_name, workshop_title, description, gallery")
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setClubs([]);
        setLoading(false);
        return;
      }

      setClubs((data ?? []) as ClubRow[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const images = clubs.reduce((sum, c) => sum + (Array.isArray(c.gallery) ? c.gallery.length : 0), 0);
    return { clubs: clubs.length, images };
  }, [clubs]);

  const closeModal = () => {
    setSelected(null);
    setActiveIndex(0);
  };

  const nextImage = () => {
    if (!selected) return;
    const list = Array.isArray(selected.gallery) ? selected.gallery : [];
    if (!list.length) return;
    setActiveIndex((prev) => (prev + 1) % list.length);
  };

  const prevImage = () => {
    if (!selected) return;
    const list = Array.isArray(selected.gallery) ? selected.gallery : [];
    if (!list.length) return;
    setActiveIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#002366] dark:text-white">
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,168,232,0.22),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(0,168,232,0.3),_transparent_60%)]" />
          <div className="container relative py-20 md:py-28">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs uppercase tracking-[0.35em] text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-white/70">
                  <span className="h-2 w-2 rounded-full bg-[#00A8E8]" />
                  Clubs & workshops
                </div>
                <h1 className="mt-6 text-4xl md:text-6xl font-semibold leading-tight">Clubs & Workshops</h1>
                <p className="mt-4 text-lg text-slate-600 max-w-2xl dark:text-white/70">
                  Curated sessions led by specialty clubs with live demonstrations, clinical debates, and applied labs.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg dark:border-white/10 dark:bg-white/5">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">Program focus</div>
                <div className="mt-3 text-2xl font-semibold">Hands-on excellence</div>
                <p className="mt-3 text-sm text-slate-600 dark:text-white/70">
                  From diagnostics to simulation, each workshop is structured for practical impact and collaboration.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                  {[
                    { label: "Clubs", value: String(stats.clubs).padStart(2, "0") },
                    { label: "Images", value: String(stats.images).padStart(2, "0") },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                    >
                      <div className="text-lg font-semibold text-[#00A8E8]">{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container pb-24">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-white/70">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : clubs.length ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {clubs.map((club, i) => {
                const galleryCount = Array.isArray(club.gallery) ? club.gallery.length : 0;
                const cover = galleryCount ? club.gallery[0]! : [event1, event2, event3][i % 3];

                return (
                  <motion.article
                    key={club.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.05 }}
                    className="group rounded-3xl border border-slate-200 bg-white/90 shadow-lg overflow-hidden dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-950 m-5 rounded-3xl">
                      <img
                        src={cover}
                        alt={`${club.workshop_title} cover`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
                    </div>

                    <div className="mx-5 mb-5 rounded-[24px] bg-[#002366] px-6 py-6 text-white shadow-[0_20px_45px_rgba(0,35,102,0.25)] dark:bg-[#001a4d]">
                      <div className="text-sm uppercase tracking-[0.25em] text-white/70">{club.club_name}</div>
                      <div className="mt-2 text-2xl font-semibold">{club.workshop_title}</div>
                      <p className="mt-3 text-sm text-white/80 leading-relaxed line-clamp-3">{club.description}</p>
                      <div className="mt-6 flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            if (!galleryCount) return;
                            setSelected(club);
                            setActiveIndex(0);
                          }}
                          disabled={!galleryCount}
                          className={
                            "rounded-full px-5 py-2 text-sm font-semibold text-white transition " +
                            (galleryCount
                              ? "bg-[#00A8E8] shadow-[0_12px_30px_rgba(0,168,232,0.35)] hover:bg-[#17b4ee]"
                              : "bg-white/15 text-white/60 cursor-not-allowed")
                          }
                        >
                          {galleryCount ? "View gallery" : "No images"}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-600 dark:text-white/70">No clubs yet.</div>
          )}
        </section>
      </main>
      <Footer />

      <AnimatePresence>
        {selected && (selected.gallery ?? []).length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="frost-scrollbar w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white text-slate-900 border border-slate-200 dark:bg-[#001a4d] dark:text-white dark:border-white/10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                <div>
                  <div className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">Gallery</div>
                  <div className="text-lg font-semibold">{selected.workshop_title}</div>
                </div>
                <button
                  onClick={closeModal}
                  className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 mx-auto" />
                </button>
              </div>

              <div className="relative bg-slate-950">
                <img
                  src={(selected.gallery ?? [])[activeIndex]}
                  alt="Workshop"
                  className="w-full max-h-[60vh] object-cover"
                  loading="lazy"
                />
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 text-white hover:bg-black/40 transition"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 text-white hover:bg-black/40 transition"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5 mx-auto" />
                </button>
              </div>

              <div className="px-6 pb-6">
                <div className="frost-scrollbar flex gap-3 overflow-x-auto py-4">
                  {(selected.gallery ?? []).map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      onClick={() => setActiveIndex(idx)}
                      className={
                        "min-w-[140px] sm:min-w-[180px] aspect-[4/3] rounded-xl overflow-hidden border transition " +
                        (idx === activeIndex ? "border-[#00A8E8]" : "border-slate-200 dark:border-white/10")
                      }
                    >
                      <img src={img} alt="Thumbnail" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
