import { useEffect, useRef, useState } from "react";
import { CalendarClock, ChevronRight, Link2, Loader2, Pencil, Plus, Radio, Trash2, UploadCloud, UserRound } from "lucide-react";
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

type Session = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
};

type Moderator = {
  id: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  full_name: string;
  photo_url: string | null;
};

type Program = {
  id: string;
  sort_order: number;
  full_name: string;
  specialty: string | null;
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
  session_id: string | null;
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
  // Session management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Moderators
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [moderatorLoading, setModeratorLoading] = useState(false);
  const [addModeratorOpen, setAddModeratorOpen] = useState(false);
  const [moderatorForm, setModeratorForm] = useState({ full_name: "" });

  // Programs
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programLoading, setProgramLoading] = useState(false);
  const [addProgramOpen, setAddProgramOpen] = useState(false);
  const [programCreateStep, setProgramCreateStep] = useState(0);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [confirmRunning, setConfirmRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  const [sessionEditOpen, setSessionEditOpen] = useState(false);
  const [sessionTitleDraft, setSessionTitleDraft] = useState("");
  const [editingModerator, setEditingModerator] = useState<Moderator | null>(null);
  const [moderatorNameDraft, setModeratorNameDraft] = useState("");
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programEditStep, setProgramEditStep] = useState(0);
  const [programEditDraft, setProgramEditDraft] = useState({
    full_name: "",
    specialty: "",
    organization: "",
    talk_title: "",
    starts_at: "",
    ends_at: "",
    stream_url: "",
    is_live: false,
    description: "",
    research_paper_url: "",
    speaker_profile_url: "",
  });

  const [saving, setSaving] = useState(false);
  const [savingStage, setSavingStage] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editGalleryFiles, setEditGalleryFiles] = useState<File[]>([]);
  const [editPhotoPreviewUrl, setEditPhotoPreviewUrl] = useState<string | null>(null);
  const [editGalleryPreviewUrls, setEditGalleryPreviewUrls] = useState<string[]>([]);
  const editPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const editGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [programForm, setProgramForm] = useState({
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

  function resetProgramForm() {
    setProgramCreateStep(0);
    setProgramForm({
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
    setPhotoPreviewUrl(null);
    setGalleryPreviewUrls([]);
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function handlePhotoSelected(file: File | null) {
    setPhotoFile(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleGallerySelected(files: File[]) {
    setGalleryFiles(files.slice(0, 3));
    setGalleryPreviewUrls(files.slice(0, 3).map((file) => URL.createObjectURL(file)));
  }

  const programStepMeta = [
    { label: "Speaker", icon: UserRound },
    { label: "Schedule", icon: CalendarClock },
    { label: "Media", icon: UploadCloud },
    { label: "Links", icon: Link2 },
  ];

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

  function openSessionEdit() {
    if (!selectedSession) return;
    setSessionTitleDraft(selectedSession.title);
    setSessionEditOpen(true);
  }

  async function saveSessionEdit() {
    if (!selectedSession || !sessionTitleDraft.trim()) return;
    const { error } = await supabase.from("sessions").update({ title: sessionTitleDraft.trim() }).eq("id", selectedSession.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session updated");
    setSessionEditOpen(false);
    setSelectedSession({ ...selectedSession, title: sessionTitleDraft.trim() });
    refreshSessions();
  }

  function openModeratorEdit(moderator: Moderator) {
    setEditingModerator(moderator);
    setModeratorNameDraft(moderator.full_name);
  }

  async function saveModeratorEdit() {
    if (!editingModerator || !moderatorNameDraft.trim()) return;
    const { error } = await supabase.from("moderators").update({ full_name: moderatorNameDraft.trim() }).eq("id", editingModerator.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Moderator updated");
    setEditingModerator(null);
    setModeratorNameDraft("");
    if (selectedSession) refreshModerators(selectedSession.id);
  }

  function openProgramEdit(program: Program) {
    setEditingProgram(program);
    setProgramEditStep(0);
    // extract common link urls (if present)
    let research = "";
    let profile = "";
    try {
      const links = (program as any).links ?? [];
      if (Array.isArray(links)) {
        for (const l of links) {
          if (l.label?.toLowerCase?.() === "research paper") research = l.url ?? "";
          if (l.label?.toLowerCase?.() === "speaker profile") profile = l.url ?? "";
        }
      }
    } catch (e) {
      // ignore
    }

    setProgramEditDraft({
      full_name: program.full_name,
      specialty: program.specialty ?? "",
      organization: program.organization,
      talk_title: program.talk_title,
      starts_at: program.starts_at,
      ends_at: program.ends_at,
      stream_url: program.stream_url ?? "",
      is_live: program.is_live,
      description: program.description ?? "",
      research_paper_url: research,
      speaker_profile_url: profile,
    });
    // prefill edit previews from existing program
    setEditPhotoFile(null);
    setEditGalleryFiles([]);
    setEditPhotoPreviewUrl(program.photo_url ?? null);
    setEditGalleryPreviewUrls(program.gallery ?? []);
  }

  async function saveProgramEdit() {
    if (!editingProgram) return;
    setSaving(true);
    try {
      const id = editingProgram.id;
      const folder = `${slugify(programEditDraft.full_name || "program")}/${id}`;

      // If a new photo was selected, upload it
      let photoUrl: string | null = editingProgram.photo_url ?? null;
      if (editPhotoFile) {
        setSavingStage("Uploading photo…");
        const photoPath = `${folder}/photo-${Date.now()}-${safeFileName(editPhotoFile.name)}`;
        photoUrl = await uploadToBucket(photoPath, editPhotoFile);
      }

      // If new gallery files selected, upload and replace
      let uploadedGallery: string[] = editingProgram.gallery ?? [];
      if (editGalleryFiles.length > 0) {
        uploadedGallery = [];
        for (let i = 0; i < editGalleryFiles.length; i += 1) {
          setSavingStage(`Uploading gallery ${i + 1}/${editGalleryFiles.length}…`);
          const f = editGalleryFiles[i]!;
          const p = `${folder}/gallery-${i + 1}-${Date.now()}-${safeFileName(f.name)}`;
          uploadedGallery.push(await uploadToBucket(p, f));
        }
      }

      setSavingStage("Finalizing…");
      const { error } = await supabase
        .from("timeline_cards")
        .update({
          full_name: programEditDraft.full_name.trim(),
          specialty: programEditDraft.specialty.trim() || null,
          organization: programEditDraft.organization.trim(),
          talk_title: programEditDraft.talk_title.trim(),
          starts_at: toIsoFromLocal(programEditDraft.starts_at),
          ends_at: toIsoFromLocal(programEditDraft.ends_at),
          stream_url: programEditDraft.stream_url.trim() || null,
          is_live: programEditDraft.is_live,
          photo_url: photoUrl,
          gallery: uploadedGallery,
        })
        .eq("id", id);
      if (error) throw error;

      toast.success("Program updated");
      setEditingProgram(null);
      if (selectedSession) refreshPrograms(selectedSession.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update program";
      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
      setSavingStage(null);
    }
  }

  // ===== Session operations =====
  async function refreshSessions() {
    setSessionLoading(true);
    setError(null);
    const { data, error } = await supabase.from("sessions").select("*").order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setSessionLoading(false);
      return;
    }
    setSessions((data ?? []) as Session[]);
    setSessionLoading(false);
  }

  async function createSession(title: string) {
    if (!title.trim()) {
      toast.error("Session title is required.");
      return;
    }
    const { error } = await supabase.from("sessions").insert({ title: title.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session created");
    refreshSessions();
  }

  async function deleteSession(sessionId: string) {
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session deleted");
    setSelectedSession(null);
    refreshSessions();
  }

  // ===== Moderator operations =====
  async function refreshModerators(sessionId: string) {
    setModeratorLoading(true);
    const { data, error } = await supabase.from("moderators").select("*").eq("session_id", sessionId);
    if (error) {
      toast.error(error.message);
      setModeratorLoading(false);
      return;
    }
    setModerators((data ?? []) as Moderator[]);
    setModeratorLoading(false);
  }

  async function addModerator() {
    if (!selectedSession || !moderatorForm.full_name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("moderators").insert({
        session_id: selectedSession.id,
        full_name: moderatorForm.full_name.trim(),
      });
      if (error) throw error;
      toast.success("Moderator added");
      setModeratorForm({ full_name: "" });
      setAddModeratorOpen(false);
      refreshModerators(selectedSession.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add moderator");
    } finally {
      setSaving(false);
    }
  }

  async function deleteModerator(modId: string) {
    if (!selectedSession) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("moderators").delete().eq("id", modId);
      if (error) throw error;
      toast.success("Moderator deleted");
      refreshModerators(selectedSession.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete moderator");
    } finally {
      setSaving(false);
    }
  }

  // ===== Program operations =====
  async function refreshPrograms(sessionId: string) {
    setProgramLoading(true);
    const { data, error } = await supabase
      .from("timeline_cards")
      .select("*")
      .eq("session_id", sessionId)
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true });
    if (error) {
      toast.error(error.message);
      setProgramLoading(false);
      return;
    }
    setPrograms((data ?? []) as Program[]);
    setProgramLoading(false);
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

  function buildLinks() {
    const links: { label: string; url: string }[] = [];
    const paper = programForm.research_paper_url.trim();
    const profile = programForm.speaker_profile_url.trim();
    if (paper) links.push({ label: "Research Paper", url: paper });
    if (profile) links.push({ label: "Speaker Profile", url: profile });
    return links;
  }

  async function createProgram() {
    setError(null);
    if (!selectedSession) return;
    if (!photoFile) {
      toast.error("Photo is required.");
      return;
    }
    if (galleryFiles.length > 3) {
      toast.error("Gallery upload max is 3 images.");
      return;
    }

    const startsAtIso = toIsoFromLocal(programForm.starts_at);
    const endsAtIso = toIsoFromLocal(programForm.ends_at);
    const startsAtMs = new Date(programForm.starts_at).getTime();
    const endsAtMs = new Date(programForm.ends_at).getTime();
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
    setSavingStage("Creating program…");
    setSavingProgress(10);
    try {
      const id = crypto.randomUUID();
      const folder = `${slugify(programForm.full_name || "program")}/${id}`;

      const insertPayload = {
        id,
        session_id: selectedSession.id,
        full_name: programForm.full_name.trim(),
        specialty: programForm.specialty.trim() || "",
        organization: programForm.organization.trim(),
        linkedin_url: programForm.linkedin_url.trim() ? programForm.linkedin_url.trim() : null,
        talk_title: programForm.talk_title.trim(),
        description: programForm.description.trim() ? programForm.description.trim() : null,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        stream_url: programForm.stream_url.trim() ? programForm.stream_url.trim() : null,
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
      setAddProgramOpen(false);
      resetProgramForm();
      toast.success("Program created");
      refreshPrograms(selectedSession.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create program";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setSavingStage(null);
      setSavingProgress(0);
    }
  }

  async function deleteProgram(progId: string) {
    if (!selectedSession) return;
    const { error } = await supabase.from("timeline_cards").delete().eq("id", progId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Program deleted");
    refreshPrograms(selectedSession.id);
  }

  async function setLive(prog: Program) {
    if (prog.is_live) {
      const res = await supabase.from("timeline_cards").update({ is_live: false }).eq("id", prog.id);
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Program is no longer live");
      if (selectedSession) refreshPrograms(selectedSession.id);
      return;
    }

    const setRes = await supabase.from("timeline_cards").update({ is_live: true }).eq("id", prog.id);
    if (setRes.error) {
      toast.error(setRes.error.message);
      return;
    }
    toast.success("Live program updated");
    if (selectedSession) refreshPrograms(selectedSession.id);
  }

  useEffect(() => {
    refreshSessions();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      refreshModerators(selectedSession.id);
      refreshPrograms(selectedSession.id);
    }
  }, [selectedSession]);

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

      <Dialog open={sessionEditOpen} onOpenChange={setSessionEditOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Session Title</Label>
            <Input value={sessionTitleDraft} onChange={(e) => setSessionTitleDraft(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => setSessionEditOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-2xl" onClick={saveSessionEdit} disabled={!sessionTitleDraft.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingModerator)} onOpenChange={(open) => !open && setEditingModerator(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Person</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={moderatorNameDraft} onChange={(e) => setModeratorNameDraft(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => setEditingModerator(null)}>
              Cancel
            </Button>
            <Button className="rounded-2xl" onClick={saveModeratorEdit} disabled={!moderatorNameDraft.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingProgram)} onOpenChange={(open) => !open && setEditingProgram(null)}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Edit the program using the same staged flow.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {programStepMeta.map((step, index) => {
                const StepIcon = step.icon;
                const active = programEditStep === index;
                const done = programEditStep > index;
                return (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() => setProgramEditStep(index)}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition",
                      active ? "border-secondary bg-secondary/10 text-secondary" : "border-border/60 bg-muted/30",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        done || active ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground",
                      )}
                    >
                      {done ? <Pencil className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest">{step.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="max-h-[66vh] overflow-y-auto pr-2 -mr-2">
              <div className="mr-2">
                {programEditStep === 0 && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Full Name</Label>
                      <Input value={programEditDraft.full_name} onChange={(e) => setProgramEditDraft((p) => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Specialty</Label>
                      <Input value={programEditDraft.specialty} onChange={(e) => setProgramEditDraft((p) => ({ ...p, specialty: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Organization</Label>
                      <Input value={programEditDraft.organization} onChange={(e) => setProgramEditDraft((p) => ({ ...p, organization: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>LinkedIn URL</Label>
                      <Input value={programEditDraft.stream_url} onChange={(e) => setProgramEditDraft((p) => ({ ...p, stream_url: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>
                )}

                {programEditStep === 1 && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Talk Title</Label>
                      <Input value={programEditDraft.talk_title} onChange={(e) => setProgramEditDraft((p) => ({ ...p, talk_title: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Input value={programEditDraft.description as string} onChange={(e) => setProgramEditDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Short session description" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Start Time</Label>
                      <DateTimePicker value={programEditDraft.starts_at} minDate={new Date()} onChange={(v) => setProgramEditDraft((p) => ({ ...p, starts_at: v }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time</Label>
                      <DateTimePicker value={programEditDraft.ends_at} minDate={programEditDraft.starts_at ? new Date(programEditDraft.starts_at) : new Date()} onChange={(v) => setProgramEditDraft((p) => ({ ...p, ends_at: v }))} />
                    </div>
                  </div>
                )}

                {programEditStep === 2 && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Speaker Photo</Label>
                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 hover:bg-muted/60">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <Plus className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold">Upload speaker photo</div>
                            <div className="text-xs text-muted-foreground">PNG or JPG</div>
                          </div>
                        </div>
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        <Input ref={editPhotoInputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { setEditPhotoFile(e.target.files?.[0] ?? null); setEditPhotoPreviewUrl(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : editingProgram?.photo_url ?? null); }} />
                      </label>
                      {(editPhotoPreviewUrl || (editingProgram && editingProgram.photo_url)) && (
                        <img src={editPhotoPreviewUrl ?? editingProgram?.photo_url ?? undefined} alt="Speaker preview" className="mt-2 h-40 w-full rounded-2xl object-cover" />
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Gallery Images</Label>
                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 hover:bg-muted/60">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-secondary shadow-sm">
                            <Plus className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold">Add gallery images</div>
                            <div className="text-xs text-muted-foreground">Up to 3 images</div>
                          </div>
                        </div>
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        <Input ref={editGalleryInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { const files = Array.from(e.target.files ?? []); setEditGalleryFiles(files.slice(0,3)); setEditGalleryPreviewUrls(files.slice(0,3).map((f) => URL.createObjectURL(f))); }} />
                      </label>
                      {(editGalleryPreviewUrls.length > 0 || (editingProgram && editingProgram.gallery && editingProgram.gallery.length > 0)) && (
                        <div className="grid grid-cols-3 gap-2">
                          {(editGalleryPreviewUrls.length > 0 ? editGalleryPreviewUrls : (editingProgram?.gallery ?? [])).map((src, i) => (
                            <img key={i} src={src} alt="Gallery preview" className="h-24 w-full rounded-2xl object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {programEditStep === 3 && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Research Paper URL</Label>
                      <Input value={(programEditDraft as any).research_paper_url ?? ""} onChange={(e) => setProgramEditDraft((p) => ({ ...p, research_paper_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Speaker Profile URL</Label>
                      <Input value={(programEditDraft as any).speaker_profile_url ?? ""} onChange={(e) => setProgramEditDraft((p) => ({ ...p, speaker_profile_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Stream URL</Label>
                      <Input value={programEditDraft.stream_url} onChange={(e) => setProgramEditDraft((p) => ({ ...p, stream_url: e.target.value }))} placeholder="https://..." />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-2 border-t border-border/60 pt-4">
              <Button variant="outline" className="rounded-2xl" onClick={() => setProgramEditStep(Math.max(0, programEditStep - 1))} disabled={programEditStep === 0 || saving}>
                Back
              </Button>
              <div className="flex gap-2">
                {programEditStep < 3 && (
                  <Button className="rounded-2xl" onClick={() => setProgramEditStep(programEditStep + 1)} disabled={saving}>
                    Next
                  </Button>
                )}
                {programEditStep === 3 && (
                  <Button className="rounded-2xl" onClick={saveProgramEdit} disabled={saving || !programEditDraft.full_name || !programEditDraft.talk_title}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sessions List */}
      <Card className="rounded-3xl">
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Timeline</div>
              <div className="text-lg font-extrabold">Live Program Sessions</div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="hero" className="rounded-2xl">
                  <Plus />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Create Session</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Session Title</Label>
                    <Input
                      id="session-title"
                      placeholder="Morning Keynote"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          createSession((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => {
                      const input = document.getElementById("session-title") as HTMLInputElement;
                      input.value = "";
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-2xl"
                    onClick={() => {
                      const input = document.getElementById("session-title") as HTMLInputElement;
                      createSession(input.value);
                      input.value = "";
                    }}
                  >
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {sessionLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading sessions…</div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No sessions yet.</div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition",
                      selectedSession?.id === session.id && "bg-muted/60",
                    )}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div>
                      <div className="font-semibold">{session.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {moderators.filter((m) => m.session_id === session.id).length} moderators ·{" "}
                        {programs.filter((p) => p.session_id === session.id).length} programs ·{" "}
                        {programs.filter((p) => p.session_id === session.id && p.is_live).length} live
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-2xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestConfirm({
                            title: "Delete session?",
                            description: session.title,
                            actionLabel: "Delete",
                            action: async () => deleteSession(session.id),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Details */}
      {selectedSession && (
            <div className="space-y-6">
              <Card className="rounded-4xl border-2 border-primary/20 bg-gradient-to-br from-background/60 to-muted/5 shadow-xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Focused Session</div>
                      <h2 className="text-3xl font-black mt-1">{selectedSession.title}</h2>
                      {moderators.length ? (
                        <div className="mt-3 text-sm text-muted-foreground">
                          Moderators: <span className="font-semibold text-foreground">{moderators.map((m) => m.full_name).join(" · ")}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="rounded-2xl" onClick={() => setSelectedSession(null)}>Close</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
          {/* Moderators Section */}
          <Card className="rounded-3xl">
            <CardContent className="p-0">
              <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    {selectedSession.title}
                  </div>
                  <div className="flex items-center gap-2 text-lg font-extrabold">
                    Moderators
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={openSessionEdit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Dialog open={addModeratorOpen} onOpenChange={setAddModeratorOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" className="rounded-2xl">
                      <Plus />
                      Add Moderator
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Add Moderator</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                          ref={fullNameInputRef}
                          value={moderatorForm.full_name}
                          onChange={(e) => setModeratorForm({ full_name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => setAddModeratorOpen(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="rounded-2xl"
                        onClick={addModerator}
                        disabled={saving || !moderatorForm.full_name.trim()}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {moderatorLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading moderators…</div>
              ) : (
                <Table>
                  <TableBody>
                    {moderators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-sm text-muted-foreground">
                          No moderators yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      moderators.map((mod) => (
                        <TableRow key={mod.id}>
                          <TableCell className="font-semibold">{mod.full_name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => openModeratorEdit(mod)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() =>
                                  requestConfirm({
                                    title: "Delete moderator?",
                                    description: mod.full_name,
                                    actionLabel: "Delete",
                                    action: async () => deleteModerator(mod.id),
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Programs Section */}
          <Card className="rounded-3xl">
            <CardContent className="p-0">
              <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    {selectedSession.title}
                  </div>
                  <div className="flex items-center gap-2 text-lg font-extrabold">
                    Programs
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={openSessionEdit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Dialog open={addProgramOpen} onOpenChange={setAddProgramOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" className="rounded-2xl">
                      <Plus />
                      Add Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Add Program to {selectedSession.title}</DialogTitle>
                      <DialogDescription>
                        Use the same staged flow: speaker, session, media, then links.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {programStepMeta.map((step, index) => {
                          const StepIcon = step.icon;
                          const active = programCreateStep === index;
                          const done = programCreateStep > index;
                          return (
                            <button
                              key={step.label}
                              type="button"
                              onClick={() => setProgramCreateStep(index)}
                              className={cn(
                                "flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition",
                                active ? "border-secondary bg-secondary/10 text-secondary" : "border-border/60 bg-muted/30",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                                  done || active ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground",
                                )}
                              >
                                {done ? <Pencil className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                              </span>
                              <span className="text-xs font-bold uppercase tracking-widest">{step.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="max-h-[66vh] overflow-y-auto pr-2 -mr-2">
                        <div className="mr-2">
                        {programCreateStep === 0 && (
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label>Full Name</Label>
                              <Input
                                value={programForm.full_name}
                                onChange={(e) => setProgramForm((p) => ({ ...p, full_name: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Specialty</Label>
                              <Input
                                value={programForm.specialty}
                                onChange={(e) => setProgramForm((p) => ({ ...p, specialty: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Organization</Label>
                              <Input
                                value={programForm.organization}
                                onChange={(e) => setProgramForm((p) => ({ ...p, organization: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>LinkedIn URL</Label>
                              <Input
                                value={programForm.linkedin_url}
                                onChange={(e) => setProgramForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                                placeholder="https://linkedin.com/in/..."
                              />
                            </div>
                          </div>
                        )}
                        {programCreateStep === 1 && (
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label>Talk Title</Label>
                              <Input
                                value={programForm.talk_title}
                                onChange={(e) => setProgramForm((p) => ({ ...p, talk_title: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Description</Label>
                              <Input
                                value={programForm.description}
                                onChange={(e) => setProgramForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Short session description"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Start Time</Label>
                              <DateTimePicker
                                value={programForm.starts_at}
                                minDate={new Date()}
                                onChange={(v) => setProgramForm((p) => ({ ...p, starts_at: v }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>End Time</Label>
                              <DateTimePicker
                                value={programForm.ends_at}
                                minDate={programForm.starts_at ? new Date(programForm.starts_at) : new Date()}
                                onChange={(v) => setProgramForm((p) => ({ ...p, ends_at: v }))}
                              />
                            </div>
                          </div>
                        )}
                        {programCreateStep === 2 && (
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label>Speaker Photo</Label>
                              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 hover:bg-muted/60">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                    <Plus className="h-4 w-4" />
                                  </span>
                                  <div>
                                    <div className="text-sm font-semibold">Upload speaker photo</div>
                                    <div className="text-xs text-muted-foreground">PNG or JPG</div>
                                  </div>
                                </div>
                                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                <Input
                                  ref={photoInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={(e) => handlePhotoSelected(e.target.files?.[0] ?? null)}
                                />
                              </label>
                              {photoPreviewUrl && (
                                <img
                                  src={photoPreviewUrl}
                                  alt="Speaker preview"
                                  className="mt-2 h-40 w-full rounded-2xl object-cover"
                                />
                              )}
                            </div>
                            <div className="grid gap-2">
                              <Label>Gallery Images</Label>
                              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 hover:bg-muted/60">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-secondary shadow-sm">
                                    <Plus className="h-4 w-4" />
                                  </span>
                                  <div>
                                    <div className="text-sm font-semibold">Add gallery images</div>
                                    <div className="text-xs text-muted-foreground">Up to 3 images</div>
                                  </div>
                                </div>
                                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                <Input
                                  ref={galleryInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="sr-only"
                                  onChange={(e) => handleGallerySelected(Array.from(e.target.files ?? []))}
                                />
                              </label>
                              {galleryPreviewUrls.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {galleryPreviewUrls.map((src) => (
                                    <img
                                      key={src}
                                      src={src}
                                      alt="Gallery preview"
                                      className="h-24 w-full rounded-2xl object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {programCreateStep === 3 && (
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label>Research Paper URL</Label>
                              <Input
                                value={programForm.research_paper_url}
                                onChange={(e) => setProgramForm((p) => ({ ...p, research_paper_url: e.target.value }))}
                                placeholder="https://..."
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Speaker Profile URL</Label>
                              <Input
                                value={programForm.speaker_profile_url}
                                onChange={(e) => setProgramForm((p) => ({ ...p, speaker_profile_url: e.target.value }))}
                                placeholder="https://..."
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Stream URL</Label>
                              <Input
                                value={programForm.stream_url}
                                onChange={(e) => setProgramForm((p) => ({ ...p, stream_url: e.target.value }))}
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between gap-2 border-t border-border/60 pt-4">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => setProgramCreateStep(Math.max(0, programCreateStep - 1))}
                        disabled={programCreateStep === 0 || saving}
                      >
                        Back
                      </Button>
                      <div className="flex gap-2">
                        {programCreateStep < 3 && (
                          <Button
                            className="rounded-2xl"
                            onClick={() => setProgramCreateStep(programCreateStep + 1)}
                            disabled={saving}
                          >
                            Next
                          </Button>
                        )}
                        {programCreateStep === 3 && (
                          <Button
                            className="rounded-2xl"
                            onClick={createProgram}
                            disabled={saving || !programForm.full_name || !programForm.talk_title || !photoFile}
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                          </Button>
                        )}
                      </div>
                    </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {programLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading programs…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Speaker</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="w-[100px]">Live</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-muted-foreground">
                          No programs yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      programs.map((prog) => (
                        <TableRow key={prog.id} data-state={prog.is_live ? "selected" : undefined}>
                          <TableCell className="font-semibold">{prog.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{prog.talk_title}</TableCell>
                          <TableCell className="text-muted-foreground tabular-nums text-xs">
                            {toLocalInputValue(prog.starts_at).replace("T", " ")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={prog.is_live ? "secondary" : "outline"}
                              size="sm"
                              className={cn("rounded-2xl", prog.is_live && "text-live")}
                              onClick={() => setLive(prog)}
                            >
                              <Radio className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => openProgramEdit(prog)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() =>
                                  requestConfirm({
                                    title: "Delete program?",
                                    description: prog.talk_title,
                                    actionLabel: "Delete",
                                    action: async () => deleteProgram(prog.id),
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}