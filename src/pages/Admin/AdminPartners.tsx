import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UploadCloud, ExternalLink } from "lucide-react";
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

type PartnerCategory = "clubs" | "media" | "sponsors";

type PartnerRow = {
  id: string;
  category: PartnerCategory;
  name: string;
  description: string;
  image_url: string;
  partner_link: string | null;
  created_at: string;
};

const categories: { id: PartnerCategory; label: string }[] = [
  { id: "clubs", label: "Clubs" },
  { id: "media", label: "Media" },
  { id: "sponsors", label: "Sponsors" },
];

const PARTNERS_BUCKET = "partners";

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

function normalizeLink(raw: string | null | undefined) {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

async function uploadToBucket(path: string, file: File) {
  const { error } = await supabase.storage.from(PARTNERS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PARTNERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminPartners() {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerRow | null>(null);

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

  const [form, setForm] = useState({
    category: "clubs" as PartnerCategory,
    name: "",
    description: "",
    partner_link: "",
  });

  const grouped = useMemo(() => {
    const by: Record<PartnerCategory, PartnerRow[]> = { clubs: [], media: [], sponsors: [] };
    for (const r of rows) by[r.category].push(r);
    return by;
  }, [rows]);

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
      .from("partners")
      .select("id, category, name, description, image_url, partner_link, created_at")
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as PartnerRow[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setForm({ category: "clubs", name: "", description: "", partner_link: "" });
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

  async function createPartner() {
    setError(null);
    if (saving) return;

    const name = form.name.trim();
    const description = form.description.trim();
    if (!name || !description) {
      setError("Please fill Name and Description.");
      toast.error("Please fill Name and Description.");
      return;
    }
    if (!imageFile) {
      setError("Image is required.");
      toast.error("Image is required.");
      return;
    }

    let createdId: string | null = null;
    try {
      setSaving(true);
      const id = newUuid();
      createdId = id;

      setSavingStage("Creating partner...");
      setSavingProgress(10);
      const payload = {
        id,
        category: form.category,
        name,
        description,
        image_url: "",
        partner_link: normalizeLink(form.partner_link),
      };
      const insertRes = await supabase.from("partners").insert(payload);
      if (insertRes.error) throw insertRes.error;

      setSavingStage("Uploading image...");
      setSavingProgress(40);
      const folder = `${slugify(name)}/${id}`;
      const imagePath = `${folder}/image-${Date.now()}-${safeFileName(imageFile.name)}`;
      const publicUrl = await uploadToBucket(imagePath, imageFile);

      setSavingStage("Finalizing...");
      setSavingProgress(85);
      const updateRes = await supabase
        .from("partners")
        .update({ image_url: publicUrl, partner_link: normalizeLink(form.partner_link) })
        .eq("id", id);
      if (updateRes.error) throw updateRes.error;

      setSavingProgress(100);
      setOpen(false);
      toast.success("Partner added");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add partner";
      setError(msg);
      toast.error(msg);
      // Best-effort cleanup if we created the row but failed later.
      if (createdId) {
        try {
          await supabase.from("partners").delete().eq("id", createdId);
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

  function openEdit(row: PartnerRow) {
    setEditing(row);
    setForm({ category: row.category, name: row.name ?? "", description: row.description ?? "", partner_link: row.partner_link ?? "" });
    setEditOpen(true);
  }

  async function updatePartner(id: string) {
    setError(null);
    if (saving) return;

    const name = form.name.trim();
    const description = form.description.trim();
    if (!name || !description) {
      setError("Please fill Name and Description.");
      toast.error("Please fill Name and Description.");
      return;
    }

    try {
      setSaving(true);
      setSavingStage("Saving changes...");
      setSavingProgress(25);

      let imageUrl: string | null = null;
      if (imageFile) {
        setSavingStage("Uploading image...");
        setSavingProgress(35);
        const folder = `${slugify(name)}/${id}`;
        const imagePath = `${folder}/image-${Date.now()}-${safeFileName(imageFile.name)}`;
        imageUrl = await uploadToBucket(imagePath, imageFile);
      }

      setSavingStage("Updating partner...");
      setSavingProgress(80);
      const payload: Partial<PartnerRow> & { category: PartnerCategory; name: string; description: string } = {
        category: form.category,
        name,
        description,
      };
      // include partner link (nullable, normalized)
      payload.partner_link = normalizeLink(form.partner_link);
      if (imageUrl) payload.image_url = imageUrl;

      const { error } = await supabase.from("partners").update(payload).eq("id", id);
      if (error) throw error;

      setSavingProgress(100);
      setEditOpen(false);
      setEditing(null);
      toast.success("Partner updated");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update partner";
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
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  }

  function removePartner(row: Pick<PartnerRow, "id" | "name" | "category">) {
    requestConfirm({
      title: "Delete partner?",
      description: `${row.name}\n${categories.find((c) => c.id === row.category)?.label ?? row.category}`,
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
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Partners</div>
              <div className="text-lg font-extrabold">Manage partners by category</div>
            </div>

            <Dialog open={open} onOpenChange={(next) => (saving ? null : setOpen(next))}>
              <DialogTrigger asChild>
                <Button variant="hero" className="rounded-2xl">
                  <Plus />
                  Add partner
                </Button>
              </DialogTrigger>
              <DialogContent className="relative max-w-lg rounded-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Add partner</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <select
                      className="h-10 rounded-2xl border border-input bg-background px-3 text-sm"
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as PartnerCategory }))}
                      disabled={saving}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} disabled={saving} />
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
                    <Label>Image (required)</Label>
                    <div className="rounded-3xl border border-border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">Upload partner image</div>
                          <div className="text-xs text-muted-foreground">PNG/JPG recommended. Used on the Partners page.</div>
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
                          <div className="text-xs text-muted-foreground mt-1">Recommended: square (e.g. 800x800).</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={createPartner} disabled={saving}>
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
                        <div
                          className="h-full rounded-full bg-gradient-secondary transition-all"
                          style={{ width: `${savingProgress}%` }}
                        />
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
            <DialogTitle>Edit partner</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <select
                className="h-10 rounded-2xl border border-input bg-background px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as PartnerCategory }))}
                disabled={saving}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} disabled={saving} />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} disabled={saving} />
            </div>

                  <div className="grid gap-2">
                    <Label>Link (optional)</Label>
                    <Input
                      placeholder="https://example.com"
                      value={form.partner_link}
                      onChange={(e) => setForm((p) => ({ ...p, partner_link: e.target.value }))}
                      disabled={saving}
                    />
                  </div>

            <div className="grid gap-2">
              <Label>Image</Label>
              <div className="rounded-3xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">Replace partner image (optional)</div>
                    <div className="text-xs text-muted-foreground">Leave empty to keep the current one.</div>
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
                      <img src={editing.image_url} alt="Current" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {imageFile ? (
                      <div className="text-sm font-semibold truncate">{imageFile.name}</div>
                    ) : (
                      <div className="text-sm font-semibold">Current image</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">Recommended: square (e.g. 800x800).</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => (editing ? updatePartner(editing.id) : null)} disabled={!editing || saving}>
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

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {categories.map((c) => (
            <Card key={c.id} className="rounded-3xl">
              <CardContent className="p-0">
                <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
                  <div className="text-sm font-extrabold">{c.label}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{grouped[c.id].length} items</div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead className="w-[160px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[c.id].map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold flex items-center gap-2">
                          <span className="truncate">{p.name}</span>
                          {p.partner_link ? (
                            <a
                              href={normalizeLink(p.partner_link) ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-secondary/20 text-muted-foreground hover:text-secondary transition-colors"
                              title="Open partner link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-muted ring-1 ring-border shrink-0">
                              <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.partner_link ? (
                            <a
                              href={p.partner_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground truncate max-w-[260px] inline-flex items-center gap-2 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="truncate">{p.partner_link}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="rounded-2xl">
                              <Pencil />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => removePartner(p)} className={cn("rounded-2xl")}>
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {grouped[c.id].length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground">
                          No partners in this category yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
