import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Radio, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/DateTimePicker";
import { toast } from "@/components/ui/sonner";

type TimelineRow = {
  id: string;
  sort_order: number;
  full_name: string;
  specialty: string;
  organization: string;
  photo_url: string | null;
  linkedin_url: string | null;
  talk_title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  links: { label: string; url: string }[];
  gallery: string[];
  is_live: boolean;
  stream_url: string | null;
  created_at: string;
};

function toIsoFromLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminLiveProgram() {
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineRow | null>(null);
  const [createStep, setCreateStep] = useState(0);
  const [editStep, setEditStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingStage, setSavingStage] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [confirmRunning, setConfirmRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    organization: "",
    linkedin_url: "",
    talk_title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    stream_url: "",
    research_paper_url: "",
    speaker_profile_url: "",
  });

  const liveId = useMemo(() => rows.find((r) => r.is_live)?.id ?? null, [rows]);
  const liveRow = useMemo(() => rows.find((r) => r.is_live) ?? null, [rows]);

  const bucketName = import.meta.env.VITE_SUPABASE_TIMELINE_BUCKET || "timeline";

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

  function requestConfirm(args: {
    title: string;
    description: string;
    actionLabel: string;
    action: () => Promise<void>;
  }) {
    setConfirmTitle(args.title);
    setConfirmDescription(args.description);
    setConfirmActionLabel(args.actionLabel);
    setConfirmAction(() => args.action);
    setConfirmRunning(false);
    setConfirmOpen(true);
  }

  function buildLinks() {
    const links: { label: string; url: string }[] = [];
    const paper = form.research_paper_url.trim();
    const profile = form.speaker_profile_url.trim();
    if (paper) links.push({ label: "Research Paper", url: paper });
    if (profile) links.push({ label: "Speaker Profile", url: profile });
    return links;
  }

  async function uploadToBucket(path: string, file: File) {
    const { error } = await supabase.storage.from(bucketName).upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  }

  useEffect(() => {
    if (!photoFile) {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
      return;
    }
    const next = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => URL.revokeObjectURL(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoFile]);

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
      .from("timeline_cards")
      .select(
        "id, sort_order, full_name, specialty, organization, photo_url, linkedin_url, talk_title, description, starts_at, ends_at, links, gallery, is_live, stream_url, created_at",
      )
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as TimelineRow[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!open) {
      setCreateStep(0);
      setPhotoFile(null);
      setGalleryFiles([]);
      setSavingProgress(0);
    } else {
      setError(null);
      setTimeout(() => {
        fullNameInputRef.current?.focus({ preventScroll: true });
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    if (!editOpen) {
      setEditStep(0);
      setEditing(null);
      setPhotoFile(null);
      setGalleryFiles([]);
      setSavingProgress(0);
    } else {
      setError(null);
      setTimeout(() => {
        fullNameInputRef.current?.focus({ preventScroll: true });
      }, 0);
    }
  }, [editOpen]);

  function formatSupabaseError(e: unknown) {
    if (!e) return "Unknown error";
    if (e instanceof Error) return e.message;
    if (typeof e === "object") {
      const anyE = e as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
      const parts = [
        typeof anyE.message === "string" ? anyE.message : null,
        typeof anyE.details === "string" ? anyE.details : null,
        typeof anyE.hint === "string" ? anyE.hint : null,
        typeof anyE.code === "string" ? `code: ${anyE.code}` : null,
      ].filter(Boolean);
      if (parts.length) return parts.join(" · ");
    }
    return String(e);
  }

  async function createSession() {
    setError(null);
    if (saving) return;
    if (!photoFile) {
      setError("Photo is required.");
      return;
    }
    if (galleryFiles.length > 3) {
      setError("Gallery upload max is 3 images.");
      return;
    }

    const startsAtIso = toIsoFromLocal(form.starts_at);
    const endsAtIso = toIsoFromLocal(form.ends_at);
    const startsAtMs = new Date(form.starts_at).getTime();
    const endsAtMs = new Date(form.ends_at).getTime();
    if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs)) {
      setError("Please select valid start/end date & time.");
      return;
    }
    if (startsAtMs < Date.now() - 60 * 1000) {
      setError("Start time can't be in the past.");
      return;
    }
    if (endsAtMs <= startsAtMs) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    setSavingStage("Creating session…");
    setSavingProgress(10);
    try {
      const id = crypto.randomUUID();
      const folder = `${slugify(form.full_name || "session")}/${id}`;

      // Create DB row first (required by storage policy that checks timeline_cards existence).
      const insertPayload = {
        id,
        full_name: form.full_name.trim(),
        specialty: form.specialty.trim(),
        organization: form.organization.trim(),
        linkedin_url: form.linkedin_url.trim() ? form.linkedin_url.trim() : null,
        talk_title: form.talk_title.trim(),
        description: form.description.trim() ? form.description.trim() : null,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        stream_url: form.stream_url.trim() ? form.stream_url.trim() : null,
        is_live: false,
        photo_url: null,
        links: buildLinks(),
        gallery: [],
      };

      const insertRes = await supabase.from("timeline_cards").insert(insertPayload);
      if (insertRes.error) throw insertRes.error;

      setSavingStage("Uploading photo…");
      setSavingProgress(35);
      const photoPath = `${folder}/photo-${Date.now()}-${safeFileName(photoFile.name)}`;
      const photoUrl = await uploadToBucket(photoPath, photoFile);

      const uploadedGallery: string[] = [];
      for (let i = 0; i < galleryFiles.length; i += 1) {
        setSavingStage(`Uploading gallery ${i + 1}/${galleryFiles.length}…`);
        const base = 35;
        const span = 45;
        const ratio = galleryFiles.length ? (i + 1) / galleryFiles.length : 1;
        setSavingProgress(base + Math.round(span * ratio));
        const f = galleryFiles[i]!;
        const p = `${folder}/gallery-${i + 1}-${Date.now()}-${safeFileName(f.name)}`;
        uploadedGallery.push(await uploadToBucket(p, f));
      }

      setSavingStage("Finalizing…");
      setSavingProgress(90);
      const updatePayload = { photo_url: photoUrl, gallery: uploadedGallery };
      const updateRes = await supabase.from("timeline_cards").update(updatePayload).eq("id", id);
      if (updateRes.error) throw updateRes.error;

      setSavingProgress(100);
      setOpen(false);
      setForm({
        full_name: "",
        specialty: "",
        organization: "",
        linkedin_url: "",
        talk_title: "",
        description: "",
        starts_at: "",
        ends_at: "",
        stream_url: "",
        research_paper_url: "",
        speaker_profile_url: "",
      });
      setPhotoFile(null);
      setGalleryFiles([]);
      toast.success("Session created");
      refresh();
    } catch (e) {
      const msg = formatSupabaseError(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setSavingStage(null);
      setSavingProgress(0);
    }
  }

  async function updateSession(id: string) {
    setError(null);
    if (saving) return;
    const startsAtIso = toIsoFromLocal(form.starts_at);
    const endsAtIso = toIsoFromLocal(form.ends_at);
    const startsAtMs = new Date(form.starts_at).getTime();
    const endsAtMs = new Date(form.ends_at).getTime();
    if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs)) {
      setError("Please select valid start/end date & time.");
      return;
    }
    if (startsAtMs < Date.now() - 60 * 1000) {
      setError("Start time can't be in the past.");
      return;
    }
    if (endsAtMs <= startsAtMs) {
      setError("End time must be after start time.");
      return;
    }

    const existingPhoto = editing?.photo_url ?? null;
    if (!photoFile && !existingPhoto) {
      setError("Photo is required.");
      return;
    }

    setSaving(true);
    setSavingStage("Saving changes…");
    setSavingProgress(15);
    try {
      const folder = `${slugify(form.full_name || "session")}/${id}`;

      let nextPhotoUrl = existingPhoto;
      if (photoFile) {
        setSavingStage("Uploading photo…");
        setSavingProgress(40);
        const photoPath = `${folder}/photo-${Date.now()}-${safeFileName(photoFile.name)}`;
        nextPhotoUrl = await uploadToBucket(photoPath, photoFile);
      }

      const baseGallery = Array.isArray(editing?.gallery) ? editing!.gallery : [];
      const uploadedGallery: string[] = [];
      const remaining = Math.max(0, 3 - baseGallery.length);
      const toUpload = galleryFiles.slice(0, remaining);
      for (let i = 0; i < toUpload.length; i += 1) {
        setSavingStage(`Uploading gallery ${i + 1}/${toUpload.length}…`);
        const base = 45;
        const span = 35;
        const ratio = toUpload.length ? (i + 1) / toUpload.length : 1;
        setSavingProgress(base + Math.round(span * ratio));
        const f = toUpload[i]!;
        const p = `${folder}/gallery-${baseGallery.length + i + 1}-${Date.now()}-${safeFileName(f.name)}`;
        uploadedGallery.push(await uploadToBucket(p, f));
      }

      const payload = {
        full_name: form.full_name.trim(),
        specialty: form.specialty.trim(),
        organization: form.organization.trim(),
        photo_url: nextPhotoUrl,
        linkedin_url: form.linkedin_url.trim() ? form.linkedin_url.trim() : null,
        talk_title: form.talk_title.trim(),
        description: form.description.trim() ? form.description.trim() : null,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        stream_url: form.stream_url.trim() ? form.stream_url.trim() : null,
        links: buildLinks(),
        gallery: [...baseGallery, ...uploadedGallery].slice(0, 3),
      };

      setSavingStage("Finalizing…");
      setSavingProgress(90);
      const { error } = await supabase.from("timeline_cards").update(payload).eq("id", id);
      if (error) throw error;
      setSavingProgress(100);
      setEditOpen(false);
      setEditing(null);
      setPhotoFile(null);
      setGalleryFiles([]);
      toast.success("Session updated");
      refresh();
    } catch (e) {
      const msg = formatSupabaseError(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setSavingStage(null);
      setSavingProgress(0);
    }
  }

  async function doDelete(row: Pick<TimelineRow, "id" | "full_name" | "talk_title">) {
    setError(null);
    const { error } = await supabase.from("timeline_cards").delete().eq("id", row.id);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  }

  function removeSession(row: Pick<TimelineRow, "id" | "full_name" | "talk_title">) {
    requestConfirm({
      title: "Delete session?",
      description: `${row.full_name}\n${row.talk_title}`,
      actionLabel: "Delete",
      action: async () => doDelete(row),
    });
  }

  async function doUnlive(row: Pick<TimelineRow, "id" | "full_name" | "talk_title">) {
    const res = await supabase.from("timeline_cards").update({ is_live: false }).eq("id", row.id);
    if (res.error) {
      setError(res.error.message);
      toast.error(res.error.message);
      return;
    }
    toast.success("Session is no longer live");
    refresh();
  }

  async function doSetLive(row: Pick<TimelineRow, "id" | "full_name" | "talk_title">) {
    const clearRes = await supabase.from("timeline_cards").update({ is_live: false }).neq("id", row.id);
    if (clearRes.error) {
      setError(clearRes.error.message);
      toast.error(clearRes.error.message);
      return;
    }

    const setRes = await supabase.from("timeline_cards").update({ is_live: true }).eq("id", row.id);
    if (setRes.error) {
      setError(setRes.error.message);
      toast.error(setRes.error.message);
      return;
    }
    toast.success("Live session updated");
    refresh();
  }

  function setLive(row: Pick<TimelineRow, "id" | "is_live" | "full_name" | "talk_title">) {
    setError(null);
    if (row.is_live) {
      requestConfirm({
        title: "Unlive this session?",
        description: `${row.full_name}\n${row.talk_title}`,
        actionLabel: "Unlive",
        action: async () => doUnlive(row),
      });
      return;
    }

    if (liveId && liveId !== row.id) {
      const current = liveRow ? `${liveRow.full_name} — ${liveRow.talk_title}` : "Another session";
      requestConfirm({
        title: "Switch live session?",
        description: `Current live:\n${current}\n\nSet live to:\n${row.full_name}\n${row.talk_title}`,
        actionLabel: "Switch",
        action: async () => doSetLive(row),
      });
      return;
    }
    requestConfirm({
      title: "Set session live?",
      description: `${row.full_name}\n${row.talk_title}`,
      actionLabel: "Set live",
      action: async () => doSetLive(row),
    });
  }

  function openEdit(row: TimelineRow) {
    setEditing(row);
    setPhotoFile(null);
    setGalleryFiles([]);
    setForm({
      full_name: row.full_name ?? "",
      specialty: row.specialty ?? "",
      organization: row.organization ?? "",
      linkedin_url: row.linkedin_url ?? "",
      talk_title: row.talk_title ?? "",
      description: row.description ?? "",
      starts_at: toLocalInputValue(row.starts_at),
      ends_at: toLocalInputValue(row.ends_at),
      stream_url: row.stream_url ?? "",
      research_paper_url: row.links?.find((l) => l.label === "Research Paper")?.url ?? row.links?.[0]?.url ?? "",
      speaker_profile_url: row.links?.find((l) => l.label === "Speaker Profile")?.url ?? row.links?.[1]?.url ?? "",
    });
    setEditOpen(true);
  }

  function renderFormFields() {
    const steps = ["Speaker", "Session", "Media", "Links"] as const;
    const step = editing ? editStep : createStep;
    const setStep = editing ? setEditStep : setCreateStep;

    const canGoBack = step > 0;
    const isLast = step === steps.length - 1;

    function validateStep(nextStep: number) {
      if (nextStep <= step) return true;
      if (step === 0) {
        if (!form.full_name.trim() || !form.specialty.trim() || !form.organization.trim()) {
          setError("Please fill: Full name, Specialty, Organization.");
          return false;
        }
      }
      if (step === 1) {
        if (!form.talk_title.trim() || !form.starts_at || !form.ends_at) {
          setError("Please fill: Talk title, Start time, End time.");
          return false;
        }

        const startsAt = new Date(form.starts_at).getTime();
        const endsAt = new Date(form.ends_at).getTime();
        const now = Date.now();
        if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
          setError("Please select valid start/end date & time.");
          return false;
        }
        if (startsAt < now - 60 * 1000) {
          setError("Start time can't be in the past.");
          return false;
        }
        if (endsAt <= startsAt) {
          setError("End time must be after start time.");
          return false;
        }
      }
      if (step === 2) {
        const hasExisting = Boolean(editing?.photo_url);
        if (!hasExisting && !photoFile) {
          setError("Photo is required.");
          return false;
        }
        if (galleryFiles.length > 3) {
          setError("Gallery upload max is 3 images.");
          return false;
        }
      }
      return true;
    }

    return (
      <div className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Step {step + 1} / {steps.length}
            </div>
            <div className="text-lg font-extrabold">{steps[step]}</div>
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2.5 w-8 rounded-full",
                  i < step ? "bg-secondary/40" : i === step ? "bg-secondary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Full name</Label>
              <Input
                ref={fullNameInputRef}
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Specialty</Label>
              <Input
                value={form.specialty}
                onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                placeholder="Cardiology"
              />
            </div>
            <div className="grid gap-2">
              <Label>Organization</Label>
              <Input
                value={form.organization}
                onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                placeholder="Stanford"
              />
            </div>
            <div className="grid gap-2">
              <Label>LinkedIn URL (optional)</Label>
              <Input
                value={form.linkedin_url}
                onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Talk title</Label>
              <Input
                value={form.talk_title}
                onChange={(e) => setForm((p) => ({ ...p, talk_title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-28 rounded-2xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start time</Label>
                <DateTimePicker
                  value={form.starts_at}
                  minDate={new Date()}
                  onChange={(v) => {
                    setForm((p) => {
                      const next = { ...p, starts_at: v };
                      if (p.ends_at) {
                        const s = new Date(v).getTime();
                        const e = new Date(p.ends_at).getTime();
                        if (Number.isFinite(s) && Number.isFinite(e) && e <= s) {
                          next.ends_at = "";
                        }
                      }
                      return next;
                    });
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>End time</Label>
                <DateTimePicker
                  value={form.ends_at}
                  minDate={form.starts_at ? new Date(form.starts_at) : new Date()}
                  onChange={(v) => setForm((p) => ({ ...p, ends_at: v }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Stream URL (optional)</Label>
              <Input
                value={form.stream_url}
                onChange={(e) => setForm((p) => ({ ...p, stream_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Photo (required)</Label>
              <div className="rounded-3xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">Upload speaker photo</div>
                    <div className="text-xs text-muted-foreground">
                      JPG/PNG recommended. This will appear on the timeline card.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outlineGlow"
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Choose file
                  </Button>
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />

                <div className="mt-3 text-xs text-muted-foreground">
                  Recommended: square image (e.g. 800×800) for best quality on the timeline card.
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
                  <div className="h-[140px] w-[140px] rounded-3xl overflow-hidden bg-muted ring-1 ring-border">
                    {photoPreviewUrl ? (
                      <img src={photoPreviewUrl} alt="Selected" className="h-full w-full object-cover" />
                    ) : editing?.photo_url ? (
                      <img src={editing.photo_url} alt="Current" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        No photo selected
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {photoFile ? (
                      <div className="text-sm font-semibold truncate">{photoFile.name}</div>
                    ) : editing?.photo_url ? (
                      <div className="text-sm font-semibold">Current photo</div>
                    ) : (
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">Photo required</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {editing?.photo_url ? "You can replace it anytime." : "Choose a photo to continue."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Gallery images (max 3)</Label>
              <div className="rounded-3xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">Upload up to 3 images</div>
                    <div className="text-xs text-muted-foreground">These appear when you expand the card.</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    Choose images
                  </Button>
                </div>

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []).slice(0, 3);
                    setGalleryFiles(selected);
                  }}
                />

                <div className="mt-3 text-xs text-muted-foreground">
                  Recommended: 4:3 images (e.g. 1200×900). Max 3 images.
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {galleryPreviewUrls.length ? (
                    galleryPreviewUrls.map((u, idx) => (
                      <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted ring-1 ring-border">
                        <img src={u} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))
                  ) : editing?.gallery?.length ? (
                    editing.gallery.slice(0, 3).map((u, idx) => (
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
                  Selected: <span className="font-semibold text-foreground tabular-nums">{galleryFiles.length}</span> / 3
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Research Paper (optional)</Label>
              <Input
                value={form.research_paper_url}
                onChange={(e) => setForm((p) => ({ ...p, research_paper_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Speaker Profile (optional)</Label>
              <Input
                value={form.speaker_profile_url}
                onChange={(e) => setForm((p) => ({ ...p, speaker_profile_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={!canGoBack || saving}
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            {!isLast ? (
              <Button
                type="button"
                className="rounded-2xl"
                onClick={() => {
                  setError(null);
                  if (!validateStep(step + 1)) return;
                  setStep((s) => Math.min(steps.length - 1, s + 1));
                }}
                disabled={saving}
              >
                Next
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {confirmDescription}
            </AlertDialogDescription>
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
              {confirmRunning ? "Working…" : confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Timeline</div>
              <div className="text-lg font-extrabold">Manage Live Program sessions</div>
            </div>
            <Dialog
              open={open}
              onOpenChange={(next) => {
                if (saving) return;
                setOpen(next);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="hero" className="rounded-2xl">
                  <Plus />
                  Add session
                </Button>
              </DialogTrigger>
              <DialogContent
                className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle>Add session</DialogTitle>
                  <DialogDescription className="sr-only">
                    Create a timeline session card.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[72vh] overflow-y-auto pr-4 -mr-2">
                  <div className="mr-2">{renderFormFields()}</div>
                </div>
                {savingStage ? (
                  <div className="text-xs text-muted-foreground">{savingStage}</div>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={createSession} disabled={createStep !== 3 || saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>

                {saving ? (
                  <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-elegant p-6">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold">Saving</div>
                          <div className="text-xs text-muted-foreground truncate">{savingStage ?? "Please wait…"}</div>
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
        <DialogContent
          className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit session</DialogTitle>
            <DialogDescription className="sr-only">
              Edit a timeline session card.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[72vh] overflow-y-auto pr-4 -mr-2">
            <div className="mr-2">{renderFormFields()}</div>
          </div>
          {savingStage ? (
            <div className="text-xs text-muted-foreground">{savingStage}</div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => (editing ? updateSession(editing.id) : null)}
              disabled={!editing || editStep !== 3 || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>

          {saving ? (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-elegant p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold">Saving</div>
                    <div className="text-xs text-muted-foreground truncate">{savingStage ?? "Please wait…"}</div>
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

      <Card className="rounded-3xl">
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <div className="text-sm font-extrabold">Sessions</div>
            <div className="text-xs text-muted-foreground tabular-nums">{rows.length} items</div>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Speaker</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-[140px]">Live</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} data-state={r.is_live ? "selected" : undefined}>
                    <TableCell className="font-semibold">
                      {r.full_name}
                      <div className="text-xs text-muted-foreground font-medium">
                        {r.specialty} · {r.organization}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.talk_title}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {toLocalInputValue(r.starts_at).replace("T", " ")} — {toLocalInputValue(r.ends_at).split("T")[1]}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={r.is_live ? "secondary" : "outline"}
                        size="sm"
                        className={cn("rounded-2xl", r.is_live && "text-live")}
                        onClick={() => setLive(r)}
                      >
                        <Radio className="h-4 w-4" />
                        {r.is_live ? "Unlive" : "Set live"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                          <Pencil />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => removeSession(r)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No sessions yet.
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
