import { useEffect, useMemo, useState } from "react";
import { HardDrive, LayoutGrid, Handshake, CalendarClock, UsersRound, Coffee } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { clamp01, formatBytes } from "./admin-utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Counts = {
  liveProgram: number;
  partners: number;
  postCoffee: number;
  organizers: number;
  organizersPeople: number;
  portfolio: number;
};

async function getCount(table: string) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

type StorageUsage = {
  totalBytes: number;
  files: number;
  buckets: { bucket: string; totalBytes: number; files: number }[];
};

async function getBucketUsage(bucket: string): Promise<{ bucket: string; totalBytes: number; files: number }> {
  // Fast + accurate: sum sizes from storage.objects via SECURITY DEFINER RPC.
  const rpc = await supabase.rpc("storage_bucket_usage", { p_bucket: bucket });
  if (!rpc.error) {
    const row = (Array.isArray(rpc.data) ? rpc.data[0] : rpc.data) as
      | { bucket?: string; total_bytes?: number; files?: number }
      | null
      | undefined;
    return {
      bucket: row?.bucket ?? bucket,
      totalBytes: Number(row?.total_bytes ?? 0),
      files: Number(row?.files ?? 0),
    };
  }

  // Fallback (no RPC): try listing objects and summing metadata sizes.
  let totalBytes = 0;
  let files = 0;
  const visited = new Set<string>();
  const queue: string[] = [""];

  while (queue.length) {
    const prefix = queue.shift() ?? "";
    if (visited.has(prefix)) continue;
    visited.add(prefix);

    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) throw error;
    for (const entry of data ?? []) {
      const maybeSize = (entry as unknown as { metadata?: { size?: number } }).metadata?.size;
      if (typeof maybeSize === "number") {
        totalBytes += maybeSize;
        files += 1;
      } else {
        const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
        queue.push(nextPrefix);
      }
    }
  }

  return { totalBytes, files, bucket };
}

function UsageBar({ usedBytes, limitBytes }: { usedBytes: number; limitBytes: number }) {
  const ratio = clamp01(usedBytes / limitBytes);
  const percent = Math.round(ratio * 100);

  const redThreshold = 750 * 1024 * 1024; // 750 MB
  const yellowThreshold = 500 * 1024 * 1024; // 500 MB
  const color =
    usedBytes >= redThreshold ? "bg-red-500" : usedBytes >= yellowThreshold ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Storage</div>
          <div className="text-2xl font-extrabold tabular-nums">
            {formatBytes(usedBytes)} <span className="text-muted-foreground text-sm font-semibold">/ {formatBytes(limitBytes)}</span>
          </div>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-extrabold tabular-nums",
            usedBytes >= redThreshold
              ? "bg-red-500/15 text-red-600 dark:text-red-400"
              : usedBytes >= yellowThreshold
                ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          )}
        >
          {percent}%
        </div>
      </div>
      <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Green &lt; 500 MB · Yellow 500–749 MB · Red ≥ 750 MB
      </div>
    </div>
  );
}

type PartnersChartRow = { category: string; count: number };
type TimelineHourRow = { hour: string; upcoming: number; live: number; done: number };
type LiveNow = { full_name: string; talk_title: string; stream_url: string | null } | null;

