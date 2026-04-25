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

type PortfolioRow = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
};

const PORTFOLIO_BUCKET = "portfolio";

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
  const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminPortfolio() {
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioRow | null>(null);

  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [savingStage, setSavingStage] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [confirmRunning, setConfirmRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({ title: "", category: "" });

  const hasAny = useMemo(() => rows.length > 0, [rows.length]);

  function requestConfirm(args: { title: string; description: string; actionLabel: string; action: () => Promise<void> }) {
    setConfirmTitle(args.title);
    setConfirmDescription(args.description);
    setConfirmActionLabel(args.actionLabel);
    setConfirmAction(() => args.action);
    setConfirmRunning(false);
    setConfirmOpen(true);
  }

  useEffect(() => {
    if (!imageFile) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      return;
    }
    const next = URL.createObjectURL(imageFile);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => URL.revokeObjectURL(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id, title, category, image_url, created_at")
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as PortfolioRow[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setForm({ title: "", category: "" });
      setImageFile(null);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!editOpen) {
      setError(null);
      setEditing(null);
      setImageFile(null);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [editOpen]);

  async function createItem() {
    setError(null);
    if (saving) return;

    const title = form.title.trim();
    const category = form.category.trim();
    if (!title || !category) {
      const msg = "Please fill Title and Category.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!imageFile) {
      const msg = "Image is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    let createdId: string | null = null;
    try {
      setSaving(true);
      const id = newUuid();
      createdId = id;

      setSavingStage("Creating item...");
      setSavingProgress(10);
      const insertRes = await supabase.from("portfolio_items").insert({ id, title, category, image_url: "" });
      if (insertRes.error) throw insertRes.error;

      setSavingStage("Uploading image...");
      setSavingProgress(40);
      const folder = `${slugify(category) || "items"}/${id}`;
      const imagePath = `${folder}/image-${Date.now()}-${safeFileName(imageFile.name)}`;
      const publicUrl = await uploadToBucket(imagePath, imageFile);

      setSavingStage("Finalizing...");
      setSavingProgress(85);
      const updateRes = await supabase.from("portfolio_items").update({ image_url: publicUrl }).eq("id", id);
      if (updateRes.error) throw updateRes.error;

      setSavingProgress(100);
      setOpen(false);
      toast.success("Portfolio item added");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add portfolio item";
      setError(msg);
      toast.error(msg);
      if (createdId) {
        try {
          await supabase.from("portfolio_items").delete().eq("id", createdId);
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

  function openEdit(row: PortfolioRow) {
    setEditing(row);
    setForm({ title: row.title ?? "", category: row.category ?? "" });
    setEditOpen(true);
  }

  async function updateItem(id: string) {
    setError(null);
    if (saving) return;

    const title = form.title.trim();
    const category = form.category.trim();
    if (!title || !category) {
      const msg = "Please fill Title and Category.";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setSaving(true);
      setSavingStage("Saving changes...");
      setSavingProgress(20);

      let imageUrl: string | null = null;
      if (imageFile) {
        setSavingStage("Uploading image...");
        setSavingProgress(35);
        const folder = `${slugify(category) || "items"}/${id}`;
        const imagePath = `${folder}/image-${Date.now()}-${safeFileName(imageFile.name)}`;
        imageUrl = await uploadToBucket(imagePath, imageFile);
      }

      setSavingStage("Finalizing...");
      setSavingProgress(90);
      const payload: Partial<PortfolioRow> & { title: string; category: string } = { title, category };
      if (imageUrl) payload.image_url = imageUrl;
      const updateRes = await supabase.from("portfolio_items").update(payload).eq("id", id);
      if (updateRes.error) throw updateRes.error;

      setSavingProgress(100);
      setEditOpen(false);
      setEditing(null);
      toast.success("Portfolio item updated");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update portfolio item";
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
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  }

  function removeItem(row: Pick<PortfolioRow, "id" | "title" | "category">) {
    requestConfirm({
      title: "Delete item?",
      description: `${row.title}\n${row.category}`,
      actionLabel: "Delete",
      action: async () => doDelete(row.id),
    });
  }

  return (
    <div className="space-y-6">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
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
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Portfolio</div>
              <div className="text-lg font-extrabold">Manage portfolio items</div>
            </div>

            <Dialog open={open} onOpenChange={(next) => (saving ? null : setOpen(next))}>
              <DialogTrigger asChild>
                <Button variant="hero" className="rounded-2xl">
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </DialogTrigger>
              <DialogContent className="relative max-w-lg rounded-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Add portfolio item</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} disabled={saving} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Input
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="Poster / UI / Badge"
                      disabled={saving}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Image (required)</Label>
                    <div className="rounded-3xl border border-border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">Upload portfolio image</div>
                          <div className="text-xs text-muted-foreground">Recommended: 1200x1200 for best quality.</div>
                        </div>
                        <Button
                          type="button"
                          variant="outlineGlow"
                          size="sm"
                          className="rounded-2xl"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={saving}
                        >
                          <UploadCloud className="h-4 w-4" />
                          Choose file
                        </Button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
                        <div className="h-[140px] w-[140px] rounded-3xl overflow-hidden bg-muted ring-1 ring-border">
                          {imagePreviewUrl ? (
                            <img src={imagePreviewUrl} alt="Selected" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          {imageFile ? (
                            <div className="text-sm font-semibold truncate">{imageFile.name}</div>
                          ) : (
                            <div className="text-sm font-semibold text-red-600 dark:text-red-400">Image required</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={createItem} disabled={saving}>
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
            <DialogTitle>Edit item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label>Image (optional)</Label>
              <div className="rounded-3xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">Replace image</div>
                    <div className="text-xs text-muted-foreground">Leave empty to keep the current image.</div>
                  </div>
                  <Button
                    type="button"
                    variant="outlineGlow"
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={saving}
                  >
                    <UploadCloud className="h-4 w-4" />
                    Choose file
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
                  <div className="h-[140px] w-[140px] rounded-3xl overflow-hidden bg-muted ring-1 ring-border">
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="Selected" className="h-full w-full object-cover" />
                    ) : editing?.image_url ? (
                      <img src={editing.image_url} alt="Current" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {imageFile ? <div className="text-sm font-semibold truncate">{imageFile.name}</div> : <div className="text-sm font-semibold">Current image</div>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => (editing ? updateItem(editing.id) : null)} disabled={!editing || saving}>
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
        </DialogContent>
      </Dialog>

      <Card className="rounded-3xl">
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <div className="text-sm font-extrabold">Items</div>
            <div className="text-xs text-muted-foreground tabular-nums">{rows.length} items</div>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.title}</TableCell>
                    <TableCell className="text-muted-foreground">{r.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl overflow-hidden bg-muted ring-1 ring-border shrink-0">
                          {r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                        </div>
                        <a
                          href={r.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "text-xs truncate max-w-[260px] hover:underline underline-offset-4",
                            r.image_url ? "text-muted-foreground" : "text-muted-foreground/60",
                          )}
                        >
                          {r.image_url || "No image"}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => openEdit(r)} disabled={!hasAny}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => removeItem(r)} disabled={!hasAny}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      No items yet.
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

