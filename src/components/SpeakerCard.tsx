import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Clock, ExternalLink, Radio } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

export type TimelineSessionStatus = "upcoming" | "live" | "done";

export type TimelineSession = {
  id: string;
  fullName: string;
  photo: string;
  specialtyLine: string; // e.g. "Cardiology · Stanford"
  talkTitle: string;
  timeLabel: string; // e.g. "09:00 — 09:45"
  startsAt: number; // ms timestamp
  endsAt: number; // ms timestamp
  description?: string | null;
  links: { label: string; url: string }[];
  gallery: string[];
  isLive?: boolean;
  streamUrl?: string | null;
};

export function getTimelineStatus(s: TimelineSession): TimelineSessionStatus {
  if (s.isLive) return "live";
  const now = Date.now();
  if (now < s.startsAt) return "upcoming";
  if (now < s.endsAt) return "live";
  return "done";
}

interface Props {
  session: TimelineSession;
}

export function SpeakerCard({ session }: Props) {
  const [open, setOpen] = useState(false);
  const status = getTimelineStatus(session);
  const { h, m, s } = useCountdown(session.startsAt);

  const isLive = status === "live";
  const isDone = status === "done";

  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);
  const dateLabel = startDate.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
  const startTime = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTime = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateTimeLabel = `${dateLabel} · ${startTime} — ${endTime}`;

  return (
    <motion.article
      layout
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
      className={cn(
        "relative rounded-3xl bg-card border overflow-hidden transition-all duration-500",
        isLive ? "border-secondary live-card-glow" : "border-border shadow-card hover:shadow-elegant",
        isDone && "opacity-70",
      )}
    >
      {isLive && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-secondary" />}

      <div className="grid md:grid-cols-[200px_1fr_auto] gap-6 p-6 items-center">
        <div
          className={cn(
            "relative mx-auto md:mx-0 h-32 w-32 md:h-36 md:w-36 rounded-2xl overflow-hidden flex items-center justify-center shrink-0",
            isLive ? "bg-gradient-secondary" : "bg-muted",
          )}
        >
          <img
            src={session.photo}
            alt={session.fullName}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
          {isLive ? (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-live text-live-foreground text-[10px] font-bold uppercase tracking-wider live-glow flex items-center gap-1">
              <Radio className="h-2.5 w-2.5 live-pulse" />
              Live
            </span>
          ) : null}
          {isDone ? (
            <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-success text-success-foreground flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 text-center md:text-left">
          <div className="text-xs uppercase tracking-widest text-secondary font-bold mb-1">{session.specialtyLine}</div>
          <h3 className="text-xl md:text-2xl font-bold mb-1">{session.fullName}</h3>
          <p className="text-foreground/80 font-medium line-clamp-2">{session.talkTitle}</p>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {dateTimeLabel}
          </div>
        </div>

        <div className="flex md:flex-col items-center gap-3 md:items-end">
          {status === "upcoming" ? (
            <div className="text-center md:text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Starts in</div>
              <div className="font-mono text-lg font-bold tabular-nums text-primary dark:text-secondary">
                {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
              </div>
            </div>
          ) : null}

          {isLive ? (
            <div className="text-center md:text-right">
              <div className="text-[10px] uppercase tracking-widest text-live mb-1 font-bold">Now Streaming</div>
              {session.streamUrl ? (
                <a
                  href={session.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-secondary font-bold text-sm hover:underline underline-offset-4"
                >
                  Watch Live →
                </a>
              ) : (
                <div className="text-secondary font-bold text-sm">Watch Live →</div>
              )}
            </div>
          ) : null}

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
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border/60">
              {session.description ? (
                <p className="text-foreground/80 leading-relaxed mb-5">{session.description}</p>
              ) : null}

              {session.gallery.length ? (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {session.gallery.map((g, i) => (
                    <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-muted group">
                      <img
                        src={g}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {session.links.length ? (
                <div className="flex flex-wrap gap-2">
                  {session.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted hover:bg-secondary hover:text-secondary-foreground text-sm font-medium transition-colors"
                    >
                      {l.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
