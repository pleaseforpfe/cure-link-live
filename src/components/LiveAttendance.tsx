import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Activity } from "lucide-react";
import { CountUp } from "./CountUp";

export function LiveAttendance() {
  const [count, setCount] = useState(4218);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 7) - 2);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="container -mt-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-card p-8 md:p-10 grid md:grid-cols-3 gap-8 items-center"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-secondary flex items-center justify-center shadow-glow">
              <Users className="h-7 w-7 text-secondary-foreground" />
            </div>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-live live-glow" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Live Attendance</div>
            <div className="text-sm text-foreground/70 arabic">حاضرون الآن</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-5xl md:text-6xl font-extrabold gradient-text leading-none tabular-nums">
            <CountUp end={count} duration={1500} />
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
            <Activity className="h-3 w-3 text-live" />
            Updated in real-time
          </div>
        </div>

        <div className="flex md:justify-end gap-6 text-center">
          <Stat label="Speakers" value={64} />
          <Stat label="Sessions" value={120} />
          <Stat label="Countries" value={42} />
        </div>
      </motion.div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary dark:text-secondary tabular-nums">
        <CountUp end={value} />
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
