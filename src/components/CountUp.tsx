import { useEffect, useState } from "react";

interface Props {
  end: number;
  duration?: number;
  className?: string;
}

export function CountUp({ end, duration = 2000, className }: Props) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return <span className={className}>{value.toLocaleString()}</span>;
}
