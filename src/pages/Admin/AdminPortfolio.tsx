import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UploadCloud, Images } from "lucide-react";
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
  return crypto.randomUUID();
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

  // CHANGED: Support for multiple files
  const [imageFiles, setImageFiles] = useState<File[]>([]);
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

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id, title, category, image_url, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setRows((data ?? []) as PortfolioRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!open && !editOpen) {
      setError(null);
      setForm({ title: "", category: "" });
      setImageFiles([]);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [open, editOpen]);

  // Handle Multi-upload and Single upload logic
  async function saveItems() {
    if (imageFiles.length === 0) {
      toast.error("Please select at least one image.");
      return;
    }

    // If only one image, we can enforce title/category. 
    // If multiple, we use file names or "Untitled" if form is empty.
    const isBulk = imageFiles.length > 1;

    try {
      setSaving(true);
      setError(null);

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const currentProgress = Math.round((i / imageFiles.length) * 100);
        
        setSavingStage(`Uploading ${i + 1} of ${imageFiles.length}: ${file.name}`);
        setSavingProgress(currentProgress);

        const id = newUuid();
        const itemTitle = isBulk ? (file.name.split('.')[0] || "Untitled") : (form.title || file.name);
        const itemCategory = form.category || "General";

        // 1. Insert Record
        const { error: insErr } = await supabase.from("portfolio_items").insert({
          id,
          title: itemTitle,
          category: itemCategory,
          image_url: ""
        });
        if (insErr) throw insErr;

        // 2. Upload File
        const folder = `${slugify(itemCategory)}/${id}`;
        const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
        const publicUrl = await uploadToBucket(path, file);

        // 3. Update Record with URL
        const { error: updErr } = await supabase.from("portfolio_items").update({ image_url: publicUrl }).eq("id", id);
        if (updErr) throw updErr;
      }

      setSavingProgress(100);
      toast.success(isBulk ? `Uploaded ${imageFiles.length} items` : "Portfolio item added");
      setOpen(false);
      refresh();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string) {
    if (saving) return;
    try {
      setSaving(true);
      let imageUrl = editing?.image_url;

      if (imageFiles.length > 0) {
        const file = imageFiles[0];
        const folder = `${slugify(form.category)}/${id}`;
        const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
        imageUrl = await uploadToBucket(path, file);
      }

      const { error } = await supabase
        .from("portfolio_items")
        .update({ title: form.title, category: form.category, image_url: imageUrl })
        .eq("id", id);

      if (error) throw error;

      toast.success("Updated successfully");
      setEditOpen(false);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden Multi-file Input */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          setImageFiles(files);
        }}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmRunning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmRunning}
              onClick={async (e) => {
                e.preventDefault();
                if (confirmAction) {
                  setConfirmRunning(true);
                  await confirmAction();
                  setConfirmRunning(false);
                  setConfirmOpen(false);
                }
              }}
            >
              {confirmRunning ? "Deleting..." : confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header Card */}
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Admin</div>
              <div className="text-lg font-extrabold">Portfolio Manager</div>
            </div>

            <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
              <DialogTrigger asChild>
                <Button variant="default" className="rounded-2xl gap-2">
                  <Plus className="h-4 w-4" /> Add Items
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-3xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Upload Portfolio</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Category (Applied to all in batch)</Label>
                    <Input 
                      placeholder="e.g. Graphic Design" 
                      value={form.category} 
                      onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    />
                  </div>
                  
                  {imageFiles.length <= 1 && (
                    <div className="grid gap-2">
                      <Label>Title (Optional for bulk)</Label>
                      <Input 
                        placeholder="Project Name" 
                        value={form.title} 
                        onChange={e => setForm(f => ({...f, title: e.target.value}))}
                      />
                    </div>
                  )}

                  <div 
                    className={cn(
                      "group relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-6 transition-colors",
                      imageFiles.length > 0 ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20 hover:border-primary/30"
                    )}
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => imageInputRef.current?.click()}
                      className="text-sm font-medium"
                    >
                      {imageFiles.length > 0 ? `${imageFiles.length} files selected` : "Select Images"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Tip: You can select multiple files at once for bulk upload.
                    </p>
                  </div>

                  {imageFiles.length > 0 && (
                    <div className="max-h-[150px] overflow-y-auto border rounded-xl p-2 bg-muted/30">
                       {imageFiles.map((f, i) => (
                         <div key={i} className="text-xs py-1 px-2 border-b last:border-0 truncate">
                           {f.name}
                         </div>
                       ))}
                    </div>
                  )}

                  <Button onClick={saveItems} disabled={saving || imageFiles.length === 0} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {saving ? "Processing..." : `Upload ${imageFiles.length} item(s)`}
                  </Button>
                </div>

                {saving && (
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <div className="font-bold text-lg">{savingProgress}%</div>
                    <div className="text-sm text-muted-foreground">{savingStage}</div>
                    <div className="w-full bg-muted h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${savingProgress}%` }} />
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="rounded-3xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center">Loading portfolio...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No items found.</TableCell></TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden border">
                      <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{row.title}</div>
                    <div className="text-xs text-muted-foreground">{row.category}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditing(row);
                        setForm({ title: row.title, category: row.category });
                        setEditOpen(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        requestConfirm({
                          title: "Delete Item?",
                          description: `Are you sure you want to delete "${row.title}"?`,
                          actionLabel: "Delete",
                          action: async () => {
                            const { error } = await supabase.from("portfolio_items").delete().eq("id", row.id);
                            if (error) toast.error(error.message);
                            else { toast.success("Deleted"); refresh(); }
                          }
                        });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={v => !saving && setEditOpen(v)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} />
            </div>
            <Button onClick={() => editing && updateItem(editing.id)} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