export default function AdminOverview() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [partnersChart, setPartnersChart] = useState<PartnersChartRow[]>([]);
  const [timelineByHour, setTimelineByHour] = useState<TimelineHourRow[]>([]);
  const [liveNow, setLiveNow] = useState<LiveNow>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buckets = useMemo(() => ["timeline", "partners", "clubs", "organizers", "portfolio", "program"], []);
  const limitBytes = useMemo(() => 1024 * 1024 * 1024, []); // 1 GB
  const [clearingBucket, setClearingBucket] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [
          liveProgram,
          partners,
          postCoffee,
          organizers,
          organizersPeople,
          portfolio,
        ] = await Promise.all([
          getCount("timeline_cards"),
          getCount("partners"),
          getCount("clubs"),
          getCount("organizer_groups"),
          getCount("organizer_people"),
          getCount("portfolio_items"),
        ]);

        const nextCounts: Counts = {
          liveProgram,
          partners,
          postCoffee,
          organizers,
          organizersPeople,
          portfolio,
        };

        let nextStorage: StorageUsage | null = null;
        try {
          const usageRows = await Promise.all(buckets.map((b) => getBucketUsage(b)));
          nextStorage = {
            buckets: usageRows,
            totalBytes: usageRows.reduce((sum, u) => sum + u.totalBytes, 0),
            files: usageRows.reduce((sum, u) => sum + u.files, 0),
          };
        } catch {
          nextStorage = null;
        }

        const [partnersRes, timelineRes] = await Promise.all([
          supabase.from("partners").select("category").limit(2000),
          supabase
            .from("timeline_cards")
            .select("full_name, talk_title, stream_url, starts_at, ends_at, is_live")
            .limit(2000),
        ]);

        if (partnersRes.error) throw partnersRes.error;
        if (timelineRes.error) throw timelineRes.error;

        const partnerCounts = new Map<string, number>();
        for (const row of partnersRes.data ?? []) {
          const category = (row as { category: string }).category;
          partnerCounts.set(category, (partnerCounts.get(category) ?? 0) + 1);
        }

        const nextPartnersChart: PartnersChartRow[] = [
          { category: "Clubs", count: partnerCounts.get("clubs") ?? 0 },
          { category: "Media", count: partnerCounts.get("media") ?? 0 },
          { category: "Sponsors", count: partnerCounts.get("sponsors") ?? 0 },
        ];

        const now = Date.now();
        const hourBins = Array.from({ length: 24 }, (_, i) => i);
        const bins = new Map<number, { upcoming: number; live: number; done: number }>();
        for (const h of hourBins) bins.set(h, { upcoming: 0, live: 0, done: 0 });

        let nextLiveNow: LiveNow = null;
        for (const row of timelineRes.data ?? []) {
          const r = row as {
            full_name: string;
            talk_title: string;
            stream_url: string | null;
            starts_at: string;
            ends_at: string;
            is_live: boolean;
          };

          const startsAt = new Date(r.starts_at).getTime();
          const endsAt = new Date(r.ends_at).getTime();
          if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) continue;

          const localHour = new Date(startsAt).getHours();
          const bucket = bins.get(localHour);
          if (!bucket) continue;

          const status = now < startsAt ? "upcoming" : now < endsAt ? "live" : "done";
          bucket[status] += 1;

          if ((r.is_live || status === "live") && !nextLiveNow) {
            nextLiveNow = { full_name: r.full_name, talk_title: r.talk_title, stream_url: r.stream_url };
          }
        }

        const nextTimelineByHour: TimelineHourRow[] = hourBins.map((h) => {
          const bucket = bins.get(h)!;
          return {
            hour: String(h).padStart(2, "0"),
            upcoming: bucket.upcoming,
            live: bucket.live,
            done: bucket.done,
          };
        });

        if (!cancelled) {
          setCounts(nextCounts);
          setStorage(nextStorage);
          setPartnersChart(nextPartnersChart);
          setTimelineByHour(nextTimelineByHour);
          setLiveNow(nextLiveNow);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [buckets]);

  function handleClearBucket(bucket: string) {
    setSelectedBucket(bucket);
    setConfirmInput("");
    setConfirmDialogOpen(true);
  }

  async function performClearBucket(bucket: string) {
    setConfirmDialogOpen(false);
    setClearingBucket(bucket);
    toast({ title: `Clearing ${bucket}…`, description: "This may take a while for large buckets." });
    try {
      // collect all file paths recursively
      const paths: string[] = [];
      const queue: string[] = [""];
      while (queue.length) {
        const prefix = queue.shift() ?? "";
        const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
        if (error) throw error;
        for (const entry of data ?? []) {
          const maybeSize = (entry as unknown as { metadata?: { size?: number } }).metadata?.size;
          if (typeof maybeSize === "number") {
            paths.push(prefix ? `${prefix}/${entry.name}` : entry.name);
          } else {
            const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
            queue.push(nextPrefix);
          }
        }
      }

      // remove in chunks to avoid large requests
      for (let i = 0; i < paths.length; i += 1000) {
        const chunk = paths.slice(i, i + 1000);
        const { error } = await supabase.storage.from(bucket).remove(chunk);
        if (error) throw error;
      }

      toast({ title: `Bucket cleared`, description: `"${bucket}" — ${paths.length} files removed.` });
    } catch (e) {
      toast({ title: "Failed to clear bucket", description: String(e instanceof Error ? e.message : e) });
    } finally {
      setClearingBucket(null);
      // refresh this bucket usage
      try {
        const row = await getBucketUsage(bucket);
        setStorage((s) => {
          if (!s) return s;
          const newBuckets = s.buckets.map((b) => (b.bucket === bucket ? row : b));
          const totalBytes = newBuckets.reduce((sum, u) => sum + u.totalBytes, 0);
          const files = newBuckets.reduce((sum, u) => sum + u.files, 0);
          return { ...s, buckets: newBuckets, totalBytes, files };
        });
      } catch {
        // ignore
      }
    }
  }

  const statCards: {
    label: string;
    value: number;
    icon: typeof CalendarClock;
    hint?: string;
  }[] = [
    { label: "Live Program", value: counts?.liveProgram ?? 0, icon: CalendarClock },
    { label: "Our Partners", value: counts?.partners ?? 0, icon: Handshake },
    { label: "Post Coffee", value: counts?.postCoffee ?? 0, icon: Coffee },
    {
      label: "Organizers",
      value: counts?.organizers ?? 0,
      icon: UsersRound,
      hint: counts ? `${counts.organizersPeople} people` : undefined,
    },
    { label: "Portfolio", value: counts?.portfolio ?? 0, icon: LayoutGrid },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <Card className="rounded-3xl border-red-200 dark:border-red-900/40">
          <CardContent className="p-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center gap-2 text-sm font-bold">
              <HardDrive className="h-4 w-4 text-secondary" />
              Overview statistics
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading overview…</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.label} className="rounded-3xl">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                              {s.label}
                            </div>
                            <div className="mt-1 text-3xl font-extrabold tabular-nums">{s.value}</div>
                            {s.hint ? <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div> : null}
                          </div>
                          <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-secondary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="p-6 pb-0">
            <div className="text-sm font-bold">Storage usage</div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading storage…</div>
            ) : storage ? (
              <div className="space-y-4">
                <UsageBar usedBytes={storage.totalBytes} limitBytes={limitBytes} />
                <div className="text-xs text-muted-foreground">
                  Buckets: <span className="font-semibold text-foreground">{storage.buckets.map((b) => b.bucket).join(", ")}</span> · Files: <span className="font-semibold text-foreground tabular-nums">{storage.files}</span>
                </div>

                <div className="space-y-2 mt-2">
                  {storage.buckets.map((b) => {
                    const isClearing = clearingBucket === b.bucket;
                    const redThreshold = 750 * 1024 * 1024;
                    const yellowThreshold = 500 * 1024 * 1024;
                    const badgeClass =
                      b.totalBytes >= redThreshold
                        ? "bg-red-50 text-red-700"
                        : b.totalBytes >= yellowThreshold
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-emerald-50 text-emerald-700";

                    return (
                      <div key={b.bucket} className="flex items-center justify-between gap-3 p-3 bg-background rounded-xl">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="font-semibold text-foreground">{b.bucket}</div>
                            <div className={`text-xs px-2 py-1 rounded-full ${badgeClass} font-semibold`}>{formatBytes(b.totalBytes)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{b.files} files</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleClearBucket(b.bucket)}
                            disabled={isClearing}
                          >
                            {isClearing ? "Clearing…" : "Clear bucket"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear bucket</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all files in the selected bucket. To confirm, type the bucket name
                        and press "Clear". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div>
                      <Input
                        placeholder={selectedBucket ?? "bucket name"}
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        data-test-id="confirm-bucket-input"
                      />
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => selectedBucket && performClearBucket(selectedBucket)}
                        disabled={confirmInput !== selectedBucket}
                      >
                        Clear
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="space-y-2">
                <UsageBar usedBytes={0} limitBytes={limitBytes} />
                <div className="text-xs text-muted-foreground">
                  Unable to measure bucket usage. Ensure the `storage_bucket_usage` RPC exists (recommended) or allow `list` on the bucket.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader className="p-6 pb-2">
            <div className="text-sm font-bold">Partners distribution</div>
            <div className="text-xs text-muted-foreground">Clubs vs Media vs Sponsors</div>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <ChartContainer
                className="h-[260px] w-full"
                config={{
                  count: { label: "Partners", color: "hsl(var(--secondary))" },
                }}
              >
                <BarChart data={partnersChart} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[10, 10, 10, 10]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold">Live Program by hour</div>
                <div className="text-xs text-muted-foreground">Sessions starting each hour (local time)</div>
              </div>
              {liveNow ? (
                <div className="shrink-0 rounded-2xl bg-live/10 text-live px-3 py-2 text-xs font-bold">
                  Live: {liveNow.full_name}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <ChartContainer
                className="h-[260px] w-full"
                config={{
                  upcoming: { label: "Upcoming", color: "hsl(var(--secondary))" },
                  live: { label: "Live", color: "hsl(var(--live))" },
                  done: { label: "Done", color: "hsl(var(--muted-foreground))" },
                }}
              >
                <BarChart data={timelineByHour} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={2} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="upcoming" stackId="a" fill="var(--color-upcoming)" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="live" stackId="a" fill="var(--color-live)" />
                  <Bar dataKey="done" stackId="a" fill="var(--color-done)" radius={[0, 0, 10, 10]} />
                </BarChart>
              </ChartContainer>
            )}
            {liveNow?.stream_url ? (
              <div className="mt-4 text-xs text-muted-foreground">
                Stream URL configured for live session.
              </div>
            ) : liveNow ? (
              <div className="mt-4 text-xs text-muted-foreground">
                No <span className="font-semibold">stream_url</span> set for the live session yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
