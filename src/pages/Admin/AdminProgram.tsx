import { useEffect, useMemo, useRef, useState } from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

type ProgramRow = {
  id: string;
  title: string;
  file_url: string;
  is_active: boolean;
  created_at: string;
};

const PROGRAM_BUCKET = "program";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function newUuid() {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id) throw new Error("Browser does not support crypto.randomUUID().");
  return id;
}

async function uploadPdf(path: string, file: File) {
  const { error } = await supabase.storage.from(PROGRAM_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/pdf",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PROGRAM_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminProgram() {
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [savingStage, setSavingStage] = useState<string | null>(null);

  const [title, setTitle] = useState("Program");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [confirmRunning, setConfirmRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

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
    setError(null);
    const { data, error } = await supabase
      .from("program_files")
      .select("id, title, file_url, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as ProgramRow[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!open) {
      setTitle("Program");
      setFile(null);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [open]);

  async function uploadNewProgram() {
    setError(null);
    if (saving) return;

    const nextTitle = title.trim() || "Program";
    if (!file) {
      toast.error("Please select a PDF file.");
      return;
    }
    if (file.type && file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    try {
      setSaving(true);
      setSavingProgress(5);
      setSavingStage("Uploading PDF...");

      const id = newUuid();
      const path = `${id}/program-${Date.now()}-${safeFileName(file.name)}`;
      const publicUrl = await uploadPdf(path, file);

      setSavingProgress(70);
      setSavingStage("Publishing...");
      const deactivate = await supabase.from("program_files").update({ is_active: false }).eq("is_active", true);
      if (deactivate.error) throw deactivate.error;

      const insert = await supabase.from("program_files").insert({ id, title: nextTitle, file_url: publicUrl, is_active: true });
      if (insert.error) throw insert.error;

      setSavingProgress(100);
      toast.success("Program updated");
      setOpen(false);
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to upload program";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }

  async function doDelete(id: string) {
    setError(null);
    const { error } = await supabase.from("program_files").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  }

  function removeRow(row: ProgramRow) {
    requestConfirm({
      title: "Delete program file?",
      description: `${row.title}\n${row.file_url}`,
      actionLabel: "Delete",
      action: async () => doDelete(row.id),
    });
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmRunning} className="rounded-2xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmRunning}
              className={cn("rounded-2xl", confirmActionLabel.toLowerCase().includes("delete") ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "")}
              onClick={async (e) => {
                e.preventDefault();
                if (!confirmAction) return;
                try {
                  setConfirmRunning(true);
                  await confirmAction();
                  setConfirmOpen(false);
                } finally {
                  setConfirmRunning(false);
                }
              }}
            >
              {confirmRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : (
                confirmActionLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-2xl">
            <FileUp className="h-4 w-4" />
            Upload program PDF
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update program</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {error ? <div className="text-sm text-destructive">{error}</div> : null}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Program" />
            </div>

            <div className="space-y-2">
              <Label>PDF file</Label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  setFile(next);
                }}
              />
              <div className="rounded-3xl border border-border bg-muted/20 p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{file ? file.name : "Choose a PDF file"}</div>
                  <div className="text-xs text-muted-foreground">PDF recommended</div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-2xl shrink-0"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving}
                >
                  Choose file
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button className="rounded-2xl" onClick={uploadNewProgram} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Publish"
                )}
              </Button>
            </div>
          </div>

          {saving ? (
            <div className="absolute inset-0 rounded-3xl bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-elegant">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{savingStage ?? "Saving..."}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{Math.round(savingProgress)}%</div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${Math.min(100, Math.max(0, savingProgress))}%` }} />
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Card className="rounded-3xl">
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <div className="text-sm font-extrabold">Program files</div>
            <div className="text-xs text-muted-foreground tabular-nums">{rows.length} files</div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.title}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-bold", r.is_active ? "bg-live/10 text-live" : "bg-muted text-muted-foreground")}>
                        {r.is_active ? "Active" : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:underline underline-offset-4 truncate block max-w-[520px]"
                      >
                        {r.file_url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => removeRow(r)} disabled={!hasAny}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      No program files yet.
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

