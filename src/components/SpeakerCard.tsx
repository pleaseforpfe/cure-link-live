import { motion, AnimatePresence } from "framer-motion";
import { Clock, ExternalLink, ChevronDown, Radio, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Speaker, getStatus } from "@/data/speakers";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface Props { speaker: Speaker }

export function SpeakerCard({ speaker }: Props) {
  const [open, setOpen] = useState(false);
  const status = getStatus(speaker);
  const { h, m, s } = useCountdown(speaker.startsAt);

  const isLive = status === "live";
  const isDone = status === "done";

  return (
    <motion.article
      layout
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
      className={cn(
        "relative rounded-3xl bg-card border overflow-hidden transition-all duration-500",
        isLive
          ? "border-secondary live-card-glow"
          : "border-border shadow-card hover:shadow-elegant",
        isDone && "opacity-70"
      )}
    >
      {isLive && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-secondary" />
      )}

      <div className="grid md:grid-cols-[200px_1fr_auto] gap-6 p-6 items-center">
        {/* Photo */}
        <div className={cn(
          "relative mx-auto md:mx-0 h-32 w-32 md:h-36 md:w-36 rounded-2xl overflow-hidden flex items-center justify-center shrink-0",
          isLive ? "bg-gradient-secondary" : "bg-muted"
        )}>
          <img
            src={speaker.photo}
            alt={speaker.name}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
          {isLive && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-live text-live-foreground text-[10px] font-bold uppercase tracking-wider live-glow flex items-center gap-1">
              <Radio className="h-2.5 w-2.5 live-pulse" />
              Live
            </span>
          )}
          {isDone && (
            <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-success text-success-foreground flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 text-center md:text-left">
          <div className="text-xs uppercase tracking-widest text-secondary font-bold mb-1">
            {speaker.specialty}
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-1">{speaker.name}</h3>
          <p className="text-foreground/80 font-medium line-clamp-2">{speaker.talk}</p>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {speaker.time}
          </div>
        </div>

        {/* Right meta */}
        <div className="flex md:flex-col items-center gap-3 md:items-end">
          {status === "upcoming" && (
            <div className="text-center md:text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Starts in</div>
              <div className="font-mono text-lg font-bold tabular-nums text-primary dark:text-secondary">
                {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
              </div>
            </div>
          )}
          {isLive && (
            <div className="text-center md:text-right">
              <div className="text-[10px] uppercase tracking-widest text-live mb-1 font-bold">Now Streaming</div>
              <div className="text-secondary font-bold text-sm">Watch Live →</div>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="h-10 w-10 rounded-full bg-muted hover:bg-secondary hover:text-secondary-foreground transition-colors flex items-center justify-center"
            aria-label="Expand"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border/60">
              <p className="text-foreground/80 leading-relaxed mb-5">{speaker.description}</p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {speaker.gallery.map((g, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-muted group">
                    <img src={g} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {speaker.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted hover:bg-secondary hover:text-secondary-foreground text-sm font-medium transition-colors"
                  >
                    {l.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
