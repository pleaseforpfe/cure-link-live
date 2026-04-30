import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EditionRow = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  image_url: string;
  link_url: string | null;
};

export function PreviousEvents() {
  const [rows, setRows] = useState<EditionRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      const { data, error } = await supabase
        .from("home_previous_editions")
        .select("id, title, event_date, location, image_url, link_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(12);

      if (cancelled || error || !data) return;
      setRows(data as EditionRow[]);
    }

    loadRows();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = rows.map((row) => ({
    img: row.image_url,
    date: row.event_date,
    location: row.location,
    title: row.title,
    link: row.link_url,
  }));

  return (
    <section className="container py-24">
      <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-secondary font-bold mb-3">Archive</div>
          <h2 className="text-4xl md:text-5xl font-bold">Previous editions</h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          Eleven years of bringing together the brightest minds in medicine across the globe.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((e, i) => (
          <motion.article
            key={e.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative rounded-3xl overflow-hidden bg-card border border-border card-hover cursor-pointer"
            onClick={() => {
              if (e.link) window.open(e.link, "_blank", "noopener,noreferrer");
            }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={e.img}
                alt={e.title}
                loading="lazy"
                width={800}
                height={600}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
            </div>
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-primary-foreground">
              <div className="flex items-center gap-3 text-xs mb-2 opacity-90">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{e.date}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
              </div>
              <h3 className="text-xl font-bold flex items-center justify-between gap-3">
                {e.title}
                <ArrowUpRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
            </div>
          </motion.article>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
          No previous editions have been published yet.
        </div>
      ) : null}
    </section>
  );
}
