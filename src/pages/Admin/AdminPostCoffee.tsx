import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

type ClubRow = {
  id: string;
  club_name: string;
  workshop_title: string;
  description: string;
  gallery: string[];
  created_at: string;
};

const CLUBS_BUCKET = "clubs";
const MAX_GALLERY = 3;

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function newUuid() {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id) throw new Error("Browser does not support crypto.randomUUID().");
  return id;
}

async function uploadToBucket(path: string, file: File) {
  const { error } = await supabase.storage.from(CLUBS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(CLUBS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminPostCoffee() {
  const [rows, setRows] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ClubRow | null>(null);

  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [savingStage, setSavingStage] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [confirmRunning, setConfirmRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    club_name: "",
    workshop_title: "",
    description: "",
  });

  const groupedCount = useMemo(() => rows.length, [rows.length]);

  function requestConfirm(args: { title: string; description: string; actionLabel: string; action: () => Promise<void> }) {
    setConfirmTitle(args.title);
    setConfirmDescription(args.description);
    setConfirmActionLabel(args.actionLabel);
    setConfirmAction(() => args.action);
    setConfirmRunning(false);
    setConfirmOpen(true);
  }

  useEffect(() => {
    const next = galleryFiles.map((f) => URL.createObjectURL(f));
    setGalleryPreviewUrls((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return next;
    });
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryFiles]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("clubs")
      .select("id, club_name, workshop_title, description, gallery, created_at")
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as ClubRow[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setForm({ club_name: "", workshop_title: "", description: "" });
      setGalleryFiles([]);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!editOpen) {
      setError(null);
      setEditing(null);
      setGalleryFiles([]);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [editOpen]);

  async function createClub() {
    setError(null);
    if (saving) return;

    const clubName = form.club_name.trim();
    const workshopTitle = form.workshop_title.trim();
    const description = form.description.trim();

    if (!clubName || !workshopTitle || !description) {
      const msg = "Please fill Club name, Workshop title, and Description.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (galleryFiles.length > MAX_GALLERY) {
      const msg = `Gallery max is ${MAX_GALLERY} images.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    let createdId: string | null = null;
    try {
      setSaving(true);
      const id = newUuid();
      createdId = id;

      setSavingStage("Creating card...");
      setSavingProgress(10);
      const payload = {
        id,
        club_name: clubName,
        workshop_title: workshopTitle,
        description,
        gallery: [] as string[],
      };
      const insertRes = await supabase.from("clubs").insert(payload);
      if (insertRes.error) throw insertRes.error;

      if (galleryFiles.length) {
        setSavingStage("Uploading gallery...");
        setSavingProgress(30);
        const folder = `${slugify(clubName)}/${id}`;
        const uploaded: string[] = [];
        for (let i = 0; i < galleryFiles.length; i += 1) {
          const f = galleryFiles[i]!;
          const p = `${folder}/gallery-${i + 1}-${Date.now()}-${safeFileName(f.name)}`;
          uploaded.push(await uploadToBucket(p, f));
          const ratio = (i + 1) / galleryFiles.length;
          setSavingProgress(30 + Math.round(45 * ratio));
        }

        setSavingStage("Finalizing...");
        setSavingProgress(85);
        const updateRes = await supabase.from("clubs").update({ gallery: uploaded }).eq("id", id);
        if (updateRes.error) throw updateRes.error;
      }

      setSavingProgress(100);
      setOpen(false);
      toast.success("Card added");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add card";
      setError(msg);
      toast.error(msg);
      if (createdId) {
        try {
          await supabase.from("clubs").delete().eq("id", createdId);
        } catch {
          // ignore
        }
      }
    } finally {
      setSaving(false);
      setSavingStage(null);
      setSavingProgress(0);
    }
  }

  function openEdit(row: ClubRow) {
    setEditing(row);
    setForm({
      club_name: row.club_name ?? "",
      workshop_title: row.workshop_title ?? "",
      description: row.description ?? "",
    });
    setEditOpen(true);
  }

  async function updateClub(id: string) {
    setError(null);
    if (saving) return;

    const clubName = form.club_name.trim();
    const workshopTitle = form.workshop_title.trim();
    const description = form.description.trim();

    if (!clubName || !workshopTitle || !description) {
      const msg = "Please fill Club name, Workshop title, and Description.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (galleryFiles.length > MAX_GALLERY) {
      const msg = `Gallery max is ${MAX_GALLERY} images.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setSaving(true);
      setSavingStage("Saving changes...");
      setSavingProgress(20);

      let nextGallery: string[] | null = null;
      if (galleryFiles.length) {
        setSavingStage("Uploading gallery...");
        setSavingProgress(35);
        const folder = `${slugify(clubName)}/${id}`;
        const uploaded: string[] = [];
        for (let i = 0; i < galleryFiles.length; i += 1) {
          const f = galleryFiles[i]!;
          const p = `${folder}/gallery-${i + 1}-${Date.now()}-${safeFileName(f.name)}`;
          uploaded.push(await uploadToBucket(p, f));
          const ratio = (i + 1) / galleryFiles.length;
          setSavingProgress(35 + Math.round(40 * ratio));
        }
        nextGallery = uploaded;
      }

      setSavingStage("Finalizing...");
      setSavingProgress(90);
      const payload: Partial<ClubRow> & { club_name: string; workshop_title: string; description: string } = {
        club_name: clubName,
        workshop_title: workshopTitle,
        description,
      };
      if (nextGallery) payload.gallery = nextGallery;

      const updateRes = await supabase.from("clubs").update(payload).eq("id", id);
      if (updateRes.error) throw updateRes.error;

      setSavingProgress(100);
      setEditOpen(false);
      setEditing(null);
      toast.success("Card updated");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update card";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setSavingStage(null);
      setSavingProgress(0);
    }
  }

  async function doDelete(id: string) {
    setError(null);
    const { error } = await supabase.from("clubs").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  }

  function removeClub(row: Pick<ClubRow, "id" | "club_name" | "workshop_title">) {
    requestConfirm({
      title: "Delete card?",
      description: `${row.club_name}\n${row.workshop_title}`,
      actionLabel: "Delete",
      action: async () => doDelete(row.id),
    });
  }

  return (
    <div className="space-y-6">
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []).slice(0, MAX_GALLERY);
          setGalleryFiles(selected);
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmRunning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmRunning || !confirmAction}
              onClick={async (e) => {
                e.preventDefault();
                if (!confirmAction) return;
                setConfirmRunning(true);
                try {
                  await confirmAction();
                  setConfirmOpen(false);
                } finally {
                  setConfirmRunning(false);
                }
              }}
            >
              {confirmRunning ? "Working..." : confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Post Coffee</div>
              <div className="text-lg font-extrabold">Manage clubs/workshops cards</div>
            </div>
            <Dialog open={open} onOpenChange={(next) => (saving ? null : setOpen(next))}>
              <DialogTrigger asChild>
                <Button variant="hero" className="rounded-2xl">
                  <Plus className="h-4 w-4" />
                  Add card
                </Button>
              </DialogTrigger>
              <DialogContent className="relative max-w-lg rounded-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Add card</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Club name</Label>
                    <Input
                      value={form.club_name}
                      onChange={(e) => setForm((p) => ({ ...p, club_name: e.target.value }))}
                      disabled={saving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Workshop title</Label>
                    <Input
                      value={form.workshop_title}
                      onChange={(e) => setForm((p) => ({ ...p, workshop_title: e.target.value }))}
                      disabled={saving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      disabled={saving}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Gallery images (optional, max {MAX_GALLERY})</Label>
                    <div className="rounded-3xl border border-border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">Upload gallery images</div>
                          <div className="text-xs text-muted-foreground">
                            These appear when you open the workshop gallery.
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outlineGlow"
                          size="sm"
                          className="rounded-2xl"
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={saving}
                        >
                          <UploadCloud className="h-4 w-4" />
                          Choose images
                        </Button>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {galleryPreviewUrls.length ? (
                          galleryPreviewUrls.map((u, idx) => (
                            <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted ring-1 ring-border">
                              <img src={u} alt="" className="h-full w-full object-cover" />
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="aspect-[4/3] rounded-2xl border border-dashed border-border bg-background/40" />
                            <div className="aspect-[4/3] rounded-2xl border border-dashed border-border bg-background/40" />
                            <div className="aspect-[4/3] rounded-2xl border border-dashed border-border bg-background/40" />
                          </>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Selected: <span className="font-semibold text-foreground tabular-nums">{galleryFiles.length}</span> /{" "}
                        {MAX_GALLERY}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={createClub} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>

                {saving ? (
                  <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-elegant p-6">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold">Saving</div>
                          <div className="text-xs text-muted-foreground truncate">{savingStage ?? "Please wait..."}</div>
                        </div>
                        <div className="ml-auto text-sm font-extrabold tabular-nums">{savingProgress}%</div>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-secondary transition-all" style={{ width: `${savingProgress}%` }} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>
          </div>
          {error ? <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div> : null}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(next) => {
          if (saving) return;
          setEditOpen(next);
          if (!next) setEditing(null);
        }}
      >
        <DialogContent className="relative max-w-lg rounded-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
          </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Club name</Label>
            <Input
              value={form.club_name}
              onChange={(e) => setForm((p) => ({ ...p, club_name: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            <Label>Workshop title</Label>
            <Input
              value={form.workshop_title}
              onChange={(e) => setForm((p) => ({ ...p, workshop_title: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label>Gallery (replace, optional, max {MAX_GALLERY})</Label>
            <div className="rounded-3xl border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Upload new gallery images</div>
                  <div className="text-xs text-muted-foreground">Leave empty to keep the current gallery.</div>
                </div>
                <Button
                  type="button"
                  variant="outlineGlow"
                  size="sm"
                  className="rounded-2xl"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={saving}
                >
                  <UploadCloud className="h-4 w-4" />
                  Choose images
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {galleryPreviewUrls.length ? (
                  galleryPreviewUrls.map((u, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted ring-1 ring-border">
                      <img src={u} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))
                ) : editing?.gallery?.length ? (
                  editing.gallery.slice(0, MAX_GALLERY).map((u, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted ring-1 ring-border">
                      <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="aspect-[4/3] rounded-2xl border border-dashed border-border bg-background/40" />
                    <div className="aspect-[4/3] rounded-2xl border border-dashed border-border bg-background/40" />
                    <div className="aspect-[4/3] rounded-2xl border border-dashed border-border bg-background/40" />
                  </>
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Selected: <span className="font-semibold text-foreground tabular-nums">{galleryFiles.length}</span> /{" "}
                {MAX_GALLERY}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => (editing ? updateClub(editing.id) : null)} disabled={!editing || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>

        {saving ? (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-elegant p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">Saving</div>
                  <div className="text-xs text-muted-foreground truncate">{savingStage ?? "Please wait..."}</div>
                </div>
                <div className="ml-auto text-sm font-extrabold tabular-nums">{savingProgress}%</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-secondary transition-all" style={{ width: `${savingProgress}%` }} />
              </div>
            </div>
          </div>
        ) : null}
        </DialogContent>
      </Dialog>

      <Card className="rounded-3xl">
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <div className="text-sm font-extrabold">Cards</div>
            <div className="text-xs text-muted-foreground tabular-nums">{groupedCount} items</div>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Workshop</TableHead>
                  <TableHead>Gallery</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.club_name}</TableCell>
                    <TableCell>{r.workshop_title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {(r.gallery ?? []).slice(0, 3).map((u, idx) => (
                            <div
                              key={`${r.id}-${idx}`}
                              className="h-9 w-9 rounded-xl overflow-hidden bg-muted ring-1 ring-border"
                              title={`Image ${idx + 1}`}
                            >
                              <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
                            </div>
                          ))}
                          {(r.gallery ?? []).length === 0 ? (
                            <div className="h-9 w-16 rounded-xl border border-dashed border-border bg-background/40" />
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {(r.gallery ?? []).length} / {MAX_GALLERY}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className={cn("rounded-2xl")} onClick={() => openEdit(r)}>
                          <Pencil />
                        </Button>
                        <Button variant="outline" size="sm" className={cn("rounded-2xl")} onClick={() => removeClub(r)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      No cards yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
