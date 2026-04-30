import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type LiveMetric = {
  id: string;
  attendance_count: number;
  attendance_label: string;
  is_active: boolean;
  updated_at: string;
};

type NewsItem = {
  id: string;
  title: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
};

type PreviousEdition = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

function toLocalDateTimeInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminHomepageCms() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [liveMetric, setLiveMetric] = useState<LiveMetric | null>(null);
  const [liveCountDraft, setLiveCountDraft] = useState("4224");
  const [liveLabelDraft, setLiveLabelDraft] = useState("Updated in real-time");
  const [liveActiveDraft, setLiveActiveDraft] = useState(true);

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsOpen, setNewsOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsDraft, setNewsDraft] = useState({
    title: "",
    sort_order: 0,
    is_active: true,
    starts_at: "",
    ends_at: "",
  });

  const [editions, setEditions] = useState<PreviousEdition[]>([]);
  const [editionOpen, setEditionOpen] = useState(false);
  const [editingEdition, setEditingEdition] = useState<PreviousEdition | null>(null);
  const [editionDraft, setEditionDraft] = useState({
    title: "",
    event_date: "",
    location: "",
    image_url: "",
    link_url: "",
    sort_order: 0,
    is_active: true,
  });

  async function refreshAll() {
    setLoading(true);
    const [liveRes, newsRes, editionsRes] = await Promise.all([
      supabase.from("home_live_metrics").select("id, attendance_count, attendance_label, is_active, updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("home_news_ticker_items").select("id, title, is_active, sort_order, starts_at, ends_at, updated_at").order("sort_order", { ascending: true }).order("updated_at", { ascending: false }),
      supabase.from("home_previous_editions").select("id, title, event_date, location, image_url, link_url, is_active, sort_order, updated_at").order("sort_order", { ascending: true }).order("updated_at", { ascending: false }),
    ]);

    if (liveRes.error) toast.error(liveRes.error.message);
    if (newsRes.error) toast.error(newsRes.error.message);
    if (editionsRes.error) toast.error(editionsRes.error.message);

    const metric = (liveRes.data ?? null) as LiveMetric | null;
    setLiveMetric(metric);
    if (metric) {
      setLiveCountDraft(String(metric.attendance_count));
      setLiveLabelDraft(metric.attendance_label ?? "Updated in real-time");
      setLiveActiveDraft(metric.is_active);
    }

    setNewsItems((newsRes.data ?? []) as NewsItem[]);
    setEditions((editionsRes.data ?? []) as PreviousEdition[]);
    setLoading(false);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const hasNews = useMemo(() => newsItems.length > 0, [newsItems.length]);
  const hasEditions = useMemo(() => editions.length > 0, [editions.length]);

  async function saveLiveMetric() {
    const count = Number.parseInt(liveCountDraft, 10);
    if (!Number.isFinite(count) || count < 0) {
      toast.error("Attendance must be a valid positive number.");
      return;
    }

    setSaving(true);
    try {
      if (liveMetric) {
        const { error } = await supabase
          .from("home_live_metrics")
          .update({
            attendance_count: count,
            attendance_label: liveLabelDraft.trim() || "Updated in real-time",
            is_active: liveActiveDraft,
          })
          .eq("id", liveMetric.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("home_live_metrics").insert({
          attendance_count: count,
          attendance_label: liveLabelDraft.trim() || "Updated in real-time",
          is_active: liveActiveDraft,
        });
        if (error) throw error;
      }
      toast.success("Live metric saved");
      refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save live metric");
    } finally {
      setSaving(false);
    }
  }

  function openAddNews() {
    setEditingNews(null);
    setNewsDraft({ title: "", sort_order: newsItems.length, is_active: true, starts_at: "", ends_at: "" });
    setNewsOpen(true);
  }

  function openEditNews(item: NewsItem) {
    setEditingNews(item);
    setNewsDraft({
      title: item.title,
      sort_order: item.sort_order,
      is_active: item.is_active,
      starts_at: toLocalDateTimeInput(item.starts_at),
      ends_at: toLocalDateTimeInput(item.ends_at),
    });
    setNewsOpen(true);
  }

  async function saveNews() {
    if (!newsDraft.title.trim()) {
      toast.error("News title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: newsDraft.title.trim(),
        sort_order: newsDraft.sort_order,
        is_active: newsDraft.is_active,
        starts_at: toIso(newsDraft.starts_at),
        ends_at: toIso(newsDraft.ends_at),
      };
      if (editingNews) {
        const { error } = await supabase.from("home_news_ticker_items").update(payload).eq("id", editingNews.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("home_news_ticker_items").insert(payload);
        if (error) throw error;
      }

      toast.success(`News item ${editingNews ? "updated" : "created"}`);
      setNewsOpen(false);
      setEditingNews(null);
      refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save news item");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNews(id: string) {
    setSaving(true);
    try {
      const { error } = await supabase.from("home_news_ticker_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("News item deleted");
      refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete news item");
    } finally {
      setSaving(false);
    }
  }

  function openAddEdition() {
    setEditingEdition(null);
    setEditionDraft({
      title: "",
      event_date: "",
      location: "",
      image_url: "",
      link_url: "",
      sort_order: editions.length,
      is_active: true,
    });
    setEditionOpen(true);
  }

  function openEditEdition(item: PreviousEdition) {
    setEditingEdition(item);
    setEditionDraft({
      title: item.title,
      event_date: item.event_date,
      location: item.location,
      image_url: item.image_url,
      link_url: item.link_url ?? "",
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setEditionOpen(true);
  }

  async function saveEdition() {
    if (!editionDraft.title.trim() || !editionDraft.event_date.trim() || !editionDraft.location.trim() || !editionDraft.image_url.trim()) {
      toast.error("Title, date, location, and image URL are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: editionDraft.title.trim(),
        event_date: editionDraft.event_date.trim(),
        location: editionDraft.location.trim(),
        image_url: editionDraft.image_url.trim(),
        link_url: editionDraft.link_url.trim() || null,
        sort_order: editionDraft.sort_order,
        is_active: editionDraft.is_active,
      };

      if (editingEdition) {
        const { error } = await supabase.from("home_previous_editions").update(payload).eq("id", editingEdition.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("home_previous_editions").insert(payload);
        if (error) throw error;
      }

      toast.success(`Previous edition ${editingEdition ? "updated" : "created"}`);
      setEditionOpen(false);
      setEditingEdition(null);
      refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save previous edition");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEdition(id: string) {
    setSaving(true);
    try {
      const { error } = await supabase.from("home_previous_editions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Previous edition deleted");
      refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete previous edition");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="live">Live metric</TabsTrigger>
          <TabsTrigger value="news">News ticker</TabsTrigger>
          <TabsTrigger value="editions">Previous editions</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card className="rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Homepage / Live Attendance</div>
                <div className="text-lg font-extrabold">Manage live count and subtitle</div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Attendance count</Label>
                  <Input value={liveCountDraft} onChange={(e) => setLiveCountDraft(e.target.value)} placeholder="4224" />
                </div>
                <div className="grid gap-2">
                  <Label>Subtitle</Label>
                  <Input value={liveLabelDraft} onChange={(e) => setLiveLabelDraft(e.target.value)} placeholder="Updated in real-time" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
                <div>
                  <div className="text-sm font-semibold">Enable live metric</div>
                  <div className="text-xs text-muted-foreground">If disabled, frontend can use fallback values.</div>
                </div>
                <Switch checked={liveActiveDraft} onCheckedChange={setLiveActiveDraft} />
              </div>

              <div className="flex justify-end">
                <Button className="rounded-2xl" onClick={saveLiveMetric} disabled={saving || loading}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Dialog open={newsOpen} onOpenChange={setNewsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl" onClick={openAddNews}>
                <Plus className="h-4 w-4" />
                Add news item
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNews ? "Edit news item" : "Add news item"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Textarea value={newsDraft.title} onChange={(e) => setNewsDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Emergency surgery workshop starts at 11:00" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Sort order</Label>
                    <Input type="number" value={String(newsDraft.sort_order)} onChange={(e) => setNewsDraft((p) => ({ ...p, sort_order: Number.parseInt(e.target.value || "0", 10) || 0 }))} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 p-3">
                    <Label>Active</Label>
                    <Switch checked={newsDraft.is_active} onCheckedChange={(v) => setNewsDraft((p) => ({ ...p, is_active: v }))} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Starts at (optional)</Label>
                    <Input type="datetime-local" value={newsDraft.starts_at} onChange={(e) => setNewsDraft((p) => ({ ...p, starts_at: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Ends at (optional)</Label>
                    <Input type="datetime-local" value={newsDraft.ends_at} onChange={(e) => setNewsDraft((p) => ({ ...p, ends_at: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-2xl" onClick={() => setNewsOpen(false)} disabled={saving}>Cancel</Button>
                  <Button className="rounded-2xl" onClick={saveNews} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Card className="rounded-3xl">
            <CardContent className="p-0">
              <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
                <div className="text-sm font-extrabold">News ticker items</div>
                <div className="text-xs text-muted-foreground tabular-nums">{newsItems.length} items</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[500px]">
                        <div className="truncate">{item.title}</div>
                      </TableCell>
                      <TableCell>{item.sort_order}</TableCell>
                      <TableCell>{item.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => openEditNews(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => deleteNews(item.id)} disabled={saving || !hasNews}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {newsItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">No news items yet.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editions" className="space-y-4">
          <Dialog open={editionOpen} onOpenChange={setEditionOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl" onClick={openAddEdition}>
                <Plus className="h-4 w-4" />
                Add previous edition
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingEdition ? "Edit previous edition" : "Add previous edition"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input value={editionDraft.title} onChange={(e) => setEditionDraft((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Date label</Label>
                    <Input value={editionDraft.event_date} onChange={(e) => setEditionDraft((p) => ({ ...p, event_date: e.target.value }))} placeholder="Nov 2024" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input value={editionDraft.location} onChange={(e) => setEditionDraft((p) => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Image URL</Label>
                    <Input value={editionDraft.image_url} onChange={(e) => setEditionDraft((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Link URL (optional)</Label>
                    <Input value={editionDraft.link_url} onChange={(e) => setEditionDraft((p) => ({ ...p, link_url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Sort order</Label>
                    <Input type="number" value={String(editionDraft.sort_order)} onChange={(e) => setEditionDraft((p) => ({ ...p, sort_order: Number.parseInt(e.target.value || "0", 10) || 0 }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 p-3">
                  <Label>Active</Label>
                  <Switch checked={editionDraft.is_active} onCheckedChange={(v) => setEditionDraft((p) => ({ ...p, is_active: v }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-2xl" onClick={() => setEditionOpen(false)} disabled={saving}>Cancel</Button>
                  <Button className="rounded-2xl" onClick={saveEdition} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Card className="rounded-3xl">
            <CardContent className="p-0">
              <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
                <div className="text-sm font-extrabold">Previous editions</div>
                <div className="text-xs text-muted-foreground tabular-nums">{editions.length} items</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">{item.title}</TableCell>
                      <TableCell>{item.event_date}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => openEditEdition(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => deleteEdition(item.id)} disabled={saving || !hasEditions}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {editions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">No previous editions yet.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading ? <div className="text-sm text-muted-foreground">Loading homepage CMS data...</div> : null}
    </div>
  );
}
