import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(
    date.getMinutes(),
  )}`;
}

function parseLocalValue(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  placeholder?: string;
  minDate?: Date;
};

export function DateTimePicker({ value, onChange, className, placeholder = "Pick a date & time", minDate }: Props) {
  const selected = useMemo(() => parseLocalValue(value), [value]);
  const [open, setOpen] = useState(false);

  const timeValue = selected ? `${pad2(selected.getHours())}:${pad2(selected.getMinutes())}` : "09:00";

  const label = selected ? format(selected, "PP • HH:mm") : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-between rounded-2xl font-semibold", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate">{label}</span>
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl p-4" align="start">
        <div className="grid gap-3">
          <Calendar
            mode="single"
            selected={selected ?? undefined}
            disabled={{ before: startOfDay(minDate ?? new Date()) }}
            onSelect={(d) => {
              if (!d) return;
              const next = new Date(d);
              const [hh, mm] = timeValue.split(":").map((x) => Number(x));
              next.setHours(Number.isFinite(hh) ? hh : 9, Number.isFinite(mm) ? mm : 0, 0, 0);
              onChange(toLocalValue(next));
            }}
            initialFocus
          />
          <div className="grid gap-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Time</div>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => {
                const t = e.target.value;
                const base = selected ? new Date(selected) : new Date();
                const [hh, mm] = t.split(":").map((x) => Number(x));
                base.setHours(Number.isFinite(hh) ? hh : 9, Number.isFinite(mm) ? mm : 0, 0, 0);
                onChange(toLocalValue(base));
              }}
              className="rounded-2xl"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-2xl"
            onClick={() => setOpen(false)}
            disabled={!selected}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
